'use strict';

// CT-01 a CT-08 — estado inicial, opcoes de criacao e saida da base.

const {
  api, verifica, assert, BASE, CASAS_SEGURAS, ENTRADA
} = require('./support/helper');

verifica('CT-01', 'estado inicial com 2 jogadores, 4 pecas e vez do jogador 0',
  () => api.criarPartida(), undefined, {
    apos: (r) => {
      assert.equal(r.valida, true, 'CT-01: criacao valida');
      assert.equal(r.motivo, '', 'CT-01: sem motivo de recusa');
      const e = r.estado;
      assert.deepEqual(e.pecas, [BASE, BASE], 'CT-01: todas na base');
      assert.equal(e.vez, 0, 'CT-01: vez do jogador 0');
      assert.equal(e.jogador, 0, 'CT-01: jogador 0');
      assert.equal(e.turno, 0, 'CT-01: turno zero');
      assert.equal(e.vencedor, null, 'CT-01: sem vencedor');
      assert.equal(e.erro, null, 'CT-01: sem erro');
      assert.deepEqual(
        e.casasSeguras.map((segura, i) => (segura ? i : -1)).filter((i) => i >= 0),
        CASAS_SEGURAS,
        'CT-01: exatamente as 8 casas seguras'
      );
    }
  });

verifica('CT-02', 'jogadorInicial define a vez e valores fora de 0/1 sao recusados',
  () => [api.criarPartida({ jogadorInicial: 1 }),
    api.criarPartida({ jogadorInicial: 2 }),
    api.criarPartida({ jogadorInicial: -1 })],
  undefined, {
    apos: ([a, b, c]) => {
      assert.equal(a.valida, true, 'CT-02: jogadorInicial 1 valido');
      assert.equal(a.estado.vez, 1, 'CT-02: vez do jogador 1');
      assert.equal(a.estado.jogador, 1, 'CT-02: jogador 1');
      assert.deepEqual(a.estado.pecas, [BASE, BASE], 'CT-02: pecas intactas');
      for (const [i, r] of [b, c].entries()) {
        assert.equal(r.valida, false, `CT-02: recusa ${i}`);
        assert.equal(r.estado, null, `CT-02: sem estado ${i}`);
        assert.equal(r.motivo, 'jogadorInicial deve ser 0 ou 1', `CT-02: motivo ${i}`);
      }
    }
  });

verifica('CT-03', 'funcao de dado 1..6 e aceita; retorno fora da faixa e recusado',
  () => {
    const bons = [1, 2, 3, 4, 5, 6].map((v) => api.criarPartida({ dado: () => v }));
    const ruins = [0, 7, -1, 1.5].map((v) => {
      const r = api.criarPartida({ dado: () => v });
      return api.jogarTurno(r.estado, 0);
    });
    return { bons, ruins };
  },
  undefined, {
    apos: ({ bons, ruins }) => {
      bons.forEach((r, i) => {
        assert.equal(r.valida, true, `CT-03: dado ${i + 1} valido`);
        assert.equal(typeof r.estado.dado, 'function', 'CT-03: dado preservado');
      });
      ruins.forEach((r, i) => {
        assert.equal(r.erro, 'dado invalido', `CT-03: retorno invalido ${i}`);
        assert.deepEqual(r.pecas, [BASE, BASE], `CT-03: pecas intactas ${i}`);
      });
    }
  });

verifica('CT-04', 'opcoes nao-objeto dao opcoes invalidas; dado deve ser funcao',
  () => ({
    opcoes: [null, 42, 'x', []].map((v) => api.criarPartida(v)),
    dados: ['6', null, NaN, true].map((v) => api.criarPartida({ dado: v }))
  }),
  undefined, {
    apos: ({ opcoes, dados }) => {
      opcoes.forEach((r, i) => {
        assert.equal(r.valida, false, `CT-04: opcoes recusadas ${i}`);
        assert.equal(r.estado, null, `CT-04: sem estado ${i}`);
        assert.equal(r.motivo, 'opcoes invalidas', `CT-04: motivo opcoes ${i}`);
      });
      dados.forEach((r, i) => {
        assert.equal(r.valida, false, `CT-04: recusa ${i}`);
        assert.equal(r.estado, null, `CT-04: sem estado ${i}`);
        assert.equal(r.motivo, 'dado deve ser funcao', `CT-04: motivo ${i}`);
      });
    }
  });

verifica('CT-05', 'saida da base com dado 1 ou 6 vai para a entrada do jogador 0',
  () => {
    const r = api.criarPartida({ dado: () => 1 });
    return [api.jogarTurno(r.estado, 0, 1), api.jogarTurno(r.estado, 0, 6)];
  },
  undefined, {
    apos: ([um, seis]) => {
      assert.equal(um.pecas[0][0], ENTRADA[0], 'CT-05: dado 1 sai');
      assert.equal(seis.pecas[0][0], ENTRADA[0], 'CT-05: dado 6 sai');
      assert.equal(um.erro, null, 'CT-05: sem erro');
      assert.equal(seis.erro, null, 'CT-05: sem erro');
      assert.equal(um.pecas[1].every((p) => p === 'base'), true, 'CT-05: adversario intacto');
      assert.equal(um.vez, 1, 'CT-05: dado 1 alterna a vez');
      assert.equal(seis.vez, 0, 'CT-05: dado 6 mantem a vez');
      assert.equal(um.jogador, 1, 'CT-05: jogador acompanha a vez com 1');
      assert.equal(seis.jogador, 0, 'CT-05: jogador acompanha a vez com 6');
    }
  });

verifica('CT-06', 'peca na base com dado 2 a 5 e recusada sem mudar a vez',
  () => {
    const r = api.criarPartida({ dado: () => 1 });
    return [2, 3, 4, 5].map((v) => api.jogarTurno(r.estado, 0, v));
  },
  undefined, {
    apos: (resultados) => {
      resultados.forEach((r, i) => {
        assert.equal(r.erro, 'peca na base exige 1 ou 6', `CT-06: erro ${i}`);
        assert.deepEqual(r.pecas, [BASE, BASE], `CT-06: pecas intactas ${i}`);
        assert.equal(r.vez, 0, `CT-06: vez nao alterna ${i}`);
        assert.equal(r.turno, 0, `CT-06: turno nao avanca ${i}`);
      });
    }
  });

verifica('CT-07', 'dado 6 em jogada valida concede turno extra',
  () => {
    const r = api.criarPartida({ dado: () => 6 });
    const primeiro = api.jogarTurno(r.estado, 0, 6);
    return [primeiro, api.jogarTurno(primeiro, 0, 6)];
  },
  undefined, {
    apos: ([seis, um]) => {
      assert.equal(seis.vez, 0, 'CT-07: 6 na base mantem a vez');
      assert.equal(seis.turno, 1, 'CT-07: turno avanca');
      assert.equal(um.vez, 0, 'CT-07: 6 no circuito mantem a vez');
      assert.equal(um.turno, 2, 'CT-07: turno avanca de novo');
    }
  });

verifica('CT-08', 'jogador 1 entra na posicao 26 com dado 1 ou 6',
  () => {
    const r = api.criarPartida({ dado: () => 1, jogadorInicial: 1 });
    return [api.jogarTurno(r.estado, 2, 1), api.jogarTurno(r.estado, 2, 6)];
  },
  undefined, {
    apos: ([um, seis]) => {
      assert.equal(um.pecas[1][2], ENTRADA[1], 'CT-08: dado 1');
      assert.equal(seis.pecas[1][2], ENTRADA[1], 'CT-08: dado 6');
      assert.equal(um.pecas[0].every((p) => p === 'base'), true, 'CT-08: jogador 0 intacto');
      assert.equal(um.vez, 0, 'CT-08: dado 1 alterna para 0');
      assert.equal(seis.vez, 1, 'CT-08: dado 6 mantem 1');
    }
  });
