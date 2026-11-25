// estoque.js - controla as movimentacoes de entrada, saida e perda

var sessaoAtual = verificarSessao();

var CONFIG_MOV = {
  entrada: {
    titulo: 'Registrar Entrada',
    botao: 'Registrar',
    classe: 'btn btn--primary',
    sinal: 1,
    motivoObrigatorio: false,
    sugestoes: ['Compra', 'Reposicao', 'Devolucao', 'Ajuste']
  },
  saida: {
    titulo: 'Registrar Saida',
    botao: 'Registrar',
    classe: 'btn btn--dark',
    sinal: -1,
    motivoObrigatorio: false,
    sugestoes: ['Venda', 'Consumo', 'Doacao', 'Ajuste']
  },
  perda: {
    titulo: 'Registrar Perda',
    botao: 'Registrar',
    classe: 'btn btn--danger',
    sinal: -1,
    motivoObrigatorio: true,
    sugestoes: ['Vencimento', 'Avaria', 'Falha na geladeira', 'Contaminacao']
  }
};

var movAtual = null; // Guarda qual produto e tipo estamos mexendo

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);
  
  var form = document.getElementById('form-movimentacao');
  form.addEventListener('submit', salvarMovimentacao);
  form.addEventListener('input', function () {
    document.getElementById('erro-movimentacao').hidden = true;
    atualizarPreview();
  });

  // Botoes de fechar modal
  var btnsFechar = document.querySelectorAll('[data-fechar]');
  for (var i = 0; i < btnsFechar.length; i++) {
    btnsFechar[i].addEventListener('click', fecharModal);
  }

  renderizarTabela();
});

// --- Funcoes auxiliares ---

function formatarNumero(valor) {
  var n = Number(valor);
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function lerQuantidade(texto) {
  if (texto == null) return NaN;
  texto = String(texto).replace(',', '.');
  var n = Number(texto);
  if (isNaN(n)) return NaN;
  return n;
}

function arredondar(n) {
  return Math.round(n * 1000) / 1000;
}

function getStatus(prod) {
  var atual = Number(prod.estoque_atual);
  var minimo = Number(prod.estoque_minimo);

  if (atual <= 0 || (minimo > 0 && atual < minimo / 2)) {
    return { txt: 'Critico', cor: 'badge--danger' };
  }
  if (atual < minimo) {
    return { txt: 'Baixo', cor: 'badge--warning' };
  }
  return { txt: 'OK', cor: 'badge--success' };
}

// --- Tabela ---

function renderizarTabela() {
  var corpo = document.getElementById('tabela-estoque');
  var produtos = Produtos.listar();
  var i;

  produtos.sort(function (a, b) {
    return a.nome.localeCompare(b.nome);
  });

  corpo.innerHTML = '';
  var total = produtos.length;
  var subtitulo = document.getElementById('subtitulo-lista');

  if (total === 0) {
    subtitulo.textContent = 'Nenhum produto cadastrado.';
    corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#888;">Nenhum produto no estoque. Cadastre na aba "Produtos".</td></tr>';
    return;
  }

  var qtdBaixos = 0;

  for (i = 0; i < produtos.length; i++) {
    var p = produtos[i];
    var st = getStatus(p);
    var semEstoque = Number(p.estoque_atual) <= 0;

    if (st.txt !== 'OK') qtdBaixos++;

    var tr = document.createElement('tr');
    
    // Monta a linha
    tr.innerHTML = 
      '<td class="nome" style="font-weight: 600;">' + p.nome + '</td>' +
      '<td class="num" style="text-align:right; font-family: var(--font-mono);">' + formatarNumero(p.estoque_atual) + ' ' + p.unidade + '</td>' +
      '<td class="num" style="text-align:right; font-family: var(--font-mono);">' + formatarNumero(p.estoque_minimo) + ' ' + p.unidade + '</td>' +
      '<td><span class="badge ' + st.cor + '">' + st.txt + '</span></td>' +
      '<td class="actions text-right">' +
        '<button type="button" class="btn btn--secondary btn--sm btn-mov" data-tipo="entrada" data-id="' + p.id + '">+ Entrada</button> ' +
        '<button type="button" class="btn btn--secondary btn--sm btn-mov" data-tipo="saida" data-id="' + p.id + '" ' + (semEstoque ? 'disabled' : '') + '>- Saida</button> ' +
        '<button type="button" class="btn btn--ghost btn--sm btn-perda btn-mov" data-tipo="perda" data-id="' + p.id + '" ' + (semEstoque ? 'disabled' : '') + '>! Perda</button>' +
      '</td>';

    corpo.appendChild(tr);
  }

  subtitulo.textContent = total + ' produtos' + (qtdBaixos > 0 ? ' - ' + qtdBaixos + ' abaixo do minimo' : ' - Todos OK');

  // Adiciona evento nos botoes gerados
  var botoes = document.querySelectorAll('.btn-mov');
  for (i = 0; i < botoes.length; i++) {
    botoes[i].addEventListener('click', function () {
      var tipo = this.getAttribute('data-tipo');
      var id = this.getAttribute('data-id');
      abrirMovimentacao(id, tipo);
    });
  }
}

// --- Modal de movimentacao ---

function abrirMovimentacao(id, tipo) {
  var conf = CONFIG_MOV[tipo];
  var prod = Produtos.buscarPorId(id);
  
  if (!prod) return;
  if (conf.sinal < 0 && Number(prod.estoque_atual) <= 0) return; // Seguranca

  var form = document.getElementById('form-movimentacao');
  form.reset();
  document.getElementById('erro-movimentacao').hidden = true;
  
  movAtual = { id: prod.id, tipo: tipo };

  document.getElementById('modal-mov-titulo').textContent = conf.titulo;
  
  var info = document.getElementById('mov-info');
  info.innerHTML = prod.nome + ' - Estoque atual: <strong>' + formatarNumero(prod.estoque_atual) + ' ' + prod.unidade + '</strong>';

  document.getElementById('mov-quantidade-rotulo').textContent = 'Quantidade (' + prod.unidade + ')';
  document.getElementById('mov-motivo-rotulo').textContent = conf.motivoObrigatorio ? 'Motivo (Obrigatorio)' : 'Motivo (Opcional)';
  document.getElementById('mov-preview').hidden = true;

  var listaSug = document.getElementById('mov-sugestoes');
  listaSug.innerHTML = '';
  for (var i = 0; i < conf.sugestoes.length; i++) {
    var opt = document.createElement('option');
    opt.value = conf.sugestoes[i];
    listaSug.appendChild(opt);
  }

  var btn = document.getElementById('btn-salvar-mov');
  btn.className = conf.classe;
  btn.textContent = conf.botao;

  document.getElementById('modal-movimentacao').classList.add('is-open');
  form.elements.quantidade.focus();
}

function atualizarPreview() {
  var preview = document.getElementById('mov-preview');
  if (!movAtual) return;

  var prod = Produtos.buscarPorId(movAtual.id);
  var qtd = lerQuantidade(document.getElementById('mov-quantidade').value);

  if (!prod || !(qtd > 0)) {
    preview.hidden = true;
    return;
  }

  var sinal = CONFIG_MOV[movAtual.tipo].sinal;
  var novoEstoque = arredondar(Number(prod.estoque_atual) + (sinal * qtd));

  if (novoEstoque < 0) {
    preview.textContent = 'Aviso: quantidade maior que o estoque disponivel!';
    preview.style.color = 'red';
  } else {
    preview.textContent = 'Estoque depois: ' + formatarNumero(novoEstoque) + ' ' + prod.unidade;
    preview.style.color = '#666';
  }
  preview.hidden = false;
}

function salvarMovimentacao(evento) {
  evento.preventDefault();
  if (!movAtual) return;

  var form = evento.target;
  var conf = CONFIG_MOV[movAtual.tipo];
  var prod = Produtos.buscarPorId(movAtual.id);

  if (!prod) {
    alert('Erro: produto nao encontrado.');
    return;
  }

  var qtd = lerQuantidade(form.elements.quantidade.value);
  if (!(qtd > 0)) {
    document.getElementById('erro-movimentacao').textContent = 'Digite uma quantidade valida.';
    document.getElementById('erro-movimentacao').hidden = false;
    return;
  }

  var motivo = form.elements.motivo.value;
  if (conf.motivoObrigatorio && motivo === '') {
    document.getElementById('erro-movimentacao').textContent = 'O motivo e obrigatorio para perdas.';
    document.getElementById('erro-movimentacao').hidden = false;
    return;
  }

  if (conf.sinal < 0 && arredondar(Number(prod.estoque_atual) - qtd) < 0) {
    document.getElementById('erro-movimentacao').textContent = 'Estoque insuficiente.';
    document.getElementById('erro-movimentacao').hidden = false;
    return;
  }

  try {
    Movimentacoes.registrar({
      produto_id: prod.id,
      tipo: movAtual.tipo,
      quantidade: qtd,
      motivo: motivo
    });
    console.log('Movimentacao salva'); // TODO: remover depois
  } catch (erro) {
    document.getElementById('erro-movimentacao').textContent = erro.message;
    document.getElementById('erro-movimentacao').hidden = false;
    return;
  }

  renderizarTabela();
  fecharModal();
}

function fecharModal() {
  document.getElementById('modal-movimentacao').classList.remove('is-open');
  movAtual = null;
}

// --- Header / Auth ---

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
        document.body.classList.remove('no-scroll');
      } else {
        app.classList.add('sidebar-open');
        document.body.classList.add('no-scroll');
      }
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', function () {
      app.classList.remove('sidebar-open');
      document.body.classList.remove('no-scroll');
    });
  }
}