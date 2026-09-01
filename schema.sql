-- =========================================================
-- MODELO DE DADOS — APP DE MANUTENÇÃO DE GERADORES (Genforce)
-- Banco: Supabase Postgres — projeto dfpmhqsqksewcjexrmhg
-- Atualizado em 23/08/2026 — reflete o banco novo criado do zero
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. CLIENTES
-- ---------------------------------------------------------
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  codigo_legado int unique,
  nome text not null,
  razao_social text,
  cnpj text,
  endereco text,
  cidade text,
  uf text,
  telefone text,
  email text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 2. UNIDADES
-- ---------------------------------------------------------
create table unidades (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  nome text not null,
  endereco text,
  latitude numeric,
  longitude numeric,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 3. EQUIPAMENTOS (geradores/GMG)
-- ---------------------------------------------------------
create table equipamentos (
  id uuid primary key default uuid_generate_v4(),
  unidade_id uuid references unidades(id) on delete cascade,
  tag text not null,
  fabricante_gmg text,
  modelo_alternador text,
  n_serie_alternador text,
  n_serie_gmg text,
  ano_fabricacao int,
  tensao text,
  potencia_kva numeric,
  fabricante_motor text,
  modelo_motor text,
  n_serie_motor text,
  placa_motor text,
  placa_alternador text,
  data_inicio_contrato date,
  tipo_gmg text,
  fabricante_alternador text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 3b. EQUIPAMENTO_FILTROS (numeração de filtros por GMG)
-- ---------------------------------------------------------
create table equipamento_filtros (
  id uuid primary key default uuid_generate_v4(),
  equipamento_id uuid references equipamentos(id) on delete cascade,
  tipo_filtro text not null,   -- 'oleo' | 'combustivel' | 'ar' | 'separador'
  numero_peca text not null,
  observacao text
);

create index idx_equipamento_filtros_equip on equipamento_filtros(equipamento_id);

-- ---------------------------------------------------------
-- 4. USUARIOS (equipe — vinculado ao auth.users)
-- ---------------------------------------------------------
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel text not null default 'tecnico', -- 'tecnico' | 'supervisor' | 'admin'
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 5. CHECKLIST_TEMPLATES
-- ---------------------------------------------------------
create table checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  ativo boolean default true
);

create table checklist_template_itens (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references checklist_templates(id) on delete cascade,
  grupo text,
  titulo text not null,
  tipo_resposta text not null,          -- 'opcoes' | 'numero' | 'texto'
  opcoes text[],
  unidade text,
  obrigatorio boolean default true,
  ordem int
);

-- ---------------------------------------------------------
-- 6. ORDENS_SERVICO
-- ---------------------------------------------------------
create table ordens_servico (
  id uuid primary key default uuid_generate_v4(),
  numero serial unique,
  numero_legado int unique,
  cliente_id uuid references clientes(id),
  unidade_id uuid references unidades(id),
  status text not null default 'pendente',
  -- agendado | pendente | andamento | pausada | concluida | finalizado
  descricao text,
  data_inicio_prevista timestamptz,
  data_fim_prevista timestamptz,
  checkin_em timestamptz,
  checkin_lat numeric,
  checkin_lng numeric,
  checkout_em timestamptz,
  checkout_lat numeric,
  checkout_lng numeric,
  km_saida numeric,
  km_retorno numeric,
  observacoes_gerais text,
  aprovado_supervisor boolean default false,
  aprovado_por uuid references usuarios(id),
  aprovado_em timestamptz,
  enviado_cliente_em timestamptz,
  observacao_correcao text,
  importado boolean default false,
  criado_em timestamptz default now()
);

-- Tipos/modalidades N:N (substitui coluna ordens_servico.tipo removida)
create table os_tipos (
  os_id uuid references ordens_servico(id) on delete cascade,
  tipo text not null,
  primary key (os_id, tipo)
);

-- Grupos de checklist não obrigatórios para fechar esta OS (Parte 8 Prompt 3)
create table os_grupos_opcionais (
  os_id uuid not null references ordens_servico(id) on delete cascade,
  grupo text not null,
  primary key (os_id, grupo)
);

create table os_tecnicos (
  os_id uuid references ordens_servico(id) on delete cascade,
  tecnico_id uuid references usuarios(id) on delete cascade,
  primary key (os_id, tecnico_id)
);

create table os_equipamentos (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references ordens_servico(id) on delete cascade,
  equipamento_id uuid references equipamentos(id),
  template_id uuid references checklist_templates(id)
);

-- ---------------------------------------------------------
-- 7. CHECKLIST_RESPOSTAS
-- ---------------------------------------------------------
create table checklist_respostas (
  id uuid primary key default uuid_generate_v4(),
  os_equipamento_id uuid references os_equipamentos(id) on delete cascade,
  template_item_id uuid references checklist_template_itens(id),
  resposta text,
  observacao text,
  respondido_por uuid references usuarios(id),
  respondido_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 8. PENDÊNCIAS (antes de fotos por FK pendencia_id)
-- ---------------------------------------------------------
create table pendencias (
  id uuid primary key default uuid_generate_v4(),
  equipamento_id uuid references equipamentos(id),
  os_origem_id uuid references ordens_servico(id),
  os_baixa_id uuid references ordens_servico(id),
  item_solicitado text not null,
  observacao_tecnico text,
  prioridade text default 'media',
  status text not null default 'solicitada',
  solicitado_por uuid references usuarios(id),
  solicitado_em timestamptz default now(),
  baixado_por uuid references usuarios(id),
  baixado_em timestamptz,
  observacao_baixa text
);

-- ---------------------------------------------------------
-- 9. FOTOS (evidências)
-- ---------------------------------------------------------
create table fotos (
  id uuid primary key default uuid_generate_v4(),
  checklist_resposta_id uuid references checklist_respostas(id) on delete cascade,
  os_id uuid references ordens_servico(id) on delete cascade,
  pendencia_id uuid references pendencias(id) on delete cascade,
  relatorio_peca_id uuid references relatorio_pecas(id) on delete cascade,
  url text not null,
  legenda text,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 10. RELATORIO_PECAS
-- ---------------------------------------------------------
create table relatorio_pecas (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references ordens_servico(id) on delete cascade,
  equipamento_id uuid references equipamentos(id),
  pendencia_id uuid references pendencias(id),
  peca text not null,
  codigo_peca text,
  quantidade numeric default 1,
  observacao text,
  tecnico_id uuid references usuarios(id),
  data_hora timestamptz default now(),
  proxima_troca_prevista date
);

-- ---------------------------------------------------------
-- 11. ASSINATURAS
-- ---------------------------------------------------------
create table assinaturas (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references ordens_servico(id) on delete cascade,
  tipo text not null,                   -- 'cliente' | 'tecnico'
  nome_responsavel text,
  imagem_url text,
  usuario_id uuid references usuarios(id),
  criado_em timestamptz default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index idx_os_status on ordens_servico(status);
create index idx_os_cliente on ordens_servico(cliente_id);
create index idx_os_tipos_os on os_tipos(os_id);
create index idx_os_grupos_opcionais_os on os_grupos_opcionais(os_id);
create index idx_pendencias_status on pendencias(status);
create index idx_pendencias_equipamento on pendencias(equipamento_id);
create index idx_relatorio_pecas_os on relatorio_pecas(os_id);
create index idx_relatorio_pecas_equipamento on relatorio_pecas(equipamento_id);
create index idx_equipamentos_unidade on equipamentos(unidade_id);

-- =========================================================
-- STORAGE: bucket publico "evidencias" (fotos + assinaturas)
-- =========================================================
-- insert into storage.buckets (id, name, public) values ('evidencias', 'evidencias', true);
-- Policies em storage.objects para authenticated (insert/update/delete) e anon (select)

-- =========================================================
-- RLS: habilitado em todas as tabelas public
-- Funções: is_privileged(), user_can_access_os(), user_can_access_os_equipamento()
-- Técnico: le/escreve OS alocadas; le clientes/unidades/equipamentos/templates
-- Admin/supervisor: acesso total
-- =========================================================
