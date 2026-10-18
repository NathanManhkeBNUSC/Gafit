---
name: Gafit
description: Seu treino, suas cargas, seu progresso. Rastreador de treino pt-BR, mobile-first, dark por padrão, quente e feminino.
colors:
  plum-night: "#16101a"
  plum-night-elev: "#1c1520"
  surface: "#221a28"
  surface-2: "#2c2233"
  surface-3: "#372b40"
  line: "rgb(255 236 246 / 0.08)"
  line-strong: "rgb(255 236 246 / 0.16)"
  text: "#f8eef4"
  text-2: "#c9b6c4"
  text-3: "#a08d9c"
  rose: "#ff8fb1"
  rose-strong: "#ff6f9c"
  rose-ink: "#3a0a1e"
  rose-soft: "rgb(255 143 177 / 0.14)"
  rose-line: "rgb(255 143 177 / 0.35)"
  lilac: "#c6aaff"
  lilac-soft: "rgb(198 170 255 / 0.14)"
  peach: "#ffb38a"
  peach-soft: "rgb(255 179 138 / 0.15)"
  mint: "#7fe0b8"
  mint-soft: "rgb(127 224 184 / 0.14)"
  danger: "#ff7a7a"
  danger-soft: "rgb(255 122 122 / 0.14)"
  day-1: "#ff8fb1"
  day-2: "#c6aaff"
  day-3: "#ffb38a"
  day-4: "#7fe0b8"
  day-5: "#8fc8ff"
  day-6: "#f3d77a"
  thumb-blush: "#eadde5"
  water: "#8fc8ff"
  water-soft: "rgb(143 200 255 / 0.14)"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: "2.5rem"
    letterSpacing: "-0.02em"
    fontVariation: "'opsz' 48"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: "2.1rem"
    letterSpacing: "-0.02em"
    fontVariation: "'opsz' 48"
  title:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: "1.6rem"
    letterSpacing: "-0.02em"
    fontVariation: "'opsz' 48"
  numeral:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.1rem"
    fontFeature: "'tnum' 1"
    fontVariation: "'opsz' 72"
  body:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  body-sm:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.3rem"
  label:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1.05rem"
  label-xs:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: "1rem"
rounded:
  sm: "12px"
  md: "16px"
  lg: "22px"
  xl: "28px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.rose-ink}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.rose-strong}"
  button-primary-lg:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.rose-ink}"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-3}"
  button-soft:
    backgroundColor: "{colors.rose-soft}"
    textColor: "{colors.rose}"
    rounded: "{rounded.full}"
    height: "48px"
  button-ghost:
    textColor: "{colors.text-2}"
    rounded: "{rounded.full}"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    height: "48px"
  icon-button:
    textColor: "{colors.text-2}"
    rounded: "{rounded.full}"
    size: "44px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-hero:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.rose-ink}"
    rounded: "{rounded.full}"
    height: "36px"
  segmented:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.full}"
    padding: "4px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    height: "36px"
  badge-mint:
    backgroundColor: "{colors.mint-soft}"
    textColor: "{colors.mint}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  badge-lilac:
    backgroundColor: "{colors.lilac-soft}"
    textColor: "{colors.lilac}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  set-input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    height: "48px"
  set-row-done:
    backgroundColor: "{colors.rose-soft}"
    rounded: "{rounded.md}"
  set-check:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-3}"
    rounded: "{rounded.sm}"
    size: "48px"
  set-check-done:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.rose-ink}"
    rounded: "{rounded.sm}"
    size: "48px"
  rest-dock:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text}"
    typography: "{typography.numeral}"
    rounded: "{rounded.xl}"
    padding: "8px 8px 8px 16px"
  sheet:
    backgroundColor: "{colors.plum-night-elev}"
    rounded: "{rounded.xl}"
    padding: "0 20px 20px"
  nav-tab-active:
    textColor: "{colors.rose}"
    typography: "{typography.label-xs}"
  nav-train-fab:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.rose-ink}"
    rounded: "{rounded.full}"
    size: "56px"
---

# Design System: Gafit

> Fonte de verdade dos tokens: `src/app/globals.css` (variáveis CSS em `:root`, expostas ao Tailwind v4 via `@theme inline`). Os valores no frontmatter acima são o tema **escuro** (padrão). O tema claro troca os mesmos nomes de token via `<html data-theme="light">` (ou `data-theme="system"`, que segue o SO); veja a tabela em Colors. Componentes **nunca** usam hex cru: só classes do tema (`bg-surface`, `text-rose`, `rounded-lg`…).

## Overview

**Creative North Star: "O Caderno de Treino à Noite"**

Gafit é o rastreador de treino canônico da categoria (dark-first, cartões arredondados, um único acento vibrante, na família de Befit e Hevy) tocado sem ironia e reafinado para o quente e feminino. O chão é uma noite ameixa (plum-night), não preto neutro; o único acento de ação é rosa; lilás carrega informação e navegação secundária; pêssego e menta são estados (atenção / pronto). Nada de gradientes decorativos, glassmorphism ou ilustração: o calor vem do matiz do neutro e do rosa, não de efeitos.

A densidade é de ferramenta de academia: o celular numa mão, entre séries, com dedo suado. Isso define tudo: alvos de toque de 44 a 56 px, números grandes em Bricolage Grotesque com algarismos tabulares, uma ação primária rosa por contexto, e a linha de série como unidade do sistema. A tela de sessão (`session-view.tsx`) é a superfície-assinatura; todas as outras telas são variações calmas de "cabeçalho de página, seções com título, cartões `surface` em pilha".

Profundidade vem de camadas tonais (`bg` → `surface` → `surface-2` → `surface-3`), não de bordas. Sombras só aparecem em coisas que flutuam (sheet, dock de descanso, toast, tooltip) e no brilho rosa da ação primária.

**Key Characteristics:**
- Chão ameixa escuro com superfícies empilhadas por tom; bordas só como hairline de separação.
- Rosa é a única cor de ação e a cor de "feito"; lilás = informação/links; pêssego = atenção/PR; menta = pronto/sucesso.
- Bricolage Grotesque para títulos e números; Figtree para toda a UI.
- Formas generosas: cartões 22 px, sheets e dock 28 px, botões e chips em pílula.
- Movimento só em mudança de estado (pop no check, rise no dock, sheet subindo), anulado em `prefers-reduced-motion`.
- Dois temas com os mesmos nomes de token; o claro é um rosa-papel com rosa mais profundo para contraste.

## Colors

Uma paleta de neutros ameixa com um único acento rosa e três cores de estado com papéis fixos; todas existem em versão cheia e versão `-soft` (mesma cor a ~14% de opacidade) para fundos tonais.

### Primary
- **Rosa Ação** (`rose`): a única cor de ação. Botão primário, FAB "Treinar" na navegação, aba ativa, chip ativo, check de série feita, barra de progresso da sessão, dias treinados no `WeekStrip`, foco (`:focus-visible` com contorno de 2 px), cursor de texto, seleção. Texto sobre rosa usa sempre `rose-ink`.
- **Rosa Pressionado** (`rose-strong`): hover/pressed do primário. Nunca usado em repouso.
- **Tinta Rosa** (`rose-ink`): texto/ícone sobre rosa cheio (vinho quase preto no escuro, branco no claro).
- **Rosa Véu** (`rose-soft`): fundo da linha de série concluída, botão `soft` ("+ Exercício"), ícones em círculo de ações primárias, item selecionado em listas de opção, preenchimento de progresso do dock de descanso.
- **Rosa Contorno** (`rose-line`): anel do dia de hoje no `WeekStrip`.

### Secondary
- **Lilás Informação** (`lilac` / `lilac-soft`): links de seção ("Ver tudo", "Histórico"), ícones de atalhos, badge "Bi-set", série tipo drop, `BarList` de volume por músculo, gráfico de peso corporal e de cardio, estado "quase pronto" na recuperação.

### Tertiary
- **Pêssego Atenção** (`peach` / `peach-soft`): PRs, sequência de semanas (chama), aviso "séries não marcadas", "salvo no aparelho" offline, série de aquecimento, músculo "recuperando".
- **Menta Pronto** (`mint` / `mint-soft`): badge "Feito" de exercício completo, toast de sucesso, músculo "pronto", intensidade leve.
- **Perigo** (`danger` / `danger-soft`): ações destrutivas (botão `danger` em fundo suave; cheio só no `ConfirmSheet` destrutivo), série até a falha, erros de campo, toast de erro.
- **Cores de Dia** (`day-1` … `day-6`): identidade de cada dia da ficha (A, B, C…), aplicada só pelo `DayBadge` como letra colorida sobre a própria cor a 18% (`color-mix`). Ciclam a cada 6 dias. Não usar para mais nada.

### Neutral
- **Noite Ameixa** (`plum-night`, `--bg`): fundo da página e do `html`, `theme-color` do PWA.
- **Noite Elevada** (`plum-night-elev`, `--bg-elev`): fundo de sheets e da barra de navegação inferior.
- **Superfície** (`surface`): cartões, blocos de exercício, linhas de histórico, chips inativos.
- **Superfície 2** (`surface-2`): controles dentro de cartões (inputs, stepper, segmented, botão secondary), hover de cartão interativo, trilho de barras.
- **Superfície 3** (`surface-3`): o nível mais alto: dock de descanso, tooltip de gráfico, toast neutro, hover de secondary.
- **Hairline** (`line`) e **Hairline Forte** (`line-strong`): divisórias internas de cartão, borda de input/chip, borda tracejada do `EmptyState`, alça do sheet.
- **Texto** (`text`), **Texto 2** (`text-2`: corpo secundário, rótulos de campo), **Texto 3** (`text-3`: metadados, placeholders, eixos de gráfico, abas inativas).
- **Azul Água** (`water`, `water-soft`): papel fixo de hidratação. Só aparece na meta de água (cartão do início, página `/agua`, garrafa, botões de adicionar e gráfico de 7 dias). Nunca é cor de ação geral nem de outro dado. Claro: `#1f6fbf`.
- **Blush de Miniatura** (`thumb-blush`, `--thumb`): fundo das miniaturas de exercício; o GIF branco do ExerciseDB entra com `mix-blend-multiply` para não ser o objeto mais claro da tela.

### Tema claro
Mesmos nomes, valores trocados em `:root[data-theme="light"]` (e repetidos em `@media (prefers-color-scheme: light) :root[data-theme="system"]`). Ao adicionar um token, adicione-o nos **três** blocos.

| Token | Claro |
|---|---|
| bg / bg-elev | #fff6f9 / #fffafc |
| surface / -2 / -3 | #ffffff / #fbeef4 / #f4e1ea |
| line / line-strong | rgb(74 27 52 / 0.09) / 0.18 |
| text / -2 / -3 | #2b1b26 / #5e4757 / #806878 |
| rose / rose-strong / rose-ink | #d23a6a / #bf2d5b / #ffffff |
| lilac / peach / mint / danger | #6c4bd1 / #b9551f / #12805a / #c23434 |
| day-1…6 | #d23a6a, #6c4bd1, #c4602b, #12805a, #2d7fcf, #a07c0a |
| thumb | #ffffff |

### Named Rules
**The One Rose Rule.** Rosa cheio significa "faça isto" ou "feito". Uma ação primária rosa por contexto (cartão, sheet, cabeçalho); todo o resto é `secondary`, `soft` ou `ghost`. Se dois botões rosa cheios aparecem lado a lado, um deles está errado.

**The Fixed Roles Rule.** Lilás informa, pêssego alerta, menta confirma, vermelho destrói. Uma cor de estado nunca troca de papel entre telas, e nenhuma delas vira cor de ação.

**The Soft Twin Rule.** Todo fundo colorido é a versão `-soft` da cor com o texto na versão cheia (`bg-mint-soft text-mint`). Cor cheia como fundo é reservada ao rosa (ação/feito) e aos toasts.

**The Token-Only Rule.** Nenhum hex em componente. Cor nova = variável nova em `:root` + os dois blocos claros + linha em `@theme inline`.

## Typography

**Display Font:** Bricolage Grotesque Variable (eixo `opsz`; fallback Figtree, system-ui)
**Body Font:** Figtree Variable (fallback ui-sans-serif, system-ui)

**Character:** Bricolage dá aos títulos e números um grotesco expressivo e levemente quirky, com tamanho óptico (48 para títulos, 72 para números); Figtree é a voz neutra, redonda e muito legível de toda a interface. Escala fixa em rem, razão ~1,2.

### Hierarchy
- **Display** (800, 2.25rem/2.5rem, -0.02em): título de página de nível superior (`PageHeader` sem voltar, saudação "Oi, Nathan"). `text-3xl font-extrabold`.
- **Headline** (800, 1.75rem/2.1rem): título de página com botão voltar e título do cartão-herói (treino de hoje). `text-2xl font-extrabold`.
- **Title** (700, 1.1875rem/1.6rem): título de `Section` e de `EmptyState`; título de sheet usa 1.4375rem (`text-xl font-bold`). Todos os `h1`–`h3` herdam Bricolage, `opsz 48`, `-0.02em`, `text-wrap: balance` da camada base.
- **Numeral** (700–800, 1.75rem–2.25rem, tabular): `Stat`, resumo de finalização, cronômetro do descanso (`text-3xl font-extrabold`), dia em `WorkoutRow`, `DayBadge`. Classe `font-display tabular`.
- **Body** (400–600, 1rem/1.5rem): texto corrido, inputs (16 px para evitar zoom no iOS), botões md.
- **Body small** (400–600, 0.875rem/1.3rem): o tamanho dominante da UI: metadados de cartão, chips, botões sm, listas.
- **Label** (600, 0.75rem): rótulos de `Stat`, dicas de campo, badges (700).
- **Label XS** (600, 0.6875rem): abas da navegação, cabeçalho da tabela de séries (maiúsculas, `tracking-wide`), letras do `WeekStrip`, eixos de gráfico (10 px no SVG).

### Named Rules
**The Numbers Are Display Rule.** Todo número que o usuário lê de longe (carga, reps, tempo, contagem, volume) usa `tabular`; os que são o conteúdo principal do bloco usam também `font-display`. Inputs de série usam Figtree bold 1.1875rem tabular: são campos, não títulos.

**The Names Stay Sans Rule.** Nomes de exercício são conteúdo, não marca: no bloco de exercício o `h3` volta para Figtree bold 17 px, `tracking-normal`. Bricolage fica para títulos de estrutura e números.

## Layout

Coluna única mobile-first, `max-w-xl` (36rem) centralizada em qualquer largura; não há grid de desktop, a tela larga é só a coluna centralizada e sheets viram diálogos centrados a partir de `sm` (640 px).

- **Moldura (`AppShell`)**: `main` com 16 px de gutter lateral, topo `max(16px, safe-area-inset-top)`, e espaço inferior para a nav (68 px, `--nav-h`) + safe area + 88 px para a pílula de treino ativo.
- **Ritmo vertical**: `PageHeader` com 24 px abaixo; `Section` separadas por 32 px, título a 12 px do conteúdo; itens dentro de uma pilha a 8 px (listas de linhas) ou 12 px (grids de atalhos, blocos de exercício a 16 px).
- **Padding interno**: cartões 16 px; cartão-herói 20 px; sheets 20 px laterais.
- **Escala de espaço**: base de 4 px do Tailwind; os passos realmente usados são 4, 8, 12, 16, 20, 24, 32 (frontmatter `spacing`). Gaps de 6 px (`gap-1.5`) aparecem só em grades densas (linha de série, `WeekStrip`).
- **Grades**: atalhos e pares de ações em `grid-cols-2 gap-3`; a linha de série é uma grade fixa `2.5rem 1fr 4.75rem 4.25rem 3.25rem`.
- **Fixos**: nav inferior (z-40, `bg-elev/95` + blur), cabeçalho da sessão sticky (z-30, `bg/92` + blur), dock de descanso (z-40), toasts no topo (z-60). Todos respeitam `env(safe-area-inset-*)`.

## Elevation & Depth

Sistema híbrido: profundidade por **camadas tonais** em repouso e sombra apenas para o que flutua sobre o conteúdo. Cartões não têm sombra nem borda; o degrau de `bg` para `surface` é a elevação.

### Shadow Vocabulary
- **Sombra 1** (`--shadow-1`, escuro: `0 1px 2px rgb(0 0 0 / .3), 0 4px 16px rgb(0 0 0 / .18)`): a pílula selecionada do `Segmented`.
- **Sombra 2** (`--shadow-2`, escuro: `0 8px 28px rgb(0 0 0 / .45), 0 2px 6px rgb(0 0 0 / .3)`): sheet, dock de descanso, toast, tooltip de gráfico.
- **Brilho Rosa** (`--shadow-rose`, escuro: `0 6px 22px rgb(255 111 156 / .32)`): botão primário, FAB "Treinar", pílula de treino ativo. É a única sombra colorida.

No tema claro as sombras usam a ameixa `rgb(74 27 52 / …)` em vez de preto.

### Named Rules
**The Tonal Step Rule.** Para elevar, suba um degrau de superfície (`surface` → `surface-2` → `surface-3`); não adicione borda nem sombra. Controles dentro de um cartão ficam sempre um degrau acima do cartão.

**The Only Floaters Cast Rule.** Sombra 2 é exclusiva de camadas sobrepostas (sheet, dock, toast, tooltip). Brilho rosa é exclusivo da ação primária cheia.

## Shapes

Linguagem macia e generosa, em quatro raios de token mais a pílula:

- **12 px** (`rounded-sm`): campos de formulário, inputs e check da linha de série, miniatura de exercício, tooltip, avisos inline.
- **16 px** (`rounded-md`): linha de série (fundo rosa ao concluir), itens de lista selecionáveis dentro de sheets, skeleton.
- **22 px** (`rounded-lg`): cartões, blocos de exercício, `WorkoutRow`, `EmptyState`. O raio padrão de superfície.
- **28 px** (`rounded-xl`): sheets (só no topo no mobile), dock de descanso.
- **Pílula** (`rounded-full`): todos os botões e `IconButton`, chips, segmented, badges, stepper, toasts, `DayBadge`, dias do `WeekStrip`, barras de progresso.

Bordas são raras: hairline `line` em inputs/chips e divisórias internas; tracejado `line-strong` só no `EmptyState`. Colunas de gráfico têm 4 px de arredondamento só na ponta de dados.

**The Nested Radius Rule.** Raio diminui para dentro: cartão 22 → linha 16 → controle 12. Nunca um filho mais arredondado que o pai (exceto pílulas).

## Components

Todos os primitivos vivem em `src/components/ui/*`; componentes de app em `src/components/app/*`. Variantes são props, não classes novas.

### Buttons (`ui/button.tsx`)
- **Shape:** pílula. Alturas sm 36 px, md 48 px (padrão), lg 56 px (CTA de cartão-herói, ações de sessão).
- **Primary:** rosa cheio, tinta rosa, brilho rosa; hover `rose-strong`.
- **Secondary:** `surface-2` → `surface-3` no hover. Para ações neutras em sheets e menus.
- **Soft:** `rose-soft` com texto rosa: ação relacionada à primária mas não principal ("+ Exercício").
- **Ghost:** texto `text-2`, fundo `surface-2` só no hover: cancelar, "Continuar treinando", "Pronto".
- **Outline:** hairline forte; uso raro.
- **Danger:** `danger-soft` com texto `danger`; isolado no fim de sheets após uma divisória.
- **Estados:** `active:scale(.97)`, desabilitado a 45% de opacidade, `loading` troca o ícone por `Spinner` e seta `aria-busy`. Prop `href` renderiza `Link` com o mesmo visual; `block` ocupa a largura; `icon` à esquerda.
- **IconButton:** círculo de 44 px (md) ou 36 px (sm), `aria-label` obrigatório; variantes ghost/secondary/primary/soft.

### Chips, Segmented e Badges (`ui/chip.tsx`)
- **Chip:** pílula de 36 px, `surface` com hairline e `text-2`; ativo vira rosa cheio sem borda (`aria-pressed`). Para filtros em linha rolável.
- **Segmented:** trilho `surface-2` com 4 px de respiro; opção selecionada é `surface` + sombra 1 + `text`. Para alternar a métrica de um mesmo gráfico/lista (`radiogroup`).
- **Badge:** pílula de 24 px, 12 px bold, tons neutral/rose/lilac/mint/peach/danger, sempre Soft Twin.

### Cards / Containers (`ui/card.tsx`)
- **Card:** `surface`, 22 px, sem borda nem sombra; `interactive` adiciona hover/active `surface-2`. Padding é do chamador: `p-4` padrão, `p-5` para o cartão-herói.
- **Section:** título Bricolage `text-lg bold` + ação opcional à direita (link lilás `text-sm font-semibold`), 32 px entre seções.
- **Linha navegável** (`WorkoutRow`, `QuickLink`): cartão `p-4` com conteúdo à esquerda e `ChevronRight` `text-3` ou ícone em círculo `*-soft` de 40 px.

### Inputs / Fields (`ui/field.tsx`, `ui/stepper.tsx`)
- **Style:** `surface-2`, hairline `line`, 12 px, altura 48 px, texto 16 px; rótulo `text-sm semibold text-2` acima, dica `text-xs text-3` abaixo. `suffix` (ex.: "kg") à direita em `text-3`.
- **Focus:** borda passa a rosa (sem halo); hover `line-strong`.
- **Error:** borda e mensagem em `danger`, `aria-invalid` + `aria-describedby` ligados pelo `FieldWrap`.
- **Textarea / Select:** mesmo controle; textarea mínimo 112 px.
- **Stepper:** pílula `surface-2` de 48 px com botões −/+ de 48 px e valor tabular `aria-live`. Para ajustes discretos (meta semanal, descanso padrão).

### Sheets (`ui/sheet.tsx`)
- Bottom sheet em `<dialog>` nativo (foco preso, Esc, clique no backdrop fecha). `bg-elev`, topo 28 px, alça de 40×4 px no mobile, título `text-xl bold` + botão fechar circular `surface-2`; corpo rola, `footer` opcional com hairline. A partir de `sm` vira diálogo centrado de até 32rem. `tall` fixa 92dvh.
- **ConfirmSheet:** mensagem + ação cheia (rosa, ou `danger` cheio quando destrutiva) + "Cancelar" ghost. Toda ação irreversível passa por aqui.
- Menus de contexto (opções do exercício, tipo de série, opções do treino) são sheets com uma pilha de botões `secondary` e, no fim, `danger` após divisória.

### Feedback (`ui/toast.tsx`, `ui/misc.tsx`, `ui/spinner.tsx`)
- **Toast:** pílula no topo, `surface-3` (neutro), `mint` (sucesso) ou `danger` (erro), sombra 2, `anim-rise`; ação opcional sublinhada ("Desfazer") estende a duração para 6 s. Máximo 3 empilhados.
- **EmptyState:** cartão tracejado, ícone em círculo `rose-soft` de 56 px, título, texto `text-2`, ação.
- **Skeleton:** shimmer `surface` → `surface-2`, raio 16 px; use a mesma altura do conteúdo final.
- **Stat:** número Bricolage tabular `text-2xl bold` + rótulo `text-xs text-3`.
- **DayBadge:** letra do dia em Bricolage extrabold sobre círculo da cor do dia a 18% (sm 28, md 40, lg 56 px).

### Navigation (`app/app-shell.tsx`)
- **Barra inferior:** 5 abas (Início, Fichas, Treinar, Progresso, Perfil), `bg-elev/95` + blur, hairline no topo. Ícone Lucide 22 px + rótulo 11 px semibold; ativa em rosa com traço 2.4, inativa `text-3`.
- **FAB Treinar:** círculo rosa de 56 px elevado 24 px acima da barra, anel de 4 px na cor do fundo, brilho rosa.
- **Pílula de treino ativo:** rosa cheio flutuando acima da barra com ponto pulsante, nome e cronômetro tabular; some no Início, na sessão e no editor.
- **PageHeader:** título display (`text-3xl`) ou, com `back`, `BackButton` circular de 44 px + título `text-2xl`; subtítulo `text-sm text-2`; ações à direita.

### Charts (`app/charts.tsx`)
SVG puro, série única, cor pela marca e texto sempre em tokens de texto.
- **LineChart:** linha de 2 px, área com lavagem de 16% → 2%, pontos de 3 px com anel `surface` (até 24 pontos), ponto final de 5 px, grade hairline `line`, rótulos 10 px `text-3`; crosshair `line-strong` + tooltip `surface-3` no hover/toque.
- **ColumnChart:** colunas de até 24 px com ponta arredondada de 4 px; a última semana em cor cheia e as demais a 45% (`highlightLast`).
- **BarList:** barras horizontais de 12 px com ponta arredondada, valor tabular na ponta; padrão lilás.
- **Cor:** rosa para métricas de treino/carga, lilás para corpo/cardio/volume por músculo. Recuperação usa menta/lilás/pêssego por faixa (pronto / quase / recuperando).

### Set Row e Rest Dock (assinatura, `app/session/*`)
A superfície que define o produto. O bloco de exercício é um cartão com miniatura de 64 px (blush + GIF multiplicado, botão "i" de execução), badges, nome em Figtree bold 17 px, meta e descanso em `text-xs text-3`, e o menu `…`.
- **Cabeçalho da tabela:** `SÉRIE · ANTERIOR · KG · REPS` em label XS maiúsculo `text-3`.
- **Linha de série:** grade fixa; marcador de tipo (círculo 32 px: número em `surface-2`, aquecimento pêssego, drop lilás, falha vermelho; toque abre o sheet de tipo), "anterior" `text-3` tabular, dois inputs de 48 px `surface-2` com placeholder do último treino, e o check de 48 px.
- **Estado feito:** a linha inteira ganha `rose-soft` (16 px), os inputs perdem o fundo, o check vira rosa cheio com traço 3 e faz `anim-pop` (280 ms). Exercício todo feito: badge menta "Feito" e cartão a 80% de opacidade.
- **Cabeçalho da sessão:** sticky com blur, nome, cronômetro e `feitas/total séries` tabulares, "Finalizar" primário sm, e barra de progresso rosa de 4 px.
- **Dock de descanso (`RestBar`):** fixo no rodapé, `surface-3`, 28 px, sombra 2, `anim-rise`; o progresso preenche da esquerda em `rose-soft`; cronômetro Bricolage `text-3xl extrabold` (vira rosa em "Bora, próxima série!"), botões −15/+15 em pílulas `surface-2` de 48 px e pular em círculo rosa de 48 px.

### Construindo uma nova tela (receita)
Toda tela nova estende o sistema; não cria um.

1. **Moldura:** coloque a rota em `src/app/(app)/` para herdar `AppShell` (gutter, nav, safe areas). Telas de foco total (como `/treino`) ficam fora e reproduzem só o cabeçalho sticky com blur.
2. **Topo:** `PageHeader` (`title`, `subtitle`, `back`, `actions`). Ações de cabeçalho são `IconButton` ou um link-pílula `surface` `h-10`.
3. **Corpo:** uma pilha de `Section` (título + ação lilás opcional), cada uma com `Card` `p-4`. Listas: pilha `gap-2` de linhas navegáveis em `Card`/`Link` `p-4`. Pares de atalhos: `grid-cols-2 gap-3`.
4. **Ação principal:** no máximo um `Button` primário por contexto, `size="lg" block` quando for o CTA do cartão. Demais ações: `secondary`, `soft` ou `ghost`.
5. **Dados:** números com `Stat` ou `font-display tabular`; séries temporais com `LineChart`/`ColumnChart`; rankings com `BarList`; alternância de métrica com `Segmented` acima do gráfico.
6. **Estados:** carregando = `Skeleton` com a altura final; vazio = `EmptyState` com ação; erro e confirmação = `useToast()`; status = `Badge` no tom de papel fixo.
7. **Entrada de dados:** `Input`/`Textarea`/`Select` (com `label`, `hint`, `error`), `Stepper` e `Switch` (configuração liga/desliga, trilho rosa quando ligado, sempre numa linha com título e explicação); filtros com `Chip`; tudo que é secundário ou destrutivo vai para um `Sheet`/`ConfirmSheet`, não para uma nova página.
8. **Identidade de dia:** qualquer referência a um dia da ficha usa `DayBadge` + `dayLetter()`.
9. **Movimento:** só `anim-pop` (confirmação), `anim-rise` (algo entra flutuando), `anim-sheet`, com `--ease-out`. Nada de entrada coreografada de página.
10. **Antes de inventar:** se faltar uma peça, adicione uma variante ao primitivo existente (`ui/*`) ou um token em `globals.css` (três blocos de tema + `@theme inline`). Componente novo só quando o padrão se repete em duas telas.

## Do's and Don'ts

### Do:
- **Do** usar só classes do tema (`bg-surface`, `text-text-2`, `bg-rose-soft`, `rounded-lg`); todo valor de cor vem de `globals.css`.
- **Do** manter uma única ação rosa cheia por contexto (The One Rose Rule) e usar `soft`/`secondary`/`ghost` para o resto.
- **Do** elevar por degrau tonal (`surface` → `surface-2` → `surface-3`) e reservar sombra 2 para sheet, dock, toast e tooltip.
- **Do** manter alvos de toque ≥ 44 px (botões md 48, linha de série 48, FAB 56) e inputs com 16 px de texto.
- **Do** escrever todo número legível com `tabular`, e os números-protagonistas em `font-display`.
- **Do** usar o par `-soft` de fundo + cor cheia de texto para badges, avisos e ícones em círculo.
- **Do** testar toda tela nova nos dois temas (`data-theme="light"`) e com `prefers-reduced-motion`.
- **Do** escrever a interface em português brasileiro informal, tratando por "você", com vocabulário de academia (série, carga, ficha, treino A).

### Don't:
- **Don't** colocar hex cru, `text-white` ou cores do Tailwind padrão (`bg-pink-500`) em componentes.
- **Don't** usar lilás, pêssego, menta ou vermelho como cor de ação, nem trocar seus papéis entre telas.
- **Don't** usar as cores `day-*` fora do `DayBadge`.
- **Don't** adicionar bordas ou sombras a cartões para separá-los; espaço e degrau tonal já fazem isso.
- **Don't** usar Bricolage em texto corrido, rótulos ou nomes de exercício; nem Figtree em números-protagonistas.
- **Don't** criar raios fora da escala (12/16/22/28/pílula) nem aninhar um filho mais arredondado que o pai.
- **Don't** adicionar gradientes decorativos, glassmorphism em cartões, ilustrações ou animações de entrada de página; o blur é só da navegação e do cabeçalho fixo.
- **Don't** criar feed social, ranking ou pressão gamificada na UI; progresso é pessoal.
