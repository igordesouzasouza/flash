const entradaArquivo = document.getElementById("fileInput");
const tabelaDados = document.getElementById("dataTable");
const cabecalhoTabela = document.getElementById("tableHeader");
const controlesPaginacao = document.getElementById("pagination-controls");

let dadosCSV = [];
let paginaAtual = 1;
const linhasPorPagina = 160;
const colunasParaManter = ["Nome", "Valor (R$)"];

entradaArquivo.addEventListener("change", (evento) => {
  const arquivo = evento.target.files[0];
  const leitor = new FileReader();

  leitor.onload = (evento) => {
    const textoCSV = evento.target.result;
    const linhas = textoCSV.split("\n");

    const cabecalhos = linhas[0]
      .split(",")
      .map((cabecalho) => cabecalho.replace(/['"]+/g, ""));

    const cabecalhosValidos = cabecalhos.filter((cabecalho) =>
      colunasParaManter.includes(cabecalho)
    );

    const indicesParaManter = cabecalhos
      .map((cabecalho, indice) =>
        colunasParaManter.includes(cabecalho) ? indice : null
      )
      .filter((indice) => indice !== null);

    const linhasProcessadas = linhas
      .slice(1)
      .map((linha) => linha.replace(/['"]/g, ""));
    dadosCSV = processarCSV(linhasProcessadas, indicesParaManter);

    renderizarCabecalhoTabela(cabecalhosValidos);
    atualizarPaginacao();
  };

  leitor.readAsText(arquivo);
});

function processarCSV(linhas, indicesParaManter) {
  const dadosAgrupados = {};

  linhas.forEach((linha) => {
    const colunas = linha.split(",");

    const nome = colunas[indicesParaManter[0]].toUpperCase().trim();

    let valor = colunas[indicesParaManter[1]]
      .replace(/['"]/g, "")
      .trim()
      .replace(/\./g, "");
// 
    let centavos = colunas[indicesParaManter[1] + 1];
    centavos = centavos / 100;
    valor = parseFloat(valor) + parseFloat(centavos);
    // 
    const valorNumerico = parseFloat(valor);

    if (!isNaN(valorNumerico)) {
      if (!dadosAgrupados[nome]) {
        dadosAgrupados[nome] = 0;
      }
      dadosAgrupados[nome] += valorNumerico;
    }
  });

  const resultado = Object.entries(dadosAgrupados).map(([nome, valor]) => [
    nome,
    valor.toFixed(2).replace(".", ","),
  ]);

  resultado.sort((a, b) => a[0].localeCompare(b[0]));

  return resultado;
}

function renderizarCabecalhoTabela(cabecalhos) {
  cabecalhoTabela.innerHTML = "";
  cabecalhos.forEach((cabecalho) => {
    const th = document.createElement("th");
    th.textContent = cabecalho;
    cabecalhoTabela.appendChild(th);
  });
}

function renderizarLinhasTabela(linhas) {
  const corpoTabela = document.querySelector("tbody");
  corpoTabela.innerHTML = "";

  linhas.forEach((colunas) => {
    const linha = document.createElement("tr");
    colunas.forEach((coluna) => {
      const celula = document.createElement("td");
      celula.textContent = coluna;
      linha.appendChild(celula);
    });
    corpoTabela.appendChild(linha);
  });
}

function atualizarPaginacao() {
  const inicio = (paginaAtual - 1) * linhasPorPagina;
  const fim = inicio + linhasPorPagina;
  const linhasPaginadas = dadosCSV.slice(inicio, fim);

  renderizarLinhasTabela(linhasPaginadas);
  renderizarControlesPaginacao();
  renderizarTotalizador(linhasPaginadas);
}

function formatarNumero(numero) {
  return numero
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    // .replace(".", ",");
}

function renderizarTotalizador(linhas) {
  const corpoTabela = document.querySelector("tbody");
  const linhaTotal = document.getElementById("linhaTotal");
  if (linhaTotal) {
    corpoTabela.removeChild(linhaTotal);
  }

  const totalValor = linhas.reduce((acc, colunas) => {
    const valor = parseFloat(colunas[1].replace(".", "").replace(",", "."));
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  const novaLinha = document.createElement("tr");
  novaLinha.id = "linhaTotal";
  const celulaNome = document.createElement("td");
  celulaNome.textContent = "Total";
  celulaNome.style.fontWeight = "bold";
  novaLinha.appendChild(celulaNome);

  const celulaValor = document.createElement("td");
  celulaValor.textContent =
    "Totalizador R$ " + formatarNumero(totalValor.toFixed(2).replace(".", ","));
  celulaValor.style.fontWeight = "bold";
  novaLinha.appendChild(celulaValor);

  corpoTabela.appendChild(novaLinha);
}

function renderizarControlesPaginacao() {
  controlesPaginacao.innerHTML = "";

  const totalPaginas = Math.ceil(dadosCSV.length / linhasPorPagina);

  if (paginaAtual > 1) {
    const botaoAnterior = document.createElement("button");
    botaoAnterior.textContent = "Anterior";
    botaoAnterior.onclick = () => {
      paginaAtual--;
      atualizarPaginacao();
    };
    controlesPaginacao.appendChild(botaoAnterior);
  }

  if (paginaAtual < totalPaginas) {
    const botaoProxima = document.createElement("button");
    botaoProxima.textContent = "Próxima";
    botaoProxima.onclick = () => {
      paginaAtual++;
      atualizarPaginacao();
    };
    controlesPaginacao.appendChild(botaoProxima);
  }

  const informacaoPagina = document.createElement("span");
  informacaoPagina.textContent = ` Página ${paginaAtual} de ${totalPaginas} `;
  controlesPaginacao.appendChild(informacaoPagina);
}

document.getElementById("exportButton").addEventListener("click", () => {
  exportarParaExcel();
});

function exportarParaExcel() {
  const totalValor = dadosCSV.reduce((acc, colunas) => {
    const valor = parseFloat(colunas[1].replace(".", "").replace(",", "."));
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  const dadosExportados = [
    ["Nome", "Valor (R$)"], 
     ...dadosCSV.map((linha) => [linha[0], "" + formatarNumero(linha[1])]),
    ["Total", formatarNumero(totalValor.toFixed(2).replace(".", ","))] 
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(dadosExportados);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");

  XLSX.writeFile(wb, "Flash Vale Refeição.xlsx");
}
