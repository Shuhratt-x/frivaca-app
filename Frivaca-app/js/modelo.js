// modelo.js - calculos matematicos do estoque (EDO)
// I(t) = estoque no tempo t
// R = reposicao, D = demanda, theta = taxa de deterioracao

var TOLERANCIA = 0.000001; // Para comparar se dois numeros sao iguais

// Cores para o card de diagnostico
var COR_OK = '#84CC16';
var COR_ALERTA = '#F59E0B';
var COR_CRITICO = '#EF4444';

// Funcao que calcula a derivada (dI/dt)
function calcularDerivada(I, R, D, theta) {
  return R - D - theta * I;
}

// Verifica se os parametros de simulacao estao certos
function validarParametros(passos, dt) {
  if (isNaN(passos) || passos < 0 || passos % 1 !== 0) {
    throw new Error('O numero de passos deve ser um inteiro positivo.');
  }
  if (isNaN(dt) || dt <= 0) {
    throw new Error('O passo de tempo (dt) deve ser maior que zero.');
  }
}

// Formata o numero com 2 casas decimais
function formatarNumeroModelo(n) {
  return Number(n).toFixed(2).replace('.', ',');
}

// --- Equilibrio e Solucao Analitica ---

// Calcula o estoque de equilibrio I* = (R - D) / theta
function equilibrio(R, D, theta) {
  if (theta <= 0) return null; // Se nao tem deterioracao, nao tem equilibrio
  return (R - D) / theta;
}

// Formula exata: I(t) = I* + (I0 - I*) * e^(-theta * t)
function analitico(t, R, D, theta, I0) {
  if (theta <= 0) {
    // Se theta for zero, vira uma reta (crescimento linear)
    return I0 + (R - D) * t;
  }
  
  var eq = (R - D) / theta; // O equilibrio
  return eq + (I0 - eq) * Math.exp(-theta * t);
}

// Gera a serie de pontos analiticos
function serieAnalitica(passos, dt, R, D, theta, I0) {
  validarParametros(passos, dt);
  var serie = [];
  for (var i = 0; i <= passos; i++) {
    var t = i * dt;
    serie.push(analitico(t, R, D, theta, I0));
  }
  return serie;
}

// --- Metodos Numericos ---

// Metodo de Euler (passo a passo)
function euler(passos, dt, R, D, theta, I0) {
  validarParametros(passos, dt);
  var serie = [I0];
  var I = I0;
  
  for (var i = 0; i < passos; i++) {
    var dIdt = calcularDerivada(I, R, D, theta);
    I = I + dt * dIdt;
    serie.push(I);
  }
  return serie;
}

// Metodo de Runge-Kutta 4 (mais preciso que o Euler)
function rk4(passos, dt, R, D, theta, I0) {
  validarParametros(passos, dt);
  var serie = [I0];
  var I = I0;
  
  for (var i = 0; i < passos; i++) {
    var k1 = calcularDerivada(I, R, D, theta);
    var k2 = calcularDerivada(I + (dt / 2) * k1, R, D, theta);
    var k3 = calcularDerivada(I + (dt / 2) * k2, R, D, theta);
    var k4 = calcularDerivada(I + dt * k3, R, D, theta);
    
    var media = (k1 + 2 * k2 + 2 * k3 + k4) / 6;
    I = I + dt * media;
    
    serie.push(I);
  }
  return serie;
}

// Verifica se o Euler vai oscilar ou divergir
function estabilidadeEuler(theta, dt) {
  var x = theta * dt;
  if (x > 2) return 'diverge';
  if (x > 1) return 'oscila';
  return 'estavel';
}

// Calcula o erro maximo entre duas series
function erroMaximo(serieA, serieB) {
  var maiorErro = 0;
  var tamanho = serieA.length;
  if (serieB.length < tamanho) tamanho = serieB.length;
  
  for (var i = 0; i < tamanho; i++) {
    var diferenca = Math.abs(serieA[i] - serieB[i]);
    if (diferenca > maiorErro) {
      maiorErro = diferenca;
    }
  }
  return maiorErro;
}

// --- Tempo de Ruptura ---

// Calcula quanto tempo leva pra estoque zerar
function tempoAteRuptura(R, D, theta, I0) {
  if (I0 <= 0) return 0; // Ja ta zerado

  if (theta <= 0) {
    // Sem deterioracao, so perde por demanda
    var saldo = R - D;
    if (saldo >= 0) return Infinity; // Nunca zera
    return I0 / -saldo;
  }

  var eq = (R - D) / theta;
  if (eq >= 0) return Infinity; // Tende a um valor positivo, nunca zera
  
  // Formula matematica para achar o t quando I(t) = 0
  var tempo = Math.log((I0 - eq) / -eq) / theta;
  return tempo;
}

// --- Diagnostico ---

// Retorna um objeto dizendo se ta OK, alerta ou critico
function diagnosticar(I, R, D, theta, minimo) {
  var atual = Number(I);
  var saldo = R - D;
  var eq = equilibrio(R, D, theta);

  // 1. Sem deterioracao (theta = 0)
  if (eq === null) {
    if (Math.abs(saldo) < TOLERANCIA) {
      return { titulo: 'Estoque constante', texto: 'Sem deterioracao e com R = D, o estoque fica estavel.', nivel: 'ok', cor: COR_OK, equilibrio: eq };
    }
    if (saldo > 0) {
      return { titulo: 'Acumulo sem limite', texto: 'Sem deterioracao, o estoque cresce ' + formatarNumeroModelo(saldo) + ' por dia.', nivel: 'alerta', cor: COR_ALERTA, equilibrio: eq };
    }
    return { titulo: 'Risco de ruptura', texto: 'O estoque cai ' + formatarNumeroModelo(-saldo) + ' por dia e vai zerar.', nivel: 'critico', cor: COR_CRITICO, equilibrio: eq };
  }

  // 2. R = D (saldo zero)
  if (Math.abs(saldo) < TOLERANCIA) {
    return { titulo: 'Equilibrio em zero', texto: 'A deterioracao vai consumindo o estoque ate zerar.', nivel: 'alerta', cor: COR_ALERTA, equilibrio: eq };
  }

  // 3. Demanda maior que reposicao (eq negativo)
  if (eq < 0) {
    return { titulo: 'Risco de ruptura', texto: 'Demanda maior que reposicao. O estoque vai zerar.', nivel: 'critico', cor: COR_CRITICO, equilibrio: eq };
  }

  // 4. Equilibrio positivo (R > D)
  var eqFmt = formatarNumeroModelo(eq);

  if (minimo > 0 && eq < minimo) {
    return { titulo: 'Abaixo do minimo', texto: 'O estoque vai estabilizar em ' + eqFmt + ', mas o minimo e ' + formatarNumeroModelo(minimo) + '.', nivel: 'alerta', cor: COR_ALERTA, equilibrio: eq };
  }

  // 5. Ta tudo certo, tende ao equilibrio
  var msg = 'O estoque se estabiliza em ' + eqFmt + '. ';
  if (atual < eq) {
    msg += 'O atual ta abaixo e vai subir.';
  } else if (atual > eq) {
    msg += 'O atual ta acima e vai cair.';
  } else {
    msg += 'Ja ta no nivel de equilibrio.';
  }

  return { titulo: 'Equilibrio estavel', texto: msg, nivel: 'ok', cor: COR_OK, equilibrio: eq };
}