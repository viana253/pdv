# PDV Web para Comércio (NF-e / NFC-e)

Aplicação web simples de PDV para registrar vendas no caixa e gerar um documento fiscal em **modo demonstração** (sem transmissão real à SEFAZ).

## Funcionalidades

- Cadastro rápido de itens da venda.
- Cálculo automático de subtotal, impostos estimados e total.
- Emissão de documento no formato **NF-e** ou **NFC-e**.
- Geração de número sequencial por tipo de documento no navegador (`localStorage`).
- Geração de estrutura XML simplificada para integração futura.

## Como executar

Como é um app estático, basta abrir o `index.html` no navegador.

Ou, opcionalmente, executar servidor local:

```bash
python3 -m http.server 8080
```

Acesse: `http://localhost:8080`

## Importante para produção

Este projeto é um ponto de partida. Para emissão fiscal com validade jurídica/fiscal, é necessário:

1. Certificado digital (A1/A3) e assinatura XML.
2. Integração com SEFAZ (autorização, rejeições, inutilização, cancelamento, carta de correção).
3. Suporte a contingência (offline/SVC).
4. Regras fiscais completas (CFOP, CST/CSOSN, NCM, CEST, alíquotas, partilha, etc.).
5. Geração de DANFE/NFC-e e armazenamento seguro dos XMLs autorizados.
