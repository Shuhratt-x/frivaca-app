// produtos.js - controla a tela de cadastro de produtos

var sessaoAtual = verificarSessao();

var CAMPOS_PRODUTO = [
  'nome', 'categoria', 'unidade', 'vida_util_dias',
  'taxa_deterioracao', 'estoque_atual', 'estoque_minimo', 'preco_unitario'
];

var idEmEdicao = null;
var idParaExcluir = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);

  document.getElementById('btn-novo-produto').addEventListener('click', function () {
    abrirFormulario(null);
  });

  document.getElementById('form-produto').addEventListener('submit', salvarProduto);
  
  // Limpa o erro quando o usuario digitar
  document.getElementById('form-produto').addEventListener('input', function() {
    document.getElementById('erro-produto').hidden = true;
  });

  document.getElementById('btn-confirmar-excluir').addEventListener('click', confirmarExclusao);

  // Botoes de fechar modal
  var botoesFechar = document.querySelectorAll('[data-fechar]');
  for (var i = 0; i < botoesFechar.length; i++) {
    botoesFechar[i].addEventListener('click', fecharModais);
  }

  renderizarTabela();
});

// --- Tabela ---

function formatarNumero(valor) {
  var n = Number(valor);
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function renderizarTabela() {
  var corpo = document.getElementById('tabela-produtos');
  var produtos = Produtos.listar();
  
  // Ordena de A a Z
  produtos.sort(function (a, b) {
    return a.nome.localeCompare(b.nome);
  });

  corpo.innerHTML = '';
  var total = produtos.length;
  
  if (total === 0) {
    document.getElementById('subtitulo-lista').textContent = 'Nenhum produto cadastrado.';
    corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#888;">Nenhum produto. Cadastre um novo!</td></tr>';
    return;
  }

  document.getElementById('subtitulo-lista').textContent = total + (total === 1 ? ' produto cadastrado.' : ' produtos cadastrados.');

  for (var i = 0; i < produtos.length; i++) {
    var prod = produtos[i];
    var tr = document.createElement('tr');
    
    var cat = prod.categoria ? prod.categoria : '-';
    var qtd = formatarNumero(prod.estoque_atual) + ' ' + prod.unidade;

    tr.innerHTML = 
      '<td class="nome" style="font-weight: 600;">' + prod.nome + '</td>' +
      '<td>' + cat + '</td>' +
      '<td class="num" style="text-align:right; font-family: var(--font-mono);">' + qtd + '</td>' +
      '<td class="num" style="text-align:right; font-family: var(--font-mono);">' + formatarMoeda(prod.preco_unitario) + '</td>' +
      '<td class="actions text-right">' +
        '<button type="button" class="btn btn--secondary btn--sm btn-editar" data-id="' + prod.id + '">Editar</button> ' +
        '<button type="button" class="btn btn--ghost btn--sm btn-excluir" data-id="' + prod.id + '">Excluir</button>' +
      '</td>';
      
    corpo.appendChild(tr);
  }

  // Adiciona o evento de clique em cada botao gerado
  var btnsEditar = document.querySelectorAll('.btn-editar');
  for (i = 0; i < btnsEditar.length; i++) {
    btnsEditar[i].addEventListener('click', function () {
      abrirFormulario(this.getAttribute('data-id'));
    });
  }

  var btnsExcluir = document.querySelectorAll('.btn-excluir');
  for (i = 0; i < btnsExcluir.length; i++) {
    btnsExcluir[i].addEventListener('click', function () {
      pedirExclusao(this.getAttribute('data-id'));
    });
  }
}

// --- Formulario (Salvar e Editar) ---

function abrirFormulario(id) {
  var form = document.getElementById('form-produto');
  form.reset();
  document.getElementById('erro-produto').hidden = true;
  idEmEdicao = null;
  document.getElementById('modal-produto-titulo').textContent = 'Novo Produto';

  if (id != null) {
    var produto = Produtos.buscarPorId(id);
    if (!produto) {
      renderizarTabela();
      return;
    }

    idEmEdicao = produto.id;
    document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
    
    // Preenche os campos
    for (var i = 0; i < CAMPOS_PRODUTO.length; i++) {
      var campo = CAMPOS_PRODUTO[i];
      if (campo === 'unidade') {
        // Se a unidade nao existir no select, cria ela
        var select = form.elements.unidade;
        var existe = false;
        for (var j = 0; j < select.options.length; j++) {
          if (select.options[j].value === produto.unidade) existe = true;
        }
        if (!existe) {
          var opt = document.createElement('option');
          opt.value = produto.unidade;
          opt.text = produto.unidade;
          select.appendChild(opt);
        }
        select.value = produto.unidade;
      } else {
        form.elements[campo].value = produto[campo];
      }
    }
  }

  document.getElementById('modal-produto').classList.add('is-open');
  form.elements.nome.focus();
}

function salvarProduto(evento) {
  evento.preventDefault();
  var form = evento.target;
  var dados = {};

  for (var i = 0; i < CAMPOS_PRODUTO.length; i++) {
    var campo = CAMPOS_PRODUTO[i];
    dados[campo] = form.elements[campo].value;
  }

  try {
    if (idEmEdicao != null) {
      var atualizou = Produtos.atualizar(idEmEdicao, dados);
      if (!atualizou) throw new Error('Produto nao encontrado.');
      console.log('Produto atualizado com sucesso');
    } else {
      Produtos.criar(dados);
      console.log('Novo produto criado');
    }
  } catch (erro) {
    document.getElementById('erro-produto').textContent = erro.message;
    document.getElementById('erro-produto').hidden = false;
    return;
  }

  renderizarTabela();
  fecharModais();
}

// --- Exclusao ---

function pedirExclusao(id) {
  var produto = Produtos.buscarPorId(id);
  if (!produto) return;

  idParaExcluir = produto.id;
  var msg = document.getElementById('excluir-mensagem');
  var btnConfirmar = document.getElementById('btn-confirmar-excluir');
  var btnCancelar = document.getElementById('btn-cancelar-excluir');

  var motivoBloqueio = Produtos.motivoBloqueioExclusao(produto.id);

  if (motivoBloqueio) {
    msg.textContent = motivoBloqueio;
    btnConfirmar.hidden = true;
    btnCancelar.textContent = 'Entendi';
  } else {
    msg.textContent = 'Tem certeza que deseja excluir "' + produto.nome + '"?';
    btnConfirmar.hidden = false;
    btnCancelar.textContent = 'Cancelar';
  }

  document.getElementById('modal-excluir').classList.add('is-open');
}

function confirmarExclusao() {
  if (idParaExcluir == null) return;

  try {
    Produtos.excluir(idParaExcluir);
    idParaExcluir = null;
    renderizarTabela();
    fecharModais();
  } catch (erro) {
    // Se deu erro (ex: tem movimentacao), mostra na tela e esconde o botao de excluir
    document.getElementById('excluir-mensagem').textContent = erro.message;
    document.getElementById('btn-confirmar-excluir').hidden = true;
    document.getElementById('btn-cancelar-excluir').textContent = 'Entendi';
  }
}

// --- Modais (abrir/fechar) ---

function fecharModais() {
  document.getElementById('modal-produto').classList.remove('is-open');
  document.getElementById('modal-excluir').classList.remove('is-open');
  document.body.classList.remove('modal-open');
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

  // Logout (topo e sidebar)
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