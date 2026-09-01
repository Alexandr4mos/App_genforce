-- Prompt 6 Parte 3 — campos extras em relatorio_pecas e vínculo de fotos
alter table relatorio_pecas
  add column if not exists proxima_troca_prevista date;

alter table fotos
  add column if not exists relatorio_peca_id uuid references relatorio_pecas(id) on delete cascade;

create index if not exists idx_relatorio_pecas_equipamento on relatorio_pecas(equipamento_id);
create index if not exists idx_fotos_relatorio_peca on fotos(relatorio_peca_id);
