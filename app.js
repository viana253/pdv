const itens = [];

const refs = {
  produto: document.getElementById("produto"),
  quantidade: document.getElementById("quantidade"),
  preco: document.getElementById("preco"),
  cliente: document.getElementById("cliente"),
  doc: document.getElementById("doc"),
  tipoDocumento: document.getElementById("tipoDocumento"),
  pagamento: document.getElementById("pagamento"),
  itensBody: document.getElementById("itensBody"),
  subtotal: document.getElementById("subtotal"),
  impostos: document.getElementById("impostos"),
  total: document.getElementById("total"),
  saida: document.getElementById("saida"),
};

const money = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function atualizarTabela() {
  refs.itensBody.innerHTML = "";
  itens.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.qtd}</td>
      <td>${money(item.unit)}</td>
      <td>${money(item.total)}</td>
      <td><button data-idx="${idx}" class="secondary">Remover</button></td>
    `;
    refs.itensBody.appendChild(tr);
  });

  const subtotal = itens.reduce((acc, item) => acc + item.total, 0);
  const impostos = subtotal * 0.18;
  const total = subtotal;

  refs.subtotal.textContent = money(subtotal);
  refs.impostos.textContent = money(impostos);
  refs.total.textContent = money(total);
}

function adicionarItem() {
  const nome = refs.produto.value.trim();
  const qtd = Number(refs.quantidade.value);
  const unit = Number(refs.preco.value);

  if (!nome || qtd <= 0 || unit < 0) {
    alert("Informe produto, quantidade e valor unitário válidos.");
    return;
  }

  itens.push({ nome, qtd, unit, total: qtd * unit });
  refs.produto.value = "";
  refs.quantidade.value = "1";
  refs.preco.value = "0";
  atualizarTabela();
}

function proximoNumeroSerie(tipo) {
  const chave = `pdv-${tipo}-numero`;
  const atual = Number(localStorage.getItem(chave) || "0") + 1;
  localStorage.setItem(chave, String(atual));
  return atual;
}

function gerarChaveAcesso(numero) {
  const seed = `${Date.now()}${numero}`;
  return seed.padEnd(44, "0").slice(0, 44);
}

function gerarXml(doc) {
  const itensXml = doc.itens
    .map(
      (item, idx) =>
        `<det nItem="${idx + 1}"><prod><xProd>${item.nome}</xProd><qCom>${item.qtd}</qCom><vUnCom>${item.unit.toFixed(
          2
        )}</vUnCom><vProd>${item.total.toFixed(2)}</vProd></prod></det>`
    )
    .join("");

  return `<${doc.tipo}><ide><nNF>${doc.numero}</nNF><dhEmi>${doc.dataHora}</dhEmi></ide><emit><xNome>EMPRESA DEMO LTDA</xNome></emit><dest><xNome>${doc.cliente}</xNome><CPF_CNPJ>${doc.documento}</CPF_CNPJ></dest>${itensXml}<total><vNF>${doc.valorTotal.toFixed(
    2
  )}</vNF></total><pag><tPag>${doc.pagamento}</tPag></pag></${doc.tipo}>`;
}

function emitirDocumento() {
  if (!itens.length) {
    alert("Adicione ao menos um item para emitir o documento.");
    return;
  }

  const tipo = refs.tipoDocumento.value;
  const numero = proximoNumeroSerie(tipo);
  const valorTotal = itens.reduce((a, b) => a + b.total, 0);
  const documento = {
    tipo,
    numero,
    serie: 1,
    ambiente: "Homologação local",
    dataHora: new Date().toISOString(),
    chaveAcesso: gerarChaveAcesso(numero),
    cliente: refs.cliente.value || "Consumidor final",
    documento: refs.doc.value || "Não informado",
    pagamento: refs.pagamento.value,
    itens: [...itens],
    valorTotal,
  };

  const xml = gerarXml(documento);

  refs.saida.textContent = JSON.stringify(
    {
      ...documento,
      xml,
      observacao:
        "Documento gerado localmente para demonstração de PDV web. Para validade fiscal, assinar e transmitir via SEFAZ.",
    },
    null,
    2
  );
}

function limparVenda() {
  itens.length = 0;
  atualizarTabela();
  refs.saida.textContent = "Nenhum documento emitido.";
}

document.getElementById("addItem").addEventListener("click", adicionarItem);
document.getElementById("emitir").addEventListener("click", emitirDocumento);
document.getElementById("limpar").addEventListener("click", limparVenda);
refs.itensBody.addEventListener("click", (e) => {
  const idx = e.target.dataset.idx;
  if (idx === undefined) return;
  itens.splice(Number(idx), 1);
  atualizarTabela();
});

atualizarTabela();
