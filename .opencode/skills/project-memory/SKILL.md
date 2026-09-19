---
name: project-memory
description: Use ALWAYS when working on the control-school project (front/ Next.js, back/ Laravel, UI, bugs, features, refactors). This skill carries the project's memory. Read the journal file `.opencode/memory/control-school.md` BEFORE starting any task and append/update it AFTER finishing significant work so no context is ever lost between sessions.
---

# Project Memory — Control School

The project keeps a persistent memory so every session starts with full context, no matter what happened previously.

## Protocol (obrigatório)

1. **Antes de qualquer trabalho:** leia `.opencode/memory/control-school.md` na íntegra.
2. **Depois de qualquer trabalho significativo** (feature, bugfix, refactor, decisão, mudança de arquitetura):
   - adicione uma entrada no **Journal** com a data e o que foi feito (conciso, tipo changelog);
   - atualize as seções **Estado Atual**, **Arquitetura**, **Schema**, **Gotchas** e **Próximos Passos** se algo mudou;
   - mantenha dados sensíveis (senhas, chaves) fora do arquivo — só referencie onde estão.
3. O arquivo de memória vive em `.opencode/memory/control-school.md`. Se ele não existir em algum momento, recrie-o com a mesma estrutura deste skill.

## Regras

- Nunca apague histórico do Journal — só adicione.
- Se uma sessão ficou **incompleta**, deixe isso explícito em "Em andamento" e ajuste os "Próximos Passos" para exatamente onde parou.
- Conflito entre a memória e o código: o **código atual é a verdade**; atualize a memória para refletir o código.

O conteúdo persistente da memória está em `.opencode/memory/control-school.md` — leia agora.