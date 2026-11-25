// relatorios.js - tela de relatorios financeiros e gerenciais

var sessaoAtual = verificarSessao();
var graficoCategorias = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!sessaoAtual) return;

  configurarHeader(sessaoAtual);
  gerarRelatorios();
});

function gerarRelatorios() {
  var produtos = Produtos.listar();
  var movs = Movimentacoes.listar();
  var i, j;

  // Variaveis de resumo
  var valorTotal = 0;
  var custoPerdas = 0;
  var produtosEmFalta = 0;
  
  var valorPorCategoria = {};
  var listaProdutosValor = [];

  // 1. Calcula os valores dos produtos
  for (i = 0; i < produtos.length; i++) {
    var p = produtos[i];
    var qtd = Number(p.estoque_atual) || 0;
    var preco = Number(p.preco_unitario) || 0;
    var valor = qtd * preco;

    valorTotal += valor;

    if (qtd === 0) {
      produtosEmFalta++;
    }

    // Agrupa por categoria
    var cat = p.categoria;
    if (cat == null || cat === '') {
      cat = 'Sem categoria';
    }
    
    if (!valorPorCategoria[cat]) {
      valorPorCategoria[cat] = 0;
    }
    valorPorCategoria[cat] += valor;

    // Guarda pra tabela de Top 5
    listaProdutosValor.push({
      nome: p.nome,
      qtd: qtd,
      unidade: p.unidade,
      valor: valor
    });
  }

  // 2. Calcula o custo total das perdas
  for (i = 0; i < movs.length; i++) {
    if (movs[i].tipo === 'perda') {
      var prod = Produtos.buscarPorId(movs[i].produto_id);
      if (prod) {
        custoPerdas += Number(movs[i].quantidade) * Number(prod.preco_unitario);
      }
    }
  }

  // 3. Atualiza os cards na tela
  document.getElementById('resumo-valor-total').textContent = formatarMoeda(valorTotal);
  document.getElementById('resumo-custo-perdas').textContent = formatarMoeda(custoPerdas);
  document.getElementById('resumo-em-falta').textContent = produtosEmFalta;

  // 4. Monta o Grafico de Rosca (Categorias)
  var categoriasArr = [];
  for (var catNome in valorPorCategoria) {
    if (valorPorCategoria[catNome] > 0) {
      categoriasArr.push({ nome: catNome, valor: valorPorCategoria[catNome] });
    }
  }

  // Ordena do maior para o menor
  categoriasArr.sort(function (a, b) {
    return b.valor - a.valor;
  });

  // Se tiver mais de 5 categorias, agrupa o resto em "Outras"
  if (categoriasArr.length > 5) {
    var resto = 0;
    for (i = 5; i < categoriasArr.length; i++) {
      resto += categoriasArr[i].valor;
    }
    
    // Corta a lista pra manter so as 5 primeiras
    var novaLista = [];
    for (i = 0; i < 5; i++) {
      novaLista.push(categoriasArr[i]);
    }
    novaLista.push({ nome: 'Outras', valor: resto });
    categoriasArr = novaLista;
  }

  if (categoriasArr.length > 0 && typeof Chart !== 'undefined') {
    var canvas = document.createElement('canvas');
    document.getElementById('grafico-categorias').appendChild(canvas);
    
    var rotulos = [];
    var valores = [];
    for (i = 0; i < categoriasArr.length; i++) {
      rotulos.push(categoriasArr[i].nome);
      valores.push(categoriasArr[i].valor);
    }

    graficoCategorias = criarGraficoRosca(canvas, {
      rotulos: rotulos,
      valores: valores,
      formatarValor: formatarMoeda
    });
  } else {
    document.getElementById('grafico-categorias').innerHTML = '<p style="text-align:center; color:#888; padding-top:40px;">Sem dados de estoque suficientes.</p>';
  }

  // 5. Monta a Tabela Top 5
  listaProdutosValor.sort(function (a, b) {
    return b.valor - a.valor;
  });

  var topProdutos = [];
  for (i = 0; i < listaProdutosValor.length && i < 5; i++) {
    topProdutos.push(listaProdutosValor[i]);
  }

  var tbody = document.getElementById('tabela-top-produtos');
  var htmlTabela = '';

  if (topProdutos.length === 0) {
    htmlTabela = '<tr><td colspan="3" style="text-align:center; padding:40px; color:#888;">Nenhum produto cadastrado.</td></tr>';
  } else {
    for (i = 0; i < topProdutos.length; i++) {
      var prodTop = topProdutos[i];
      
      htmlTabela += 
        '<tr>' +
          '<td class="nome" style="font-weight:600;">' + prodTop.nome + '</td>' +
          '<td class="num" style="text-align:right; font-family: var(--font-mono);">' + prodTop.qtd + ' ' + prodTop.unidade + '</td>' +
          '<td class="num" style="text-align:right; font-family: var(--font-mono); font-weight: 600; color: var(--color-primary-dark);">' + formatarMoeda(prodTop.valor) + '</td>' +
        '</tr>';
    }
  }
  
  tbody.innerHTML = htmlTabela;
  
  // console.log('relatorios ok');
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