'use strict';

// CT-09 a CT-18 — movimento no circuito, wrap, reta final e entradas invalidas.

const { api, verifica, assert, estadoCom, BASE } = require('./support/helper');

verifica('CT-09', 'anda 3 casas a partir da entrada do jogador 0',
  () => {
    const e = estadoCom([0, 'base', 'base', 'base'], BASE);
    return api.jogarTurno(e, 0, 3);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0][0], 3, 'CT-09: destino 3');
      assert.equal(r.erro, null, 'CT-09: sem erro');
      assert.equal(r.vez, 1, 'CT-09: turno alterna');
      assert.equal(r.turno, 1, 'CT-09: contador avanca');
    }
  });

// O jogador 0 tem a entrada do home na casa 51; por isso o wrap puro e
// observado no jogador 1, cuja entrada do home e a casa 25.
verifica('CT-10', 'wrap around: de 50 com dado 3 termina na casa 1',
  () => api.jogarTurno(estadoCom(BASE, [50, 'base', 'base', 'base'],
    { vez: 1, jogador: 1 }), 0, 3),
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[1][0], 1, 'CT-10: destino 1');
      assert.equal(r.erro, null, 'CT-10: sem erro');
    }
  });

verifica('CT-11', 'chegar na entrada do home produz home-0 ou home-1',
  () => [[48, 3], [50, 1], [49, 2], [48, 4]].map(([origem, dado]) =>
    api.jogarTurno(estadoCom([origem, 'base', 'base', 'base'], BASE), 0, dado)),
  undefined, {
    apos: (resultados) => {
      assert.deepEqual(resultados.map((r) => r.pecas[0][0]),
        ['home-0', 'home-0', 'home-0', 'home-1'], 'CT-11: entradas na reta');
      resultados.forEach((r, i) => assert.equal(r.erro, null, `CT-11: sem erro ${i}`));
    }
  });

verifica('CT-12', 'andar dentro da reta final: home-0 mais 3 vai para home-3',
  () => api.jogarTurno(estadoCom(['home-0', 'base', 'base', 'base'], BASE), 0, 3),
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0][0], 'home-3', 'CT-12: destino home-3');
      assert.equal(r.erro, null, 'CT-12: sem erro');
    }
  });

verifica('CT-13', 'bounce na reta: passar da central faz a peca voltar',
  () => {
    const e = estadoCom(['home-2', 'base', 'base', 'base'], BASE);
    return [api.jogarTurno(e, 0, 4), api.jogarTurno(e, 0, 3),
      api.jogarTurno(estadoCom(['home-4', 'base', 'base', 'base'], BASE), 0, 2),
      api.jogarTurno(estadoCom(['home-3', 'base', 'base', 'base'], BASE), 0, 2),
      api.jogarTurno(estadoCom(['home-0', 'base', 'base', 'base'], BASE), 0, 5),
      api.jogarTurno(estadoCom(['home-4', 'base', 'base', 'base'], BASE), 0, 1)];
  },
  undefined, {
    apos: ([a, b, c, d, e, f]) => {
      assert.equal(a.pecas[0][0], 'home-4', 'CT-13: home-2 + 4 volta para home-4');
      assert.equal(b.pecas[0][0], 'casa', 'CT-13: home-2 + 3 chega exatamente');
      assert.equal(c.pecas[0][0], 'home-4', 'CT-13: home-4 + 2 quica na ultima casa');
      assert.equal(d.pecas[0][0], 'casa', 'CT-13: home-3 + 2 chega exatamente');
      assert.equal(e.pecas[0][0], 'casa', 'CT-13: home-0 + 5 chega exatamente');
      assert.equal(f.pecas[0][0], 'casa', 'CT-13: home-4 + 1 chega exatamente');
      [a, b, c, d, e, f].forEach((r, i) => assert.equal(r.erro, null, `CT-13: sem erro ${i}`));
    }
  });

verifica('CT-14', 'peca ja na casa central nao pode ser movida',
  () => {
    const e = estadoCom(['casa', 'base', 'base', 'base'], BASE);
    return api.jogarTurno(e, 0, 6);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.erro, 'peca na casa', 'CT-14: erro descritivo');
      assert.equal(r.pecas[0][0], 'casa', 'CT-14: peca intacta');
    }
  });

verifica('CT-15', 'jogador 1 tambem sai da base com 1 ou 6',
  () => {
    const e = estadoCom(BASE, ['base', 'base', 'base', 'base'], { vez: 1, jogador: 1 });
    return [api.jogarTurno(e, 1, 1), api.jogarTurno(e, 1, 6)];
  },
  undefined, {
    apos: ([um, seis]) => {
      assert.equal(um.pecas[1][1], 26, 'CT-15: dado 1');
      assert.equal(seis.pecas[1][1], 26, 'CT-15: dado 6');
      assert.equal(um.erro, null, 'CT-15: sem erro');
      assert.equal(seis.erro, null, 'CT-15: sem erro');
    }
  });

verifica('CT-16', 'indice de peca negativo, 4, decimal, string, null e undefined',
  () => {
    const e = estadoCom([0, 'base', 'base', 'base'], BASE);
    return [-1, 4, 1.5, '0', null, undefined].map((i) => api.jogarTurno(e, i, 3));
  },
  undefined, {
    apos: (resultados) => {
      resultados.forEach((r, i) => {
        assert.equal(r.erro, 'peca invalida', `CT-16: erro ${i}`);
        assert.equal(r.pecas[0][0], 0, `CT-16: peca intacta ${i}`);
        assert.equal(r.turno, 0, `CT-16: turno intacto ${i}`);
      });
    }
  });

verifica('CT-17', 'mover peca ja finalizada e recusado em qualquer indice',
  () => {
    const e = estadoCom(['base', 'casa', 'casa', 'casa'], BASE);
    return [1, 2, 3].map((i) => api.jogarTurno(e, i, 6));
  },
  undefined, {
    apos: (resultados) => {
      resultados.forEach((r, i) => {
        assert.equal(r.erro, 'peca na casa', `CT-17: erro ${i}`);
        assert.deepEqual(r.pecas[0], ['base', 'casa', 'casa', 'casa'], `CT-17: intactas ${i}`);
      });
    }
  });

verifica('CT-18', 'base com dado 2, 3, 4 ou 5 e recusada sem alterar o estado',
  () => {
    const e = estadoCom(BASE, BASE);
    return [2, 3, 4, 5].map((v) => api.jogarTurno(e, 3, v));
  },
  undefined, {
    apos: (resultados) => {
      resultados.forEach((r, i) => {
        assert.equal(r.erro, 'peca na base exige 1 ou 6', `CT-18: erro ${i}`);
        assert.deepEqual(r.pecas, [BASE, BASE], `CT-18: intactas ${i}`);
      });
    }
  });
