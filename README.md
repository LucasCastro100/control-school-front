# Control Schools

Sistema web para gerenciamento de escolas, turmas, salas, alunos, horários, itens (tapetes/tecnologias) e TBR (times por categoria).

> Controle completo de unidades escolares com suporte a múltiplos anos letivos.

## Funcionalidades

- **Escolas** — cadastro com endereço, região/estado/cidade, cor, orientador vinculado e equipes TBR
- **Ano Letivo** — cada escola pertence a um ano; filtro por ano em todas as listagens (horários, itens)
- **Turmas** — organizadas por NAP (1 a 4), com anos correspondentes (Infantil, Fundamental, Médio)
- **Salas** — vinculadas a turmas
- **Alunos** — cadastro por sala com nome e matrícula
- **Horários** — grade semanal por turma/sala com disciplina, professor e horário
- **Itens** — cadastro de tapetes e tecnologias, vínculo com NAPs e quantidades por escola
- **Orientadores** — cadastro com região/estado/cidade
- **TBR** — categorias e times vinculados a escolas
- **Horário Geral** — visão consolidada de todas as escolas

## Stack

| Tecnologia | Versão |
|---|---|
| Next.js (App Router) | 16 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| shadcn/ui + Base UI | — |

## Como usar

Requisitos: backend Laravel rodando (repo `control-school-back`).

```bash
# .env.local
BACKEND_URL=http://localhost:8000

pnpm install
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Login

| Email | Senha |
|---|---|
| lucascastro121295@gmail.com | mudar123 |

## Persistência

Todos os dados ficam no backend **Laravel** (`control-school-back`), acessado via proxy Next (`/api/backend/*`). Autenticação por token Sanctum em cookie HttpOnly `session_token`.
