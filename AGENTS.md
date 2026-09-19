<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack e layout

- Next.js **16** (App Router, breaking changes vs 15), React 19, Tailwind v4, TypeScript, lucide-react, shadcn/base-ui.
- Repo dedicado ao **front**. O backend Laravel vive em `control-school-back` (http://localhost:8000).
- `pnpm dev` (dev), `pnpm lint` (eslint), `pnpm exec tsc --noEmit` (typecheck).

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