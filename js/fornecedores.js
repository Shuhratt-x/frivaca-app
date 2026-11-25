// fornecedores.js - controla a tela de fornecedores

var sessaoAtual = verificarSessao();

var idEmEdicao = null;
var idParaExcluir = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);

  document.getElementById('btn-novo-fornecedor').addEventListener('click', function () {
    abrirFormulario(null);
  });

  var form = document.getElementById('form-fornecedor');
  form.addEventListener('submit', salvarFornecedor);
  form.addEventListener('input', function () {
    document.getElementById('erro-fornecedor').hidden = true;
  });

  document.getElementById('btn-confirmar-excluir').addEventListener('click', confirmarExclusao);

  // Botoes de fechar modal
  var btnsFechar = document.querySelectorAll('[data-fechar]');
  for (var i = 0; i < btnsFechar.length; i++) {
    btnsFechar[i].addEventListener('click', fecharModais);
  }

  renderizarTabela();
});

// --- Tabela ---

function renderizarTabela() {
  var corpo = document.getElementById('tabela-fornecedores');
  var fornecedores = Fornecedores.listar();
  var i;

  // Ordena de A a Z
  fornecedores.sort(function (a, b) {
    return a.nome.localeCompare(b.nome);
  });

  corpo.innerHTML = '';
  var total = fornecedores.length;

  if (total === 0) {
    document.getElementById('subtitulo-lista').textContent = 'Nenhum fornecedor cadastrado.';
    corpo.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#888;">Nenhum fornecedor. Cadastre um novo!</td></tr>';
    return;
  }

  document.getElementById('subtitulo-lista').textContent = total + (total === 1 ? ' fornecedor cadastrado.' : ' fornecedores cadastrados.');

  var htmlTabela = '';

  for (i = 0; i < fornecedores.length; i++) {
    var f = fornecedores[i];
    var cnpj = f.cnpj ? f.cnpj : '-';
    var contato = f.contato ? f.contato : '-';

    htmlTabela += 
      '<tr>' +
        '<td class="nome" style="font-weight: 600;">' + f.nome + '</td>' +
        '<td style="font-family: var(--font-mono);">' + cnpj + '</td>' +
        '<td>' + contato + '</td>' +
        '<td class="actions text-right">' +
          '<button type="button" class="btn btn--secondary btn--sm btn-editar" data-id="' + f.id + '">Editar</button> ' +
          '<button type="button" class="btn btn--ghost btn--sm btn-excluir" data-id="' + f.id + '">Excluir</button>' +
        '</td>' +
      '</tr>';
  }

  corpo.innerHTML = htmlTabela;

  // Adiciona os eventos nos botoes gerados
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

// --- Formulario ---

function abrirFormulario(id) {
  var form = document.getElementById('form-fornecedor');
  form.reset();
  document.getElementById('erro-fornecedor').hidden = true;
  idEmEdicao = null;
  document.getElementById('modal-fornecedor-titulo').textContent = 'Novo Fornecedor';

  if (id != null) {
    var f = Fornecedores.buscarPorId(id);
    if (!f) {
      renderizarTabela();
      return;
    }

    idEmEdicao = f.id;
    document.getElementById('modal-fornecedor-titulo').textContent = 'Editar Fornecedor';
    form.elements.nome.value = f.nome;
    form.elements.cnpj.value = f.cnpj;
    form.elements.contato.value = f.contato;
  }

  document.getElementById('modal-fornecedor').classList.add('is-open');
  form.elements.nome.focus();
}

function salvarFornecedor(evento) {
  evento.preventDefault();
  var form = evento.target;

  var dados = {
    nome: form.elements.nome.value,
    cnpj: form.elements.cnpj.value,
    contato: form.elements.contato.value
  };

  try {
    if (idEmEdicao != null) {
      var atualizou = Fornecedores.atualizar(idEmEdicao, dados);
      if (!atualizou) throw new Error('Fornecedor nao encontrado.');
      console.log('Fornecedor atualizado');
    } else {
      Fornecedores.criar(dados);
      console.log('Fornecedor criado');
    }
  } catch (erro) {
    document.getElementById('erro-fornecedor').textContent = erro.message;
    document.getElementById('erro-fornecedor').hidden = false;
    return;
  }

  renderizarTabela();
  fecharModais();
}

// --- Exclusao ---

function pedirExclusao(id) {
  var f = Fornecedores.buscarPorId(id);
  if (!f) return;

  idParaExcluir = f.id;
  document.getElementById('excluir-mensagem').textContent = 'Tem certeza que deseja excluir "' + f.nome + '"?';
  document.getElementById('btn-confirmar-excluir').hidden = false;
  document.getElementById('btn-cancelar-excluir').textContent = 'Cancelar';

  document.getElementById('modal-excluir').classList.add('is-open');
}

function confirmarExclusao() {
  if (idParaExcluir == null) return;

  try {
    Fornecedores.excluir(idParaExcluir);
    idParaExcluir = null;
    renderizarTabela();
    fecharModais();
  } catch (erro) {
    // Se tiver pedidos atrelados, o storage.js bloqueia e cai aqui
    document.getElementById('excluir-mensagem').textContent = erro.message;
    document.getElementById('btn-confirmar-excluir').hidden = true;
    document.getElementById('btn-cancelar-excluir').textContent = 'Entendi';
  }
}

// --- Modais ---

function fecharModais() {
  document.getElementById('modal-fornecedor').classList.remove('is-open');
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