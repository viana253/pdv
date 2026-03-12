$ErrorActionPreference = 'Stop'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js não encontrado. Instale Node.js 18+ e tente novamente."
}

$version = node -p "process.versions.node"
$major = [int]($version.Split('.')[0])
if ($major -lt 18) {
  Write-Error "Versão do Node.js incompatível: v$version. Use Node.js 18+"
}

Write-Host "Node.js OK: v$version"
Write-Host "Validando sintaxe dos arquivos..."
npm run test:syntax

Write-Host "Instalação validada com sucesso."
Write-Host "Para iniciar: npm start"
