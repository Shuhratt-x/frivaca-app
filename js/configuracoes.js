// configuracoes.js - gerencia o perfil e reset do sistema

var sessaoAtual = verificarSessao();

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);
  carregarPerfil();
  configurarEventos();
});

// --- Perfil ---

function carregarPerfil() {
  document.getElementById('input-nome').value = sessaoAtual.nome;
}

function salvarPerfil(evento) {
  evento.preventDefault();
  var novoNome = document.getElementById('input-nome').value;
  var msg = document.getElementById('msg-perfil');

  // Tira os espacos em branco do comeco e do fim
  novoNome = novoNome.trim();

  if (novoNome === '') {
    msg.textContent = 'O nome nao pode ficar vazio.';
    msg.style.color = 'red';
    msg.hidden = false;
    return;
  }

  try {
    // Atualiza o localStorage
    var dadosSessao = {
      nome: novoNome,
      iniciadaEm: sessaoAtual.iniciadaEm || new Date().toISOString()
    };
    
    localStorage.setItem('frivaca_sessao', JSON.stringify(dadosSessao));
    
    // Mostra mensagem de sucesso
    msg.textContent = 'Perfil atualizado com sucesso!';
    msg.style.color = 'green';
    msg.hidden = false;

    // Atualiza o nome e as iniciais no topo da tela na hora
    var partes = novoNome.split(' ');
    var iniciais = partes[0].charAt(0);
    if (partes.length > 1) {
      iniciais += partes[partes.length - 1].charAt(0);
    }
    
    document.getElementById('user-name').textContent = novoNome;
    document.getElementById('user-avatar').textContent = iniciais.toUpperCase();

    // Esconde a mensagem depois de 3 segundos
    setTimeout(function () { 
      msg.hidden = true; 
    }, 3000);
    
    console.log('Nome alterado para: ' + novoNome);
  } catch (erro) {
    msg.textContent = 'Erro ao salvar. O navegador pode estar bloqueando o armazenamento.';
    msg.style.color = 'red';
    msg.hidden = false;
  }
}

// --- Reset do Sistema ---

function exportarDados(formato) {
  var texto, nome, tipo;
  if (formato === 'js') {
    texto = '// dados.js - copia dos dados para abrir o site sem servidor.\nvar DADOS_INICIAIS = ' + JSON.stringify(BANCO, null, 2) + ';\n';
    nome = 'dados.js'; tipo = 'text/javascript';
  } else {
    texto = JSON.stringify(BANCO, null, 2);
    nome = 'dados.json'; tipo = 'application/json';
  }
  var blob = new Blob([texto], { type: tipo });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Aceita o dados.json novo ou o dados-iniciais.js antigo ("var DADOS_INICIAIS = {...};")
function lerArquivoDeDados(texto) {
  var t = texto.trim();
  var ini = t.indexOf('{');
  var fim = t.lastIndexOf('}');
  if (ini === -1 || fim === -1) throw new Error('Arquivo sem dados reconhecidos');
  var obj = JSON.parse(t.substring(ini, fim + 1));
  var tem = false;
  for (var chave in CAMPOS) { if (obj[CAMPOS[chave]] instanceof Array) tem = true; }
  if (!tem) throw new Error('O arquivo nao tem produtos, fornecedores, pedidos ou cenarios');
  return obj;
}

function importarDados(evento) {
  var arquivo = evento.target.files[0];
  var msg = document.getElementById('msg-importar');
  if (!arquivo) return;

  var leitor = new FileReader();
  leitor.onload = function () {
    try {
      var obj = lerArquivoDeDados(String(leitor.result));
      if (!confirm('Importar "' + arquivo.name + '"? Isso SUBSTITUI todos os dados atuais (produtos, movimentacoes, fornecedores, pedidos e cenarios).')) return;
      substituirBanco(obj, { dados_iniciais: true });
      msg.textContent = 'Dados importados com sucesso!';
      msg.style.color = 'green';
    } catch (erro) {
      msg.textContent = 'Nao foi possivel importar: ' + erro.message;
      msg.style.color = 'red';
    }
    msg.hidden = false;
  };
  leitor.readAsText(arquivo);
  evento.target.value = '';
}

function configurarEventos() {
  document.getElementById('btn-exportar').addEventListener('click', function () { exportarDados('json'); });
  document.getElementById('btn-exportar-js').addEventListener('click', function () { exportarDados('js'); });
  document.getElementById('btn-importar').addEventListener('click', function () {
    document.getElementById('arquivo-importar').click();
  });
  document.getElementById('arquivo-importar').addEventListener('change', importarDados);
  document.getElementById('form-perfil').addEventListener('submit', salvarPerfil);

  var modal = document.getElementById('modal-reset');
  var btnResetar = document.getElementById('btn-resetar');
  var btnCancelar = document.getElementById('btn-cancelar-reset');
  var btnConfirmar = document.getElementById('btn-confirmar-reset');

  btnResetar.addEventListener('click', function () {
    modal.classList.add('is-open');
  });

  btnCancelar.addEventListener('click', function () {
    modal.classList.remove('is-open');
  });

  btnConfirmar.addEventListener('click', function () {
    // Zera todas as tabelas (sem recarregar os dados iniciais)
    try {
      substituirBanco({}, { dados_iniciais: true });
    } catch (erro) {
      alert(erro.message);
      return;
    }

    // TODO: apagar o log de atividades tambem no futuro
    alert('Todos os dados foram apagados. Voltando para o painel...');
    
    // Volta pra home e recarrega
    window.location.href = 'index.html';
  });
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