const http = require("http");
const fs = require("fs");
const path = require("path");
const dns = require("dns").promises;
const os = require("os");
const {
  validarItens,
  gerarChave,
  gerarXmlFiscal,
  assinarXml,
  avaliarSefazMock,
  gerarDanfeHtml,
  armazenarDocumento,
  cancelarDocumento,
} = require("./fiscal-service");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8080);
const rootDir = __dirname;
const numeroArquivo = path.join(__dirname, "storage", "sequencial.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function proximoNumero(tipo) {
  let dados = { NFe: 0, NFCe: 0 };
  if (fs.existsSync(numeroArquivo)) {
    dados = JSON.parse(fs.readFileSync(numeroArquivo, "utf8"));
  }
  dados[tipo] = Number(dados[tipo] || 0) + 1;
  fs.mkdirSync(path.dirname(numeroArquivo), { recursive: true, mode: 0o700 });
  fs.writeFileSync(numeroArquivo, JSON.stringify(dados), { mode: 0o600 });
  return dados[tipo];
}

async function getStatus() {
  let internet = false;
  try {
    await dns.lookup("google.com");
    internet = true;
  } catch (_err) {
    internet = false;
  }

  const localIPs = Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface.address);

  return { app: "PDV Web", status: "online", internet, host, port, localIPs, sefaz: "mock" };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendFile(reqPath, res) {
  const safePath = reqPath === "/" ? "/index.html" : reqPath;
  const fullPath = path.join(rootDir, path.normalize(safePath));

  if (!fullPath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error("Payload muito grande."));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_err) {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

async function emitirFiscal(req, res) {
  const body = await readBody(req);
  const tipo = body.tipo || "NFCe";
  const numero = proximoNumero(tipo);
  const erroValidacao = validarItens(body.itens || []);
  if (erroValidacao) return sendJson(res, 400, { ok: false, etapa: "validacao", motivo: erroValidacao });

  const valorTotal = (body.itens || []).reduce((acc, i) => acc + Number(i.total), 0);
  const statusRede = await getStatus();
  const documento = {
    tipo,
    numero,
    ambiente: "2",
    tpEmis: statusRede.internet ? "1" : "9",
    dataHora: new Date().toISOString(),
    emitenteCnpj: process.env.EMITENTE_CNPJ || "00000000000000",
    emitenteNome: process.env.EMITENTE_NOME || "EMPRESA DEMO LTDA",
    cliente: body.cliente || "Consumidor final",
    documento: body.documento || "Não informado",
    pagamento: body.pagamento || "Dinheiro",
    itens: body.itens,
    valorTotal,
    chaveAcesso: gerarChave(numero, process.env.EMITENTE_CNPJ || "00000000000000"),
  };

  const xml = gerarXmlFiscal(documento);
  const assinado = assinarXml(xml);
  const sefaz = avaliarSefazMock(documento);

  if (!sefaz.autorizado) {
    return sendJson(res, 422, { ok: false, etapa: "sefaz", documento, sefaz, xmlAssinado: assinado.xmlAssinado });
  }

  const danfe = gerarDanfeHtml(documento);
  const paths = armazenarDocumento(documento, assinado.xmlAssinado, danfe, sefaz);

  return sendJson(res, 200, {
    ok: true,
    etapa: "autorizado",
    documento,
    sefaz,
    assinatura: { status: assinado.certificado === "ausente" ? "sem_certificado" : "assinado", hash: assinado.assinatura },
    armazenamento: paths,
  });
}

async function cancelarFiscal(req, res, chave) {
  const body = await readBody(req);
  const result = cancelarDocumento(chave, body.justificativa || "Cancelamento solicitado no PDV.");
  if (!result.ok) return sendJson(res, 404, result);
  return sendJson(res, 200, result);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }

  if (url.pathname === "/api/status" && req.method === "GET") {
    const status = await getStatus();
    sendJson(res, 200, status);
    return;
  }


  if (url.pathname === "/api/apps" && req.method === "GET") {
    sendJson(res, 200, {
      servidor: { nome: "Servidor Fiscal Local", comando: "npm start", porta: port },
      pdv: { nome: "PDV App (PWA)", acesso: `http://${req.headers.host || `127.0.0.1:${port}`}`, instalavel: true },
    });
    return;
  }

  if (url.pathname === "/api/fiscal/emitir" && req.method === "POST") {
    try {
      await emitirFiscal(req, res);
    } catch (err) {
      sendJson(res, 400, { ok: false, erro: err.message });
    }
    return;
  }

  if (url.pathname.startsWith("/api/fiscal/cancelar/") && req.method === "POST") {
    const chave = url.pathname.split("/").pop();
    try {
      await cancelarFiscal(req, res, chave);
    } catch (err) {
      sendJson(res, 400, { ok: false, erro: err.message });
    }
    return;
  }

  sendFile(url.pathname, res);
});

server.listen(port, host, () => {
  console.log(`PDV disponível em http://${host}:${port}`);
  console.log("Acesse também pelo IP da máquina para uso na rede local.");
});
