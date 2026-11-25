// storage.js - camada de dados do sistema
// Os dados iniciais (produtos, fornecedores...) vem do arquivo dados.js, que
// viaja junto com o projeto. As alteracoes feitas no uso ficam guardadas no
// navegador; para levar as alteracoes junto, use Configuracoes > Baixar dados.js
// e substitua o dados.js da pasta.

// ==========================================================================
//  DADOS INICIAIS - E AQUI QUE VOCE EDITA OS PRODUTOS E FORNECEDORES
// ==========================================================================
//  Cada linha entre colchetes [ ] e um item. Pode mudar os valores, apagar
//  uma linha inteira ou copiar uma linha para criar outro item.
//  Cuidado: texto fica entre aspas ('assim') e numero com PONTO (4.60, nao 4,60).
//  Esses dados entram sozinhos so na PRIMEIRA vez que o sistema abre.

// Ordem das colunas dos produtos:
//   nome, categoria, unidade (L / kg / un), vida util (dias),
//   taxa de deterioracao (0 a 1), estoque atual, estoque minimo, preco (R$)
var PRODUTOS_INICIAIS = [
  ['Leite Integral UHT 1L',                'Leites',                 'L', 120, 0.008, 800, 300, 4.6],
  ['Leite Semidesnatado UHT 1L',           'Leites',                 'L', 120, 0.008, 400, 150, 4.7],
  ['Leite Desnatado UHT 1L',               'Leites',                 'L', 120, 0.008, 250, 100, 4.8],
  ['Leite Zero Lactose UHT 1L',            'Leites',                 'L', 120, 0.008, 300, 120, 6.5],
  ['Leite Pasteurizado Tipo C 1L',         'Leites',                 'L', 5, 0.2, 70, 100, 4.9],
  ['Leite em Pó Integral',                 'Leites',                 'kg', 180, 0.006, 120, 40, 32],
  ['Leite Condensado 395g',                'Leites',                 'un', 270, 0.004, 500, 200, 5.8],
  ['Queijo Mussarela',                     'Queijos',                'kg', 45, 0.022, 250, 100, 34],
  ['Queijo Prato',                         'Queijos',                'kg', 60, 0.017, 150, 60, 38],
  ['Queijo Minas Frescal',                 'Queijos',                'kg', 12, 0.083, 25, 40, 29],
  ['Queijo Minas Padrão',                  'Queijos',                'kg', 30, 0.033, 90, 40, 36],
  ['Queijo Coalho',                        'Queijos',                'kg', 45, 0.022, 100, 40, 39],
  ['Queijo Provolone',                     'Queijos',                'kg', 90, 0.011, 12, 20, 52],
  ['Ricota Fresca',                        'Queijos',                'kg', 10, 0.1, 0, 30, 24],
  ['Parmesão Ralado 100g',                 'Queijos',                'un', 180, 0.006, 400, 150, 7.9],
  ['Requeijão Cremoso 200g',               'Queijos',                'un', 60, 0.017, 450, 180, 7.5],
  ['Cream Cheese 150g',                    'Queijos',                'un', 45, 0.022, 200, 80, 9.9],
  ['Iogurte Natural 170g',                 'Iogurtes e Fermentados', 'un', 30, 0.033, 700, 300, 2.4],
  ['Iogurte de Morango 170g',              'Iogurtes e Fermentados', 'un', 30, 0.033, 900, 350, 2.6],
  ['Iogurte Grego Natural 100g',           'Iogurtes e Fermentados', 'un', 30, 0.033, 400, 150, 3.8],
  ['Bebida Láctea Fermentada 900g',        'Iogurtes e Fermentados', 'un', 35, 0.029, 500, 200, 6.9],
  ['Kefir Natural 500mL',                  'Iogurtes e Fermentados', 'un', 20, 0.05, 120, 50, 8.5],
  ['Creme de Leite UHT 200g',              'Manteigas e Cremes',     'un', 120, 0.008, 600, 250, 3.2],
  ['Manteiga com Sal 200g',                'Manteigas e Cremes',     'un', 90, 0.011, 300, 120, 12.5],
  ['Manteiga sem Sal 200g',                'Manteigas e Cremes',     'un', 90, 0.011, 150, 60, 13],
  ['Manteiga de Garrafa (Ghee) 200g',      'Manteigas e Cremes',     'un', 365, 0.003, 80, 30, 18.9],
  ['Nata Fresca',                          'Manteigas e Cremes',     'kg', 15, 0.067, 8, 20, 28],
  ['Doce de Leite Pastoso 400g',           'Sobremesas e Bebidas',   'un', 180, 0.006, 250, 100, 9.5],
  ['Pudim de Leite 120g',                  'Sobremesas e Bebidas',   'un', 25, 0.04, 150, 60, 3.9],
  ['Bebida Láctea Achocolatada 200mL',     'Sobremesas e Bebidas',   'un', 120, 0.008, 1200, 500, 1.9],
];

// Ordem das colunas dos fornecedores: nome, CNPJ, contato
// (nomes, CNPJs e contatos abaixo sao ficticios - troque pelos reais)
var FORNECEDORES_INICIAIS = [
  ['Cooperativa Leite do Vale',              '00.000.000/0001-01', 'vendas@leitedovale.exemplo.com.br'],
  ['Fazenda Boa Pastagem',                   '00.000.000/0001-02', '(00) 90000-0002'],
  ['Agropecuária Campo Verde',               '00.000.000/0001-03', 'contato@campoverde.exemplo.com.br'],
  ['Embalagens Lácteas do Brasil',           '00.000.000/0001-04', '(00) 3000-0004'],
  ['Fermentos e Culturas Lácteas Ltda',      '00.000.000/0001-05', 'pedidos@culturaslacteas.exemplo.com.br'],
  ['Transportes Frio Express',               '00.000.000/0001-06', '(00) 90000-0006'],
];

var CHAVES = {
  produtos: 'frivaca_produtos',
  movs: 'frivaca_movimentacoes',
  fornecedores: 'frivaca_fornecedores',
  pedidos: 'frivaca_pedidos',
  cenarios: 'frivaca_cenarios'
};

var METODOS_VALIDOS = ['analitico', 'euler', 'rk4', 'comparar'];
var HORIZONTE_MAX = 730;

// ---------- Funcoes auxiliares ----------

// Campo de cada tabela dentro do dados.json
var CAMPOS = {};
CAMPOS[CHAVES.produtos] = 'produtos';
CAMPOS[CHAVES.movs] = 'movimentacoes';
CAMPOS[CHAVES.fornecedores] = 'fornecedores';
CAMPOS[CHAVES.pedidos] = 'pedidos';
CAMPOS[CHAVES.cenarios] = 'cenarios';

var CHAVE_MODO_LOCAL = 'frivaca_banco_local';

var BANCO = null;

function copiar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function bancoVazio() {
  return { rev: 0, meta: {}, produtos: [], movimentacoes: [], fornecedores: [], pedidos: [], cenarios: [] };
}

// Garante que o objeto tem todas as tabelas (aceita tambem o formato antigo)
function normalizarBanco(obj) {
  var b = bancoVazio();
  if (!obj || typeof obj !== 'object') return b;
  for (var chave in CAMPOS) {
    var campo = CAMPOS[chave];
    if (obj[campo] instanceof Array) b[campo] = obj[campo];
  }
  if (obj.meta && typeof obj.meta === 'object') b.meta = obj.meta;
  b.rev = Number(obj.rev) || 0;
  return b;
}

function lerBancoLocal() {
  try {
    var txt = localStorage.getItem(CHAVE_MODO_LOCAL);
    if (txt) return JSON.parse(txt);
    // Dados do sistema antigo (uma chave por tabela)
    var antigo = {};
    for (var chave in CAMPOS) {
      var t = localStorage.getItem(chave);
      if (t) antigo[CAMPOS[chave]] = JSON.parse(t);
    }
    for (var c in antigo) return antigo;
  } catch (e) {}
  // Primeira vez neste navegador: usa os dados que vao dentro do projeto (dados.js)
  if (typeof DADOS_INICIAIS !== 'undefined') {
    var semente = copiar(DADOS_INICIAIS);
    semente.meta = semente.meta || {};
    semente.meta.dados_iniciais = true;
    return semente;
  }
  return {};
}

function carregarBanco() {
  BANCO = normalizarBanco(lerBancoLocal());
}

function persistirBanco() {
  BANCO.salvoEm = new Date().toISOString();
  try {
    localStorage.setItem(CHAVE_MODO_LOCAL, JSON.stringify(BANCO));
  } catch (erro) {
    throw new Error('Nao foi possivel salvar. O armazenamento do navegador pode estar cheio.');
  }
}

function lerTabela(chave) {
  var campo = CAMPOS[chave];
  if (!campo || !BANCO) return [];
  // Devolve uma copia: quem chama pode mexer a vontade, so vale depois de salvarTabela
  return copiar(BANCO[campo]);
}

function salvarTabela(chave, lista) {
  var campo = CAMPOS[chave];
  var antiga = BANCO[campo];
  BANCO[campo] = copiar(lista);
  try {
    persistirBanco();
  } catch (erro) {
    BANCO[campo] = antiga; // desfaz na memoria se nao conseguiu gravar
    alert(erro.message);
    throw erro;
  }
}

// Troca tudo de uma vez (usado por Importar e Resetar)
function substituirBanco(dados, meta) {
  var anterior = BANCO;
  var novo = normalizarBanco(dados);
  novo.rev = anterior.rev;
  novo.meta = meta || novo.meta;
  BANCO = novo;
  try {
    persistirBanco();
  } catch (erro) {
    BANCO = anterior;
    throw erro;
  }
}


var ultimoId = 0;

function gerarId(lista) {
  var id = Date.now();
  if (id <= ultimoId) id = ultimoId + 1;
  
  var existe = true;
  while (existe) {
    existe = false;
    for (var i = 0; i < lista.length; i++) {
      if (String(lista[i].id) === String(id)) {
        id++;
        existe = true;
        break;
      }
    }
  }
  ultimoId = id;
  return id;
}

function buscarIndice(lista, id) {
  if (!id) return -1;
  for (var i = 0; i < lista.length; i++) {
    if (String(lista[i].id) === String(id)) {
      return i;
    }
  }
  return -1;
}

function textoLimpo(txt) {
  if (txt == null) return '';
  return String(txt).trim();
}

function numeroValido(valor, nomeCampo, padrao) {
  if (valor == null || valor === '') {
    if (padrao !== undefined) return padrao;
    throw new Error('Preencha o campo ' + nomeCampo);
  }
  if (typeof valor === 'string') {
    valor = valor.replace(',', '.');
  }
  var n = Number(valor);
  if (isNaN(n) || n < 0) {
    throw new Error('Valor invalido para ' + nomeCampo);
  }
  return n;
}

// Evita dizimas tipo 0.30000000000004
function arredondar(n) {
  return Math.round(n * 1000) / 1000;
}

function formatarDataBanco(valor) {
  if (!valor) return new Date().toISOString();
  
  // Se ja vier no formato certinho, mantem
  if (typeof valor === 'string' && valor.length === 10) {
    return valor;
  }
  
  var d = new Date(valor);
  if (isNaN(d.getTime())) throw new Error('Data invalida');
  return d.toISOString();
}

// ---------- Inicializacao ----------

function initStorage() {
  carregarBanco();
}

// ---------- PRODUTOS ----------

var Produtos = {

  listar: function () {
    return lerTabela(CHAVES.produtos);
  },

  buscarPorId: function (id) {
    var produtos = this.listar();
    var pos = buscarIndice(produtos, id);
    if (pos == -1) return null;
    return produtos[pos];
  },

  criar: function (dados) {
    var produtos = this.listar();
    var nome = textoLimpo(dados.nome);
    if (!nome) throw new Error('Digite o nome do produto');

    var taxa = numeroValido(dados.taxa_deterioracao, 'taxa de deterioracao', 0);
    if (taxa > 1) throw new Error('A taxa de deterioracao deve ser entre 0 e 1');

    var novo = {
      id: gerarId(produtos),
      nome: nome,
      categoria: textoLimpo(dados.categoria),
      unidade: textoLimpo(dados.unidade) || 'un',
      vida_util_dias: numeroValido(dados.vida_util_dias, 'vida util', 0),
      taxa_deterioracao: taxa,
      estoque_atual: numeroValido(dados.estoque_atual, 'estoque atual', 0),
      estoque_minimo: numeroValido(dados.estoque_minimo, 'estoque minimo', 0),
      preco_unitario: numeroValido(dados.preco_unitario, 'preco', 0)
    };

    produtos.push(novo);
    salvarTabela(CHAVES.produtos, produtos);
    return novo;
  },

  atualizar: function (id, dadosNovos) {
    var produtos = this.listar();
    var pos = buscarIndice(produtos, id);
    if (pos == -1) return null;

    var atual = produtos[pos];
    
    // Junta os dados antigos com os novos (sem Object.assign)
    var novosDados = {};
    for (var k in atual) { novosDados[k] = atual[k]; }
    for (var k in dadosNovos) { novosDados[k] = dadosNovos[k]; }

    var nome = textoLimpo(novosDados.nome);
    if (!nome) throw new Error('Digite o nome do produto');

    var atualizado = {
      id: atual.id,
      nome: nome,
      categoria: textoLimpo(novosDados.categoria),
      unidade: textoLimpo(novosDados.unidade) || 'un',
      vida_util_dias: numeroValido(novosDados.vida_util_dias, 'vida util', 0),
      taxa_deterioracao: numeroValido(novosDados.taxa_deterioracao, 'taxa', 0),
      estoque_atual: numeroValido(novosDados.estoque_atual, 'estoque', 0),
      estoque_minimo: numeroValido(novosDados.estoque_minimo, 'minimo', 0),
      preco_unitario: numeroValido(novosDados.preco_unitario, 'preco', 0)
    };

    produtos[pos] = atualizado;
    salvarTabela(CHAVES.produtos, produtos);
    return atualizado;
  },

  excluir: function (id) {
    var produtos = this.listar();
    var pos = buscarIndice(produtos, id);
    if (pos == -1) return false;

    var prod = produtos[pos];
    var movs = lerTabela(CHAVES.movs);
    var temMov = false;
    
    for (var i = 0; i < movs.length; i++) {
      if (String(movs[i].produto_id) === String(id)) {
        temMov = true;
        break;
      }
    }
    
    if (temMov) {
      throw new Error('Nao pode excluir "' + prod.nome + '" porque ele ja tem movimentacoes no historico.');
    }

    var pedidos = lerTabela(CHAVES.pedidos);
    for (var j = 0; j < pedidos.length; j++) {
      if (String(pedidos[j].produto_id) === String(id) && pedidos[j].status === 'pendente') {
        throw new Error('Nao pode excluir. Existe um pedido pendente para este produto.');
      }
    }

    produtos.splice(pos, 1);
    salvarTabela(CHAVES.produtos, produtos);
    return true;
  }
};

// ---------- MOVIMENTACOES ----------

var Movimentacoes = {

  listar: function () {
    return lerTabela(CHAVES.movs);
  },

  listarPorProduto: function (prodId) {
    var todas = this.listar();
    var filtradas = [];
    
    for (var i = 0; i < todas.length; i++) {
      if (String(todas[i].produto_id) === String(prodId)) {
        filtradas.push(todas[i]);
      }
    }
    
    // Ordena da mais nova pra mais velha
    filtradas.sort(function (a, b) {
      if (a.data === b.data) return b.id - a.id;
      return a.data < b.data ? 1 : -1;
    });
    
    return filtradas;
  },

  registrar: function (dados) {
    var tipo = textoLimpo(dados.tipo).toLowerCase();
    if (tipo !== 'entrada' && tipo !== 'saida' && tipo !== 'perda') {
      throw new Error('Tipo de movimentacao invalido');
    }

    var qtd = numeroValido(dados.quantidade, 'quantidade');
    if (qtd <= 0) throw new Error('A quantidade deve ser maior que zero');

    var produtos = lerTabela(CHAVES.produtos);
    var pos = buscarIndice(produtos, dados.produto_id);
    if (pos == -1) throw new Error('Produto nao encontrado');

    var prod = produtos[pos];
    var estoqueAntigo = Number(prod.estoque_atual) || 0;
    var novoEstoque = 0;

    if (tipo === 'entrada') {
      novoEstoque = estoqueAntigo + qtd;
    } else {
      novoEstoque = estoqueAntigo - qtd;
    }
    
    novoEstoque = arredondar(novoEstoque);

    if (novoEstoque < 0) {
      throw new Error('Estoque insuficiente. Voce so tem ' + estoqueAntigo + ' ' + prod.unidade);
    }

    // Cria o registro da movimentacao
    var movs = lerTabela(CHAVES.movs);
    var novaMov = {
      id: gerarId(movs),
      produto_id: prod.id,
      tipo: tipo,
      quantidade: qtd,
      data: formatarDataBanco(dados.data)
    };
    
    if (dados.motivo) novaMov.motivo = textoLimpo(dados.motivo);
    if (dados.pedido_id) novaMov.pedido_id = dados.pedido_id;

    // Atualiza o estoque do produto
    prod.estoque_atual = novoEstoque;
    salvarTabela(CHAVES.produtos, produtos);

    try {
      movs.push(novaMov);
      salvarTabela(CHAVES.movs, movs);
    } catch (erro) {
      // Se der erro ao salvar o historico, desfaz o estoque (rollback)
      prod.estoque_atual = estoqueAntigo;
      salvarTabela(CHAVES.produtos, produtos);
      throw erro;
    }

    return novaMov;
  }
};

// ---------- FORNECEDORES ----------

var Fornecedores = {

  listar: function () {
    return lerTabela(CHAVES.fornecedores);
  },

  buscarPorId: function (id) {
    var lista = this.listar();
    var pos = buscarIndice(lista, id);
    if (pos == -1) return null;
    return lista[pos];
  },

  criar: function (dados) {
    var lista = this.listar();
    var nome = textoLimpo(dados.nome);
    if (!nome) throw new Error('Digite o nome do fornecedor');

    var novo = {
      id: gerarId(lista),
      nome: nome,
      cnpj: textoLimpo(dados.cnpj),
      contato: textoLimpo(dados.contato)
    };

    lista.push(novo);
    salvarTabela(CHAVES.fornecedores, lista);
    return novo;
  },

  atualizar: function (id, dadosNovos) {
    var lista = this.listar();
    var pos = buscarIndice(lista, id);
    if (pos == -1) return null;

    var atual = lista[pos];
    var nome = textoLimpo(dadosNovos.nome !== undefined ? dadosNovos.nome : atual.nome);
    if (!nome) throw new Error('Digite o nome do fornecedor');

    var atualizado = {
      id: atual.id,
      nome: nome,
      cnpj: textoLimpo(dadosNovos.cnpj !== undefined ? dadosNovos.cnpj : atual.cnpj),
      contato: textoLimpo(dadosNovos.contato !== undefined ? dadosNovos.contato : atual.contato)
    };

    lista[pos] = atualizado;
    salvarTabela(CHAVES.fornecedores, lista);
    return atualizado;
  },

  excluir: function (id) {
    var lista = this.listar();
    var pos = buscarIndice(lista, id);
    if (pos == -1) return false;

    var pedidos = lerTabela(CHAVES.pedidos);
    for (var i = 0; i < pedidos.length; i++) {
      if (String(pedidos[i].fornecedor_id) === String(id)) {
        throw new Error('Nao pode excluir. Este fornecedor tem pedidos registrados.');
      }
    }

    lista.splice(pos, 1);
    salvarTabela(CHAVES.fornecedores, lista);
    return true;
  }
};

// ---------- PEDIDOS ----------

var Pedidos = {

  listar: function () {
    return lerTabela(CHAVES.pedidos);
  },

  buscarPorId: function (id) {
    var lista = this.listar();
    var pos = buscarIndice(lista, id);
    if (pos == -1) return null;
    return lista[pos];
  },

  criar: function (dados) {
    var forn = Fornecedores.buscarPorId(dados.fornecedor_id);
    if (!forn) throw new Error('Selecione um fornecedor valido');

    var prod = Produtos.buscarPorId(dados.produto_id);
    if (!prod) throw new Error('Selecione um produto valido');

    var qtd = numeroValido(dados.quantidade, 'quantidade');
    if (qtd <= 0) throw new Error('A quantidade deve ser maior que zero');

    var pedidos = this.listar();
    var novo = {
      id: gerarId(pedidos),
      fornecedor_id: forn.id,
      produto_id: prod.id,
      quantidade: qtd,
      status: 'pendente',
      data: new Date().toISOString()
    };

    pedidos.push(novo);
    salvarTabela(CHAVES.pedidos, pedidos);
    return novo;
  },

  marcarEntregue: function (id) {
    var pedidos = this.listar();
    var pos = buscarIndice(pedidos, id);
    if (pos == -1) throw new Error('Pedido nao encontrado');

    var pedido = pedidos[pos];
    if (pedido.status === 'entregue') {
      throw new Error('Este pedido ja foi entregue');
    }

    var prod = Produtos.buscarPorId(pedido.produto_id);
    if (!prod) throw new Error('O produto deste pedido foi excluido do sistema');

    // Marca como entregue primeiro
    pedido.status = 'entregue';
    pedido.data_entrega = new Date().toISOString();
    salvarTabela(CHAVES.pedidos, pedidos);

    try {
      // Joga a entrada no estoque
      Movimentacoes.registrar({
        produto_id: pedido.produto_id,
        tipo: 'entrada',
        quantidade: pedido.quantidade,
        motivo: 'Entrega de pedido de compra',
        pedido_id: pedido.id
      });
    } catch (erro) {
      // Se der erro na entrada, volta o pedido pra pendente
      pedido.status = 'pendente';
      delete pedido.data_entrega;
      salvarTabela(CHAVES.pedidos, pedidos);
      throw erro;
    }

    return pedido;
  }
};

// ---------- CENARIOS ----------

var Cenarios = {

  listar: function () {
    return lerTabela(CHAVES.cenarios);
  },

  buscarPorId: function (id) {
    var lista = this.listar();
    var pos = buscarIndice(lista, id);
    if (pos == -1) return null;
    return lista[pos];
  },

  criar: function (dados) {
    var nome = textoLimpo(dados.nome);
    if (!nome) throw new Error('Digite o nome do cenario');

    var prod = Produtos.buscarPorId(dados.produto_id);
    if (!prod) throw new Error('Produto nao encontrado');

    var metodo = textoLimpo(dados.metodo);
    var metodoOk = false;
    for (var i = 0; i < METODOS_VALIDOS.length; i++) {
      if (METODOS_VALIDOS[i] === metodo) metodoOk = true;
    }
    if (!metodoOk) throw new Error('Metodo de calculo invalido');

    var lista = this.listar();
    var novo = {
      id: gerarId(lista),
      nome: nome,
      produto_id: prod.id,
      R: numeroValido(dados.R, 'R'),
      D: numeroValido(dados.D, 'D'),
      theta: numeroValido(dados.theta, 'theta'),
      I0: numeroValido(dados.I0, 'I0'),
      metodo: metodo,
      data: formatarDataBanco(dados.data)
    };

    if (dados.horizonte_dias) {
      var h = numeroValido(dados.horizonte_dias, 'horizonte');
      if (h < 1 || h > HORIZONTE_MAX) throw new Error('Horizonte invalido');
      novo.horizonte_dias = h;
    }

    if (dados.passo_dt) {
      var p = numeroValido(dados.passo_dt, 'passo dt');
      if (p <= 0) throw new Error('Passo dt deve ser maior que zero');
      novo.passo_dt = p;
    }

    lista.push(novo);
    salvarTabela(CHAVES.cenarios, lista);
    return novo;
  },

  excluir: function (id) {
    var lista = this.listar();
    var pos = buscarIndice(lista, id);
    if (pos == -1) return false;

    lista.splice(pos, 1);
    salvarTabela(CHAVES.cenarios, lista);
    return true;
  }
};

// ---------- Carrega os dados iniciais (primeira vez que o sistema abre) ----------

function carregarDadosIniciais() {
  // Se ja carregou uma vez, nao faz nada (assim o reset nao traz tudo de volta)
  if (BANCO.meta.dados_iniciais) return;

  // Produtos (so se a lista estiver vazia)
  if (Produtos.listar().length === 0) {
    for (var i = 0; i < PRODUTOS_INICIAIS.length; i++) {
      var p = PRODUTOS_INICIAIS[i];
      Produtos.criar({
        nome: p[0], categoria: p[1], unidade: p[2], vida_util_dias: p[3],
        taxa_deterioracao: p[4], estoque_atual: p[5], estoque_minimo: p[6],
        preco_unitario: p[7]
      });
    }
  }

  // Fornecedores (so se a lista estiver vazia)
  if (Fornecedores.listar().length === 0) {
    for (var j = 0; j < FORNECEDORES_INICIAIS.length; j++) {
      var f = FORNECEDORES_INICIAIS[j];
      Fornecedores.criar({ nome: f[0], cnpj: f[1], contato: f[2] });
    }
  }

  BANCO.meta.dados_iniciais = true;
  persistirBanco();
}

// Roda a inicializacao assim que o arquivo é carregado
initStorage();
carregarDadosIniciais();