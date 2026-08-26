<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Autenticação e Segurança

### Arquitetura
- **Não usa Supabase Auth** para login/logout (descontinuado)
- Usa tabela `users` com senhas hasheadas (bcrypt, 12 rounds)
- Sessões via JWT tokens (HS256, expira 24h) em cookies HttpOnly

### Fluxo de Login
1. `POST /api/auth/login` - valida credenciais com bcrypt
2. Cria JWT token e salva em cookie `session_token` (HttpOnly, Secure, SameSite=Lax)
3. Retorna dados do usuário sem senha

### Fluxo de Logout
1. `POST /api/auth/logout` - deleta cookie `session_token`

### Validação de Sessão
- `GET /api/auth/session` - valida JWT do cookie
- Middleware (`src/utils/supabase/middleware.ts`) valida token em todas as rotas protegidas

### Arquivos Importantes
- `src/lib/auth/crypto.ts` - hash/verificação de senhas (bcrypt)
- `src/lib/auth/jwt.ts` - criação/verificação de tokens JWT
- `src/lib/auth/cookies.ts` - gerenciamento de cookies HttpOnly
- `src/app/api/auth/login/route.ts` - API de login
- `src/app/api/auth/logout/route.ts` - API de logout
- `src/app/api/auth/session/route.ts` - API de sessão

### Scripts SQL (executar no Supabase SQL Editor)
- `supabase-setup.sql` - setup completo: limpa banco + cria admin
- `supabase-cleanup.sql` - limpa todos os dados
- `supabase-rls.sql` - políticas RLS (service_role bypass)

### Usuário Admin
- Email: `admin@gmail.com`
- Senha: `mudar123`
- Para criar: executar `supabase-setup.sql` no SQL Editor do Supabase
- **IMPORTANTE**: NUNCA usar `supabase.auth.signUp()` - usar apenas a tabela `users`

### Variável de Ambiente
- `JWT_SECRET` no `.env.local` - chave secreta para JWT (NUNCA expor no client-side)

