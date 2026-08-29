-- Parte 8: grupos de checklist opcionais por OS (não bloqueiam check-out)
create table if not exists os_grupos_opcionais (
  os_id uuid not null references ordens_servico(id) on delete cascade,
  grupo text not null,
  primary key (os_id, grupo)
);

create index if not exists idx_os_grupos_opcionais_os on os_grupos_opcionais(os_id);
