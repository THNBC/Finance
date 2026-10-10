# Arquitetura

Estrutura principal do app financeiro:

- `app/`: rotas do Next.js.
- `components/layout/`: componentes estruturais, como Sidebar.
- `components/ui/`: componentes reutilizáveis entre páginas.
- `components/{dashboard,cartoes,transacoes,bets}/`: componentes específicos de cada área.
- `hooks/`: estado e orquestração das telas.
- `services/`: camada de acesso ao Supabase.
- `lib/utils/`: utilitários compartilhados.
- `lib/{dashboard,cartoes,transacoes,bets}/`: cálculos e regras específicas das features.
- `types/`: exports centralizados de tipos.

A refatoração mantém compatibilidade com os imports antigos principais e adiciona a camada compartilhada para próximas evoluções sem quebrar o build.
