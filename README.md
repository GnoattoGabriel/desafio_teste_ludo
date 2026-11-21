# desafio_teste_ludo

Casos de teste para o desafio **Ludo** da disciplina Projeto, Implementação e
Teste de Software — 2026. O enunciado em `desafios.md` pede apenas "casos de
teste para testar uma partida para 02 jogadores; casos de teste em Javascript
para testar Javascript".

**Colaborador:** Gabriel de Oliveira Gnoatto — RA 23298801-2 (individual).

## 1. Especificação considerada

- **Jogo:** Ludo para **02 jogadores**, um contra o outro, com **4 peças cada**.
- **Tabuleiro:** 52 casas de circuito (`0..51`), uma reta final de 5 casas por
  jogador (`home-0..home-4`) e uma **casa central única e comum** (`'casa'`).
- O manual `ludo_manual_table_games.pdf` foi usado como referência das regras;
  o enunciado do desafio não define variante, contrato JavaScript nem critério
  de vitória. Tudo o que segue é **premissa explícita**, registrada para que o
  professor possa ajustar a variante.

### 1.1 Premissas adotadas

| Premissa | Decisão |
|---|---|
| Posições opostas | jogador 0 entra na casa `0`; jogador 1 entra na casa `26` |
| Entrada da reta final | jogador 0: casa `51`; jogador 1: casa `25` |
| Saída da base | exige **1 ou 6** (confirmado pelo autor) |
| Turno extra | somente com **6** ou **captura**; saída com `1` **não** dá extra |
| Reta final | tem **bounce**: se o dado passa do fim, a peça vai até a última casa e volta |
| Chegada à casa central | exige número **exato**; se passar, a peça permanece na reta |
| Captura | ao parar em casa normal ocupada por uma peça adversária, ela volta à base |
| Casa segura | índices `0, 8, 13, 21, 26, 34, 39, 47`; não há captura nelas |
| Bloqueio | duas peças próprias podem empilhar; o bloqueio impede que o **adversário passe ou pare** na casa, inclusive na entrada e em casa segura; termina quando uma das peças sai |
| Vitória | primeiro jogador a levar as **4 peças** à casa central |
| Depois do fim | qualquer jogada é recusada e o estado fica intacto |
| Jogada recusada | `erro` descritivo; **vez e turno não mudam** (premissa adotada para manter o estado coerente) |

A saída com `1 ou 6` foi confirmada pelo autor. O manual se contradiz em outro
ponto (mais adiante diz "é necessário tirar 6"); prevaleceu a primeira afirmação
e a regra mais difundida.

O CT-10 (wrap around `50 → 1` com dado `3`) usa o **jogador 1**, porque a casa
`51` é a entrada da reta do jogador 0: partindo de `50`, o jogador 0 já entraria
em `home-2` com dado `3`.

### 1.2 Contrato JavaScript

Módulo CommonJS em `src/ludo.js`:

```js
const {
  criarPartida, // ({ dado?, jogadorInicial? }) => { valida, estado, motivo }
  jogarTurno,   // (estado, indicePeca, valorDado?) => novo estado
  visao,        // (estado, jogador) => { posicoes, seguras }
  status        // (estado) => 'jogando' | 'vitoria'
} = require('./src/ludo');
```

- `dado` é uma função `(turno, jogador) => 1..6`, injetada em `criarPartida`.
  Quando `valorDado` é omitido, `jogarTurno` usa essa função; um valor explícito
  sempre prevalece. Sem dado disponível, o erro é `'dado indisponivel'`.
- `jogadorInicial` é `0` (padrão) ou `1`. Opções que não são objeto devolvem
  `valida: false`, `estado: null` e `motivo: 'opcoes invalidas'` (CT-04);
  valores fora de `0/1` usam `jogadorInicial deve ser 0 ou 1` (CT-02).
- `visao(estado, jogador)` devolve `{ posicoes, seguras }`, em que `seguras[i]`
  informa se a peça `i` está em uma das 8 casas seguras do circuito.

### 1.3 Representação do estado

```js
{
  jogador: 0,        // jogador associado ao turno
  vez: 0,            // quem joga agora (0 ou 1)
  turno: 0,          // número de jogadas válidas
  vencedor: null,    // null, 0 ou 1
  pecas: [
    ['base', 'base', 'base', 'base'],
    ['base', 'base', 'base', 'base']
  ],
  casasSeguras: [ /* 52 booleanos */ ],
  erro: null,        // null ou motivo da recusa
  dado: (turno, jogador) => 1
}
```

Em todo estado válido, `jogador` e `vez` são iguais: os dois campos descrevem o
mesmo jogador ativo e são atualizados juntos a cada turno. Um estado em que
divergem é malformado e recebe `estado invalido` (CT-31).

Cada posição de peça é:

- `'base'` — ainda não saiu;
- `0..51` — circuito;
- `'home-0'` .. `'home-4'` — reta final (índice `0` = entrada);
- `'casa'` — chegou à casa central.

Todas as funções devolvem objeto novo. A não mutação é conferida pelo helper
`verifica` em todos os casos que recebem estado, e explicitamente nos CT-26,
CT-30 e CT-37.

Cada motivo do vocabulário é exigido por algum caso: `opcoes invalidas` e
`dado deve ser funcao` (CT-04), `jogadorInicial deve ser 0 ou 1` (CT-02),
`dado indisponivel` (CT-38), `dado invalido` (CT-03, CT-38), `peca invalida`
(CT-16), `peca na casa` (CT-14, CT-17, CT-35), `peca na base exige 1 ou 6`
(CT-06, CT-18, CT-37), `casa bloqueada` (CT-22, CT-26, CT-39),
`partida encerrada` (CT-29), `estado invalido` e `jogador invalido` (CT-31).
`jogada impossivel` não faz parte do vocabulário: com posições validadas e
bounce na reta, o destino nunca é inexistente.

## 2. Funcionamento

```bash
npm test
```

Os testes usam `node:test` (sem dependências externas). A suíte está separada
em `inicio.test.js`, `movimento.test.js`, `captura.test.js`, `partida.test.js` e
`propriedades.test.js`, com suporte comum em `test/support/helper.js`.

**Situação atual:** os 39 casos viram **40 testes** (CT-30 tem duas jogadas
completas, uma por jogador) e falham no repositório:

```
# tests 40
# pass 0
# fail 40
```

Esse é o estado **RED** esperado: a implementação do jogo não faz parte do
entregável. `src/ludo.js` não existe aqui; cada chamada lança uma mensagem com
o `stack` real do `require`.

**Determinismo:** nenhum teste usa `Math.random`, relógio ou uma lista de
jogadas escrita à mão. CT-30 e CT-37 extraem dados e índices de estratégias
implementadas no próprio teste.

**Ciclo TDD:** o GREEN (40/40), a refatoração da implementação de referência e
as variantes defeituosas foram executados em **cópia descartável** fora do
repositório, porque o entregável não pode conter `src/`. O histórico executado
foi: testes falhando no repo → implementação de referência na cópia (40/40) →
refatoração (40/40) → variantes → **reforço das asserções** (40/40) → variantes
reexecutadas. Nenhum `src/` foi deixado neste repositório.

**Reforço das asserções:** CT-05 verifica a vez na saída com `1` e com `6`;
CT-11 cobre quatro chegadas ao limite do circuito; CT-13 cobre seis cenários de
reta; CT-19 e CT-20 conferem a mão adversária completa; CT-24 confere o destino
e a sinalização em `casasSeguras`; CT-30 conta as peças na casa em **cada**
passo; CT-31 exige `seguras` coerente em casas seguras e comuns, além da
não-mutação de `visao`; CT-35 contrasta dado `1` e dado `6` na base; CT-39
verifica que o bloqueio não afeta o próprio jogador.

**Ajustes finais:** CT-04 exige `opcoes invalidas` para opções que não são
objeto; CT-05, CT-19, CT-20 e CT-30 exigem que `jogador` acompanhe `vez`, e
CT-31 recusa estados em que divergem — um implementador não pode ignorar
`jogador`. CT-32 compara os **342 destinos exatos** com um oráculo independente
e fixa explicitamente oito casos de bounce, inclusive o jogador 1.

## 3. Matriz de cobertura

| Área | Casos |
|---|---|
| Estado inicial e dado | CT-01 a CT-04, CT-38 |
| Saída da base e turno extra | CT-05 a CT-08, CT-35 |
| Circuito, wrap e reta final | CT-09 a CT-13 |
| Jogadas recusadas e índices | CT-14, CT-16 a CT-18, CT-31 |
| Captura e casa segura | CT-19, CT-20, CT-23 a CT-25, CT-36 |
| Empilhamento e bloqueio | CT-21, CT-22, CT-39 |
| Vitória e partida completa | CT-27 a CT-30 |
| Propriedades (216 sequências incluídas) | CT-32 a CT-37 |
| Não mutação | todos os casos com estado, mais CT-26, CT-30 e CT-37 |
| Visão do jogador | CT-31 |

## 4. Variantes defeituosas detectadas

Cada uma das 14 variantes foi executada na cópia descartável contra a mesma
suíte de 40 testes. Todas foram detectadas:

| Variante | Falhas |
|---|---|
| só sai com 6 (não com 1) | 8 |
| sem bounce na chegada ao circuito | 5 |
| sem bounce dentro da reta final | 3 |
| sem captura | 4 |
| captura em casa segura | 2 |
| sem bloqueio | 3 |
| sem turno extra | 6 |
| vencedor marcado na primeira peça que chega | 2 |
| dado injetado ignorado | 3 |
| implementação que muta o estado | 8 |
| `visao` sem o campo `seguras` | 1 |
| ignora `jogador` (não valida nem atualiza) | 5 |
| aceita opções que não são objeto | 1 |
| bounce com um passo a mais na volta | 2 |

## 5. Rastreabilidade

Os mesmos IDs (CT-01 a CT-39) aparecem nos arquivos `.test.js`, no resumo e
nas seções do `.docx` (`casos_de_teste_ludo.docx`). O vocabulário de motivos
da seção 1.3 também é rastreável: cada termo citado é exigido por um caso.
O `.docx` segue o template
da disciplina: especificação, resumo e, para cada caso, descrição,
pré-condições, passos, cenário, dados de teste, resultado esperado e
pós-condições.

## 6. Colaborador

- Gabriel de Oliveira Gnoatto — RA 23298801-2 (trabalho individual).
