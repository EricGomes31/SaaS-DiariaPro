#!/usr/bin/env bash
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://cuqljxadqdrjieqkvuqp.supabase.co}"
FUNCTION_PATH="${FUNCTION_PATH:-/functions/v1/send-payment-receipt}"
URL="${SUPABASE_URL}${FUNCTION_PATH}"
EMAIL="${EMAIL:-eric.outubro@gmail.com}"

# Edge Functions exigem JWT por padrao. Le o anon key de .env.local se ANON_KEY nao vier do ambiente.
ANON_KEY="${ANON_KEY:-}"
if [ -z "$ANON_KEY" ]; then
  ENV_FILE="$(dirname "$0")/../.env.local"
  if [ -f "$ENV_FILE" ]; then
    ANON_KEY="$(grep -E '^\s*VITE_SUPABASE_ANON_KEY\s*=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '[:space:]')"
  fi
fi
if [ -z "$ANON_KEY" ]; then
  echo "ERRO: anon key nao encontrada. Defina ANON_KEY=... ou VITE_SUPABASE_ANON_KEY em .env.local" >&2
  exit 1
fi

echo "== OPTIONS (preflight) -> $URL =="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X OPTIONS "$URL" \
  -H "Origin: http://localhost:5173" \
  -H "apikey: $ANON_KEY"

read -p "Pressione Enter para enviar o POST de teste (destino: $EMAIL)..."

PAYLOAD=$(cat <<JSON
{
  "email":"$EMAIL",
  "workerName":"Teste Recebimento",
  "amount":150,
  "paidDate":"2026-06-22",
  "workDates":["2026-06-20","2026-06-21"]
}
JSON
)

echo "== POST -> $URL =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  --data-binary "$PAYLOAD"

echo ""
echo "Se for 200 e success:true, o e-mail foi enfileirado. Confira a caixa de entrada (e spam)."
