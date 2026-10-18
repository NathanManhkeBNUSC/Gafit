# Gafit

App de treino pessoal (para você e os amigos): sua ficha no celular, registro de cargas e séries, cardio, progresso, recordes, recuperação muscular e demonstração dos exercícios. Inspirado no Befit, com um diferencial: **você traz a sua própria ficha** (montando no app, colando o texto ou mandando foto/PDF da ficha do personal).

## O que tem

- **Fichas** com dias A/B/C…, séries, repetições, descanso, carga inicial e observações. Várias fichas, uma ativa.
- **Importar ficha**: colar texto (“Supino reto 4x10-12”), foto ou PDF (lido por IA), modelos prontos, ou código de um amigo.
- **Treino ao vivo**: próximo dia da sequência, “anterior” de cada série, aquecimento / drop / até a falha, timer de descanso com som e vibração, trocar exercício por outro do mesmo músculo, adicionar/remover/reordenar, bi-sets, tela sempre ligada, salva sozinho (e no aparelho se a internet cair).
- **Cardio** dentro do treino ou avulso (esteira, bike, escada, corrida…).
- **Progresso**: semana e sequência na meta, gráficos semanais, recordes, séries por músculo, recuperação estimada, evolução por exercício (carga, 1RM estimado, volume) e peso corporal.
- **Meta de água diária** calculada pelo seu peso, idade e altura (ajuste de peso quando o IMC passa de 30), somando o treino do dia e clima quente; registro rápido por copo, histórico de 7 dias e meta manual opcional.
- **Biblioteca** de ~1.260 exercícios com GIF de execução (ExerciseDB), nomes em português de academia e busca com gírias (“puxada alta”, “leg 45”, “extensora”…). Dá para criar exercícios próprios.
- **Login por pessoa**, código de convite opcional, compartilhamento de ficha por código.
- **PWA**: instala na tela inicial do celular.

## Stack

Next.js 16 (App Router) · Postgres no Neon · Drizzle ORM · Tailwind 4 · TanStack Query · Vercel.

## Rodar local

```bash
npm install
cp .env.example .env.local   # use DATABASE_URL=pglite:./.data/pglite para não precisar de Postgres
npm run dev
```

Abra http://localhost:3000 e crie sua conta. No modo `pglite` as tabelas são criadas sozinhas.

## Publicar (Neon + Vercel)

1. **Banco**: crie um projeto no [Neon](https://neon.tech) (região São Paulo) e copie a *pooled connection string*.
2. **Tabelas**: no seu computador, com a string do Neon:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
3. **Código**: suba o projeto para um repositório no GitHub.
4. **Vercel**: *Add New → Project*, importe o repositório e configure as variáveis:
   - `DATABASE_URL` (a do Neon)
   - `AUTH_SECRET` (gere com `openssl rand -base64 32`)
   - `INVITE_CODE` (opcional, para só amigos entrarem)
   - `ANTHROPIC_API_KEY` (opcional, para foto/PDF e tradução das instruções)
5. Deploy. Depois, no celular: Chrome → menu → *Instalar app*; iPhone → Compartilhar → *Adicionar à Tela de Início*.

Depois de atualizar o projeto (ex.: a meta de água), rode `npm run db:migrate` de novo para criar as tabelas novas.

Ao mudar o schema (`src/lib/db/schema.ts`): `npm run db:generate` e depois `npm run db:migrate`.

## IA (opcional)

Com `ANTHROPIC_API_KEY`:
- **Foto/PDF da ficha** é lida e vira um rascunho que você revisa antes de salvar.
- **Colar texto com IA** para fichas fora do padrão.
- **Instruções de execução** são traduzidas para português na primeira vez que alguém abre o exercício e ficam guardadas no banco (sem IA, aparecem em inglês).

Custo: centavos por ficha lida; a tradução é paga uma vez por exercício.

## Estrutura

```
src/app/                 páginas (App Router) e API (src/app/api)
src/components/ui/       design system: Button, Card, Field, Chip, Sheet, Stepper, Toast…
src/components/app/      componentes do app: editor de ficha, treino ao vivo, gráficos, biblioteca
src/lib/                 regras (training.ts), busca (search.ts), parser de ficha (parse-plan.ts), tipos
src/lib/server/          serviços: fichas, treinos, progresso, importação, IA
src/lib/db/              schema Drizzle e conexão (Neon ou PGlite)
src/data/exercises.json  catálogo de exercícios (gerado por scripts/build-catalog.py)
DESIGN.md / PRODUCT.md   design system e decisões de produto
```

Os tokens visuais ficam em `src/app/globals.css` (tema escuro padrão + claro); toda tela nova usa os componentes de `src/components/ui`.

## Créditos

Dados e GIFs dos exercícios: [ExerciseDB](https://exercisedb.dev) (API gratuita V1), mídia © Gym visual. Uso pessoal.
