'use strict';

// Suporte comum aos cinco arquivos de teste do Ludo.
// A implementacao de src/ludo.js deve ser escrita a partir da especificacao.
// Enquanto ela nao existe, cada chamada lanca com o stack real do require.

const test = require('node:test');
const assert = require('node:assert/strict');

let api;
try {
  api = require('../../src/ludo');
} catch (erro) {
  const detalhe = (erro && (erro.stack || erro.message)) || String(erro);
  api = {};
  for (const nome of ['criarPartida', 'jogarTurno', 'visao', 'status']) {
    api[nome] = () => {
      throw new Error('Crie src/ludo.js exportando ' + nome + '. ' + detalhe);
    };
  }
}
for (const nome of ['criarPartida', 'jogarTurno', 'visao', 'status']) {
  if (typeof api[nome] !== 'function') {
    const mensagem = 'Exporte ' + nome + ' de src/ludo.js';
    api[nome] = () => { throw new Error(mensagem); };
  }
}

// Copia generica: preserva funcoes, NaN, undefined e qualquer tipo de entrada.
const clonar = (v) => {
  if (Array.isArray(v)) return v.map(clonar);
  if (v && typeof v === 'object') {
    const out = {};
    for (const chave of Object.keys(v)) out[chave] = clonar(v[chave]);
    return out;
  }
  return v;
};

const BASE = Array(4).fill('base');
const CASAS_SEGURAS = [0, 8, 13, 21, 26, 34, 39, 47];
const ENTRADA = [0, 26];
const ENTRADA_HOME = [51, 25];

// Estado montado diretamente, sem depender da implementacao, para que os
// cenarios possam ser definidos mesmo no estado RED.
const estadoCom = (pecas0 = BASE, pecas1 = BASE, extras = {}) => ({
  jogador: 0,
  vez: 0,
  turno: 0,
  vencedor: null,
  pecas: [pecas0.slice(), pecas1.slice()],
  casasSeguras: Array.from({ length: 52 }, (_, i) => CASAS_SEGURAS.includes(i)),
  erro: null,
  ...extras
});

// verifica sempre clona as entradas antes da chamada e compara depois.
// esperado pode ser um valor (assert.equal/deepEqual) ou uma funcao de asserts.
const verifica = (id, descricao, acao, esperado, opcoes = {}) => {
  test(`${id} — ${descricao}`, () => {
    const entradas = (opcoes.entradas || []).map(clonar);
    const saida = acao();
    if (typeof esperado === 'function') {
      esperado(saida);
    } else if (esperado !== undefined) {
      if (opcoes.deep) {
        assert.deepEqual(saida, esperado, `${id}: retorno`);
      } else {
        assert.equal(saida, esperado, `${id}: ${descricao}`);
      }
    }
    entradas.forEach((antes, i) => {
      assert.deepEqual(
        opcoes.entradas[i], antes,
        `${id}: a entrada ${i + 1} nao pode ser alterada`
      );
    });
    if (opcoes.apos) opcoes.apos(saida);
  });
};

// Estrategia deterministica usada em CT-30 e CT-37: sempre a primeira peca
// que pode ser movida com o dado fornecido, sem lista de jogadas escrita a mao.
const escolherPeca = (pecas, dado) => pecas.findIndex(
  (p) => p !== 'casa' && !(p === 'base' && dado !== 1 && dado !== 6)
);

module.exports = {
  test, assert, api, verifica, clonar, estadoCom, escolherPeca,
  BASE, CASAS_SEGURAS, ENTRADA, ENTRADA_HOME
};
