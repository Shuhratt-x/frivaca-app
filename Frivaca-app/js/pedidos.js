// pedidos.js - controla os pedidos de compra

var sessaoAtual = verificarSessao();

var idPedidoEntregar = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);

  document.getElementById('btn-novo-pedido').addEventListener('click', abrirFormulario);
  
  var form = document.getElementById('form-pedido');
  form.addEventListener('submit', salvarPedido);
  form.addEventListener('input', function () {
    document.getElementById('erro-pedido').hidden = true;
  });
  
  // Atualiza a dica da unidade quando troca o produto
  form.elements.produto_id.addEventListener('change', function () {
    var prodId = this.value;
    if (!prodId) {
      document.getElementById('pedido-unidade').textContent = 'Selecione um produto para ver a unidade.';
      return;
    }
    var p = Produtos.buscarPorId(prodId);
    if (p) {
      document.getElementById('pedido-unidade').textContent = 'Quantidade em ' + p.unidade + '.';
    }
  });

  document.getElementById('btn-confirmar-entrega').addEventListener('click', confirmarEntrega);

  // Botoes de fechar modal
  var btnsFechar = document.querySelectorAll('[data-fechar]');
  for (var i = 0; i < btnsFechar.length; i++) {
    btnsFechar[i].addEventListener('click', fecharModais);
  }

  renderizarTabela();
});

// --- Tabela ---

function renderizarTabela() {
  var corpo = document.getElementById('tabela-pedidos');
  var pedidos = Pedidos.listar();
  var fornecedores = Fornecedores.listar();
  var produtos = Produtos.listar();
  var i, j;

  // Ordena: pendentes primeiro, depois os mais novos
  pedidos.sort(function (a, b) {
    if (a.status === 'pendente' && b.status !== 'pendente') return -1;
    if (a.status !== 'pendente' && b.status === 'pendente') return 1;
    return b.id - a.id;
  });

  corpo.innerHTML = '';
  
  var total = pedidos.length;
  var pendentes = 0;

  // Conta quantos estao pendentes
  for (i = 0; i < pedidos.length; i++) {
    if (pedidos[i].status === 'pendente') pendentes++;
  }

  var subtitulo = document.getElementById('subtitulo-lista');
  if (total === 0) {
    subtitulo.textContent = 'Nenhum pedido registrado.';
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">Nenhum pedido. Crie um novo!</td></tr>';
    return;
  }
  
  subtitulo.textContent = total + ' pedidos (' + pendentes + ' pendentes)';

  var htmlTabela = '';

  for (i = 0; i < pedidos.length; i++) {
    var ped = pedidos[i];
    
    // Procura o nome do fornecedor e do produto
    var nomeForn = '(removido)';
    for (j = 0; j < fornecedores.length; j++) {
      if (String(fornecedores[j].id) === String(ped.fornecedor_id)) {
        nomeForn = fornecedores[j].nome;
      }
    }

    var nomeProd = '(removido)';
    var unidade = '';
    for (j = 0; j < produtos.length; j++) {
      if (String(produtos[j].id) === String(ped.produto_id)) {
        nomeProd = produtos[j].nome;
        unidade = produtos[j].unidade;
      }
    }

    var dataFmt = formatarData(ped.data);
    var statusBadge = '';
    
    if (ped.status === 'entregue') {
      statusBadge = '<span class="badge" style="background:#DCFCE7; color:#166534; padding:4px 8px; border-radius:12px; font-size:0.8rem;">Entregue</span>';
    } else {
      statusBadge = '<span class="badge" style="background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:12px; font-size:0.8rem;">Pendente</span>';
    }

    var acao = '';
    if (ped.status === 'entregue') {
      acao = '<span style="font-size:0.8rem; color:#888;">Entregue em ' + formatarData(ped.data_entrega) + '</span>';
    } else {
      acao = '<button type="button" class="btn btn--primary btn--sm btn-entregar" data-id="' + ped.id + '">Entregar</button>';
    }

    htmlTabela += 
      '<tr>' +
        '<td>' + dataFmt + '</td>' +
        '<td style="font-weight:600;">' + nomeForn + '</td>' +
        '<td>' + nomeProd + '</td>' +
        '<td style="text-align:right; font-family:var(--font-mono);">' + ped.quantidade + ' ' + unidade + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="text-align:right;">' + acao + '</td>' +
      '</tr>';
  }

  corpo.innerHTML = htmlTabela;

  // Adiciona evento nos botoes de entregar que acabaram de ser criados
  var botoesEntregar = document.querySelectorAll('.btn-entregar');
  for (i = 0; i < botoesEntregar.length; i++) {
    botoesEntregar[i].addEventListener('click', function () {
      var id = this.getAttribute('data-id');
      pedirEntrega(id);
    });
  }
}

// --- Novo Pedido ---

function abrirFormulario() {
  var form = document.getElementById('form-pedido');
  var listaForn = document.getElementById('pedido-fornecedor');
  var listaProd = document.getElementById('pedido-produto');
  var btnSalvar = document.getElementById('btn-salvar-pedido');
  var i;

  form.reset();
  document.getElementById('erro-pedido').hidden = true;

  var fornecedores = Fornecedores.listar();
  var produtos = Produtos.listar();

  // Limpa os selects
  listaForn.innerHTML = '<option value="">Selecione o fornecedor...</option>';
  for (i = 0; i < fornecedores.length; i++) {
    var opt = document.createElement('option');
    opt.value = fornecedores[i].id;
    opt.textContent = fornecedores[i].nome;
    listaForn.appendChild(opt);
  }

  listaProd.innerHTML = '<option value="">Selecione o produto...</option>';
  for (i = 0; i < produtos.length; i++) {
    var optProd = document.createElement('option');
    optProd.value = produtos[i].id;
    optProd.textContent = produtos[i].nome + ' (' + produtos[i].unidade + ')';
    listaProd.appendChild(optProd);
  }

  btnSalvar.disabled = false;
  
  if (fornecedores.length === 0) {
    document.getElementById('erro-pedido').textContent = 'Voce precisa cadastrar um fornecedor antes.';
    document.getElementById('erro-pedido').hidden = false;
    btnSalvar.disabled = true;
  }
  
  if (produtos.length === 0) {
    document.getElementById('erro-pedido').textContent = 'Voce precisa cadastrar um produto antes.';
    document.getElementById('erro-pedido').hidden = false;
    btnSalvar.disabled = true;
  }

  document.getElementById('modal-pedido').classList.add('is-open');
}

function salvarPedido(e) {
  e.preventDefault();
  var form = e.target;

  var fornId = form.elements.fornecedor_id.value;
  var prodId = form.elements.produto_id.value;
  var qtd = form.elements.quantidade.value;

  if (fornId === '' || prodId === '') {
    document.getElementById('erro-pedido').textContent = 'Selecione o fornecedor e o produto.';
    document.getElementById('erro-pedido').hidden = false;
    return;
  }

  try {
    Pedidos.criar({
      fornecedor_id: fornId,
      produto_id: prodId,
      quantidade: qtd
    });
    console.log('Pedido criado com sucesso'); // TODO: colocar no log do sistema depois
  } catch (err) {
    document.getElementById('erro-pedido').textContent = err.message;
    document.getElementById('erro-pedido').hidden = false;
    return;
  }

  renderizarTabela();
  fecharModais();
}

// --- Entrega ---

function pedirEntrega(id) {
  var ped = Pedidos.buscarPorId(id);
  if (!ped || ped.status !== 'pendente') return;

  var prod = Produtos.buscarPorId(ped.produto_id);
  var msg = document.getElementById('entregar-mensagem');
  var btnConfirmar = document.getElementById('btn-confirmar-entrega');
  var btnCancelar = document.getElementById('btn-cancelar-entrega');

  idPedidoEntregar = ped.id;

  if (!prod) {
    msg.textContent = 'O produto deste pedido foi excluido do sistema.';
    btnConfirmar.hidden = true;
    btnCancelar.textContent = 'Entendi';
  } else {
    msg.textContent = 'Confirmar a entrega de ' + ped.quantidade + ' ' + prod.unidade + ' de ' + prod.nome + '?';
    btnConfirmar.hidden = false;
    btnCancelar.textContent = 'Cancelar';
  }

  document.getElementById('modal-entregar').classList.add('is-open');
}

function confirmarEntrega() {
  if (idPedidoEntregar === null) return;

  try {
    Pedidos.marcarEntregue(idPedidoEntregar);
    idPedidoEntregar = null;
    renderizarTabela();
    fecharModais();
  } catch (err) {
    document.getElementById('entregar-mensagem').textContent = err.message;
    document.getElementById('btn-confirmar-entrega').hidden = true;
    document.getElementById('btn-cancelar-entrega').textContent = 'Entendi';
  }
}

// --- Modais ---

function fecharModais() {
  document.getElementById('modal-pedido').classList.remove('is-open');
  document.getElementById('modal-entregar').classList.remove('is-open');
  idPedidoEntregar = null;
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