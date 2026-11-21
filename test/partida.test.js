'use strict';

// CT-27 a CT-31 — vitoria, partida completa deterministica e estados invalidos.

const {
  api, verifica, assert, clonar, estadoCom, escolherPeca, BASE
} = require('./support/helper');

const CASA = ['casa', 'casa', 'casa', 'casa'];

verifica('CT-27', 'vitoria do jogador 0 ao levar as 4 pecas a casa central',
  () => {
    const e = estadoCom(['home-4', ...CASA.slice(1)], BASE);
    const fim = api.jogarTurno(e, 0, 1);
    return { fim, status: api.status(fim) };
  },
  undefined, {
    apos: ({ fim, status }) => {
      assert.deepEqual(fim.pecas[0], CASA, 'CT-27: quatro pecas na casa');
      assert.equal(fim.vencedor, 0, 'CT-27: vencedor 0');
      assert.equal(fim.vez, 0, 'CT-27: vez congelada no vencedor');
      assert.equal(status, 'vitoria', 'CT-27: status de vitoria');
      assert.equal(fim.erro, null, 'CT-27: sem erro');
    }
  });

verifica('CT-28', 'vitoria do jogador 1 — simetria do CT-27',
  () => {
    const e = estadoCom(BASE, ['home-4', ...CASA.slice(1)],
      { vez: 1, jogador: 1 });
    const fim = api.jogarTurno(e, 0, 1);
    return { fim, status: api.status(fim) };
  },
  undefined, {
    apos: ({ fim, status }) => {
      assert.deepEqual(fim.pecas[1], CASA, 'CT-28: quatro pecas na casa');
      assert.equal(fim.vencedor, 1, 'CT-28: vencedor 1');
      assert.equal(fim.vez, 1, 'CT-28: vez congelada no vencedor');
      assert.equal(status, 'vitoria', 'CT-28: status de vitoria');
    }
  });

verifica('CT-29', 'jogada depois do fim e recusada sem alterar o estado',
  () => {
    const e0 = estadoCom(CASA, BASE, { vencedor: 0, vez: 0 });
    const e1 = estadoCom(BASE, CASA, { vencedor: 1, vez: 1, jogador: 1 });
    return [api.jogarTurno(e0, 0, 6), api.jogarTurno(e0, 1, 3),
      api.jogarTurno(e1, 2, 1)];
  },
  undefined, {
    apos: (resultados) => {
      resultados.forEach((r, i) => {
        assert.equal(r.erro, 'partida encerrada', `CT-29: erro ${i}`);
        assert.equal(r.turno, 0, `CT-29: turno intacto ${i}`);
      });
      assert.deepEqual(resultados[0].pecas, [CASA, BASE], 'CT-29: pecas intactas');
      assert.deepEqual(resultados[2].pecas, [BASE, CASA], 'CT-29: pecas intactas');
    }
  });

// Estrategia deterministica (sem Math.random, sem relogio e sem lista escrita a
// mao): o alvo move sempre a primeira peca disponivel com 6 (ou 2 em home-3);
// o adversario move a primeira peca possivel com 1.
const jogarAteVitoria = (alvo) => {
  let estado = api.criarPartida({ dado: () => 1 }).estado;
  const passos = [];
  for (let n = 0; n < 200 && estado.vencedor === null; n++) {
    const vez = estado.vez;
    let indice;
    let valor;
    if (vez === alvo) {
      indice = estado.pecas[alvo].findIndex((p) => p !== 'casa');
      valor = estado.pecas[alvo][indice] === 'home-3' ? 2 : 6;
    } else {
      indice = escolherPeca(estado.pecas[vez], 1);
      valor = 1;
    }
    assert.notEqual(indice, -1, `CT-30: peca disponivel no passo ${n}`);
    const antes = clonar(estado);
    const proximo = api.jogarTurno(estado, indice, valor);
    passos.push({
      vez,
      vezResultante: proximo.vez,
      jogador: proximo.jogador,
      indice,
      valor,
      erro: proximo.erro,
      vencedor: proximo.vencedor,
      status: api.status(proximo),
      casasAlvo: proximo.pecas[alvo].filter((p) => p === 'casa').length,
      intacto: JSON.stringify(antes) === JSON.stringify(estado)
    });
    assert.equal(proximo.erro, null, `CT-30: passo ${n} sem erro`);
    estado = proximo;
  }
  return { estado, passos };
};

for (const alvo of [0, 1]) {
  verifica(`CT-30`, `partida completa ate a vitoria do jogador ${alvo}`,
    () => jogarAteVitoria(alvo),
    undefined, {
      apos: ({ estado, passos }) => {
        assert.ok(passos.length > 10, 'CT-30: sequencia gerada pela estrategia');
        assert.ok(passos.length < 200, 'CT-30: vitoria dentro do limite');
        assert.equal(estado.vencedor, alvo, 'CT-30: vencedor no fim');
        assert.equal(api.status(estado), 'vitoria', 'CT-30: status final');
        assert.equal(estado.pecas[alvo].every((p) => p === 'casa'), true,
          'CT-30: quatro pecas na casa');
        assert.equal(estado.turno, passos.length, 'CT-30: turno conta as jogadas');
        assert.ok(passos.every((p) => p.intacto), 'CT-30: nenhum passo mutou a entrada');
        assert.ok(passos.every((p) => p.erro === null), 'CT-30: nenhum passo recusado');
        assert.ok(passos.every((p) => p.jogador === p.vezResultante),
          'CT-30: jogador acompanha a vez resultante em todos os passos');
        assert.ok(passos.slice(0, -1).every((p) => p.vencedor === null),
          'CT-30: nenhum vencedor prematuro');
        assert.ok(passos.slice(0, -1).every((p) => p.status === 'jogando'),
          'CT-30: nenhum status de vitoria antes do fim');
        const ultimo = passos[passos.length - 1];
        assert.equal(ultimo.vencedor, alvo, 'CT-30: vencedor marcado na ultima jogada');
        assert.equal(ultimo.status, 'vitoria', 'CT-30: vitoria so no ultimo passo');
        assert.ok(passos.slice(0, -1).every((p) => p.casasAlvo < 4),
          'CT-30: quarta peca na casa so no ultimo passo');
        assert.equal(ultimo.casasAlvo, 4, 'CT-30: quatro pecas na casa no ultimo passo');
      }
    });
}

const ESTADO_VISAO_CT31 = estadoCom([0, 8, 'base', 'home-2'], BASE);

verifica('CT-31', 'estados malformados e posicoes desconhecidas sao recusados',
  () => {
    const ruims = [null, {}, { vez: 0 }, { pecas: [BASE] },
      { pecas: [BASE, BASE, BASE] },
      estadoCom([0, 'base', 'base', 'base', 'base'], BASE),
      estadoCom([0, 'home-9', 'base', 'base'], BASE),
      estadoCom([0, -1, 'base', 'base'], BASE),
      estadoCom([0, 52, 'base', 'base'], BASE),
      estadoCom([0, '0', 'base', 'base'], BASE),
      estadoCom([undefined, 'base', 'base', 'base'], BASE),
      estadoCom(BASE, BASE, { vez: 1 }),
      estadoCom(BASE, BASE, { jogador: 1 })];
    return {
      jogadas: ruims.map((e) => api.jogarTurno(e, 0, 3)),
      visoes: [api.visao(null, 0), api.visao({}, 0),
        api.visao(estadoCom(), 2), api.visao(estadoCom(), -1)],
      boa: api.visao(ESTADO_VISAO_CT31, 0),
      todas: api.visao(estadoCom([0, 8, 13, 21], [26, 34, 39, 47]), 0),
      mistas: api.visao(estadoCom([1, 9, 14, 22], [27, 35, 40, 48]), 1)
    };
  },
  undefined, {
    entradas: [ESTADO_VISAO_CT31],
    apos: ({ jogadas, visoes, boa, todas, mistas }) => {
      jogadas.forEach((r, i) => {
        assert.equal(r && r.erro, 'estado invalido', `CT-31: jogada invalida ${i}`);
      });
      visoes.forEach((r, i) => {
        assert.equal(r && r.erro, 'jogador invalido', `CT-31: visao invalida ${i}`);
      });
      assert.deepEqual(boa.posicoes, [0, 8, 'base', 'home-2'], 'CT-31: visao posicoes');
      assert.deepEqual(boa.seguras, [true, true, false, false], 'CT-31: visao seguras');
      assert.deepEqual(todas.seguras, [true, true, true, true],
        'CT-31: as quatro posicoes seguras marcadas');
      assert.deepEqual(mistas.seguras, [false, false, false, false],
        'CT-31: posicoes comuns nao marcadas como seguras');
    }
  });
