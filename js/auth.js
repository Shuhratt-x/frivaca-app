// auth.js - controla o login e a sessao do usuario

var CHAVE_SESSAO = 'frivaca_sessao';

// Pega os dados da sessao (se existir)
function obterSessao() {
  var txt = localStorage.getItem(CHAVE_SESSAO);
  if (!txt) return null;

  try {
    var s = JSON.parse(txt);
    // Se tiver um nome válido, retorna
    if (s && s.nome) {
      return s;
    }
  } catch (erro) {
    console.log("Erro ao ler a sessao do localStorage");
  }
  
  return null;
}

// Faz o login (chamado pelo botao da tela de login)
function login() {
  var input = document.getElementById('nome-admin');
  var msgErro = document.getElementById('erro-nome');
  
  var nome = input.value.trim();

  if (nome === '') {
    input.classList.add('is-invalid');
    msgErro.textContent = 'Digite o nome do administrador para entrar.';
    msgErro.hidden = false;
    input.focus();
    return;
  }

  // Salva no navegador
  var dados = { 
    nome: nome, 
    iniciadaEm: new Date().toISOString() 
  };
  
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
  
  console.log('Usuario logado: ' + nome); // TODO: tirar isso depois
  
  // Redireciona pra home
  window.location.href = 'index.html';
}

// Verifica se o usuario ta logado (chamado no topo de todas as paginas)
function verificarSessao() {
  var s = obterSessao();
  
  if (!s) {
    // Se nao tem sessao, esconde a tela pra nao piscar e joga pro login
    document.documentElement.style.display = 'none';
    window.location.replace('login.html');
  }

  // Se o usuario apertar "Voltar" no navegador depois de sair, a pagina
  // pode vir do cache. A gente verifica de novo pra garantir que ele ta logado.
  window.addEventListener('pageshow', function (evento) {
    if (evento.persisted && !obterSessao()) {
      document.documentElement.style.display = 'none';
      window.location.replace('login.html');
    }
  });

  return s;
}

// Sai do sistema
function logout() {
  // Remove so a sessao, nao apaga os produtos (senao perde tudo)
  localStorage.removeItem(CHAVE_SESSAO);
  window.location.href = 'login.html';
}