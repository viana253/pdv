const catalogo = [
  { codigo: "1001", nome: "Hambúrguer Completo", categoria: "Lanches", preco: 18, icone: "🍔", ncm: "16025000", cfop: "5102", cst: "060" },
  { codigo: "1002", nome: "Hot Dog", categoria: "Lanches", preco: 12, icone: "🌭", ncm: "16029000", cfop: "5102", cst: "060" },
  { codigo: "1003", nome: "Batata Frita", categoria: "Diversos", preco: 16.5, icone: "🍟", ncm: "20041000", cfop: "5102", cst: "060" },
  { codigo: "2001", nome: "Refrigerante Lata", categoria: "Bebidas", preco: 6, icone: "🥤", ncm: "22021000", cfop: "5102", cst: "060" },
  { codigo: "2002", nome: "Suco Natural", categoria: "Bebidas", preco: 8.5, icone: "🧃", ncm: "20099000", cfop: "5102", cst: "060" },
  { codigo: "3001", nome: "Pizza Calabresa", categoria: "Pizzas", preco: 49.9, icone: "🍕", ncm: "19059090", cfop: "5102", cst: "060" },
  { codigo: "3002", nome: "Pizza Quatro Queijos", categoria: "Pizzas", preco: 54.9, icone: "🍕", ncm: "19059090", cfop: "5102", cst: "060" },
  { codigo: "4001", nome: "Mousse", categoria: "Sobremesas", preco: 10, icone: "🍮", ncm: "21069090", cfop: "5102", cst: "060" },
  { codigo: "4002", nome: "Pudim", categoria: "Sobremesas", preco: 9.5, icone: "🍮", ncm: "21069090", cfop: "5102", cst: "060" },
  { codigo: "5001", nome: "Promoção Combo", categoria: "Promoção", preco: 25, icone: "🎉", ncm: "21069090", cfop: "5102", cst: "060" },
  { codigo: "6001", nome: "Pastel de Carne", categoria: "Salgados", preco: 9, icone: "🥟", ncm: "19022000", cfop: "5102", cst: "060" },
  { codigo: "7001", nome: "Prato Executivo", categoria: "Restaurante", preco: 31, icone: "🍛", ncm: "21069090", cfop: "5102", cst: "060" },
];

const ordemCategorias = ["Todos", "Bebidas", "Diversos", "Lanches", "Pizzas", "Promoção", "Restaurante", "Salgados", "Sobremesas"];
const itens = [];
let categoriaAtual = "Todos";

const refs = {
  categorias: document.getElementById("categorias"),
  produtos: document.getElementById("produtos"),
  codigoProduto: document.getElementById("codigoProduto"),
  qtd: document.getElementById("qtd"),
  itensBody: document.getElementById("itensBody"),
  subtotal: document.getElementById("subtotal"),
  impostos: document.getElementById("impostos"),
  total: document.getElementById("total"),
  saida: document.getElementById("saida"),
  cliente: document.getElementById("cliente"),
  doc: document.getElementById("doc"),
  tipoDocumento: document.getElementById("tipoDocumento"),
  pagamento: document.getElementById("pagamento"),
};

const money = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function categoriasUnicas() {
  const categoriasCatalogo = new Set(catalogo.map((p) => p.categoria));
  return ordemCategorias.filter((categoria) => categoria === "Todos" || categoriasCatalogo.has(categoria));
}

function renderCategorias() {
  refs.categorias.innerHTML = "";
  categoriasUnicas().forEach((categoria) => {
    const btn = document.createElement("button");
    btn.className = `categoria-btn ${categoriaAtual === categoria ? "active" : ""}`;
    btn.textContent = categoria.toUpperCase();
    btn.onclick = () => {
      categoriaAtual = categoria;
      renderCategorias();
      renderProdutos();
    };
    refs.categorias.appendChild(btn);
  });
}

function produtosFiltrados() {
  return categoriaAtual === "Todos" ? catalogo : catalogo.filter((p) => p.categoria === categoriaAtual);
}

function adicionarItem(produto, qtd) {
  const existente = itens.find((item) => item.codigo === produto.codigo);
  if (existente) {
    existente.qtd += qtd;
    existente.total = existente.qtd * existente.unit;
  } else {
    itens.push({ codigo: produto.codigo, nome: produto.nome, qtd, unit: produto.preco, total: qtd * produto.preco, ncm: produto.ncm, cfop: produto.cfop, cst: produto.cst });
  }
  renderVenda();
}

function renderProdutos() {
  refs.produtos.innerHTML = "";
  produtosFiltrados().forEach((produto) => {
    const card = document.createElement("button");
    card.className = "produto-card";
    card.innerHTML = `<div class="produto-topo"><span class="icone">${produto.icone}</span><strong>${produto.nome}</strong></div><small>Cód: ${produto.codigo}</small><span>${money(produto.preco)}</span>`;
    card.onclick = () => adicionarItem(produto, Math.max(1, Number(refs.qtd.value) || 1));
    refs.produtos.appendChild(card);
  });
}

function renderVenda() {
  refs.itensBody.innerHTML = "";
  itens.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.nome}</td><td>${item.qtd}</td><td>${money(item.unit)}</td><td>${money(item.total)}</td><td><button class="remover" data-idx="${idx}">x</button></td>`;
    refs.itensBody.appendChild(tr);
  });

  const subtotal = itens.reduce((acc, item) => acc + item.total, 0);
  refs.subtotal.textContent = money(subtotal);
  refs.impostos.textContent = money(subtotal * 0.18);
  refs.total.textContent = money(subtotal);
}

function proximoNumeroSerie(tipo) {
  const chave = `pdv-${tipo}-numero`;
  const atual = Number(localStorage.getItem(chave) || "0") + 1;
  localStorage.setItem(chave, String(atual));
  return atual;
}

function gerarChaveAcesso(numero) {
  return `${Date.now()}${numero}`.padEnd(44, "0").slice(0, 44);
}

function gerarXml(doc) {
  const itensXml = doc.itens
    .map((item, idx) => `<det nItem="${idx + 1}"><prod><cProd>${item.codigo}</cProd><xProd>${item.nome}</xProd><qCom>${item.qtd}</qCom><vUnCom>${item.unit.toFixed(2)}</vUnCom><vProd>${item.total.toFixed(2)}</vProd></prod></det>`)
    .join("");

  return `<${doc.tipo}><ide><nNF>${doc.numero}</nNF><dhEmi>${doc.dataHora}</dhEmi></ide><emit><xNome>EMPRESA DEMO LTDA</xNome></emit><dest><xNome>${doc.cliente}</xNome><CPF_CNPJ>${doc.documento}</CPF_CNPJ></dest>${itensXml}<total><vNF>${doc.valorTotal.toFixed(2)}</vNF></total><pag><tPag>${doc.pagamento}</tPag></pag></${doc.tipo}>`;
}

async function emitirDocumento() {
  if (!itens.length) {
    alert("Adicione itens antes de finalizar.");
    return;
  }

  const payload = {
    tipo: refs.tipoDocumento.value,
    cliente: refs.cliente.value || "Consumidor final",
    documento: refs.doc.value || "Não informado",
    pagamento: refs.pagamento.value,
    itens: [...itens],
  };

  try {
    const resposta = await fetch("/api/fiscal/emitir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const dados = await resposta.json();
    refs.saida.textContent = JSON.stringify(dados, null, 2);

    if (!resposta.ok) {
      alert(`Falha fiscal: ${dados.motivo || dados.erro || "erro desconhecido"}`);
      return;
    }

    alert(`Documento autorizado (${dados.sefaz.codigo}). DANFE: ${dados.armazenamento.danfePath}`);
  } catch (err) {
    alert(`Erro ao enviar para servidor fiscal: ${err.message}`);
  }
}

function limparVenda() {
  itens.length = 0;
  refs.qtd.value = "1";
  refs.codigoProduto.value = "";
  renderVenda();
}

function adicionarPorCodigo() {
  const codigo = refs.codigoProduto.value.trim();
  const produto = catalogo.find((p) => p.codigo === codigo);
  if (!produto) {
    alert("Código não encontrado no catálogo.");
    return;
  }
  adicionarItem(produto, Math.max(1, Number(refs.qtd.value) || 1));
  refs.codigoProduto.value = "";
}

document.getElementById("menosQtd").addEventListener("click", () => {
  refs.qtd.value = String(Math.max(1, Number(refs.qtd.value || "1") - 1));
});

document.getElementById("maisQtd").addEventListener("click", () => {
  refs.qtd.value = String(Math.max(1, Number(refs.qtd.value || "1") + 1));
});

document.getElementById("addPorCodigo").addEventListener("click", adicionarPorCodigo);
document.getElementById("buscarCodigo").addEventListener("click", () => refs.codigoProduto.focus());
document.getElementById("cancelar").addEventListener("click", limparVenda);
document.getElementById("finalizar").addEventListener("click", emitirDocumento);
refs.codigoProduto.addEventListener("keydown", (event) => {
  if (event.key === "Enter") adicionarPorCodigo();
});

refs.itensBody.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remover")) return;
  itens.splice(Number(e.target.dataset.idx), 1);
  renderVenda();
});

renderCategorias();
renderProdutos();
renderVenda();

async function carregarStatusServidor() {
  const statusEl = document.getElementById("statusServidor");
  if (!statusEl) return;

  try {
    const resposta = await fetch("/api/status");
    const dados = await resposta.json();
    statusEl.classList.add(dados.internet ? "ok" : "warn");
    statusEl.textContent = `Servidor local ativo em ${dados.localIPs.join(" | ") || "127.0.0.1"}:${dados.port} • Internet ${dados.internet ? "disponível" : "indisponível"}`;
  } catch (_err) {
    statusEl.classList.add("warn");
    statusEl.textContent = "Servidor não respondeu ao endpoint /api/status.";
  }
}

carregarStatusServidor();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => null);
  });
}

let deferredInstallPrompt;
const installBtn = document.getElementById("instalarPdv");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installBtn) installBtn.hidden = false;
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}
