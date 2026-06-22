import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Diária Pro <noreply@diariapro.com.br>'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { email, workerName, amount, paidDate, workDates } = body

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'E-mail do diarista é obrigatório.' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const html = buildEmailHtml({ email, workerName, amount, paidDate, workDates })
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Comprovante de pagamento — ${workerName}`,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return new Response(JSON.stringify({ error: `Falha ao enviar e-mail: ${text}` }), {
        status: res.status || 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

function buildEmailHtml({ workerName, amount, paidDate, workDates }: { workerName: string; amount: number; paidDate: string; workDates: string[] }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Comprovante de Pagamento</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.08);">
      <div style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:28px;color:#fff;">
        <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Comprovante de Pagamento</h1>
        <p style="margin:10px 0 0;font-size:14px;opacity:.9;">Obrigado! O pagamento das suas diárias foi confirmado.</p>
      </div>
      <div style="padding:26px;">
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Olá <strong>${workerName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">Este é o comprovante do pagamento registrado para o seu trabalho.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
          <tr>
            <td style="padding:10px 0;font-weight:700;width:50%;">Valor pago</td>
            <td style="padding:10px 0;text-align:right;">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;">Data do pagamento</td>
            <td style="padding:10px 0;text-align:right;">${paidDate.split('-').reverse().join('/')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;">Dias pagos</td>
            <td style="padding:10px 0;text-align:right;">${workDates.length} dia(s)</td>
          </tr>
        </table>

        <div style="padding:18px;background:#ecfdf5;border:1px solid #d1fae5;border-radius:16px;margin-bottom:24px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#065f46;">Dias incluídos no comprovante</p>
          <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.75;font-size:14px;">
            ${workDates.map(date => `<li>${date}</li>`).join('')}
          </ul>
        </div>

        <p style="margin:0;font-size:13px;color:#6b7280;">Guarde este e-mail como comprovante do pagamento realizado.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}
