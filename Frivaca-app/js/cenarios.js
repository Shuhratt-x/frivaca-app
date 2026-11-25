// cenarios.js - comparacao de cenarios salvos

var sessaoAtual = verificarSessao();

var ROTULOS_METODO = {
  analitico: 'Analitico',
  euler: 'Euler',
  rk4: 'RK4',
  comparar: 'Comparacao'
};

var HORIZONTE_PADRAO = 60;
var PONTOS_CURVA = 200;

var idsSelecionados = {}; // Guarda os IDs marcados
var grafico = null;
var idParaExcluir = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);
  renderizarTabela();

  // Evento do botao "selecionar todos"
  document.getElementById('selecionar-todos').addEventListener('change', function () {
    idsSelecionados = {};
    if (this.checked) {
      var cenarios = Cenarios.listar();
      for (var i = 0; i < cenarios.length; i++) {
        idsSelecionados[String(cenarios[i].id)] = true;
      }
    }
    renderizarTabela(); // Redesenha a tabela para marcar/desmarcar os checkboxes
  });

  document.getElementById('btn-limpar-selecao').addEventListener('click', function () {
    idsSelecionados = {};
    renderizarTabela();
  });

  document.getElementById('btn-confirmar-excluir').addEventListener('click', confirmarExclusao);

  // Botoes de fechar modal
  var btnsFechar = document.querySelectorAll('[data-fechar]');
  for (var i = 0; i < btnsFechar.length; i++) {
    btnsFechar[i].addEventListener('click', fecharModais);
  }
});

// --- Tabela ---

function renderizarTabela() {
  var corpo = document.getElementById('tabela-cenarios');
  var cenarios = Cenarios.listar();
  var i;

  // Ordena do mais novo pro mais velho
  cenarios.sort(function (a, b) {
    return b.id - a.id;
  });

  corpo.innerHTML = '';
  var total = cenarios.length;

  if (total === 0) {
    document.getElementById('subtitulo-lista').textContent = 'Nenhum cenario salvo.';
    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">Nenhum cenario. Salve um no <a href="simulador.html">Simulador</a>.</td></tr>';
    return;
  }

  document.getElementById('subtitulo-lista').textContent = total + ' cenarios salvos.';
  var htmlTabela = '';

  for (i = 0; i < cenarios.length; i++) {
    var c = cenarios[i];
    var idStr = String(c.id);
    var isChecked = idsSelecionados[idStr] ? 'checked' : '';
    var trClass = idsSelecionados[idStr] ? 'style="background:#F1F5F9;"' : '';
    
    var prod = Produtos.buscarPorId(c.produto_id);
    var nomeProd = prod ? prod.nome : 'Produto removido';

    // Formata os parametros
    var R = Number(c.R).toFixed(2);
    var D = Number(c.D).toFixed(2);
    var th = Number(c.theta).toFixed(4);
    var i0 = Number(c.I0).toFixed(2);
    var paramsStr = 'R ' + R + ' | D ' + D + ' | θ ' + th + ' | I0 ' + i0;

    var dataFmt = formatarData(c.data);
    var metodoStr = ROTULOS_METODO[c.metodo] || c.metodo;

    htmlTabela += 
      '<tr ' + trClass + '>' +
        '<td style="text-align:center;">' +
          '<input type="checkbox" class="check-cenario" data-id="' + idStr + '" ' + isChecked + ' style="width:18px; height:18px; accent-color:var(--color-accent);">' +
        '</td>' +
        '<td class="nome" style="font-weight: 600;">' + c.nome + '</td>' +
        '<td>' + nomeProd + '</td>' +
        '<td style="font-family: var(--font-mono); font-size: 0.8rem;">' + paramsStr + '</td>' +
        '<td>' + metodoStr + '</td>' +
        '<td>' + dataFmt + '</td>' +
        '<td class="actions text-right">' +
          '<button type="button" class="btn btn--ghost btn--sm btn-excluir" data-id="' + idStr + '" style="color:red;">Excluir</button>' +
        '</td>' +
      '</tr>';
  }

  corpo.innerHTML = htmlTabela;

  // Adiciona os eventos nos checkboxes e nos botoes de excluir
  var checkboxes = document.querySelectorAll('.check-cenario');
  for (i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', function () {
      var id = this.getAttribute('data-id');
      if (this.checked) {
        idsSelecionados[id] = true;
      } else {
        delete idsSelecionados[id];
      }
      atualizarSelecao();
    });
  }

  var btnsExcluir = document.querySelectorAll('.btn-excluir');
  for (i = 0; i < btnsExcluir.length; i++) {
    btnsExcluir[i].addEventListener('click', function () {
      pedirExclusao(this.getAttribute('data-id'));
    });
  }

  atualizarSelecao();
}

function atualizarSelecao() {
  var totalMarcados = 0;
  for (var id in idsSelecionados) {
    totalMarcados++;
  }

  var todos = document.getElementById('selecionar-todos');
  var totalCenarios = Cenarios.listar().length;

  todos.disabled = totalCenarios === 0;
  todos.checked = (totalCenarios > 0 && totalMarcados === totalCenarios);
  
  // O estado 'indeterminate' precisa ser setado via JS, não dá pra fazer no HTML
  if (totalMarcados > 0 && totalMarcados < totalCenarios) {
    todos.indeterminate = true;
  } else {
    todos.indeterminate = false;
  }

  document.getElementById('btn-limpar-selecao').hidden = (totalMarcados === 0);
  
  var txt = totalMarcados === 0 ? 'Nenhum cenario selecionado.' : totalMarcados + ' cenarios selecionados.';
  document.getElementById('contagem-selecao').textContent = txt;

  renderizarGrafico();
}

// --- Grafico ---

function renderizarGrafico() {
  var caixa = document.getElementById('grafico-caixa');
  var aviso = document.getElementById('aviso-comparacao');
  var canvas = document.getElementById('grafico-cenarios');
  var i;

  if (grafico) {
    grafico.destroy(); // Limpa o grafico antigo
    grafico = null;
  }

  var cenarios = Cenarios.listar();
  var escolhidos = [];

  for (i = 0; i < cenarios.length; i++) {
    if (idsSelecionados[String(cenarios[i].id)]) {
      escolhidos.push(cenarios[i]);
    }
  }

  if (escolhidos.length < 2) {
    caixa.hidden = true;
    aviso.hidden = false;
    aviso.textContent = 'Selecione 2 ou mais cenarios para comparar.';
    return;
  }

  if (typeof Chart === 'undefined') {
    caixa.hidden = true;
    aviso.hidden = false;
    aviso.textContent = 'Erro: Chart.js nao carregou.';
    return;
  }

  caixa.hidden = false;
  aviso.hidden = true;

  // Acha o maior horizonte entre os escolhidos
  var maxHorizonte = 0;
  for (i = 0; i < escolhidos.length; i++) {
    var h = Number(escolhidos[i].horizonte_dias) || HORIZONTE_PADRAO;
    if (h > maxHorizonte) maxHorizonte = h;
  }

  var datasets = [];
  var unidadesUsadas = [];

  for (i = 0; i < escolhidos.length; i++) {
    var c = escolhidos[i];
    var prod = Produtos.buscarPorId(c.produto_id);
    var unid = prod ? prod.unidade : '';
    
    // Evita unidades duplicadas (pra colocar no eixo Y)
    var temUnidade = false;
    for (var j = 0; j < unidadesUsadas.length; j++) {
      if (unidadesUsadas[j] === unid) temUnidade = true;
    }
    if (unid !== '' && !temUnidade) unidadesUsadas.push(unid);

    var pontos = gerarPontos(c, maxHorizonte);
    
    datasets.push({
      rotulo: c.nome,
      pontos: pontos,
      unidade: unid
    });
  }

  var tituloY = 'Estoque';
  if (unidadesUsadas.length === 1) {
    tituloY = 'Estoque (' + unidadesUsadas[0] + ')';
  }

  grafico = criarGraficoLinhasMultiplas(canvas, datasets, {
    tituloX: 'Tempo (dias)',
    tituloY: tituloY,
    xMax: maxHorizonte
  });
  
  console.log('Grafico renderizado com ' + escolhidos.length + ' curvas');
}

function gerarPontos(cenario, horizonte) {
  var R = Number(cenario.R);
  var D = Number(cenario.D);
  var theta = Number(cenario.theta);
  var I0 = Number(cenario.I0);
  var pontos = [];
  var k;

  if (cenario.metodo === 'euler' || cenario.metodo === 'rk4') {
    var dt = Number(cenario.passo_dt);
    if (!(dt > 0)) dt = 1;
    
    var passos = Math.round(horizonte / dt);
    if (passos < 1) passos = 1;
    
    var serie = cenario.metodo === 'euler' 
      ? euler(passos, dt, R, D, theta, I0)
      : rk4(passos, dt, R, D, theta, I0);
      
    for (k = 0; k < serie.length; k++) {
      pontos.push({ x: k * dt, y: serie[k] });
    }
    return pontos;
  }

  // Se for analitico
  for (k = 0; k <= PONTOS_CURVA; k++) {
    var t = (horizonte / PONTOS_CURVA) * k;
    pontos.push({ x: t, y: analitico(t, R, D, theta, I0) });
  }
  return pontos;
}

// --- Exclusao ---

function pedirExclusao(id) {
  var c = Cenarios.buscarPorId(id);
  if (!c) return;

  idParaExcluir = c.id;
  document.getElementById('excluir-mensagem').textContent = 'Tem certeza que deseja excluir o cenario "' + c.nome + '"?';
  
  document.getElementById('modal-excluir').classList.add('is-open');
}

function confirmarExclusao() {
  if (idParaExcluir == null) return;

  Cenarios.excluir(idParaExcluir);
  delete idsSelecionados[String(idParaExcluir)];
  idParaExcluir = null;
  
  renderizarTabela();
  fecharModais();
}

// --- Modais ---

function fecharModais() {
  document.getElementById('modal-excluir').classList.remove('is-open');
}

// --- Header ---

function configurarHeader(sessao) {
  var partes = sessao.nome.split(' ');
  var iniciais = partes[0].charAt(0);
  if (partes.length > 1) {
    iniciais += partes[partes.length - 1].charAt(0);
  }

  document.getElementById('user-name').textContent = sessao.nome;
  document.getElementById('user-avatar').textContent = iniciais.toUpperCase();

  var btnMenu = document.getElementById('user-menu-btn');
  var menu = document.getElementById('user-menu');

  btnMenu.addEventListener('click', function () {
    if (menu.hidden) {
      menu.hidden = false;
    } else {
      menu.hidden = true;
    }
  });

  var btnLogout = document.getElementById('btn-logout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
  
  var btnLogoutSide = document.getElementById('btn-logout-sidebar');
  if (btnLogoutSide) btnLogoutSide.addEventListener('click', logout);

  // Menu mobile
  var app = document.getElementById('app');
  var toggle = document.getElementById('menu-toggle');
  var overlay = document.getElementById('sidebar-overlay');

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (app.classList.contains('sidebar-open')) {
        app.classList.remove('sidebar-open');
      } else {
        app.classList.add('sidebar-open');
      }
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', function () {
      app.classList.remove('sidebar-open');
    });
  }
}