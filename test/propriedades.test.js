'use strict';

// CT-32 a CT-39 — propriedades, dado injetado e bloqueio em detalhe.

const {
  api, verifica, assert, clonar, estadoCom, escolherPeca, BASE
} = require('./support/helper');

const posicaoValida = (p) => p === 'base' || p === 'casa' ||
  (typeof p === 'string' && /^home-[0-4]$/.test(p)) ||
  (Number.isInteger(p) && p >= 0 && p <= 51);

verifica('CT-32', 'todo dado 1..6 leva toda posicao a uma posicao valida',
  () => {
    const resultados = [];
    for (let posicao = 0; posicao <= 51; posicao++) {
      for (let dado = 1; dado <= 6; dado++) {
        const e = estadoCom([posicao, 'base', 'base', 'base'], BASE);
        resultados.push({ origem: posicao, dado, r: api.jogarTurno(e, 0, dado) });
      }
    }
    for (let casa = 0; casa <= 4; casa++) {
      for (let dado = 1; dado <= 6; dado++) {
        const e = estadoCom([`home-${casa}`, 'base', 'base', 'base'], BASE);
        resultados.push({ origem: `home-${casa}`, dado, r: api.jogarTurno(e, 0, dado) });
      }
    }
    return resultados;
  },
  undefined, {
    apos: (resultados) => {
      assert.equal(resultados.length, 342, 'CT-32: 57 origens x 6 dados');
      resultados.forEach(({ origem, dado, r }, i) => {
        assert.equal(r.erro, null, `CT-32: ${origem}+${dado} sem erro (${i})`);
        assert.equal(posicaoValida(r.pecas[0][0]), true,
          `CT-32: destino valido para ${origem}+${dado}`);
      });
    }
  });

verifica('CT-33', 'simetria: peças espelhadas e dados iguais dao destinos espelhados',
  () => {
    const pares = [];
    for (let posicao = 0; posicao <= 51; posicao++) {
      for (let dado = 1; dado <= 6; dado++) {
        const a = estadoCom([posicao, 'base', 'base', 'base'], BASE);
        const b = estadoCom(BASE, [(posicao + 26) % 52, 'base', 'base', 'base'],
          { vez: 1, jogador: 1 });
        pares.push({
          posicao, dado,
          a: api.jogarTurno(a, 0, dado),
          b: api.jogarTurno(b, 0, dado)
        });
      }
    }
    return pares;
  },
  undefined, {
    apos: (pares) => {
      assert.equal(pares.length, 312, 'CT-33: 52 posicoes x 6 dados');
      pares.forEach(({ posicao, dado, a, b }, i) => {
        const da = a.pecas[0][0];
        const db = b.pecas[1][0];
        assert.equal(a.erro, null, `CT-33: erro jogador 0 (${i})`);
        assert.equal(b.erro, null, `CT-33: erro jogador 1 (${i})`);
        if (Number.isInteger(da)) {
          assert.equal(db, (da + 26) % 52,
            `CT-33: espelhamento de ${posicao}+${dado}`);
        } else {
          assert.equal(db, da, `CT-33: reta/casa espelhada em ${posicao}+${dado}`);
        }
      });
    }
  });

verifica('CT-34', 'nenhuma jogada diminui a quantidade de pecas na casa',
  () => {
    const resultados = [];
    const origens = ['casa', 0, 'home-2', 'base'];
    for (const jogador of [0, 1]) {
      for (let dado = 1; dado <= 6; dado++) {
        for (let indice = 0; indice < 4; indice++) {
          const pecas = origens.slice();
          const extras = jogador === 1 ? { vez: 1, jogador: 1 } : {};
          const e = jogador === 0
            ? estadoCom(pecas, BASE, extras)
            : estadoCom(BASE, pecas, extras);
          const antes = e.pecas[jogador].filter((p) => p === 'casa').length;
          const r = api.jogarTurno(e, indice, dado);
          const depois = r.pecas[jogador].filter((p) => p === 'casa').length;
          resultados.push({ jogador, dado, indice, antes, depois, erro: r.erro });
        }
      }
    }
    return resultados;
  },
  undefined, {
    apos: (resultados) => {
      assert.equal(resultados.length, 48, 'CT-34: 2 jogadores x 6 dados x 4 pecas');
      resultados.forEach((r, i) => {
        assert.ok(r.depois >= r.antes, `CT-34: monotonicidade (${i})`);
        if (r.erro !== null) assert.equal(r.depois, r.antes, `CT-34: recusa intacta (${i})`);
      });
    }
  });

verifica('CT-35', 'dado 6 da turno extra nas tres origens, para os dois jogadores',
  () => {
    const cenarios = [];
    for (const jogador of [0, 1]) {
      const extras = jogador === 1 ? { vez: 1, jogador: 1 } : {};
      const entrada = jogador === 0 ? 0 : 26;
      const origens = [
        { nome: 'base', pecas: ['base', 'base', 'base', 'base'], indice: 0 },
        { nome: 'circuito', pecas: [entrada, 'base', 'base', 'base'], indice: 0 },
        { nome: 'home', pecas: ['home-0', 'base', 'base', 'base'], indice: 0 }
      ];
      for (const origem of origens) {
        const e = jogador === 0
          ? estadoCom(origem.pecas, BASE, extras)
          : estadoCom(BASE, origem.pecas, extras);
        cenarios.push({
          jogador, nome: origem.nome,
          r: api.jogarTurno(e, origem.indice, 6)
        });
      }
    }
    return cenarios;
  },
  undefined, {
    apos: (cenarios) => {
      assert.equal(cenarios.length, 6, 'CT-35: 2 jogadores x 3 origens');
      cenarios.forEach(({ jogador, nome, r }) => {
        assert.equal(r.erro, null, `CT-35: ${jogador}/${nome} sem erro`);
        assert.equal(r.vez, jogador, `CT-35: ${jogador}/${nome} turno extra`);
        assert.equal(r.turno, 1, `CT-35: ${jogador}/${nome} contador avanca`);
      });
      const recusada = estadoCom(['casa', 'base', 'base', 'base'], BASE);
      const r = api.jogarTurno(recusada, 0, 6);
      assert.equal(r.erro, 'peca na casa', 'CT-35: 6 em jogada invalida nao da extra');
      assert.equal(r.vez, 0, 'CT-35: vez intacta na recusa');
      const saidaUm = api.jogarTurno(estadoCom(BASE, BASE), 0, 1);
      assert.equal(saidaUm.vez, 1, 'CT-35: dado 1 na base alterna a vez');
    }
  });

verifica('CT-36', 'captura nunca remove peca da casa nem da base',
  () => {
    const e = estadoCom([25, 'base', 'base', 'base'],
      ['casa', 'base', 30, 'base']);
    return api.jogarTurno(e, 0, 5);
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.pecas[0][0], 30, 'CT-36: capturadora chegou');
      assert.equal(r.pecas[1][0], 'casa', 'CT-36: peca na casa intacta');
      assert.equal(r.pecas[1][1], 'base', 'CT-36: peca na base intacta');
      assert.equal(r.pecas[1][2], 'base', 'CT-36: so a vitima voltou');
      assert.equal(r.pecas[1][3], 'base', 'CT-36: quarta peca intacta');
    }
  });

verifica('CT-37', '216 sequencias de tres dados preservam 4 pecas validas por jogador',
  () => {
    const inicial = api.criarPartida().estado;
    const finais = [];
    for (let a = 1; a <= 6; a++) {
      for (let b = 1; b <= 6; b++) {
        for (let c = 1; c <= 6; c++) {
          let e = clonar(inicial);
          const recusas = [];
          for (const dado of [a, b, c]) {
            const vez = e.vez;
            const indice = escolherPeca(e.pecas[vez], dado);
            if (indice === -1) {
              recusas.push('sem peca');
              continue;
            }
            const antes = clonar(e);
            const proximo = api.jogarTurno(e, indice, dado);
            if (proximo.erro) {
              recusas.push(proximo.erro);
              assert.deepEqual(proximo.pecas, antes.pecas, `CT-37: pecas mutaram ${a}${b}${c}`);
               assert.equal(proximo.vez, antes.vez, `CT-37: vez mutou ${a}${b}${c}`);
               assert.equal(proximo.turno, antes.turno, `CT-37: turno mutou ${a}${b}${c}`);
            } else {
              e = proximo;
            }
          }
          finais.push({ sequencia: `${a}${b}${c}`, e, recusas });
        }
      }
    }
    return finais;
  },
  undefined, {
    apos: (finais) => {
      assert.equal(finais.length, 216, 'CT-37: 6^3 sequencias');
      finais.forEach(({ sequencia, e, recusas }) => {
        assert.equal(e.pecas.length, 2, `CT-37: 2 jogadores em ${sequencia}`);
        e.pecas.forEach((mao, jogador) => {
          assert.equal(mao.length, 4, `CT-37: 4 pecas do jogador ${jogador} em ${sequencia}`);
          assert.equal(mao.every(posicaoValida), true,
            `CT-37: posicoes validas do jogador ${jogador} em ${sequencia}`);
        });
        assert.ok(recusas.every((r) => r === 'peca na base exige 1 ou 6' || r === 'sem peca'),
          `CT-37: so recusas esperadas em ${sequencia}`);
      });
    }
  });

verifica('CT-38', 'dado injetado e chamado com (turno, jogador); valor explicito prevalece',
  () => {
    const chamadas = [];
    const comDado = estadoCom([0, 'base', 'base', 'base'], BASE,
      { dado: (turno, jogador) => { chamadas.push([turno, jogador]); return 6; } });
    const usado = api.jogarTurno(comDado, 0);
    const explicito = api.jogarTurno(comDado, 0, 2);
    const semDado = api.jogarTurno(
      estadoCom([0, 'base', 'base', 'base'], BASE), 0);
    const invalidos = [0, 7, '6', NaN, null].map((v) => api.jogarTurno(
      estadoCom([0, 'base', 'base', 'base'], BASE, { dado: () => v }), 0));
    return { chamadas, usado, explicito, semDado, invalidos };
  },
  undefined, {
    apos: ({ chamadas, usado, explicito, semDado, invalidos }) => {
      assert.deepEqual(chamadas, [[0, 0]], 'CT-38: dado recebe turno e jogador');
      assert.equal(usado.pecas[0][0], 6, 'CT-38: dado da funcao usado');
      assert.equal(explicito.pecas[0][0], 2, 'CT-38: valor explicito prevalece');
      assert.equal(semDado.erro, 'dado indisponivel', 'CT-38: sem funcao de dado');
      invalidos.forEach((r, i) => assert.equal(r.erro, 'dado invalido',
        `CT-38: retorno invalido ${i}`));
    }
  });

verifica('CT-39', 'bloqueio vale na entrada, em casa segura, e termina quando uma peça sai',
  () => {
    const entradaBloqueada = estadoCom(BASE, [0, 0, 'base', 'base']);
    const saidaBloqueada = api.jogarTurno(entradaBloqueada, 0, 1);

    const seguraBloqueada = estadoCom([25, 'base', 'base', 'base'],
      [26, 26, 'base', 'base']);
    const ataqueSegura = api.jogarTurno(seguraBloqueada, 0, 1);

    const antes = estadoCom([18, 'base', 'base', 'base'],
      [20, 20, 'base', 'base']);
    const bloqueado = api.jogarTurno(antes, 0, 3);
    const liberar = api.jogarTurno(
      estadoCom([18, 'base', 'base', 'base'], [20, 20, 'base', 'base'],
        { vez: 1, jogador: 1 }), 0, 1);
    const depois = api.jogarTurno(
      estadoCom([18, 'base', 'base', 'base'], [21, 20, 'base', 'base']), 0, 3);
    const isolada = api.jogarTurno(estadoCom([19, 'base', 'base', 'base'],
      [20, 'base', 'base', 'base']), 0, 1);
    const proprioPassa = api.jogarTurno(estadoCom([18, 20, 20, 'base'], BASE), 0, 3);
    return { saidaBloqueada, ataqueSegura, bloqueado, liberar, depois, isolada, proprioPassa };
  },
  undefined, {
    apos: (r) => {
      assert.equal(r.saidaBloqueada.erro, 'casa bloqueada', 'CT-39: entrada bloqueada');
      assert.equal(r.saidaBloqueada.pecas[0][0], 'base', 'CT-39: peca ficou na base');
      assert.equal(r.ataqueSegura.erro, 'casa bloqueada', 'CT-39: bloqueio em casa segura');
      assert.equal(r.bloqueado.erro, 'casa bloqueada', 'CT-39: bloqueio ativo');
      assert.equal(r.liberar.erro, null, 'CT-39: peça bloqueadora saiu');
      assert.equal(r.liberar.pecas[1][0], 21, 'CT-39: peça foi para 21');
      assert.equal(r.depois.erro, null, 'CT-39: bloqueio terminou');
      assert.equal(r.depois.pecas[0][0], 21, 'CT-39: adversario passou');
      assert.equal(r.depois.pecas[1][1], 20, 'CT-39: casa 20 liberada');
      assert.equal(r.isolada.erro, null, 'CT-39: peça isolada pode ser atacada');
      assert.equal(r.isolada.pecas[1][0], 'base', 'CT-39: peça isolada capturada');
      assert.equal(r.proprioPassa.erro, null, 'CT-39: bloqueio nao afeta o proprio jogador');
      assert.equal(r.proprioPassa.pecas[0][0], 21, 'CT-39: proprio jogador passou');
    }
  });
