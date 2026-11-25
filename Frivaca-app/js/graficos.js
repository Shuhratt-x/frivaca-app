// graficos.js - funcoes que criam os graficos com o Chart.js

var PALETA_CORES = ['#84CC16', '#0B4D2C', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6', '#EC4899'];

// Pega uma cor do CSS (senao tiver, usa a padrao)
function lerCorCss(nomeVar, corPadrao) {
  var cor = getComputedStyle(document.documentElement).getPropertyValue(nomeVar).trim();
  if (cor === '') {
    return corPadrao;
  }
  return cor;
}

// Formata o numero pra nao ficar com muitas casas decimais
function formatarNumeroGrafico(valor) {
  var n = Number(valor);
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

// =========================================================================
// GRAFICO DE ROSCA (Dashboard - Categorias)
// =========================================================================
function criarGraficoRosca(ctx, dados) {
  if (typeof Chart === 'undefined') return null;

  var rotulos = dados.rotulos || [];
  var valores = dados.valores || [];
  var formatar = dados.formatarValor || formatarNumeroGrafico;
  var cores = [];
  var i;

  // Calcula o total pra mostrar a porcentagem no tooltip
  var total = 0;
  for (i = 0; i < valores.length; i++) {
    total += Number(valores[i]);
  }

  // Se nao mandaram cores especificas, pega da paleta
  if (dados.cores) {
    cores = dados.cores;
  } else {
    for (i = 0; i < rotulos.length; i++) {
      cores.push(PALETA_CORES[i % PALETA_CORES.length]);
    }
  }

  console.log("Criando grafico de rosca..."); // TODO: remover

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: rotulos,
      datasets: [{
        data: valores,
        backgroundColor: cores,
        borderColor: lerCorCss('--color-surface', '#FFFFFF'),
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // TODO: ver se isso funciona direito no mobile
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, padding: 14 }
        },
        tooltip: {
          callbacks: {
            label: function (item) {
              var percentual = 0;
              if (total > 0) {
                percentual = (item.parsed / total) * 100;
              }
              return item.label + ': ' + formatar(item.parsed) + ' (' + formatarNumeroGrafico(percentual) + '%)';
            }
          }
        }
      }
    }
  });
}

// =========================================================================
// GRAFICO DE BARRAS (Dashboard - Entradas/Saidas/Perdas)
// =========================================================================
function criarGraficoBarras(ctx, dados) {
  if (typeof Chart === 'undefined') return null;

  var formatar = dados.formatarValor || formatarNumeroGrafico;
  var series = dados.series || [];
  var conjuntos = [];
  var i;

  // Cores padrao para as series
  var coresPadrao = ['#84CC16', '#0EA5E9', '#EF4444'];

  for (i = 0; i < series.length; i++) {
    var s = series[i];
    var corDaSerie = s.cor;
    
    if (!corDaSerie) {
      corDaSerie = coresPadrao[i % coresPadrao.length];
    }

    conjuntos.push({
      label: s.rotulo,
      data: s.valores,
      backgroundColor: corDaSerie,
      borderRadius: 4,
      maxBarThickness: 28
    });
  }

  return new Chart(ctx, {
    type: 'bar',
    data: { labels: dados.rotulos || [], datasets: conjuntos },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          title: { display: !!dados.tituloY, text: dados.tituloY || '' },
          grid: { color: lerCorCss('--color-border', '#E3ECE5') },
          ticks: {
            callback: function (valor) { 
              return formatarNumeroGrafico(valor); 
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { usePointStyle: true, boxWidth: 8 }
        },
        tooltip: {
          callbacks: {
            label: function (item) {
              return item.dataset.label + ': ' + formatar(item.parsed.y);
            }
          }
        }
      }
    }
  });
}

// =========================================================================
// GRAFICO DE LINHAS (Cenarios - Comparacao)
// =========================================================================
function criarGraficoLinhasMultiplas(ctx, datasets, opcoes) {
  if (typeof Chart === 'undefined') return null;
  
  if (!opcoes) opcoes = {};

  var bordaFraca = lerCorCss('--color-border', '#E3ECE5');
  var bordaForte = lerCorCss('--color-border-strong', '#CBD8CE');
  var conjuntos = [];
  var i;

  for (i = 0; i < datasets.length; i++) {
    var d = datasets[i];
    var cor = d.cor;
    
    if (!cor) {
      cor = PALETA_CORES[i % PALETA_CORES.length];
    }

    conjuntos.push({
      label: d.rotulo,
      data: d.pontos,
      unidade: d.unidade || '',
      borderColor: cor,
      backgroundColor: cor,
      borderWidth: 2.5,
      borderDash: d.tracejado || [],
      fill: false,
      tension: 0, // Linha reta (sem curva)
      pointRadius: 0, // Esconde as bolinhas
      pointHoverRadius: 5
    });
  }

  // Configura o eixo X
  var escalaX = {
    type: 'linear',
    min: 0,
    title: { display: true, text: opcoes.tituloX || 'Tempo (dias)' },
    ticks: { maxTicksLimit: 10 },
    grid: { display: false }
  };
  
  if (opcoes.xMax > 0) {
    escalaX.max = opcoes.xMax;
  }

  return new Chart(ctx, {
    type: 'line',
    data: { datasets: conjuntos },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, 
      parsing: false, // Os pontos ja vem no formato {x, y}
      interaction: { mode: 'x', intersect: false },
      scales: {
        x: escalaX,
        y: {
          suggestedMin: 0,
          title: { display: true, text: opcoes.tituloY || 'Estoque' },
          grid: {
            // Pinta a linha do zero de uma cor mais forte
            color: function (contexto) { 
              if (contexto.tick.value === 0) return bordaForte;
              return bordaFraca;
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { usePointStyle: true, boxWidth: 8 }
        },
        tooltip: {
          callbacks: {
            title: function (itens) {
              if (itens.length > 0) {
                return 'Dia ' + formatarNumeroGrafico(itens[0].parsed.x);
              }
              return '';
            },
            label: function (item) {
              var unidade = '';
              if (item.dataset.unidade) {
                unidade = ' ' + item.dataset.unidade;
              }
              return item.dataset.label + ': ' + formatarNumeroGrafico(item.parsed.y) + unidade;
            }
          }
        }
      }
    }
  });
}

// Destroi o grafico antigo pra nao ficar dois na tela
function destruirGrafico(grafico) {
  if (grafico) {
    grafico.destroy();
  }
  return null;
}