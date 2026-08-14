import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as Sentry from 'npm:@sentry/deno@^8'

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente pelo Supabase.
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// SENTRY_DSN precisa ser configurado como secret desta função (supabase secrets set).
// Sem ele, Sentry.init fica inerte — não quebra a função.
Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false })
const ASAAS_API_KEY     = Deno.env.get('ASAAS_API_KEY')!
// Sandbox por padrão. Em produção: https://api.asaas.com/v3
const ASAAS_BASE_URL    = Deno.env.get('ASAAS_BASE_URL') ?? 'https://sandbox.asaas.com/api/v3'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ⚠️ Mantenha em sincronia com PLANS em src/components/Billing/PlansModal.jsx
const PLANS: Record<string, { monthly: number; annual: number }> = {
  basico:  { monthly: 19.9, annual: 199 },
  pro:     { monthly: 39.9, annual: 399 },
  empresa: { monthly: 79.9, annual: 799 },
}

async function asaas(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY, ...(init.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Asaas ${path} ${res.status}: ${JSON.stringify(data)}`)
  return data
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERV_KEY)

    // 1) Autentica o usuário pelo JWT que o app envia
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) return json({ error: 'Não autenticado.' }, 401)

    // 2) Valida plano + ciclo
    const { planId, cycle } = await req.json().catch(() => ({}))
    const plan = PLANS[planId]
    if (!plan || (cycle !== 'monthly' && cycle !== 'annual')) {
      return json({ error: 'Plano ou ciclo inválido.' }, 400)
    }
    const value             = cycle === 'annual' ? plan.annual : plan.monthly
    const subscriptionCycle = cycle === 'annual' ? 'YEARLY' : 'MONTHLY'

    // 3) Cria um LINK DE PAGAMENTO recorrente hospedado no Asaas.
    //    O cliente informa CPF/CNPJ e escolhe PIX/boleto/cartão na página do Asaas.
    //    externalReference = user.id → o webhook usa isso para mapear de volta.
    const link = await asaas('/paymentLinks', {
      method: 'POST',
      body: JSON.stringify({
        name: `Diária Pro — plano ${planId} (${cycle})`,
        billingType: 'UNDEFINED',
        chargeType: 'RECURRENT',
        subscriptionCycle,
        value,
        dueDateLimitDays: 3,   // dias úteis até o vencimento de cada cobrança (exigido pelo Asaas)
        externalReference: user.id,
      }),
    })

    // 4) Guarda plano/ciclo. status/worker_limit só mudam no webhook, após o pagamento.
    await supabase.from('subscriptions').update({
      plan: planId,
      billing_cycle: cycle,
    }).eq('user_id', user.id)

    return json({ url: link.url, paymentLinkId: link.id })
  } catch (error) {
    Sentry.captureException(error, { extra: { function: 'create-checkout' } })
    await Sentry.flush(2000)
    return json({ error: String(error) }, 500)
  }
})
