-- =========================================================
-- MIGRAÇÃO 01 — status "agendado" + múltiplos tipos por OS
-- Gerado em 18/08/2026
--
-- ESTADO ATUAL (29/08/2026): JÁ APLICADA no Supabase de produção.
-- ordens_servico NÃO tem mais a coluna "tipo"; tipos ficam em os_tipos.
-- Não rode este arquivo de novo em produção — é registro histórico.
--
-- COMO RODAR (só em ambiente novo que ainda tenha ordens_servico.tipo):
-- 1. Entre no Supabase (app.supabase.com) > seu projeto
-- 2. Menu lateral > SQL Editor > New query
-- 3. Cole as seções 1–4 abaixo e clique em "Run"
-- 4. Depois de rodar, veja o aviso no final sobre as OS antigas
--    marcadas como "Observação" (não têm tipo novo correspondente)
-- =========================================================

-- ---------------------------------------------------------
-- 1) Nova tabela: uma OS pode ter mais de um tipo/modalidade
--    (ex: "Teste com Carga Programado" + "Manutenção Preventiva"
--    juntos na mesma OS)
-- ---------------------------------------------------------
create table if not exists os_tipos (
  os_id uuid references ordens_servico(id) on delete cascade,
  tipo text not null,
  primary key (os_id, tipo)
);

create index if not exists idx_os_tipos_os on os_tipos(os_id);

-- ---------------------------------------------------------
-- 2) Migrar as OS que você já criou nos testes pra tabela nova,
--    já convertendo pro nome novo de cada tipo
--    (requer coluna ordens_servico.tipo — só em banco pré-migração)
-- ---------------------------------------------------------
insert into os_tipos (os_id, tipo)
select id,
  case tipo
    when 'preventiva' then 'manutencao_preventiva'
    when 'corretiva' then 'manutencao_corretiva'
    when 'visita_tecnica' then 'visita_tecnica'
    else tipo  -- 'observacao' não tem correspondente novo, entra como está
  end
from ordens_servico
where tipo is not null
on conflict (os_id, tipo) do nothing;

-- ---------------------------------------------------------
-- 3) status "agendado" — não precisa de alteração no banco
--    (o campo status é texto livre, sem lista fixa de valores).
--    Só o app passa a usar esse valor novo a partir de agora.
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 4) Coluna legada ordens_servico.tipo — REMOVIDA (estado final)
--
--    O app passou a gravar tipos só em os_tipos. A coluna antiga
--    era NOT NULL; sem ajuste, criar OS nova falhava com:
--    "null value in column tipo violates not-null constraint".
--
--    Evolução aplicada no Supabase de produção (em ordem):
--      a) alter table ordens_servico alter column tipo drop not null;
--      b) alter table ordens_servico drop column tipo;
--
--    Produção já está no passo (b). Comandos comentados abaixo —
--    descomente só se reproduzir em ambiente que ainda tenha a coluna.
-- ---------------------------------------------------------
-- alter table ordens_servico alter column tipo drop not null;
-- alter table ordens_servico drop column tipo;

-- ---------------------------------------------------------
-- AVISO: OS de teste que estavam como "Observação" ficaram com
-- tipo = 'observacao' na tabela nova, que não é nenhuma das 5
-- opções novas (Atendimento de Emergência, Manutenção Corretiva,
-- Visita Técnica, Teste com Carga Programado, Manutenção
-- Preventiva). Depois de rodar essa migração, abra essas OS na
-- tela de Editar e marque manualmente o tipo correto — é rápido
-- porque agora dá pra marcar mais de um.
-- ---------------------------------------------------------
