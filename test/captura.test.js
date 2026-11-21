'use strict';

// CT-19 a CT-26 — captura, casas seguras, empilhamento, bloqueio e turno extra.

const {
  api, verifica, assert, estadoCom, BASE, CASAS_SEGURAS
} = require('./support/helper');

verifica('CT-19', 'captura em casa normal devolve a peca adversaria a base e da turno extra',
  () => {
    const e = estadoCom([25, 'base', 'base', 'base'], [30, 'base', 'base', 'base']);
    return api.jogarTurno(e, 0, 5);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0][0], 30, 'CT-19: capturadora na casa');
      assert.equal(r.pecas[1][0], 'base', 'CT-19: vitima na base');
      assert.equal(r.vez, 0, 'CT-19: captura mantem a vez');
      assert.equal(r.erro, null, 'CT-19: sem erro');
      assert.equal(r.turno, 1, 'CT-19: turno avanca');
      assert.deepEqual(r.pecas[1], ['base', 'base', 'base', 'base'],
        'CT-19: so a vitima voltou a base');
    }
  });

verifica('CT-20', 'cair em casa segura nao captura e alterna o turno',
  () => {
    const e = estadoCom([25, 'base', 'base', 'base'], [26, 'base', 'base', 'base']);
    return api.jogarTurno(e, 0, 1);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0][0], 26, 'CT-20: destino 26');
      assert.equal(r.pecas[1][0], 26, 'CT-20: adversaria permanece');
      assert.equal(r.vez, 1, 'CT-20: turno alterna');
      assert.equal(r.erro, null, 'CT-20: sem erro');
      assert.equal(r.turno, 1, 'CT-20: turno avanca');
      assert.equal(r.pecas[1].filter((p) => p === 'base').length, 3,
        'CT-20: nenhuma peca adversaria voltou a base');
    }
  });

verifica('CT-21', 'peca propria pode parar sobre peca propria e formar bloqueio',
  () => {
    const e = estadoCom([19, 20, 20, 'base'], BASE);
    return api.jogarTurno(e, 0, 1);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0].filter((p) => p === 20).length, 3, 'CT-21: tres peças empilhadas');
      assert.equal(r.erro, null, 'CT-21: sem erro');
      assert.deepEqual(r.pecas[1], BASE, 'CT-21: adversario intacto');
    }
  });

verifica('CT-22', 'bloqueio de duas peças impedem passar e parar',
  () => {
    const passar = estadoCom([29, 'base', 'base', 'base'], [31, 31, 'base', 'base']);
    const parar = estadoCom([30, 'base', 'base', 'base'], [31, 31, 'base', 'base']);
    return [api.jogarTurno(passar, 0, 3), api.jogarTurno(parar, 0, 1)];
  },
  undefined, {
    apos: ([a, b]) => {
      assert.equal(a.erro, 'casa bloqueada', 'CT-22: nao pode passar');
      assert.equal(a.pecas[0][0], 29, 'CT-22: peca intacta ao passar');
      assert.equal(b.erro, 'casa bloqueada', 'CT-22: nao pode parar');
      assert.equal(b.pecas[0][0], 30, 'CT-22: peca intacta ao parar');
    }
  });

verifica('CT-23', 'captura nao existe dentro da reta final',
  () => {
    const e = estadoCom(['home-0', 'base', 'base', 'base'],
      ['home-1', 'base', 'base', 'base']);
    return api.jogarTurno(e, 0, 1);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0][0], 'home-1', 'CT-23: destino na reta');
      assert.equal(r.pecas[1][0], 'home-1', 'CT-23: peca adversaria nao e capturada');
      assert.equal(r.erro, null, 'CT-23: sem erro');
      assert.equal(r.vez, 1, 'CT-23: turno alterna');
    }
  });

verifica('CT-24', 'nenhuma das 8 casas seguras permite captura',
  () => CASAS_SEGURAS.map((casa) => {
    const atacanteJogador = casa === 0 ? 1 : 0;
    const origem = (casa - 1 + 52) % 52;
    if (atacanteJogador === 0) {
      const e = estadoCom([origem, 'base', 'base', 'base'],
        [casa, 'base', 'base', 'base']);
      return { casa, r: api.jogarTurno(e, 0, 1) };
    }
    const e = estadoCom([casa, 'base', 'base', 'base'],
      [origem, 'base', 'base', 'base'], { vez: 1, jogador: 1 });
    return { casa, r: api.jogarTurno(e, 0, 1) };
  }),
  undefined, {
    apos: (resultados) => {
      resultados.forEach(({ casa, r }, i) => {
        assert.equal(r.erro, null, `CT-24: casa ${casa} aceita a jogada ${i}`);
        const atacante = casa === 0 ? 1 : 0;
        const vitima = r.pecas[1 - atacante];
        assert.equal(r.pecas[atacante][0], casa, `CT-24: atacante parou em ${casa}`);
        assert.equal(r.casasSeguras[casa], true, `CT-24: ${casa} sinalizada como segura`);
        assert.equal(vitima.includes(casa), true, `CT-24: peca em ${casa} permanece`);
      });
    }
  });

verifica('CT-25', 'captura da turno extra e o proximo dado vem da funcao injetada',
  () => {
    const e = estadoCom([25, 0, 'base', 'base'], [30, 'base', 'base', 'base'],
      { dado: (turno, jogador) => (turno === 0 && jogador === 0 ? 5 : 6) });
    const captura = api.jogarTurno(e, 0);
    const proxima = api.jogarTurno(captura, 1);
    return { captura, proxima };
  },
  undefined, {
    apos: ({ captura, proxima }) => {
      assert.equal(captura.pecas[1][0], 'base', 'CT-25: vitima na base');
      assert.equal(captura.vez, 0, 'CT-25: turno extra');
      assert.equal(proxima.pecas[0][1], 6, 'CT-25: dado injetado no proximo turno');
      assert.equal(proxima.turno, 2, 'CT-25: dois turnos');
      assert.equal(proxima.erro, null, 'CT-25: sem erro');
    }
  });

const ESTADO_VALIDO_CT26 = estadoCom([0, 'base', 'base', 'base'], BASE);
const ESTADO_RECUSADO_CT26 = estadoCom([29, 'base', 'base', 'base'],
  [31, 31, 'base', 'base']);

verifica('CT-26', 'jogadas validas e recusadas nao alteram o estado recebido',
  () => [api.jogarTurno(ESTADO_VALIDO_CT26, 0, 3),
    api.jogarTurno(ESTADO_RECUSADO_CT26, 0, 3)],
  undefined, {
    entradas: [ESTADO_VALIDO_CT26, ESTADO_RECUSADO_CT26],
    apos: ([valida, recusada]) => {
      assert.equal(valida.pecas[0][0], 3, 'CT-26: jogada valida aplicada');
      assert.equal(recusada.erro, 'casa bloqueada', 'CT-26: jogada recusada');
    }
  });
