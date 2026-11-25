// ui.js - Controla o tema escuro e o rodapé em todas as páginas

document.addEventListener('DOMContentLoaded', function () {
  // 1. Verifica se o usuário já escolheu um tema antes
  var temaSalvo = localStorage.getItem('frivaca_tema');
  if (temaSalvo === 'escuro') {
    document.body.classList.add('dark-mode');
  }

  // 2. Acha o botão da lua/sol (pelo ID ou pelo aria-label)
  var btnTema = document.getElementById('btn-tema') || document.querySelector('button[aria-label="Alternar Tema"]');

  if (btnTema) {
    atualizarIconeTema(btnTema);

    btnTema.addEventListener('click', function (e) {
      e.preventDefault();
      document.body.classList.toggle('dark-mode');

      var taEscuro = document.body.classList.contains('dark-mode');
      localStorage.setItem('frivaca_tema', taEscuro ? 'escuro' : 'claro');

      atualizarIconeTema(btnTema);
      console.log("Tema alterado para: " + (taEscuro ? "Escuro" : "Claro"));
    });
  } else {
    console.warn("Aviso: Botão de tema não encontrado nesta página.");
  }

  // 3. Injeta o rodapé automaticamente em todas as páginas
  var main = document.querySelector('.main-content');
  if (main) {
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<p>&copy; 2026 <strong>Frivaca</strong> &middot; O Legítimo Laticínio. Todos os direitos reservados.</p>' +
      '<p style="margin-top: 4px; font-size: 0.75rem;">Sistema de Gestão de Estoque e Simulação Matemática de Perecíveis.</p>';
    main.appendChild(footer);
  }
});

// Troca o ícone de lua pra sol dependendo do tema
function atualizarIconeTema(botao) {
  var taEscuro = document.body.classList.contains('dark-mode');
  // Desenho do Sol
  var iconeSol = '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/><circle cx="12" cy="12" r="5"/>';
  // Desenho da Lua
  var iconLua = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

  botao.innerHTML = '<svg class="icon" viewBox="0 0 24 24">' + (taEscuro ? iconeSol : iconLua) + '</svg>';
}

