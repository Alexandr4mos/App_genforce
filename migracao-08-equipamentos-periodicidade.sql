-- Prompt 9 Parte 3 — periodicidade de manutenção por gerador
alter table equipamentos
  add column if not exists periodicidade_manutencao text
    check (periodicidade_manutencao is null or periodicidade_manutencao in ('mensal', 'trimestral', 'semestral', 'anual'));
