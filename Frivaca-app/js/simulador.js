// simulador.js - controla a tela de simulacao

var sessaoAtual = verificarSessao();

var COR_NEON = '#84CC16';
var COR_NEON_FUNDO = 'rgba(132, 204, 22, 0.18)';
var COR_EULER = '#0EA5E9';
var COR_RK4 = '#0B4D2C';

var PARAMS_PADRAO = { R: 40, D: 30, theta: 0.05, I0: 100, horizonte: 60, passo: '1' };

var grafico = null;
var produtoAtual = null;
var unidade = 'un';
var timerAtualizar = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);
  configurarEventos();
  preencherProdutos();
  criarGraficoInicial();
  resetarPadroes();
});

// ---------- Funcoes auxiliares ----------

function formatarNumero(valor, casas) {
  var n = Number(valor);
  if (casas === undefined) casas = 2;
  return n.toFixed(casas).replace('.', ',');
}

function lerNumero(txt) {
  if (txt == null) return null;
  txt = String(txt).replace(',', '.');
  var n = Number(txt);
  if (isNaN(n) || n < 0) return null;
  return n;
}

// Espera o usuario parar de mexer no slider pra atualizar
function agendarAtualizacao() {
  clearTimeout(timerAtualizar);
  timerAtualizar = setTimeout(atualizar, 30);
}

function getElemento(id) {
  return document.getElementById(id);
}

// ---------- Controles (Sliders e Inputs) ----------

function configurarEventos() {
  var chaves = ['R', 'D', 'theta', 'I0'];
  var i;

  for (i = 0; i < chaves.length; i++) {
    var k = chaves[i];
    var rng = getElemento('rng-' + k);
    var num = getElemento('num-' + k);

    rng.addEventListener('input', function () {
      var inputNum = getElemento('num-' + this.id.replace('rng-', ''));
      inputNum.value = this.value;
      inputNum.classList.remove('is-invalid');
      agendarAtualizacao();
    });

    num.addEventListener('input', function () {
      var v = lerNumero(this.value);
      if (v === null) {
        this.classList.add('is-invalid');
        return;
      }
      this.classList.remove('is-invalid');
      
      var inputRng = getElemento('rng-' + this.id.replace('num-', ''));
      if (v > Number(inputRng.max)) {
        inputRng.max = Math.ceil(v * 1.2);
      }
      inputRng.value = v;
      agendarAtualizacao();
    });
  }

  getElemento('horizonte').addEventListener('input', function () {
    if (lerNumero(this.value) === null) {
      this.classList.add('is-invalid');
    } else {
      this.classList.remove('is-invalid');
      agendarAtualizacao();
    }
  });

  getElemento('passo').addEventListener('change', agendarAtualizacao);

  var radios = document.getElementsByName('metodo');
  for (i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function () {
      var met = getMetodoSelecionado();
      getElemento('passo').disabled = (met === 'analitico');
      agendarAtualizacao();
    });
  }

  getElemento('produto-carregar').addEventListener('change', function () {
    carregarProduto(this.value);
  });

  getElemento('btn-restaurar').addEventListener('click', resetarPadroes);
  getElemento('btn-salvar-cenario').addEventListener('click', abrirSalvar);
  getElemento('form-salvar').addEventListener('submit', salvarCenario);

  // Botoes de fechar o modal
  var botoesFechar = document.querySelectorAll('.modal__close, .modal .btn--secondary');
  for (i = 0; i < botoesFechar.length; i++) {
    botoesFechar[i].addEventListener('click', fecharModal);
  }
}

function getMetodoSelecionado() {
  var radios = document.getElementsByName('metodo');
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) return radios[i].value;
  }
  return 'analitico';
}

function lerParametros() {
  var R = lerNumero(getElemento('num-R').value);
  var D = lerNumero(getElemento('num-D').value);
  var theta = lerNumero(getElemento('num-theta').value);
  var I0 = lerNumero(getElemento('num-I0').value);

  if (R === null || D === null || theta === null || I0 === null) {
    return null;
  }

  return { R: R, D: D, theta: theta, I0: I0 };
}

function resetarPadroes() {
  getElemento('produto-carregar').value = '';
  produtoAtual = null;
  getElemento('dica-produto').textContent = '';

  var chaves = ['R', 'D', 'theta', 'I0'];
  for (var i = 0; i < chaves.length; i++) {
    var k = chaves[i];
    var val = PARAMS_PADRAO[k];
    getElemento('rng-' + k).value = val;
    getElemento('num-' + k).value = val;
    getElemento('num-' + k).classList.remove('is-invalid');
  }

  getElemento('horizonte').value = PARAMS_PADRAO.horizonte;
  getElemento('passo').value = PARAMS_PADRAO.passo;
  getElemento('metodo-analitico').checked = true;
  getElemento('passo').disabled = true; // Comeca no analitico
  getElemento('status-salvo').hidden = true;

  atualizarUnidades();
  atualizar();
}

// ---------- Carregar Produto ----------

function preencherProdutos() {
  var select = getElemento('produto-carregar');
  var prods = Produtos.listar();

  for (var i = 0; i < prods.length; i++) {
    var opt = document.createElement('option');
    opt.value = prods[i].id;
    opt.textContent = prods[i].nome + ' (' + prods[i].unidade + ')';
    select.appendChild(opt);
  }
}

function carregarProduto(id) {
  if (!id) {
    produtoAtual = null;
    getElemento('dica-produto').textContent = '';
    atualizarUnidades();
    atualizar();
    return;
  }

  var p = Produtos.buscarPorId(id);
  if (!p) return;

  produtoAtual = p;
  
  getElemento('num-I0').value = p.estoque_atual;
  getElemento('rng-I0').value = p.estoque_atual;
  
  getElemento('num-theta').value = p.taxa_deterioracao;
  getElemento('rng-theta').value = p.taxa_deterioracao;

  // Estima R e D das ultimas movimentacoes
  var movs = Movimentacoes.listarPorProduto(p.id);
  var entradas = 0;
  var saidas = 0;
  var limite = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 dias atras
  
  for (var i = 0; i < movs.length; i++) {
    var d = new Date(movs[i].data).getTime();
    if (d > limite) {
      if (movs[i].tipo === 'entrada') entradas += Number(movs[i].quantidade);
      if (movs[i].tipo === 'saida') saidas += Number(movs[i].quantidade);
    }
  }

  if (entradas > 0 || saidas > 0) {
    var R_est = entradas / 30;
    var D_est = saidas / 30;
    getElemento('num-R').value = R_est.toFixed(2);
    getElemento('rng-R').value = R_est;
    getElemento('num-D').value = D_est.toFixed(2);
    getElemento('rng-D').value = D_est;
    getElemento('dica-produto').textContent = 'Parametros estimados com base nos ultimos 30 dias.';
  } else {
    getElemento('dica-produto').textContent = 'Sem movimentacoes recentes. Ajuste R e D na mao.';
  }

  atualizarUnidades();
  atualizar();
}

function atualizarUnidades() {
  unidade = produtoAtual ? produtoAtual.unidade : 'un';
  getElemento('unid-R').textContent = unidade + '/dia';
  getElemento('unid-D').textContent = unidade + '/dia';
  getElemento('unid-I0').textContent = unidade;
}

// ---------- Grafico ----------

function criarGraficoInicial() {
  if (typeof Chart === 'undefined') {
    getElemento('aviso-grafico').hidden = false;
    getElemento('grafico-simulador').hidden = true;
    return;
  }

  var ctx = getElemento('grafico-simulador').getContext('2d');
  
  grafico = new Chart(ctx, {
    type: 'line',
    data: { datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          type: 'linear',
          min: 0,
          title: { display: true, text: 'Tempo (dias)' }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Estoque' }
        }
      },
      plugins: {
        legend: { position: 'top', align: 'start' }
      }
    }
  });
}

function gerarPontos(serie, dt) {
  var pts = [];
  for (var i = 0; i < serie.length; i++) {
    pts.push({ x: i * dt, y: serie[i] });
  }
  return pts;
}

function gerarPontosAnaliticos(p, fim) {
  var pts = [];
  var qtdPontos = 200;
  for (var i = 0; i <= qtdPontos; i++) {
    var t = (fim / qtdPontos) * i;
    pts.push({ x: t, y: analitico(t, p.R, p.D, p.theta, p.I0) });
  }
  return pts;
}

// ---------- Recálculo Principal ----------

function atualizar() {
  var p = lerParametros();
  var horizonte = lerNumero(getElemento('horizonte').value);
  
  if (!p || horizonte === null || horizonte > 730) return;

  var dt = Number(getElemento('passo').value);
  var passos = Math.round(horizonte / dt);
  if (passos < 1) passos = 1;
  
  var fim = passos * dt;
  var metodo = getMetodoSelecionado();
  var minimo = produtoAtual ? Number(produtoAtual.estoque_minimo) : 0;

  // Calcula as series matematicas
  var serieAna = serieAnalitica(passos, dt, p.R, p.D, p.theta, p.I0);
  var serieEuler = null;
  var serieRk4 = null;

  if (metodo === 'euler' || metodo === 'comparar') {
    serieEuler = euler(passos, dt, p.R, p.D, p.theta, p.I0);
  }
  if (metodo === 'rk4' || metodo === 'comparar') {
    serieRk4 = rk4(passos, dt, p.R, p.D, p.theta, p.I0);
  }

  var datasets = [];
  var serieFinal = serieAna;

  // Monta o visual do grafico
  if (metodo === 'analitico') {
    datasets.push({
      label: 'Analitico',
      data: gerarPontosAnaliticos(p, fim),
      borderColor: COR_NEON,
      backgroundColor: COR_NEON_FUNDO,
      borderWidth: 3,
      fill: true,
      pointRadius: 0
    });
  } else if (metodo === 'euler') {
    datasets.push({
      label: 'Euler',
      data: gerarPontos(serieEuler, dt),
      borderColor: COR_NEON,
      backgroundColor: COR_NEON_FUNDO,
      borderWidth: 3,
      fill: true,
      pointRadius: passos <= 60 ? 3 : 0
    });
    serieFinal = serieEuler;
  } else if (metodo === 'rk4') {
    datasets.push({
      label: 'RK4',
      data: gerarPontos(serieRk4, dt),
      borderColor: COR_NEON,
      backgroundColor: COR_NEON_FUNDO,
      borderWidth: 3,
      fill: true,
      pointRadius: passos <= 60 ? 3 : 0
    });
    serieFinal = serieRk4;
  } else {
    // Comparar
    datasets.push({
      label: 'Analitico',
      data: gerarPontosAnaliticos(p, fim),
      borderColor: COR_NEON,
      backgroundColor: COR_NEON_FUNDO,
      borderWidth: 3,
      fill: true,
      pointRadius: 0
    });
    datasets.push({
      label: 'Euler',
      data: gerarPontos(serieEuler, dt),
      borderColor: COR_EULER,
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0
    });
    datasets.push({
      label: 'RK4',
      data: gerarPontos(serieRk4, dt),
      borderColor: COR_RK4,
      borderWidth: 2,
      fill: false,
      pointRadius: 0
    });
  }

  // Linha de Equilibrio
  var eq = equilibrio(p.R, p.D, p.theta);
  if (eq !== null) {
    datasets.push({
      label: 'Equilibrio (I*)',
      data: [{ x: 0, y: eq }, { x: fim, y: eq }],
      borderColor: '#888',
      borderWidth: 1.5,
      borderDash: [6, 6],
      fill: false,
      pointRadius: 0
    });
  }

  if (grafico) {
    grafico.data.datasets = datasets;
    grafico.options.scales.x.max = fim;
    grafico.options.scales.y.title.text = 'Estoque (' + unidade + ')';
    grafico.update('none');
  }

  // Atualiza textos e diagnostico
  getElemento('subtitulo-grafico').textContent = 'Metodo: ' + metodo;
  
  var estoqueFim = serieFinal[serieFinal.length - 1];
  var diag = diagnosticar(p.I0, p.R, p.D, p.theta, minimo);
  var tempoRuptura = tempoAteRuptura(p.R, p.D, p.theta, p.I0);

  getElemento('diag-titulo').textContent = diag.titulo;
  getElemento('diag-texto').textContent = diag.texto;
  getElemento('diag-equilibrio').textContent = diag.equilibrio === null ? 'Nao tem' : formatarNumero(diag.equilibrio) + ' ' + unidade;
  getElemento('diag-final').textContent = formatarNumero(estoqueFim) + ' ' + unidade;

  // ATUALIZA O BADGE E A BORDA
  var badge = getElemento('diag-badge');
  badge.className = 'badge';
  if (diag.nivel === 'critico') {
    badge.classList.add('badge--danger');
    badge.textContent = 'Critico';
  } else if (diag.nivel === 'alerta') {
    badge.classList.add('badge--warning');
    badge.textContent = 'Atencao';
  } else {
    badge.classList.add('badge--success');
    badge.textContent = 'Estavel';
  }
  document.getElementById('card-diagnostico').style.borderLeftColor = diag.cor;

  // ATUALIZA A RUPTURA (Com a formatacao de horas)
  var elementoRuptura = getElemento('diag-ruptura');
  if (tempoRuptura === Infinity) {
    elementoRuptura.textContent = 'Nunca';
  } else if (tempoRuptura > 0 && tempoRuptura < 1) {
    var horas = Math.round(tempoRuptura * 24);
    elementoRuptura.textContent = formatarNumero(tempoRuptura, 1) + ' dias (~' + horas + 'h)';
  } else {
    elementoRuptura.textContent = formatarNumero(tempoRuptura, 1) + ' dias';
  }
  
  // Mostra erros se estiver comparando
  if (serieEuler != null) {
    getElemento('linha-erro-euler').hidden = false;
    var errE = erroMaximo(serieAna, serieEuler);
    getElemento('diag-erro-euler').textContent = formatarNumero(errE, 3) + ' ' + unidade;
  } else {
    getElemento('linha-erro-euler').hidden = true;
  }

  if (serieRk4 != null) {
    getElemento('linha-erro-rk4').hidden = false;
    var errR = erroMaximo(serieAna, serieRk4);
    getElemento('diag-erro-rk4').textContent = formatarNumero(errR, 6) + ' ' + unidade;
  } else {
    getElemento('linha-erro-rk4').hidden = true;
  }
}

// ---------- Salvar Cenario ----------

function abrirSalvar() {
  if (!produtoAtual) {
    alert('Selecione um produto antes de salvar o cenario!');
    return;
  }

  var p = lerParametros();
  if (!p) return;

  var nome = produtoAtual.nome + ' - ' + new Date().toLocaleDateString('pt-BR');
  getElemento('cenario-nome').value = nome;
  getElemento('cenario-resumo').textContent = 'R=' + p.R + ' D=' + p.D + ' Theta=' + p.theta;
  getElemento('erro-salvar').hidden = true;
  
  getElemento('modal-salvar').classList.add('is-open');
}

function salvarCenario(e) {
  e.preventDefault();
  var nome = getElemento('cenario-nome').value;
  
  if (nome == '') {
    getElemento('erro-salvar').textContent = 'Digite um nome';
    getElemento('erro-salvar').hidden = false;
    return;
  }

  var p = lerParametros();
  var horizonte = lerNumero(getElemento('horizonte').value);

  try {
    Cenarios.criar({
      nome: nome,
      produto_id: produtoAtual.id,
      R: p.R,
      D: p.D,
      theta: p.theta,
      I0: p.I0,
      metodo: getMetodoSelecionado(),
      horizonte_dias: horizonte,
      passo_dt: Number(getElemento('passo').value)
    });
    
    fecharModal();
    alert('Cenario salvo com sucesso!');
  } catch (err) {
    getElemento('erro-salvar').textContent = err.message;
    getElemento('erro-salvar').hidden = false;
  }
}

function fecharModal() {
  getElemento('modal-salvar').classList.remove('is-open');
}

// ---------- Header / Auth ----------

function configurarHeader(sessao) {
  var partes = sessao.nome.split(' ');
  var iniciais = partes[0].charAt(0);
  if (partes.length > 1) {
    iniciais += partes[partes.length - 1].charAt(0);
  }

  getElemento('user-name').textContent = sessao.nome;
  getElemento('user-avatar').textContent = iniciais.toUpperCase();

  var btnMenu = getElemento('user-menu-btn');
  var menu = getElemento('user-menu');
  
  btnMenu.addEventListener('click', function () {
    if (menu.hidden) {
      menu.hidden = false;
    } else {
      menu.hidden = true;
    }
  });

  var btnSair = getElemento('btn-logout');
  if (btnSair) btnSair.addEventListener('click', logout);
  
  var btnSairSide = getElemento('btn-logout-sidebar');
  if (btnSairSide) btnSairSide.addEventListener('click', logout);

  // Menu mobile
  var app = getElemento('app');
  var toggle = getElemento('menu-toggle');
  var overlay = getElemento('sidebar-overlay');

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