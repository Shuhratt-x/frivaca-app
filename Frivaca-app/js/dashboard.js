// dashboard.js - controla a tela inicial

var sessaoAtual = verificarSessao();

var QTD_SEMANAS = 6;
var MAX_CATS = 7;
var MS_POR_DIA = 24 * 60 * 60 * 1000;

var graficoRosca = null;
var graficoBarras = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  exibirUsuario(sessaoAtual);
  iniciarMenuUsuario();
  iniciarLogout();
  iniciarMenuMobile();
  atualizarPainel();

  // Se abrir em outra aba e mudar algo, atualiza aqui também
  window.addEventListener('storage', function (evento) {
    if (evento.key === null || evento.key.indexOf('frivaca_') === 0) {
      atualizarPainel();
    }
  });
});

// --- Funcoes de dados ---

function inicioDoDia(data) {
  var d;
  if (typeof data === 'string' && data.length === 10) {
    var partes = data.split('-');
    d = new Date(partes[0], partes[1] - 1, partes[2]);
  } else {
    d = new Date(data);
  }
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatarDiaMes(data) {
  var dia = data.getDate();
  var mes = data.getMonth() + 1;
  if (dia < 10) dia = '0' + dia;
  if (mes < 10) mes = '0' + mes;
  return dia + '/' + mes;
}

function estaAbaixoDoMinimo(prod) {
  var atual = Number(prod.estoque_atual);
  var minimo = Number(prod.estoque_minimo);
  return atual <= 0 || atual < minimo;
}

function agruparPorSemana(produtos, movs) {
  var precos = {};
  var i, j;
  
  for (i = 0; i < produtos.length; i++) {
    precos[String(produtos[i].id)] = Number(produtos[i].preco_unitario) || 0;
  }

  var hoje = inicioDoDia(new Date());
  var semanas = [];
  for (i = 0; i < QTD_SEMANAS; i++) {
    semanas.push({ entrada: 0, saida: 0, perda: 0 });
  }

  for (i = 0; i < movs.length; i++) {
    var mov = movs[i];
    var preco = precos[String(mov.produto_id)];
    var dia = inicioDoDia(mov.data);
    
    if (preco === undefined || dia === null) continue;

    var diasAtras = Math.round((hoje.getTime() - dia.getTime()) / MS_POR_DIA);
    if (diasAtras < 0) continue;
    
    var indice = Math.floor(diasAtras / 7);
    if (indice >= QTD_SEMANAS) continue;

    if (semanas[indice][mov.tipo] !== undefined) {
      semanas[indice][mov.tipo] += Number(mov.quantidade) * preco;
    }
  }

  return semanas;
}

function arredondarCentavos(valor) {
  return Math.round(valor * 100) / 100;
}

function carregarDados() {
  var produtos = Produtos.listar();
  var movs = Movimentacoes.listar();
  var semanas = agruparPorSemana(produtos, movs);

  var valorEstoque = 0;
  var abaixoMin = 0;
  var i;

  for (i = 0; i < produtos.length; i++) {
    valorEstoque += Number(produtos[i].estoque_atual) * Number(produtos[i].preco_unitario);
    if (estaAbaixoDoMinimo(produtos[i])) {
      abaixoMin++;
    }
  }

  return {
    produtos: produtos,
    movs: movs,
    semanas: semanas,
    resumo: {
      totalProdutos: produtos.length,
      valorEstoque: arredondarCentavos(valorEstoque),
      abaixoMinimo: abaixoMin,
      perdasSemana: arredondarCentavos(semanas[0].perda)
    }
  };
}

function valorPorCategoria(produtos) {
  var mapa = {};
  var i;

  for (i = 0; i < produtos.length; i++) {
    var p = produtos[i];
    var cat = (p.categoria || '').trim();
    if (cat === '') cat = 'Sem categoria';
    
    var valor = Number(p.estoque_atual) * Number(p.preco_unitario);
    
    if (!mapa[cat]) {
      mapa[cat] = 0;
    }
    mapa[cat] += valor;
  }

  var lista = [];
  for (var nome in mapa) {
    if (mapa[nome] > 0) {
      lista.push({ nome: nome, valor: arredondarCentavos(mapa[nome]) });
    }
  }

  // Ordena do maior valor para o menor
  lista.sort(function (a, b) {
    return b.valor - a.valor;
  });

  if (lista.length > MAX_CATS) {
    var resto = 0;
    for (i = MAX_CATS; i < lista.length; i++) {
      resto += lista[i].valor;
    }
    
    // Corta a lista e adiciona "Outras"
    var novaLista = lista.slice(0, MAX_CATS);
    novaLista.push({ nome: 'Outras', valor: arredondarCentavos(resto) });
    return novaLista;
  }

  return lista;
}

// --- Funcoes de tela ---

function atualizarPainel() {
  var dados = carregarDados();
  
  document.getElementById('resumo-produtos').textContent = dados.resumo.totalProdutos;
  document.getElementById('resumo-valor').textContent = formatarMoeda(dados.resumo.valorEstoque);
  document.getElementById('resumo-abaixo-minimo').textContent = dados.resumo.abaixoMinimo;
  document.getElementById('resumo-perdas').textContent = formatarMoeda(dados.resumo.perdasSemana);
  
  renderizarTabela(dados.movs, dados.produtos);
  renderizarAtividades();
  renderizarGraficoRosca(dados.produtos);
  renderizarGraficoBarras(dados.semanas);
}

function renderizarTabela(movs, produtos) {
  var tbody = document.getElementById('tabela-movimentacoes');
  tbody.innerHTML = '';

  if (movs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Nenhuma movimentacao recente.</td></tr>';
    return;
  }

  // Pega as ultimas 5 e inverte a ordem (mais recente primeiro)
  var ultimas = movs.slice(-5).reverse();
  var mapaProdutos = {};
  var i;

  for (i = 0; i < produtos.length; i++) {
    mapaProdutos[produtos[i].id] = produtos[i].nome;
  }

  for (i = 0; i < ultimas.length; i++) {
    var mov = ultimas[i];
    var nomeProd = mapaProdutos[mov.produto_id] || 'Produto Excluido';
    
    // Formata a data
    var d = new Date(mov.data);
    var dtFmt = isNaN(d.getTime()) ? mov.data : (d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear());

    var corBadge = 'badge-entrada';
    var txtTipo = 'Entrada';
    
    if (mov.tipo === 'saida') {
      corBadge = 'badge-saida';
      txtTipo = 'Saida';
    } else if (mov.tipo === 'perda') {
      corBadge = 'badge-perda';
      txtTipo = 'Perda';
    }

    var tr = document.createElement('tr');
    tr.innerHTML = 
      '<td style="font-weight: 600;">' + nomeProd + '</td>' +
      '<td><span class="badge-status ' + corBadge + '">' + txtTipo + '</span></td>' +
      '<td style="font-family: var(--font-mono); font-weight: 700;">' + mov.quantidade + '</td>' +
      '<td style="color: #666;">' + dtFmt + '</td>';
      
    tbody.appendChild(tr);
  }
}

function renderizarAtividades() {
  var lista = document.getElementById('lista-atividades');
  lista.innerHTML = '';

  var logs = [];
  
  // Tenta puxar os logs (se existir o objeto Log no futuro)
  if (typeof Log !== 'undefined' && Log.listar) {
    logs = Log.listar();
  }

  var recentes = logs.slice(-4).reverse();

  if (recentes.length === 0) {
    lista.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Nenhuma atividade registrada.</p>';
    return;
  }

  for (var i = 0; i < recentes.length; i++) {
    var log = recentes[i];
    var d = new Date(log.data);
    var hora = 'Recentemente';
    
    if (!isNaN(d.getTime())) {
      var hh = d.getHours();
      var mm = d.getMinutes();
      if (hh < 10) hh = '0' + hh;
      if (mm < 10) mm = '0' + mm;
      hora = hh + ':' + mm;
    }

    var div = document.createElement('div');
    div.className = 'update-item';
    
    div.innerHTML = 
      '<div class="update-icon">' +
        '<svg class="icon" style="width: 20px; height: 20px;" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>' +
      '</div>' +
      '<div class="update-text">' +
        '<p>' + log.acao + '</p>' +
        '<span>' + hora + '</span>' +
      '</div>';
      
    lista.appendChild(div);
  }
}

// --- Funcoes dos Graficos ---

function prepararCanvas(areaId, descricao) {
  var area = document.getElementById(areaId);
  area.innerHTML = ''; 

  var canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', descricao);
  
  area.appendChild(canvas);
  return canvas;
}

function limparArea(areaId) {
  document.getElementById(areaId).innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#888; font-size:0.9rem;">O grafico aparece aqui quando houver dados.</div>';
}

function renderizarGraficoRosca(produtos) {
  graficoRosca = destruirGrafico(graficoRosca);
  var cats = valorPorCategoria(produtos);
  
  if (cats.length === 0) { 
    limparArea('grafico-estoque'); 
    return; 
  }
  
  if (typeof Chart === 'undefined') { 
    document.getElementById('grafico-estoque').innerHTML = '<p style="text-align:center; color:red;">Erro no Chart.js</p>'; 
    return; 
  }

  var rotulos = [];
  var valores = [];
  for (var i = 0; i < cats.length; i++) {
    rotulos.push(cats[i].nome);
    valores.push(cats[i].valor);
  }

  var canvas = prepararCanvas('grafico-estoque', 'Estoque por categoria');
  graficoRosca = criarGraficoRosca(canvas, {
    rotulos: rotulos,
    valores: valores,
    formatarValor: formatarMoeda
  });
}

function renderizarGraficoBarras(semanas) {
  graficoBarras = destruirGrafico(graficoBarras);
  
  // Verifica se tem algum dado pra mostrar
  var temDados = false;
  for (var i = 0; i < semanas.length; i++) {
    if (semanas[i].entrada > 0 || semanas[i].saida > 0 || semanas[i].perda > 0) {
      temDados = true;
      break;
    }
  }
  
  if (!temDados) { 
    limparArea('grafico-perdas'); 
    return; 
  }
  
  if (typeof Chart === 'undefined') { 
    document.getElementById('grafico-perdas').innerHTML = '<p style="text-align:center; color:red;">Erro no Chart.js</p>'; 
    return; 
  }

  var ordem = [];
  for (i = semanas.length - 1; i >= 0; i--) {
    ordem.push({ semana: semanas[i], indice: i });
  }

  var hoje = inicioDoDia(new Date());
  var rotulos = [];
  
  for (i = 0; i < ordem.length; i++) {
    var item = ordem[i];
    var fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - item.indice * 7);
    var inicio = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - 6);
    rotulos.push(formatarDiaMes(inicio) + ' - ' + formatarDiaMes(fim));
  }

  var vEntradas = [];
  var vSaidas = [];
  var vPerdas = [];
  
  for (i = 0; i < ordem.length; i++) {
    vEntradas.push(arredondarCentavos(ordem[i].semana.entrada));
    vSaidas.push(arredondarCentavos(ordem[i].semana.saida));
    vPerdas.push(arredondarCentavos(ordem[i].semana.perda));
  }

  var canvas = prepararCanvas('grafico-perdas', 'Grafico de barras');
  graficoBarras = criarGraficoBarras(canvas, {
    rotulos: rotulos,
    series: [
      { rotulo: 'Entradas', valores: vEntradas },
      { rotulo: 'Saidas', valores: vSaidas },
      { rotulo: 'Perdas', valores: vPerdas }
    ],
    tituloY: 'Valor (R$)',
    formatarValor: formatarMoeda
  });
}

// --- Funcoes do Header / Auth ---

function obterIniciais(nome) {
  var partes = nome.trim().split(' ');
  var iniciais = partes[0].charAt(0);
  if (partes.length > 1) {
    iniciais += partes[partes.length - 1].charAt(0);
  }
  return iniciais.toUpperCase();
}

function exibirUsuario(sessao) {
  document.getElementById('user-name').textContent = sessao.nome;
  document.getElementById('user-avatar').textContent = obterIniciais(sessao.nome);
}

function iniciarMenuUsuario() {
  var botao = document.getElementById('user-menu-btn');
  var menu = document.getElementById('user-menu');
  if (!botao || !menu) return;

  botao.addEventListener('click', function () { 
    menu.hidden = !menu.hidden; 
  });
  
  document.addEventListener('click', function (evento) {
    if (!menu.hidden && !menu.contains(evento.target) && !botao.contains(evento.target)) {
      menu.hidden = true;
    }
  });
}

function iniciarLogout() {
  var btnTopo = document.getElementById('btn-logout');
  if (btnTopo) btnTopo.addEventListener('click', logout);
  
  var btnSide = document.getElementById('btn-logout-sidebar');
  if (btnSide) btnSide.addEventListener('click', logout);
}

function iniciarMenuMobile() {
  var app = document.getElementById('app');
  var botao = document.getElementById('menu-toggle');
  var overlay = document.getElementById('sidebar-overlay');
  if (!botao) return;

  botao.addEventListener('click', function () { 
    var aberto = app.classList.contains('sidebar-open');
    if (aberto) {
      app.classList.remove('sidebar-open');
      document.body.classList.remove('no-scroll');
    } else {
      app.classList.add('sidebar-open');
      document.body.classList.add('no-scroll');
    }
  });
  
  if (overlay) {
    overlay.addEventListener('click', function () { 
      app.classList.remove('sidebar-open');
      document.body.classList.remove('no-scroll');
    });
  }
}

// TODO: ver se da pra juntar as funcoes do header num arquivo separado depois