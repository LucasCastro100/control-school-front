# Memória do Projeto — Control School

> Última atualização: 2026-09-18
> Gerida pela skill `.opencode/skills/project-memory/SKILL.md`. Leia ao iniciar, atualize ao terminar.

---

## Visão geral

Sistema multi-escolar de gestão pedagógica: escolas, turmas (NAPs segmentados por ano), salas (com `student_count` — **não existe entidade "aluno" separada**), horários (semanal/quinzenal), orientadores, itens pedagógicos (tapetes/tecnologias) por NAP, agenda e TBR (championships).

Stack atual:
- **`front/`** — Next.js **16.2.9** (App Router, Breaking changes vs 15), React 19, Tailwind v4, TypeScript, lucide-react, shadcn/base-ui. Camada de dados em `front/src/lib/db/*`.
- **`back/`** — Laravel **13.17** API-only, PHP 8.4, Sanctum, SQLite em `back/database/database.sqlite`.

---

## Fase atual (EM ANDAMENTO — 2026-09-18)

**Migração do frontend: remover Supabase → integrar backend Laravel.** Usuário aprova a abordagem "Ligar ao backend Laravel (Recomendado)". O erro que o usuário viu: `AuthRetryableFetchError: fetch failed` (status 0) porque o projeto Supabase está inacessível.

O que JÁ mudou (feito nesta sessão, backend completo):
- Backend Laravel criado, testado (11/11 testes), com 77 rotas `auth:sanctum`.
- Seed: admin `lucascastro121295@gmail.com` / `mudar123` (role `admin`) + categorias TBR.

O que AINDA falta (front) — ordem recomendada:
1. ✅ **(planejado, não implementado)** criar `front/src/lib/backend.ts` (helper `api()`) e proxy `front/src/app/api/backend/[...path]/route.ts` (repassa para `${BACKEND_URL}/api/...` com Bearer do cookie `session_token` HttpOnly).
2. Reescrever `front/src/lib/db/*` (auth, schools, users, classes, rooms, schedules, orientador-schedules, segment-configs, items, nap-items, agenda, tbr) para usar o proxy, **preservando as assinaturas da barrel `src/lib/db/index.ts`** e mapeando snake_case→camelCase com `toCamel`.
3. Atualizar `front/src/app/api/auth/{login,logout,session}/route.ts` para proxy ao Laravel (login devolve `{token, user}` → cookie; session valida; logout revoga token).
4. Simplificar `src/middleware.ts` e remover `src/utils/supabase/middleware.ts` — checar **presença** do cookie `session_token` (sem JWT).
5. Remover Supabase: deps `@supabase/ssr` + `@supabase/supabase-js` (+ `bcryptjs`, `jose` e `@types/bcryptjs`) do `front/package.json`; apagar `src/lib/supabase.ts`, `src/utils/supabase/`, `src/lib/auth/jwt.ts`, `src/lib/auth/crypto.ts`; limpar usos diretos em `front/src/app/(dashboard)/advisors/page.tsx` e `front/src/app/reset-password/page.tsx`.
6. `.env.local` do front: remover `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`; adicionar `BACKEND_URL` (ex.: `http://localhost:8000`). Criar `.env.example` se necessário.
7. Backend: relaxar `UserController::rules()` (name/email/role → `sometimes`) para updates parciais do front; rodar `php artisan test`.
8. Validation: `pnpm exec tsc --noEmit`, `pnpm lint`, smoke test `pnpm dev` (3000) + `php artisan serve` (8000).
9. Docs: atualizar `front/AGENTS.md`, `README.md`, skill `control-school-context`.

---

## Arquitetura

### Fluxo de dados (depois da migração)
```
Browser → fetch('/api/backend/<path>') → Route Handler Next (adds Bearer do cookie) 
        → Laravel `back` http://localhost:8000/api/<path> (snake_case JSON)
```
- Token Sanctum fica só no cookie HttpOnly `session_token` → nunca no JS.
- Proxy evita CORS no browser (back já tem CORS p/ localhost:3000, mas o proxy dispensa expor tudo).

### Auth (após migração)
- `front/src/lib/db/auth.ts`: `login()` chama `POST /api/auth/login` (Next) → proxeia Laravel `/api/auth/login` (`{token, user}`) → cookie.
- `logout()` → `/api/auth/logout` (Next) → revoga token no Laravel + apaga cookie.
- `getSession()` → `GET /api/auth/session` → Laravel `/api/auth/session` retorna o `User`.
- `resetPassword()` → retorna "Funcionalidade desabilitada" (manter).
- `updatePassword`/`updateProfile` → pegam userId da sessão, chamam `PUT /api/users/{id}`.

### Backend (Laravel 13)
- API-only: sem Blade (resources/ removido), sem Vite. `bootstrap/app.php` só rotas `api` + `/up` (health).
- UUIDs como PK em todas as tabelas (models `HasUuids`).
- SQLite com `PRAGMA foreign_keys = ON` via listener `ConnectionEstablished` no `AppServiceProvider` (Laravel 13 **não aceita Closure em `withEvents()`**).
- CORS config publicado: origins `http://localhost:3000` e `127.0.0.1:3000`, paths `api/*`.
- Pint (`vendor/bin/pint`) para estilo. Testes em `back/tests/Feature/ApiTest.php`.

### Schema (14 tabelas, back)
`users` (uuid, role), `schools`, `classes` (tabela **`classes`**), `rooms` (student_count), `schedules` (sem timestamps, fortnight), `orientador_schedules` (year), `segment_configs` (year), `items` (naps json cast array), `nap_items` (segment_name/year/quantity), `agenda` (tabela **`agenda`**), `tbr_categories`, `tbr_teams` (school/category/name), pivôs `user_schools` e `agenda_orientadores`, + `personal_access_tokens` (Sanctum).

### Front (Next 16)
- `src/lib/db/index.ts` = barrel de TODAS as funções CRUD usadas pelas páginas (nomes devem ser preservados).
- `src/lib/helpers.ts`: `generateId()`, `toCamel()`, `toSnake()`.
- `src/lib/types.ts`: interfaces `School`, `User`, `AuthUser`, `Class`, `Room`, `Schedule`, `OrientadorSchedule`, `AgendaItem`, `SegmentConfig`, `Item`, `NapItem`, `TbrCategory`, `TbrTeam` — todas camelCase.
- `src/lib/auth/`: cookies.ts (cookie `session_token` HttpOnly 24h) — **manter**; jwt.ts + crypto.ts — **remover**.
- Middleware global `src/middleware.ts` (matcher amplo) — **simplificar**.

---

## Gotchas / Decisões (IMPORTANTE)

1. **Next 16 ≠ Next 15**: ler docs em `front/node_modules/next/dist/docs/` antes de codar. `params` em route handlers/pages é **Promise** → `const { path } = await params`. Usar `RouteContext<'/api/...'>` se quiser tipar. `cookies()` é async.
2. **`laravel new --api` NÃO existe** no Laravel Installer 5.31.1. Equivalente usado: `laravel new back --no-authentication --no-node --database=sqlite --quiet` + `php artisan install:api`.
3. **Binding de rota Laravel**: `apiResource('classes')` gera parâmetro `{class}` → o controller usa `$class`. Nome do parâmetro precisa casar com a rota.
4. Tabela do modelo `Agenda` é `agenda` e a do `SchoolClass` é `classes`.
5. Usuário corrigiu: **admin real** é `lucascastro121295@gmail.com` (`admin@gmail.com` é obsoleto do Supabase).
6. Backend responde **snake_case**; o front converte para camelCase com `toCamel`.
7. `SchoolController::store` **não cria usuário escola** automaticamente (só insere a escola). Vínculo escola↔usuário é via pivot `user_schools` (endpoints `/users/{user}/schools`).
8. `items.naps` é JSON (array) no back; o front deve mandar array e ler array (cast no model).
9. `.env.local` do front ainda tem chaves Supabase — **remover** (segredos expirados/válidos: ver Fase atual).
10. AGENTS.md/front e README ainda descrevem Supabase/localStorage — desatualizado, atualizar no fim.

---

## Credenciais & dev

- Admin back: `lucascastro121295@gmail.com` / `mudar123` (bcrypt, seed `DatabaseSeeder`).
- Senha padrão de usuários criados pelo front: `mudar123`.
- Backend dev: `cd back && php artisan serve` → http://localhost:8000
- Front dev: `cd front && pnpm dev` → http://localhost:3000

---

## Journal

- **2026-09-18 — Sessão atual (em andamento):**
  - Criado backend Laravel completo (ver Fase atual/Arquitetura) com 14 tabelas, 13 controllers Api, 77 rotas sanctum, seed admin+TBR, CORS, testes 11/11 passando.
  - Iniciada migração do front Supabase→Laravel (proxy Next + reescrita `db/*`). **NÃO concluída.** Próximos passos detalhados na seção "Fase atual".
  - Criada skill `project-memory` + este arquivo de memória.
- **Antes (front original):** Next.js + Supabase (banco e Auth via tabela `users`), login com JWT próprio (jose) em cookie `session_token`, dados em `src/lib/db/*` via client Supabase. Projeto Supabase caiu/inacessível → motivou a migração para o backend Laravel.