import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as Sentry from 'npm:@sentry/deno@^8'

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente pelo Supabase.
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// SENTRY_DSN precisa ser configurado como secret desta função (supabase secrets set).
// Sem ele, Sentry.init fica inerte — não quebra a função.
Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERV_KEY)
    const body = await req.json().catch(() => ({}))
    const token: string = body.token ?? ''
    if (!token) return json({ error: 'token obrigatório' }, 400)

    // 1) Resolve a conta dona deste quiosque a partir do token opaco.
    //    service_role ignora RLS — por isso TODA query abaixo filtra
    //    explicitamente por user_id, senão vazaria dados entre contas.
    const { data: kiosk, error: kioskErr } = await supabase
      .from('kiosk_tokens')
      .select('user_id, location_id')
      .eq('token', token)
      .maybeSingle()
    if (kioskErr) throw kioskErr
    if (!kiosk) return json({ error: 'token inválido' }, 401)

    // 2) Diaristas ativos, com rosto já cadastrado, da conta desse token
    //    (e do local do quiosque, se um local específico estiver configurado).
    let query = supabase
      .from('workers')
      .select('id, name, job_title, department, avatar, avatar_color, locations, face_descriptor')
      .eq('user_id', kiosk.user_id)
      .eq('status', 'active')
      .not('face_descriptor', 'is', null)

    if (kiosk.location_id) query = query.contains('locations', [kiosk.location_id])

    const { data: workers, error: workersErr } = await query.order('name')
    if (workersErr) throw workersErr

    return json({
      workers: (workers ?? []).map(w => ({
        id: w.id, name: w.name, jobTitle: w.job_title, department: w.department,
        avatar: w.avatar, avatarColor: w.avatar_color, locations: w.locations ?? [],
        faceDescriptor: w.face_descriptor,
      })),
    })
  } catch (error) {
    Sentry.captureException(error, { extra: { function: 'kiosk-roster' } })
    await Sentry.flush(2000)
    return json({ error: String(error) }, 500)
  }
})
