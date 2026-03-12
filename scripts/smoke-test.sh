#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8091}"

PORT="$PORT" node server.js >/tmp/pdv_smoke_server.log 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1

curl -fsS "http://127.0.0.1:${PORT}/health" | grep -q "ok"
curl -fsS "http://127.0.0.1:${PORT}/api/apps" | grep -q "Servidor Fiscal Local"
curl -fsS "http://127.0.0.1:${PORT}/api/status" | grep -q '"status":"online"'
curl -fsS -X POST "http://127.0.0.1:${PORT}/api/fiscal/emitir" \
  -H 'Content-Type: application/json' \
  -d '{"tipo":"NFCe","cliente":"Teste","documento":"12345678901","pagamento":"Pix","itens":[{"codigo":"1001","nome":"Hambúrguer Completo","qtd":1,"unit":18,"total":18,"ncm":"16025000","cfop":"5102","cst":"060"}]}' \
  | grep -q '"ok":true'

echo "Smoke test concluído com sucesso na porta ${PORT}."
