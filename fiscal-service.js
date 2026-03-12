const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_ROOT = path.join(__dirname, "storage");
const DIRS = {
  autorizados: path.join(STORAGE_ROOT, "xml", "autorizados"),
  cancelados: path.join(STORAGE_ROOT, "xml", "cancelados"),
  danfes: path.join(STORAGE_ROOT, "danfe"),
  metadata: path.join(STORAGE_ROOT, "metadata"),
};

for (const dir of Object.values(DIRS)) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function safeWrite(filePath, data) {
  fs.writeFileSync(filePath, data, { mode: 0o600 });
}

function validarItens(itens) {
  if (!Array.isArray(itens) || !itens.length) return "Venda sem itens.";

  for (const item of itens) {
    if (!item.codigo || !item.nome) return "Item sem código/nome.";
    if (!item.ncm || String(item.ncm).length < 8) return `Item ${item.codigo} sem NCM válido.`;
    if (!item.cfop || String(item.cfop).length !== 4) return `Item ${item.codigo} sem CFOP válido.`;
    if (!item.cst) return `Item ${item.codigo} sem CST/CSOSN.`;
    if (Number(item.qtd) <= 0 || Number(item.unit) < 0) return `Quantidade/valor inválidos no item ${item.codigo}.`;
  }

  return null;
}

function gerarChave(numero, cnpj = "00000000000000") {
  const base = `${cnpj}${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}${String(numero).padStart(9, "0")}`;
  return base.padEnd(44, "0").slice(0, 44);
}

function gerarXmlFiscal(doc) {
  const itensXml = doc.itens
    .map(
      (item, idx) =>
        `<det nItem="${idx + 1}"><prod><cProd>${item.codigo}</cProd><xProd>${item.nome}</xProd><NCM>${item.ncm}</NCM><CFOP>${item.cfop}</CFOP><CST>${item.cst}</CST><qCom>${Number(item.qtd).toFixed(4)}</qCom><vUnCom>${Number(item.unit).toFixed(2)}</vUnCom><vProd>${Number(item.total).toFixed(2)}</vProd></prod></det>`
    )
    .join("");

  return `<${doc.tipo}><ide><tpAmb>${doc.ambiente}</tpAmb><nNF>${doc.numero}</nNF><dhEmi>${doc.dataHora}</dhEmi><tpEmis>${doc.tpEmis}</tpEmis></ide><emit><CNPJ>${doc.emitenteCnpj}</CNPJ><xNome>${doc.emitenteNome}</xNome></emit><dest><xNome>${doc.cliente}</xNome><CPF_CNPJ>${doc.documento}</CPF_CNPJ></dest>${itensXml}<total><vNF>${doc.valorTotal.toFixed(2)}</vNF></total></${doc.tipo}>`;
}

function assinarXml(xml) {
  const certPath = process.env.CERT_PATH;
  const keyPath = process.env.KEY_PATH;

  if (!certPath || !keyPath || !fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    return { xmlAssinado: xml, assinatura: "SEM_CERTIFICADO_CONFIGURADO", certificado: "ausente" };
  }

  const privateKey = fs.readFileSync(keyPath, "utf8");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(xml);
  sign.end();
  const assinatura = sign.sign(privateKey, "base64");
  const certificado = fs.readFileSync(certPath, "utf8");
  const xmlAssinado = `${xml}<Signature>${assinatura}</Signature>`;
  return { xmlAssinado, assinatura, certificado };
}

function avaliarSefazMock(doc) {
  if (doc.valorTotal <= 0) return { autorizado: false, codigo: "531", motivo: "Total da NF inválido" };
  if (!doc.documento || doc.documento === "Não informado") return { autorizado: false, codigo: "539", motivo: "Destinatário inválido" };
  return { autorizado: true, codigo: "100", motivo: "Autorizado o uso da NF-e" };
}

function gerarDanfeHtml(doc) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>DANFE ${doc.chaveAcesso}</title></head><body><h1>DANFE/NFC-e (Demo)</h1><p>Chave: ${doc.chaveAcesso}</p><p>Tipo: ${doc.tipo}</p><p>Número: ${doc.numero}</p><p>Cliente: ${doc.cliente}</p><p>Total: R$ ${doc.valorTotal.toFixed(2)}</p></body></html>`;
}

function armazenarDocumento(doc, xmlAssinado, danfeHtml, statusSefaz) {
  const base = `${doc.chaveAcesso}-${Date.now()}`;
  const xmlPath = path.join(DIRS.autorizados, `${base}.xml`);
  const danfePath = path.join(DIRS.danfes, `${base}.html`);
  const metaPath = path.join(DIRS.metadata, `${base}.json`);

  safeWrite(xmlPath, xmlAssinado);
  safeWrite(danfePath, danfeHtml);
  safeWrite(metaPath, JSON.stringify({ doc, statusSefaz, xmlPath, danfePath }, null, 2));

  return { xmlPath, danfePath, metaPath };
}

function cancelarDocumento(chaveAcesso, justificativa) {
  const files = fs.readdirSync(DIRS.metadata).filter((f) => f.endsWith(".json"));
  const found = files.find((f) => {
    const meta = JSON.parse(fs.readFileSync(path.join(DIRS.metadata, f), "utf8"));
    return meta.doc.chaveAcesso === chaveAcesso;
  });

  if (!found) return { ok: false, motivo: "Documento não encontrado." };

  const metaPath = path.join(DIRS.metadata, found);
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.cancelamento = { data: new Date().toISOString(), justificativa };
  const cancelPath = path.join(DIRS.cancelados, `${chaveAcesso}.xml`);
  safeWrite(cancelPath, `<eventoCancelamento><chNFe>${chaveAcesso}</chNFe><xJust>${justificativa}</xJust></eventoCancelamento>`);
  safeWrite(metaPath, JSON.stringify(meta, null, 2));

  return { ok: true, motivo: "Cancelamento registrado.", cancelPath };
}

module.exports = {
  validarItens,
  gerarChave,
  gerarXmlFiscal,
  assinarXml,
  avaliarSefazMock,
  gerarDanfeHtml,
  armazenarDocumento,
  cancelarDocumento,
};
