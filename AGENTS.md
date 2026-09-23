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

- (aberto) A automação usa o `automation/.env` (copiado do `register_students`; contém `URL_CADASTRAR`, `URL_LOGIN`, `PASS_FIXED`). Manter em sincronia.
- (aberto) `register_monitoramento.mjs` ainda tem TODOs: seletor da lupa da escola pode variar, campos restantes do formulário MundoZ e botão Salvar a confirmar.
- (manter atualizado) Validação cross-projeto: rode `pnpm exec tsc --noEmit` + `pnpm lint` no front e `php -l` + testes de endpoints no back.

## Histórico de mudanças recentes

- **"Registrar no MundoZ" por atividade na Agenda** (`/agenda`): o dialog de Nova/Editar Atividade ganhou um checkbox "Registrar no MundoZ" que, quando marcado, libera campos Escola (select das escolas do usuário — orientador vê as próprias via `getUserSchools`, admin todas via `getSchools`), Ano (default ano atual), Tipo (Presencial/Remoto/Híbrido) e Confirmado por (default nome do usuário). Esses campos agora são persistidos na tabela `agenda` (back: migration `2026_09_23_000001_add_mundoz_to_agendas_table`, colunas `registrar_mundoz`/`escola`/`ano`/`tipo`/`confirmado_por`; `Agenda::fillable` e `AgendaController::rules` atualizados). A `AgendaItem` ganhou os campos opcionais `registrarMundoz/escola/ano/tipo/confirmadoPor`. Itens marcados aparecem com badge `·MZ` no calendário. O card "Automação MundoZ" agora **só envia os itens marcados** (`handleRunMonitor` filtra por `registrarMundoz`) e `POST /api/monitoramento/run` usa as infos **por item** (fallback: escola=1ª do usuário, ano atual, tipo Presencial, confirmado por=nome). Helper `getUserSchools(userId): School[]` em `src/lib/db/users.ts` (retorna objetos com nome; `getSchoolsByUser` passou a usar ele).
- **Automação de monitoramentos na Agenda** (orientador): card "Automação MundoZ" em `/agenda` com botão "Registrar no MundoZ" (envia as etapas da agenda do orientador) + checkbox "Mostrar navegador" + terminalzinho. Rotas: `POST /api/monitoramento/run` (lê a sessão via cookie, busca credenciais em `GET /api/backend/users/{id}/mundoz`, monta `.data/.run/monitoramentos.json` e spawna `automation/register_monitoramento.mjs` passando credenciais via env `MUNDOZ_USUARIO/MUNDOZ_SENHA` — nunca grava senha em arquivo), `GET /api/monitoramento/status`, `GET /api/monitoramento/log`, `POST /api/monitoramento/stop`. Lib `src/lib/monitor-data.ts` (estado/log/itens). Itens já com `status=OK` não são reenviados.
- **Credenciais do MundoZ no Perfil** (`/profile`): card "Acesso ao MundoZ" com Usuário + Senha + checkbox "usar meu email do sistema". Backend ganhou `users.mundoz_user`/`mundoz_password` (`mundoz_password` fica oculto no JSON padrão; só o dono/admin lê via `GET /users/{user}/mundoz`). Front: `getMundozCredentials`/`updateMundozCredentials` em `src/lib/db/users.ts`.
- **Checkbox "Mostrar navegador durante a execução"** em `/students_register`: marca para o Chromium abrir visível (`HEADLESS=false`), desmarca para rodar oculto e acompanhar pelo terminal. `runScript(script, args, { showBrowser })` em `register-data.ts` decide o `HEADLESS`; `POST /api/students/run` recebe `showBrowser` no body.
- Nova automação `automation/register_monitoramento.mjs` (em construção — descoberta de campos da tela `/monitoramento` do MundoZ): lê um JSON `monitoramentos.json` (`orientador {nome,usuario,senha}` + `itens [{escola,ano,tipo,confirmadoPor,data,inicio,fim,atividade}]`), faz login do orientador por email+senha, navega a `/monitoramento`, clica "Adicionar +", busca a escola (campo "Digite o nome ou o cnpj da escola" + lupa), seleciona escola/ano/tipo ("Presencial"/"Remoto"/"Híbrido")/confirmado por e preenche Data (date), Data entrada (time) e Data fim (time). Status `OK/FALHA` gravado de volta no JSON. Faltam campos a descobrir (TODO no arquivo).
- Página `/students_register` completa no estilo da tela de automação (stats + terminal + tabela): importa planilha `.xlsx` (botão "Importar Excel" salva em `/.data/dados.xlsx`), resumo com contadores (cadastrados/falhas/inseridos/pendentes), roda a automação (`POST /api/students/run` spawna `automation/register_students.mjs` com N navegadores), log estilo terminal com polling a cada 2s, gera cards PDF (`POST /api/students/cards` → `automation/generate_login_cards.mjs`), downloads (`GET /api/students/download?file=` com proteção de path traversal) e tabela de alunos com badges OK/FALHA. Caminhos centralizados em `src/lib/register-data.ts`.
- Deps novas no front: `playwright@1.52.0`, `exceljs`, `dotenv`, `pdf-lib`, `unidecode`. Scripts de automação em `automation/*.mjs` (rodam com `node` e resolvem deps do `node_modules` do front; Chromium via `pnpm exec playwright install chromium`).
- Fix slug de turma nos cards: `°`/`º`/`ª` removidos antes do `unidecode` (turma "9° A" → `9_a.pdf`, antes virava `9deg_a.pdf`).
- Cards de acesso melhorados (`generate_login_cards.mjs`): layout moderno (faixa superior com gradiente azul, logo "MZ", bloco de credenciais com fundo claro), gera cards **só** para alunos com `REGISTRADO` e `INSERIDO` = OK (ignora o resto e avisa no log), e `wrap()` agora quebra URLs/nomes longos no meio sem estourar o card. Card continua 94×135mm, 4 por página A4.
- Email padrão em `/students_register`: se a planilha importada não tiver a coluna EMAIL (ou algum aluno estiver sem email), a página mostra um input de email padrão que preenche todos os que estiverem sem (rota `POST /api/students/email` + função `setDefaultEmail` em `src/lib/register-data.ts`, que cria a coluna EMAIL na planilha se não existir). Tabela de alunos ganhou coluna Email ("sem email" em âmbar).
- Nome do aluno é normalizado para **MAIÚSCULAS** no cadastro (`automation/register_students.mjs`: `cellText(s.NOME).toUpperCase()` — também no `register_students/register_students.js` original).
- Download da **planilha preenchida**: `GET /api/students/download?file=dados.xlsx` serve o `.data/dados.xlsx` (a automação grava cada OK/FALHA direto nele, com `Content-Type` xlsx; PDFs continuam em `?file=pdf/…`). Botões "Baixar planilha preenchida" no card *Automação concluída* e "Baixar preenchida" no card *Planilha de alunos*.
- **Upload nomeado + planilhas salvas**: o upload agora salva com o **nome original do arquivo** (sanitizado), não mais `dados.xlsx` fixo. Arquivo ativo fica em `.data/.active`. Rotas novas: `POST /api/students/activate` (troca a planilha ativa) e `POST /api/students/snapshot` (`saveSnapshot` — salva uma cópia nomeada da planilha preenchida no sistema). Funções novas em `register-data.ts`: `sanitizeSpreadsheetName`, `listSpreadsheets`, `getActiveName/setActiveName`, `activeXlsxPath`, `deleteSpreadsheet`. UI: chips "Planilhas salvas no sistema" (clica para usar) + campo "Salvar planilha no sistema com nome".
- **Stats lidos da planilha**: os cards de cima (Cadastrados/Falha cadastro/Inseridos/Falha inserção/Pendentes) agora contam **direto dos campos REGISTRADO/INSERIDO** da planilha (`fromSheet`), com fallback para o log. Inclui **tempo estimado** (×1,5 min/aluno ÷ navegadores) no Resumo.
- **RA também em MAIÚSCULO** + **nunca processa dados vazios**: `register_students.mjs` converte `raText(s.RA).toUpperCase()` e **pula** alunos sem NOME/RA/EMAIL (log `DADOS INCOMPLETOS` e marca FALHA) — sem preencher formulário com linha vazia.
- **Botão "Parar"**: `POST /api/students/stop` → `stopRun()` em `register-data.ts` (kill do grupo do processo via `detached:true`). Botão destrutivo ao lado de "Rodar cadastro" quando rodando. Rota `/api/students/stop`.
- **Só processa alunos reais**: `register_students.mjs` ignora linhas **totalmente vazias** da planilha na leitura (sem NOME e sem RA) — não processa nem loga as centenas de linhas vazias que o Excel reporta no rodapé (a planilha do usuário tem `rowCount` 1000 com 123 alunos). `loadStudents` também corrigido: se **não existe coluna EMAIL** o email fica **vazio** (antes caía em fallback e lia a coluna 4 = NOME, mascarando o "sem email" e impedindo o input de aparecer; REGISTRADO/INSERIDO também agora exigem a coluna real). `setDefaultEmail` preenche o email padrão **apenas nas linhas com NOME ou RA** (nunca nas linhas vazias do rodapé); `loadStudents` filtra elas da tabela.
- **Cards de acesso com seleção**: página `/students_register` agora tem checkbox por card + "Selecionar todos", botões **"Baixar selecionadas (N)"** e **"Baixar todas"** que chamam `POST /api/students/cards/download` (body `{files:[...]}`, só `.pdf`) — a rota **mescla os PDFs selecionados em um só** com `pdf-lib` (sem reusar `sanitizeSpreadsheetName`, que adiciona `.xlsx`; usa `basename` + checa `isAbsolute`/exists). Novo componente `src/components/ui/checkbox.tsx` (Base UI 1.6: `@base-ui/react/checkbox`, o indicador é `CheckboxPrimitive.Indicator` e **não existe** `CheckboxIndicator`/`showWhen`). "Regenerar cards" continua em `POST /api/students/cards`.
- **Card compacto (94×78mm)**: `generate_login_cards.mjs` usa `CARD_H=78`, `CARD_W=94`; card **todo branco** (sem faixa gradiente, sem bloco cinza de credenciais), título "ACESSO MUNDO Z" centralizado no topo, linha azul full-width, margens internas 4mm, SENHA com respiro (~15mm) do USUÁRIO (não cola mais), link encostado no fim do card. Grid **2×3 (6 cards/página)**, posição `8 + col*98, 8 + linha*(CARD_H+8)`; página nova a cada 6 cards (`pos % 6`).

- Validação cross-projeto (smoke test back+front): `src/proxy.ts` agora protege também a raiz `/` (antes usuário deslogado via `/` recebia 200 com dashboard quebrado; agora 307 → `/login`). `src/app/api/backend/[...path]/route.ts` passa `Accept: application/json` ao backend (sem isso, token expirado + Laravel API-only → 500 em vez de 401). Tipo `PendingAccount` definido em `school-accounts-view.tsx` (faltava; quebrava o tsc).
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
- Rotas principais: `/login` público; protegidas em `(dashboard)`: `/` (visão geral), `/users` (usuários, era `/advisors`), `/schools`, `/agenda`, `/items`, `/all-schedules`, `/tbr`, `/roles`, `/students_register` (import de planilha de alunos), `/schools/[id]/schedules`, `/schools/[id]/classes/[classId]/schedules`.

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