---
name: control-school-context
description: Use ALWAYS when working on the control-school project. Provides project structure, conventions, and context. Read this file first to understand the codebase before any modification.
---

# Control School — Contexto do Projeto

> **MEMÓRIA DO PROJETO:** leia também `.opencode/memory/control-school.md` (journal + estado atual + agentes). Use sempre, junto com este arquivo, a skill `project-memory`.

## Visão Geral

Sistema de gerenciamento multi-escolar para controle de turmas, salas, alunos, horários e itens pedagógicos.

## Funcionalidades

- **Escolas** — cadastro e gerenciamento de múltiplas escolas
- **Turmas** — organização por NAPs (Núcleo de Ação Pedagógica) com anos segmentados
- **Salas** — gerenciamento de salas por turma
- **Alunos** — cadastro organizado por sala
- **Horários** — grade por turma/sala com dias da semana
- **Itens** — cadastro global (tapetes e tecnologias) com vínculo por NAP e quantidade por escola

## Estrutura

```
control-school/
├── front/   # aplicação frontend Next.js (componentes em src/app, src/components, src/lib)
└── back/    # backend Laravel API-only (sem Blade, sem views)
    ├── app/Http/Controllers/Api/   # controllers da API
    ├── app/Models/                 # Eloquent Models (PKs UUID via HasUuids)
    ├── database/migrations/        # schema conforme supabase-schema.sql do front
    ├── routes/api.php              # todas as rotas (prefixo /api)
    └── tests/Feature/              # testes de API (php artisan test)
```

## Backend Laravel

- API-only: sem Blade/web.php; responder JSON (snake_case)
- Auth: Sanctum tokens (`Authorization: Bearer <token>` via POST /api/auth/login)
- Admin seed: `lucascastro121295@gmail.com` / `mudar123`
- Convenções: controllers em `App\Http\Controllers\Api`, validação inline com `->validate()`, filtros por query string nos `index` (school_id, class_id, year, etc.)
- Tabela de turmas é `classes` (model `SchoolClass`); agenda usa tabela `agenda` (model com `$table = 'agenda'`)
- Testes: `cd back && php artisan test`

## Convenções

- Seguir a skill `ultra-modern-ui` para design/animações (dark mode, glassmorphism, Framer Motion)
- Usar `cn()` de `lib/utils`
- Componentes UI em `components/ui`, seções em `components/sections`
- Regras de negócio do domínio escolar (NAP, turmas segmentadas por ano) devem ser preservadas
- Responsividade obrigatória (mobile + desktop)