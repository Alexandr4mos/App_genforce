-- =========================================================
-- MODELO DE DADOS — APP DE MANUTENÇÃO DE GERADORES
-- Baseado no fluxo do 8Confirma + melhorias solicitadas
-- Banco: Supabase (Postgres)
-- =========================================================

-- Extensão para gerar UUIDs
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. CLIENTES (empresa/condomínio/instituição atendida)
-- ---------------------------------------------------------
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  razao_social text,
  cnpj text,
  endereco text,
  telefone text,
  email text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 2. UNIDADES (local físico do cliente, ex: "Edifício X",
--    útil quando um cliente tem mais de um site)
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
  tag text not null,                    -- ex: "GMG 01"
  fabricante_gmg text,
  modelo_alternador text,
  n_serie_alternador text,
  tensao text,
  potencia_kva numeric,
  fabricante_motor text,
  modelo_motor text,
  n_serie_motor text,
  tipo_gmg text,                        -- ex: "ABERTO"
  fabricante_alternador text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 4. USUARIOS (equipe — vinculado ao auth.users)
--    Hoje: 5 técnicos + 1 supervisor + 2 admin = 8 contas
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
-- 5. CHECKLIST_TEMPLATES (modelo reutilizável de checklist
--    por tipo de manutenção/equipamento)
-- ---------------------------------------------------------
create table checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,                   -- ex: "Preventiva Mensal GMG"
  descricao text,
  ativo boolean default true
);

create table checklist_template_itens (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references checklist_templates(id) on delete cascade,
  grupo text,                           -- ex: "Mecânica / Sistema de Arrefecimento"
  titulo text not null,                 -- ex: "Nível de óleo lubrificante"
  tipo_resposta text not null,          -- 'opcoes' | 'numero' | 'texto'
  opcoes text[],                        -- ex: {"Nível OK","Nível baixo"}
  unidade text,                         -- ex: "Vac", "RPM", "Km"
  obrigatorio boolean default true,
  ordem int
);

-- ---------------------------------------------------------
-- 6. ORDENS_SERVICO (OS)
-- ---------------------------------------------------------
create table ordens_servico (
  id uuid primary key default uuid_generate_v4(),
  numero serial unique,                 -- número sequencial tipo #9735
  cliente_id uuid references clientes(id),
  unidade_id uuid references unidades(id),
  tipo text not null,                   -- 'preventiva' | 'corretiva' | 'visita_tecnica'
  status text not null default 'pendente', -- pendente|andamento|pausada|concluida
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
  criado_em timestamptz default now()
);

-- Técnicos alocados numa OS (N:N)
create table os_tecnicos (
  os_id uuid references ordens_servico(id) on delete cascade,
  tecnico_id uuid references usuarios(id) on delete cascade,
  primary key (os_id, tecnico_id)
);

-- Equipamentos atendidos numa OS (N:N, uma OS pode ter GMG 01 + GMG 02)
create table os_equipamentos (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references ordens_servico(id) on delete cascade,
  equipamento_id uuid references equipamentos(id),
  template_id uuid references checklist_templates(id)
);

-- ---------------------------------------------------------
-- 7. CHECKLIST_RESPOSTAS (preenchimento real de cada item
--    durante a execução da OS)
-- ---------------------------------------------------------
create table checklist_respostas (
  id uuid primary key default uuid_generate_v4(),
  os_equipamento_id uuid references os_equipamentos(id) on delete cascade,
  template_item_id uuid references checklist_template_itens(id),
  resposta text,                        -- valor escolhido ou digitado
  observacao text,
  respondido_por uuid references usuarios(id),
  respondido_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 8. FOTOS (evidências — vinculadas a um item de checklist
--    ou diretamente à OS)
-- ---------------------------------------------------------
create table fotos (
  id uuid primary key default uuid_generate_v4(),
  checklist_resposta_id uuid references checklist_respostas(id) on delete cascade,
  os_id uuid references ordens_servico(id) on delete cascade,
  url text not null,                    -- caminho no Supabase Storage
  legenda text,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------
-- 9. PENDÊNCIAS ★ (fluxo real: técnico solicita → comercial
--    aciona proposta → cliente aprova → serviço executado →
--    técnico dá baixa. Fica vinculada ao EQUIPAMENTO, então
--    aparece em toda manutenção seguinte até ser baixada.)
-- ---------------------------------------------------------
create table pendencias (
  id uuid primary key default uuid_generate_v4(),
  equipamento_id uuid references equipamentos(id),
  os_origem_id uuid references ordens_servico(id),    -- OS onde o técnico relatou
  os_baixa_id uuid references ordens_servico(id),     -- OS onde o serviço foi feito e deu baixa

  item_solicitado text not null,        -- ex: "Troca de óleo lubrificante"
  observacao_tecnico text,              -- relato de quem identificou
  prioridade text default 'media',      -- baixa|media|alta|critica

  -- status reflete o fluxo comercial/operacional real, não só aberta/fechada
  status text not null default 'solicitada',
  -- valores esperados:
  -- 'solicitada'          -> técnico acabou de relatar
  -- 'aguardando_comercial'-> comercial avisado, aguardando proposta
  -- 'proposta_enviada'    -> proposta enviada ao cliente
  -- 'aprovada'            -> cliente aprovou, aguardando execução
  -- 'recusada'            -> cliente não aprovou (fica registrado, não some)
  -- 'resolvida'           -> serviço feito e técnico deu baixa

  solicitado_por uuid references usuarios(id),
  solicitado_em timestamptz default now(),

  baixado_por uuid references usuarios(id),           -- técnico que deu baixa
  baixado_em timestamptz,
  observacao_baixa text                               -- o que foi feito na baixa
);

-- ---------------------------------------------------------
-- 9b. RELATORIO_PECAS (controle do que já foi trocado —
--     prova pro cliente em caso de questionamento)
-- ---------------------------------------------------------
create table relatorio_pecas (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references ordens_servico(id) on delete cascade,
  equipamento_id uuid references equipamentos(id),
  pendencia_id uuid references pendencias(id),        -- null se troca avulsa, sem pendência prévia
  peca text not null,                   -- ex: "Filtro de óleo lubrificante"
  quantidade numeric default 1,
  observacao text,                      -- detalhe da troca
  tecnico_id uuid references usuarios(id),
  data_hora timestamptz default now()
);

-- ---------------------------------------------------------
-- 10. ASSINATURAS (cliente e técnico ao final da OS)
-- ---------------------------------------------------------
create table assinaturas (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references ordens_servico(id) on delete cascade,
  tipo text not null,                   -- 'cliente' | 'tecnico'
  nome_responsavel text,
  imagem_url text,                      -- assinatura desenhada, salva como imagem
  criado_em timestamptz default now()
);

-- =========================================================
-- ÍNDICES úteis para as telas mais consultadas
-- =========================================================
create index idx_os_status on ordens_servico(status);
create index idx_os_cliente on ordens_servico(cliente_id);
create index idx_pendencias_status on pendencias(status);
create index idx_pendencias_equipamento on pendencias(equipamento_id);
create index idx_relatorio_pecas_os on relatorio_pecas(os_id);
create index idx_equipamentos_unidade on equipamentos(unidade_id);

-- =========================================================
-- OBS: no Supabase, ative Row Level Security (RLS) em todas
-- as tabelas e crie policies por perfil (técnico só vê suas
-- OS do dia; cliente, se tiver portal, só vê as próprias).
-- =========================================================
