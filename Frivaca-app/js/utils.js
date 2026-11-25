// utils.js - funcoes de formatacao (moeda e data)

// Formata o dinheiro tipo R$ 1.234,50
function formatarMoeda(valor) {
  var n = Number(valor);
  if (isNaN(n)) n = 0;

  // Arredonda pra 2 casas e troca o ponto por virgula
  var texto = n.toFixed(2).replace('.', ',');

  // Separa a parte inteira da decimal
  var partes = texto.split(',');
  var inteiro = partes[0];
  var decimal = partes[1];

  // Coloca o ponto de milhar (regex pega de 3 em 3 numeros)
  inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return 'R$ ' + inteiro + ',' + decimal;
}

// Formata a data tipo 16/11/2026
function formatarData(data) {
  var d;

  // Se vier no formato AAAA-MM-DD (do banco), monta manualmente pra nao bugar o fuso
  if (typeof data === 'string' && data.length === 10) {
    var pedacos = data.split('-');
    d = new Date(pedacos[0], pedacos[1] - 1, pedacos[2]);
  } else {
    d = new Date(data);
  }

  // Se a data for invalida, retorna um tracinho
  if (isNaN(d.getTime())) {
    return '—';
  }

  // Pega o dia e o mes (mes comeca do 0 no JS, por isso o +1)
  var dia = d.getDate();
  var mes = d.getMonth() + 1;
  var ano = d.getFullYear();

  // Completa com zero a esquerda se for menor que 10
  if (dia < 10) dia = '0' + dia;
  if (mes < 10) mes = '0' + mes;

  return dia + '/' + mes + '/' + ano;
}