#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale Node.js 18+ e tente novamente."
  exit 1
fi

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Versão do Node.js incompatível: $(node -v). Use Node.js 18+"
  exit 1
fi

echo "Node.js OK: $(node -v)"
echo "Validando sintaxe dos arquivos..."
npm run test:syntax

echo "Instalação validada com sucesso."
echo "Para iniciar: npm start"
