-- Prompt 7 Parte 1 — nível de prioridade na OS
alter table ordens_servico
  add column if not exists prioridade text not null default 'medio'
    check (prioridade in ('alto', 'medio', 'baixo'));

create index if not exists idx_os_prioridade on ordens_servico(prioridade);
