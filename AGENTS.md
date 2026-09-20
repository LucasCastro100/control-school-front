<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Regras de manutenção deste arquivo (obrigatórias)

- **Antes de qualquer alteração**: reler este `AGENTS.md` (e o `AGENTS.md` do `control-school-back` quando o trabalho envolver o backend) — é a fonte de verdade do estado atual.
- **Após cada alteração** (páginas, rotas, componentes, camada de dados `src/lib/db/*`, tipos, config): atualizar este arquivo se algo mudou — comandos, credenciais, arquitetura, convenções, novas rotas/endpoints, pendências.
- **Ao final de cada resposta**: verificar se este arquivo ainda reflete a realidade. Se ficou defasado, corrigir imediatamente antes de responder.
- Manter a seção **Pendências / Próximos passos** sempre atualizada: remover o que foi concluído e adicionar o que estiver em aberto.

## Pendências / Próximos passos

- (manter atualizado) Validação cross-projeto: rode `pnpm exec tsc --noEmit` + `pnpm lint` no front e `php -l` + testes de endpoints no back.

## Histórico de mudanças recentes

- Tooltip de ações (`ActionTooltip`, `src/components/ui/action-tooltip.tsx`): aplicado nas ações das tabelas de usuários, escolas, cargos, categorias TBR, itens, turmas, salas, horários, contas e equipes.
- Modal de turma (`/schools/[id]/classes`): campo "Identificador da Turma" **removido**. O nome da turma agora é derivado automaticamente do Ano selecionado (fallback: NAP); na edição o nome original é preservado (só o NAP muda).
- "Contas de acesso" e "Equipes TBR" viraram **páginas próprias** (não mais modais): `/schools/[id]/accounts` e `/schools/[id]/teams`. Acessos: grupo "Ações da Escola" no **menu lateral** (admin **e orientador**). Header da página de turmas limpo (só botão "Nova Turma"). Removido `school-actions-menu.tsx`.
- Grupo lateral **"Ações da Escola"** (visível para admin/orientador quando `activeSchoolId` existe — via pathname `/schools/{id}/...` **ou** `?schoolId=` na página de itens): Itens (`/items?schoolId&year`), Equipes TBR, Contas de acesso e Horário geral (`/schools/{id}/schedules?year`). "Nova turma" ficou de fora (redundante dentro da escola — o botão vive no conteúdo das turmas).
- **Sidebar data-driven**: `src/lib/sidebar-config.ts` expõe `getMainMenu(user)`, `getSchoolActionMenu(ctx)` e `isSidebarItemActive/resolveHref`; `AppSidebar` renderiza a partir desses arrays. Menu do usuário no footer virou **popup** (Base UI `Menu`), não mais accordion.
- Header do dashboard agora renderiza **só** o toggle da sidebar + título da página (sem ações). Botões primários (Nova Turma, Novo Item, Nova Escola, Novo Usuário, Novo Cargo, Nova Categoria, Nova Sala, Novo Horário, Nova Atividade) foram movidos para as toolbars/conteúdo das próprias páginas; voltar-"Turmas" está no topo de `accounts`/`teams`. `setHeader` agora aceita `right` opcional.
- Views colocalizadas: `src/app/(dashboard)/schools/[id]/accounts/school-accounts-view.tsx` (SchoolAccountsView) e `.../teams/school-teams-view.tsx` (SchoolTeamsView); páginas em `accounts/page.tsx` e `teams/page.tsx`. Removidos `school-accounts.tsx`, `school-teams.tsx` e o provider `src/lib/school-actions.tsx`.
- Tabela de `/users`: nível e cargo em colunas separadas; cargo só aparece quando difere do nível (evita duplicar "Orientador" + "Orientador").
- Cadastro/edição de escola (`/schools`): campos de "Email/Senha de acesso" da escola foram **removidos** — credenciais agora são criadas apenas pelo "Contas de acesso" (tipo "Acesso da escola").
- `SearchableSelect`: dropdown via **portal** com `position: fixed` (escapa de containers com `overflow` — não abre mais "dentro" do form criando scrollbars).
- `FloatingLines`: defaults `enabledWaves`, `lineCount`, `lineDistance` **e** `bottomWavePosition` são constantes de módulo (o default de `bottomWavePosition` criava objeto novo a cada render → `useEffect` recriava o canvas WebGL a cada keystroke no `/login` causando "flash"; era ESSE o causador real do pisca ao digitar). Deps do effect agora são estáveis.
- Página `/roles` criada (Cargos e Níveis de acesso): CRUD via `src/lib/db/roles.ts` consumindo `/api/roles`; link no `app-sidebar.tsx` (admin).

## Stack e layout

- Next.js **16** (App Router, breaking changes vs 15), React 19, Tailwind v4, TypeScript, lucide-react, shadcn/base-ui.
- Repo dedicado ao **front**. O backend Laravel vive em `control-school-back` (http://localhost:8000).
- `pnpm dev` (dev), `pnpm lint` (eslint), `pnpm exec tsc --noEmit` (typecheck).
- Rotas principais: `/login` público; protegidas em `(dashboard)`: `/` (visão geral), `/users` (usuários, era `/advisors`), `/schools`, `/agenda`, `/items`, `/all-schedules`, `/tbr`, `/roles`, `/schools/[id]/schedules`, `/schools/[id]/classes/[classId]/schedules`.

## Arquitetura de dados

O front **não fala com Supabase** (removido) nem tem JWT próprio. Tudo passa por um proxy Next para a API Laravel:

```
Browser → fetch('/api/backend/<path>')            (helper api() em src/lib/backend.ts)
        → src/app/api/backend/[...path]/route.ts  (adiciona Authorization: Bearer do cookie)
        → http://localhost:8000/api/<path>        (Laravel, JSON snake_case)
```

- Token Sanctum fica **só no cookie HttpOnly `session_token`** → nunca vai ao JS.
- `BACKEND_URL` no `.env.local` (default `http://localhost:8000`).
- Auth routes do Next proxeiam o Laravel: `src/app/api/auth/{login,logout,session}/route.ts`.
- `src/proxy.ts` (Next 16: a convenção `middleware.ts` foi renomeada para `proxy.ts`) redireciona para `/login` se não houver cookie em rotas protegidas.
- Camada de dados em `src/lib/db/*` — barrel `src/lib/db/index.ts` expõe todas as funções usadas pelas páginas. Backend responde snake_case → converter com `toCamel()` (`src/lib/helpers.ts`).

### Usuário Admin
- Email: `lucascastro121295@gmail.com`
- Senha: `mudar123`
- Senha padrão de usuários criados pelo front: `mudar123`

### Variáveis de Ambiente
- `BACKEND_URL` — URL base do backend Laravel (ex.: `http://localhost:8000`). Nenhuma chave pública/secret no client.