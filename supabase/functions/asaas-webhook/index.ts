import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as Sentry from 'npm:@sentry/deno@^8'

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente pelo Supabase.
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// SENTRY_DSN precisa ser configurado como secret desta função (supabase secrets set).
// Sem ele, Sentry.init fica inerte — não quebra a função.
Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false })
// Token que você configura no painel do Asaas (Webhooks) e aqui, para autenticar as chamadas.
const WEBHOOK_TOKEN     = Deno.env.get('ASAAS_WEBHOOK_TOKEN')!

// ⚠️ Mantenha em sincronia com PLANS em src/components/Billing/PlansModal.jsx (null = ilimitado)
const PLAN_LIMITS: Record<string, number | null> = {
  basico: 5, pro: 20, empresa: null,
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  // 1) Autenticidade: o Asaas manda o token configurado no header de cada requisição.
  const token = req.headers.get('asaas-access-token')
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) return json({ error: 'unauthorized' }, 401)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERV_KEY)
    const body = await req.json().catch(() => ({}))
    const event: string = body.event ?? ''
    const payment = body.payment ?? {}
    // O link de pagamento propaga o externalReference (= user.id) para a cobrança.
    const externalRef: string | undefined = payment.externalReference ?? undefined
    const asaasSubId: string | undefined = payment.subscription ?? undefined
    const asaasCustomerId: string | undefined = payment.customer ?? undefined

    // 2) Localiza nossa assinatura. Prioridade: externalReference (user.id) → sub id → customer id.
    let sub: Record<string, unknown> | null = null
    if (externalRef) {
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', externalRef).maybeSingle()
      sub = data
    }
    if (!sub && asaasSubId) {
      const { data } = await supabase.from('subscriptions').select('*').eq('asaas_subscription_id', asaasSubId).maybeSingle()
      sub = data
    }
    if (!sub && asaasCustomerId) {
      const { data } = await supabase.from('subscriptions').select('*').eq('asaas_customer_id', asaasCustomerId).maybeSingle()
      sub = data
    }
    if (!sub) return json({ ignored: 'assinatura não encontrada' })

    // 3) Mapeia o evento → status. Responder 200 sempre que possível (senão o Asaas re-tenta).
    const updates: Record<string, unknown> = {}
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const days = sub.billing_cycle === 'annual' ? 365 : 30
      updates.status = 'active'
      updates.worker_limit = sub.plan ? (PLAN_LIMITS[sub.plan as string] ?? null) : null
      updates.current_period_end = new Date(Date.now() + days * 86400000).toISOString()
      // Captura os IDs do Asaas (o link cria o cliente/assinatura só quando o cliente paga).
      if (asaasSubId) updates.asaas_subscription_id = asaasSubId
      if (asaasCustomerId) updates.asaas_customer_id = asaasCustomerId
    } else if (event === 'PAYMENT_OVERDUE') {
      updates.status = 'past_due'
    } else if (['PAYMENT_DELETED', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED'].includes(event)) {
      updates.status = 'canceled'
    } else {
      return json({ ignored: event })
    }

    const { error } = await supabase.from('subscriptions').update(updates).eq('id', sub.id)
    if (error) throw error

    return json({ ok: true, event, status: updates.status })
  } catch (error) {
    Sentry.captureException(error, { extra: { function: 'asaas-webhook' } })
    await Sentry.flush(2000)
    return json({ error: String(error) }, 500)
  }
})
