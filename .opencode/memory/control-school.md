# Memória do Projeto — Control School

> Última atualização: 2026-09-19
> Gerida pela skill `.opencode/skills/project-memory/SKILL.md`. Leia ao iniciar, atualize ao terminar.

---

## Visão geral

Sistema multi-escolar de gestão pedagógica: escolas, turmas (NAPs segmentados por ano), salas (com `student_count` — **não existe entidade "aluno" separada**), horários (semanal/quinzenal), orientadores, itens pedagógicos (tapetes/tecnologias) por NAP, agenda e TBR (championships).

**Projeto SPLITADO em 2 repositórios** (2026-09-19):
- `control-school-front` — Next.js 16.2.9 (App Router, React 19, Tailwind v4), GitHub público: `LucasCastro100/control-school-front`. Este repo.
- `control-school-back` — Laravel 13.17 API-only (PHP 8.4, Sanctum, SQLite), GitHub público: `LucasCastro100/control-school-back`.
- O monorepo antigo `control-school` foi **movido para a Lixeira** (`~/.Trash/control-school-monorepo-20260918-230307`). O GitHub remoto antigo `LucasCastro100/control-school` fica **1 commit atrás** (não foi pusheado o commit da migração) — manter só como arquivo/referência.
- **Vercel**: precisa ser reconfigurada apontando para o novo repo `control-school-front`; env `BACKEND_URL` deve apontar para o Laravel publicado.

---

## Arquitetura (front)

```
Browser → fetch('/api/backend/<path>')            (helper api() em src/lib/backend.ts)
        → src/app/api/backend/[...path]/route.ts  (adds Authorization: Bearer do cookie session_token)
        → ${BACKEND_URL}/api/<path>               (Laravel, JSON snake_case)
```

- Token Sanctum fica **só no cookie HttpOnly `session_token`** (24h, `src/lib/auth/cookies.ts`) → nunca no JS.
- Auth routes do Next proxeiam o Laravel: `src/app/api/auth/{login,logout,session}/route.ts`. Login devolve `{token, user}` → cookie; session valida no Laravel; logout revoga token best-effort + apaga cookie.
- `src/proxy.ts` — **Next 16 renomeou `middleware.ts` → `proxy.ts`** (deprecation warning). Redireciona p/ `/login` se não houver cookie em rotas protegidas.
- Camada de dados `src/lib/db/*`, barrel `src/lib/db/index.ts` (funções usadas pelas páginas). Backend snake_case → `toCamel()` (`src/lib/helpers.ts`).
- Backend `User` model tem cast `'password' => 'hashed'` → senha vai em texto puro. `School` model **sem** esse cast — senha fica texto (pass-through).
- `.env.local` (criar): `BACKEND_URL=http://localhost:8000`. Nenhuma chave pública/secret.

---

## Backend (Laravel 13) — resumo

- API-only (resources/ removido, sem Vite). UUIDs PK (`HasUuids`). 14 tabelas + pivôs + Sanctum.
- SQLite `PRAGMA foreign_keys = ON` via listener `ConnectionEstablished` no `AppServiceProvider` (Laravel 13 **não aceita Closure em `withEvents()`**).
- CORS origins `localhost:3000`/`127.0.0.1:3000`, paths `api/*`.
- 77 rotas `auth:sanctum`; testes `php artisan test` 11/11.
- Seed: admin `lucascastro121295@gmail.com` / `mudar123` + categorias TBR.
- **Validação relaxada p/ updates parciais**: `UserController::updateRules()` e `SchoolController::update` usam `sometimes` (name/email/role etc.) — permitido vindo do front.

---

## Gotchas / Decisões (IMPORTANTE)

1. **Next 16 ≠ Next 15**: ler docs em `node_modules/next/dist/docs/` antes de codar. `params` em route handlers é **Promise** → `await params`. `cookies()` async. `middleware` → `proxy.ts`.
2. **`laravel new --api` NÃO existe** (Installer 5.31.1). Usado: `laravel new back --no-authentication --no-node --database=sqlite --quiet` + `php artisan install:api`.
3. **Binding de rota Laravel**: `apiResource('classes')` → parâmetro `{class}` → controller usa `$class`. Nome do parâmetro precisa casar com a rota.
4. Tabela `Agenda` → `agenda`; `SchoolClass` → `classes`.
5. Admin real: `lucascastro121295@gmail.com` (`admin@gmail.com` é obsoleto).
6. `SchoolController::store` **não cria usuário escola** nem vínculo no pivô `user_schools` (gap; decisão posterior). Vínculo p/ role `escola` via `/users/{user}/schools`.
7. `items.naps` é JSON array no back (cast no model) — front manda/lê array.
8. `getSegmentConfig(schoolId, segmentName)`: back não filtra por `segment_name` → filtro client-side (fetch school_id + `find`).
9. **PENDENTE**: `DELETE /api/schools/{id}` retorna **500** (durante smoke test) — investigar (provável constraint no pivot/agenda). Criar escola, PATCH parcial, GET e DELETE de school via proxy = testado.
10. Dica: para rodar back e front ao mesmo tempo como "2 projetos": `opencode` a partir de cada repo, ou `php artisan serve` (back) + `pnpm dev` (front).

---

## Credenciais & dev

- Admin back: `lucascastro121295@gmail.com` / `mudar123` (bcrypt, seed `DatabaseSeeder`).
- Senha padrão de usuários criados pelo front: `mudar123`.
- Backend dev: `cd control-school-back && php artisan serve` → http://localhost:8000
- Front dev: `cd control-school-front && pnpm dev` → http://localhost:3000
- Front: `pnpm lint`, `pnpm exec tsc --noEmit` (lint tem 6 erros pré-existentes `react-hooks/set-state-in-effect` em páginas não relacionadas).

---

## Journal

- **2026-09-18 → 19 — Migração completa + split do projeto:**
  - Backend Laravel criado (14 tabelas, 13 controllers Api, 77 rotas sanctum, seed admin+TBR, CORS, testes 11/11).
  - Front migrado de Supabase → Laravel: helper `api()` + proxy `/api/backend/**`, `db/*` reescrito (assinaturas preservadas), auth routes proxeadas, `middleware.ts` → `proxy.ts`, Supabase/JWT/bcrypt removido de deps e arquivos, `.env.local` só com `BACKEND_URL`.
  - Smoke test ponta-a-ponta OK (login → session → proxy CRUD; 401 sem cookie; PATCH parcial funciona). Pendente: delete school 500.
  - Relaxada validação de update (UserController updateRules + SchoolController update).
  - **Split**: repo criado no GitHub (públicos) `control-school-front` (histórico via `git subtree split --prefix=front`, 43 commits) e `control-school-back` (histórico novo). Monorepo antigo movido p/ Lixeira.
  - Criadas skill `project-memory` + memória; skill `ultra-modern-ui` (design conventions do front).
  - **Próximo:** investigar DELETE school 500; configurar Vercel com o novo repo + env BACKEND_URL; deploy do back.
- **Antes (front original, pré-split):** localStorage → Supabase (banco + Auth via tabela `users`, JWT próprio jose em cookie) → projeto Supabase caiu → migração p/ Laravel.