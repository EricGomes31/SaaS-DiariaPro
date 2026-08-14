param(
  [string]$FunctionUrl = "https://cuqljxadqdrjieqkvuqp.supabase.co/functions/v1/send-payment-receipt",
  [string]$Email = "eric.outubro@gmail.com",
  # Edge Functions exigem JWT por padrao. Use o anon/publishable key do projeto.
  # Por padrao le de .env.local (VITE_SUPABASE_ANON_KEY); pode sobrescrever via parametro.
  [string]$AnonKey = ""
)

if (-not $AnonKey) {
  $envFile = Join-Path $PSScriptRoot "..\.env.local"
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^\s*VITE_SUPABASE_ANON_KEY\s*=' } | Select-Object -First 1
    if ($line) { $AnonKey = ($line -split '=', 2)[1].Trim() }
  }
}
if (-not $AnonKey) {
  Write-Host "ERRO: anon key nao encontrada. Passe -AnonKey <chave> ou defina VITE_SUPABASE_ANON_KEY em .env.local" -ForegroundColor Red
  exit 1
}

$headers = @{
  Origin        = 'http://localhost:5173'
  apikey        = $AnonKey
  Authorization = "Bearer $AnonKey"
}

Write-Host "== OPTIONS (preflight) -> $FunctionUrl ==" -ForegroundColor Cyan
try {
  $opt = Invoke-WebRequest -Method OPTIONS -Uri $FunctionUrl -Headers $headers -UseBasicParsing
  Write-Host ("Status: {0} {1}" -f [int]$opt.StatusCode, $opt.StatusDescription)
} catch {
  Write-Host ("OPTIONS falhou: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

$body = @{
  email     = $Email
  workerName = 'Teste Recebimento'
  amount    = 150
  paidDate  = '2026-06-22'
  workDates = @('2026-06-20','2026-06-21')
} | ConvertTo-Json

Write-Host "`n== POST -> $FunctionUrl (destino: $Email) ==" -ForegroundColor Cyan
try {
  $r = Invoke-WebRequest -Method POST -Uri $FunctionUrl -Headers $headers -Body $body -ContentType 'application/json' -UseBasicParsing
  Write-Host ("Status: {0}" -f [int]$r.StatusCode) -ForegroundColor Green
  Write-Host ("Body: {0}" -f $r.Content)
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $code = [int]$resp.StatusCode
    $txt = (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
    Write-Host ("Status: {0}" -f $code) -ForegroundColor Red
    Write-Host ("Body: {0}" -f $txt)
  } else {
    Write-Host ("Erro: {0}" -f $_.Exception.Message) -ForegroundColor Red
  }
}

Write-Host "`nSe a resposta contiver success:true o envio foi solicitado. Confira a caixa de entrada (e spam)."
