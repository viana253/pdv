# PDV Web para Comércio (Frente de Caixa)

Protótipo de **frente de caixa web** inspirado em layout de PDV touch, com catálogo de produtos por categoria, adição rápida de itens e emissão de NF-e/NFC-e em modo demonstração local.

## Funcionalidades

- Layout de frente de caixa com:
  - categorias de produtos;
  - grade de itens clicáveis;
  - painel lateral de venda com código, quantidade e total em destaque.
- Inclusão de produtos por clique no catálogo ou por código.
- Ajuste de quantidade com botões `-` e `+`.
- Remoção de itens da venda.
- Cálculo automático de subtotal, impostos estimados e total.
- Emissão demo de **NF-e** ou **NFC-e** com XML simplificado (sem assinatura/transmissão SEFAZ).

## Como executar

```bash
python3 -m http.server 8080
```

Acesse `http://localhost:8080`.

## Observação fiscal importante

Este projeto é apenas demonstrativo. Para uso real, ainda é necessário:

1. Certificado digital e assinatura XML.
2. Integração SEFAZ (autorização, cancelamento, rejeições, contingência).
3. Regras fiscais completas (NCM, CFOP, CST/CSOSN, etc.).
4. Armazenamento seguro de XML autorizado e emissão de DANFE/NFC-e.
