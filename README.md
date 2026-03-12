# PDV Local com 2 Apps (Servidor + PDV Instalável)

Agora o projeto está organizado para funcionar como **dois apps diferentes**:

1. **App Servidor Fiscal Local** (Node.js)
2. **App PDV** (Web instalável como PWA na máquina do usuário)

---

## Instalar e testar na sua máquina

### Linux/macOS

```bash
chmod +x scripts/install-linux.sh
./scripts/install-linux.sh
npm run test:smoke
npm start
```

### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
npm run test:smoke
npm start
```

Depois de iniciar, abra:
- Local: `http://127.0.0.1:8080`
- Rede local: `http://IP_DA_MAQUINA:8080`

---

## 1) App Servidor Fiscal Local

Responsável por:
- emissão fiscal (`/api/fiscal/emitir`),
- cancelamento (`/api/fiscal/cancelar/:chave`),
- status (`/api/status`),
- healthcheck (`/health`),
- identificação dos dois apps (`/api/apps`).

### Executar
```bash
npm start
```

---

## 2) App PDV (instalável)

A interface PDV foi convertida para **PWA**:
- possui `manifest.webmanifest`,
- possui `service worker` (`sw.js`),
- botão **Instalar app PDV** quando o navegador suporta instalação.

### Como instalar na máquina do usuário
1. Abra `http://IP_DA_MAQUINA:8080` no Chrome/Edge.
2. Clique em **Instalar app PDV**.
3. O PDV ficará instalado como app independente, separado do processo do servidor.

---

## Scripts úteis

- `npm run test:syntax`: valida sintaxe dos arquivos JS.
- `npm run test:smoke`: sobe servidor temporário, testa endpoints principais e emissão fiscal demo.

---

## Fiscal (estado atual)

- Assinatura XML com `CERT_PATH`/`KEY_PATH` (fallback sem certificado para demo).
- Regras de validação por item: `NCM`, `CFOP`, `CST/CSOSN`.
- Fluxo SEFAZ em modo mock com autorização/rejeição/cancelamento e contingência quando sem internet.
- Armazenamento seguro em `storage/` com permissões restritas.
