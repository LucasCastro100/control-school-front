---
name: frontend-suspense-skeletons
description: Skill obrigatoria do frontend (control-school-front - Next.js App Router + TypeScript). Leia SEMPRE ao criar/alterar qualquer pagina, listagem, modal ou painel com carregamento. Regras: skeleton + Suspense em TODA tela com load; em schools/classes o skeleton e em CARD (nao tabela); a pagina e server component que chama um client component.
---

# Frontend - Skeleton, Suspense e Server->Client

## Regra principal

Toda tela com carregamento (fetch/promise/pending) DEVE ter skeleton de carregamento dentro de Suspense. Nunca tela em branco nem "loading" cru.

## Estrutura obrigatoria

- pagina exportada = SERVER component (sem Suspense proprio).
- Essa pagina chama um CLIENT component ("use client") que cuida do carregamento.
- O client usa Suspense com fallback = skeleton.
- O skeleton espelha o layout do conteudo real (sem layout shift).

## Em schools e classes (e contas de escola)

- Skeleton em CARD (grid de cards), NAO em tabela.
- schools/classes/accounts: primeiro uma view server que chama client com cards skeleton.

## Snippet de referencia (card skeleton)

import { Suspense } from "react"

function AccountCardsSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 h-4 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-white/8" />
          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/8" />
        </li>
      ))}
    </ul>
  )
}

export default function AccountsView() {
  return (
    <Suspense fallback={<AccountCardsSkeleton />}>
      {/* client que carrega as contas */}
    </Suspense>
  )
}
