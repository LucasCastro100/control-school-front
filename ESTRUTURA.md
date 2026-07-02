# Estrutura do projeto — Control Schools

> Guia de referência: o que cada arquivo faz, com foco em `lib/` (dados e
> hook de cabeçalho) e nas rotas em `app/`.

## Índice

1. [Visão geral](#1-visão-geral)
2. [Árvore de pastas](#2-árvore-de-pastas)
3. [`src/lib/` — dados e lógica compartilhada](#3-srclib--dados-e-lógica-compartilhada)
   - [3.1 `types.ts`](#31-typests)
   - [3.2 `db.ts`](#32-dbts)
   - [3.3 `page-header.tsx` (hook)](#33-page-headertsx--hook-de-cabeçalho)
   - [3.4 `brazil-data.ts`](#34-brazil-datats)
   - [3.5 `ibge-api.ts`](#35-ibge-apits)
   - [3.6 `utils.ts`](#36-utilsts)
4. [`src/app/` — rotas](#4-srcapp--rotas)
5. [`src/components/`](#5-srccomponents)
6. [Fluxo de dados de ponta a ponta](#6-fluxo-de-dados-de-ponta-a-ponta)

---

## 1. Visão geral

| Item | Detalhe |
|---|---|
| Stack | Next.js (App Router) + React + TypeScript + Tailwind |
| Backend | **Não existe.** Sem API, sem banco de dados |
| Persistência | `localStorage` do navegador, via `src/lib/db.ts` |
| Implicação | Dados ficam presos ao navegador/máquina; não são compartilhados entre usuários |
| Autenticação | Fake — usuário/senha fixos, checados em `login()` (`db.ts`) |

---

## 2. Árvore de pastas

```
front/src/
├── app/
│   ├── layout.tsx                 # layout raiz (fonte, <html>, TooltipProvider)
│   ├── page.tsx                   # "/" → redirect("/schools")
│   ├── login/page.tsx             # tela de login
│   └── (dashboard)/
│       ├── layout.tsx             # guarda de sessão + sidebar + header
│       ├── schools/page.tsx       # CRUD de escolas
│       ├── orientadores/page.tsx  # CRUD de orientadores
│       ├── items/page.tsx         # CRUD de itens (tapetes/tecnologias)
│       ├── all-schedules/page.tsx # horários de todas as escolas
│       └── schools/[id]/...       # turmas → salas → alunos, horários
├── components/
│   ├── app-sidebar.tsx            # menu lateral
│   └── ui/*                       # primitivas de UI (Button, Dialog, Table, SearchableSelect...)
└── lib/
    ├── types.ts                   # interfaces/"tabelas"
    ├── db.ts                      # CRUD + persistência em localStorage
    ├── page-header.tsx            # hook usePageHeader + provider
    ├── brazil-data.ts             # lista de regiões do Brasil
    ├── ibge-api.ts                # fetch de estados/municípios (API do IBGE)
    └── utils.ts                   # helper cn() (classes Tailwind)
```

---

## 3. `src/lib/` — dados e lógica compartilhada

### 3.1 `types.ts`

Só interfaces TypeScript — não gera código, só contratos de tipo. Cada
interface funciona como uma "tabela"; relacionamentos são feitos por campos
`xxxId`.

| Entidade | Campos principais | Relaciona com |
|---|---|---|
| `School` | name, address, region, state, city, color, `orientadorId` | → `Orientador` |
| `Orientador` | name, region, state, city | — |
| `Class` | name, nap, `schoolId` | → `School` |
| `Room` | name, `classId` | → `Class` |
| `Student` | name, registrationNumber, `roomId` | → `Room` |
| `Schedule` | dayOfWeek, startTime, endTime, subject, teacher, `classId`, `roomId` | → `Class`, `Room` |
| `SegmentConfig` | segmentName, tapetes, kits, `schoolId` | → `School` |
| `Item` | name, category, naps | — |
| `NapItem` | segmentName, quantity, `schoolId`, `itemId` | → `School`, `Item` |
| `AuthUser` | email, name | — |

### 3.2 `db.ts`

O "banco de dados" da aplicação — tudo client-side, sem schema/validação.

**Base interna**
- `STORAGE_KEYS`: uma chave de `localStorage` por entidade (ex.:
  `control-schools:schools`, `control-schools:orientadores`).
- `getItems<T>(key)` / `setItems<T>(key, items)`: lê/escreve um array JSON no
  `localStorage`. Toda função pública é construída em cima dessas duas.

**Padrão repetido por entidade**

Para (quase) toda entidade existem as mesmas 4 funções:

| Função | O que faz |
|---|---|
| `getX()` | lista tudo (opcionalmente filtrado por um id pai, ex. `getClassesBySchool`) |
| `createX(data)` | gera `id` (`crypto.randomUUID()`) e `createdAt`, salva |
| `updateX(id, data)` | merge parcial no registro existente |
| `deleteX(id)` | remove; em alguns casos faz cascata manual |

**Cascatas de exclusão** (o ponto mais importante para não deixar dado
"órfão"):
- `deleteSchool`: apaga também turmas, salas, alunos, horários,
  `segmentConfigs` e `napItems` daquela escola.
- `deleteOrientador`: remove o registro e limpa o `orientadorId` de qualquer
  escola que apontava para ele.
- `deleteClass` / `deleteRoom` / `deleteItem`: cascata equivalente para
  salas/alunos/horários ou nap-items dependentes.

**Autenticação fake**
- `login(email, password)`: só aceita `admin@gmail.com` / `mudar123`;
  grava um `AuthUser` em `localStorage`.
- `logout()` / `getAuthUser()`: remove / lê esse mesmo registro.

Nada aqui valida schema ou tipo em runtime — é chamado direto pelos
componentes de página (`"use client"`), que já usam os tipos de `types.ts`.

### 3.3 `page-header.tsx` — hook de cabeçalho

Único hook customizado do projeto. Resolve o problema de "cada página tem um
título e botões diferentes no cabeçalho, mas o cabeçalho em si vive no
layout, fora da página".

| Peça | Papel |
|---|---|
| `PageHeaderContext` | React Context guardando `{ left, right, setHeader }` |
| `PageHeaderProvider` | guarda `left`/`right` (nodes React) em `useState`; expõe `setHeader` via `useCallback` memoizado |
| `usePageHeader()` | hook para **ler** `left`/`right` (usado pelo `Header` do layout) ou **escrever** (`setHeader(...)`, chamado no `useEffect` de cada página) |

**Fluxo:**
```
DashboardLayout
  └─ <PageHeaderProvider>
        ├─ <Header/>            → lê left/right do contexto e renderiza
        └─ página filha          → chama setHeader(titulo, botão) no useEffect
```
Isso evita que cada página precise desenhar sua própria barra de título —
ela só "empurra" o conteúdo para o contexto.

### 3.4 `brazil-data.ts`

Só a constante `REGIONS` (Norte, Nordeste, Centro-Oeste, Sudeste, Sul),
usada para popular o primeiro select da cascata Região → Estado → Cidade.

### 3.5 `ibge-api.ts`

Duas chamadas à API pública do IBGE — a única chamada de rede "de verdade"
do sistema (só para preencher selects, não para guardar dado do app):

| Função | O que faz |
|---|---|
| `fetchStatesByRegion(regionName)` | mapeia nome da região → id numérico do IBGE, busca os estados dessa região |
| `fetchCitiesByState(uf)` | busca os municípios de um estado (sigla) |

Usadas nos formulários de Escola e Orientador.

### 3.6 `utils.ts`

Um único helper:
```ts
cn(...inputs) // clsx(inputs) + tailwind-merge
```
Junta classes do Tailwind evitando conflito (padrão comum em projetos
shadcn/ui). Usado em praticamente todo componente de `components/ui`.

---

## 4. `src/app/` — rotas

| Rota / arquivo | Função |
|---|---|
| `app/layout.tsx` | layout raiz do Next: fonte (Nunito), `<html>`/`<body>`, `TooltipProvider` global |
| `app/page.tsx` | `/` → `redirect("/schools")` |
| `app/login/page.tsx` | tela de login (chama `login()` de `lib/db.ts`; sem sessão real) |
| `(dashboard)/layout.tsx` | confere `getAuthUser()` (sem usuário → `/login`), monta `AppSidebar` e envolve as páginas com `PageHeaderProvider` + `Header` |
| `(dashboard)/schools/page.tsx` | CRUD de escolas: tabela + modal, selects em cascata Região→Estado→Cidade + select de Orientador |
| `(dashboard)/orientadores/page.tsx` | CRUD de orientadores (nome, região, estado, município) — mesmo padrão de escolas, mais simples (sem paginação/estatísticas) |
| `(dashboard)/items/page.tsx` | CRUD de itens (tapetes/tecnologias) e vínculo com escolas por NAP |
| `(dashboard)/schools/[id]/...` | sub-rotas por escola: turmas → salas → alunos, horários |
| `(dashboard)/all-schedules/page.tsx` | visão geral de horários de todas as escolas |

---

## 5. `src/components/`

| Arquivo | Função |
|---|---|
| `app-sidebar.tsx` | menu lateral fixo; array `routes` define os itens de menu (foi aqui que entrou "Orientadores") |
| `ui/*` | primitivas de UI reutilizáveis (Button, Dialog, Table, Input, `searchable-select.tsx` — combobox com busca usado em todos os selects de Região/Estado/Cidade/Orientador). Sem lógica de negócio. |

---

## 6. Fluxo de dados de ponta a ponta

Exemplo com a entidade **Orientador**:

1. Usuário abre `/orientadores` e preenche nome + região/estado/município
   (selects via `SearchableSelect` + IBGE API).
2. Ao salvar, a página chama `createOrientador(...)` (`lib/db.ts`).
3. `createOrientador` lê o array atual do `localStorage`, adiciona o novo
   registro com `id`/`createdAt` gerados, e regrava o array inteiro.
4. A página re-lê `getOrientadores()` e atualiza a tabela.
5. Em `/schools`, o formulário de escola busca `getOrientadores()` para
   popular o select "Orientador" e salva o `orientadorId` escolhido dentro
   do registro da escola.

```
UI (form) → useState local → createX/updateX (lib/db.ts)
   → localStorage (JSON.stringify) → refresh() → getX() → re-render da tabela
```

Não há round-trip de servidor em nenhum passo — tudo é síncrono e roda no
navegador.
