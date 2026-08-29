-- seed-os-historico.sql
-- 100 Ordens de Serviço exportadas do 8Confirma (período 03/08 a 28/08/2026).
-- Importadas como HISTÓRICO/CONSULTA, decidido em 22/08/2026.
--
-- ATENÇÃO — estas OS são incompletas de propósito:
--   * sem unidade_id  (o export do 8Confirma não traz a unidade)
--   * sem os_equipamentos (não traz o gerador) -> não têm checklist
--   * sem checklist_respostas, fotos nem pendências
-- Servem pra consultar "o que foi feito quando", não pra operar.
-- Por isso vão marcadas com importado = true, pra lista de OS poder filtrar.
--
-- PRÉ-REQUISITOS na tabela ordens_servico (criar no schema antes de rodar):
--   numero_legado int unique   -- número da OS no 8Confirma (9752..10388)
--   importado boolean default false
-- E em clientes:
--   codigo_legado int          -- já previsto no prompt do banco
--
-- O número novo (coluna numero, serial) é gerado normalmente pelo banco;
-- o número do 8Confirma fica só em numero_legado, pra não brigar com a sequence.
--
-- Status mapeados: PROGRAMADO->agendado, PENDENTE->pendente, ANDAMENTO->andamento,
--                  CONCLUÍDO->concluida, FINALIZADO->finalizado
--
-- FUSO HORÁRIO: as datas foram gravadas com offset -03 (horário de Brasília), que é o
-- horário real das manutenções. Como a coluna é timestamptz, o editor de tabelas do
-- Supabase mostra em UTC — uma OS das 08:00 aparece como 11:00 ali. Isso está CERTO:
-- o app converte pro fuso do aparelho e mostra 08:00. Não "corrigir" isso no banco.
-- Distribuição: {'finalizado': 46, 'concluida': 19, 'pendente': 1, 'andamento': 9, 'agendado': 25}
-- Rodar DEPOIS de importar os clientes. Idempotente.

begin;

insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9755, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-03 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 114
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9755 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9756, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-03 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 6
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9756 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9757, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-03 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 7
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9757 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9758, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-03 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 119
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9758 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10213, c.id, 'finalizado', 'TESTE COM CARGA PROGRAMADO.', '2026-08-03 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 49
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'teste_carga_programado' from ordens_servico o where o.numero_legado = 10213 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10270, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-03 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 278
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10270 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9752, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-04 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 224
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9752 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9759, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLEOS E FILTROS CONFORME CRONOGRAMA', '2026-08-04 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 11
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9759 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9781, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-04 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 237
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9781 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9782, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-04 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 83
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9782 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9784, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-04 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 9
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9784 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10162, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-04 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 120
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10162 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10374, c.id, 'finalizado', null, '2026-08-04 18:22:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 283
on conflict (numero_legado) do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9762, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-05 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 17
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9762 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10367, c.id, 'finalizado', 'Retirada unidades injetora', '2026-08-05 10:12:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 231
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_corretiva' from ordens_servico o where o.numero_legado = 10367 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10368, c.id, 'finalizado', 'Troca de óleo filtros e bateria', '2026-08-05 11:28:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 115
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10368 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9764, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-06 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 201
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9764 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9765, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS POR NOSSA CONTA', '2026-08-06 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 225
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9765 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9766, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-06 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 118
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9766 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10375, c.id, 'finalizado', 'INSTALAÇÃO DA BOMBA INJETORA.', '2026-08-06 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 249
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_corretiva' from ordens_servico o where o.numero_legado = 10375 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9767, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-07 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 206
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9767 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9769, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-07 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 229
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9769 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9770, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-07 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 94
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9770 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9771, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-07 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 62
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9771 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9761, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-08 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 48
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9761 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10377, c.id, 'concluida', 'Manutenção subestação', '2026-08-08 09:47:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 48
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10377 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9772, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA - ISRAEL PINHEIRO A', '2026-08-10 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 150
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9772 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9773, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA - ISRAEL PINHEIRO B', '2026-08-10 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 150
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9773 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9774, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-10 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 5
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9774 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10378, c.id, 'finalizado', 'Retirada de radiador para manutenção', '2026-08-10 09:48:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 248
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_corretiva' from ordens_servico o where o.numero_legado = 10378 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10379, c.id, 'finalizado', null, '2026-08-10 11:06:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 92
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'atendimento_emergencia' from ordens_servico o where o.numero_legado = 10379 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9775, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 21
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9775 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9776, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 12
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9776 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9777, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCAS DE ÓLEOS, FILTROS, CONFORME PROPOSTA  APROVADA.', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 215
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9777 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9778, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉOS E FILTROS CONFORME PROPOSTA  APROVADA.', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 4
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9778 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9785, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS POR NOSSA CONTA', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 193
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9785 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9787, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 192
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9787 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10330, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-11 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 281
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10330 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10380, c.id, 'finalizado', 'Troca da bateria', '2026-08-11 08:50:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 224
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10380 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10381, c.id, 'finalizado', 'troca da correia', '2026-08-11 13:01:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 224
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10381 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9267, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA -  4° TRIMESTRAL', '2026-08-12 08:00:00-03'::timestamptz, '2026-08-12 17:00:00-03'::timestamptz, true
from clientes c where c.codigo_legado = 269
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9267 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9408, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA - 4° TRIMESTRAL', '2026-08-12 08:00:00-03'::timestamptz, '2026-08-12 17:00:00-03'::timestamptz, true
from clientes c where c.codigo_legado = 270
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9408 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9520, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLEO E FILTROS - 4° TRIMESTRAL /ANUAL', '2026-08-12 08:00:00-03'::timestamptz, '2026-08-13 17:00:00-03'::timestamptz, true
from clientes c where c.codigo_legado = 267
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9520 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9780, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE BATERIA, ESTABILIZADOR, COMPLEAT E MANGUEIRA CONFORME PROPOSTA APROVADA.', '2026-08-13 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 248
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9780 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9783, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS POR NOSSA CONTA', '2026-08-13 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 67
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9783 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9786, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS CONFORME PROPOSTA APROVADA', '2026-08-13 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 175
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9786 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9789, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-13 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 244
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9789 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9791, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-13 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 174
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9791 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9792, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-13 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 15
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9792 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9270, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA - 4° TRIMESTRAL', '2026-08-13 08:00:00-03'::timestamptz, '2026-08-14 08:01:00-03'::timestamptz, true
from clientes c where c.codigo_legado = 271
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9270 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10382, c.id, 'concluida', 'START-UP GRUPO GERADOR', '2026-08-13 10:23:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 284
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'visita_tecnica' from ordens_servico o where o.numero_legado = 10382 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9790, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-14 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 57
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9790 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10383, c.id, 'finalizado', 'RETIRADA DE BOMBA INJETORA', '2026-08-14 08:00:00-03'::timestamptz, '2026-08-14 17:00:00-03'::timestamptz, true
from clientes c where c.codigo_legado = 270
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_corretiva' from ordens_servico o where o.numero_legado = 10383 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10285, c.id, 'pendente', 'APOIO PROGRAMADO', '2026-08-15 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 50
on conflict (numero_legado) do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9793, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-17 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 18
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9793 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10215, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA, TESTE COM CARGA', '2026-08-17 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 49
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10215 on conflict do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'teste_carga_programado' from ordens_servico o where o.numero_legado = 10215 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10385, c.id, 'andamento', 'APLICAÇÃO DE ADITIVO PARA ÓLEO DIESEL TECCOM.', '2026-08-17 13:46:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 184
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'visita_tecnica' from ordens_servico o where o.numero_legado = 10385 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9795, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-18 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 235
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9795 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9796, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-18 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 16
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9796 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9797, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-18 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 236
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9797 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10314, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-18 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 279
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10314 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10369, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-18 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 194
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10369 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9798, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-19 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 231
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9798 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9753, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-20 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 158
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9753 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9754, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-20 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 188
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9754 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10386, c.id, 'finalizado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-20 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 254
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10386 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10388, c.id, 'concluida', null, '2026-08-20 15:36:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 284
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10388 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9800, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS POR NOSSA CONTA', '2026-08-21 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 41
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9800 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9801, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-21 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 87
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9801 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9802, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS POR NOSSA CONTA', '2026-08-21 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 42
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9802 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10216, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-21 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 50
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10216 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10384, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CTA 5 / CTA 6', '2026-08-22 12:26:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 49
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10384 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9788, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-24 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 268
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9788 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9803, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-24 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 8
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9803 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10343, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-24 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 282
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10343 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9804, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 92
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9804 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9805, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 256
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9805 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9806, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 257
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9806 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9807, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 217
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9807 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9809, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 203
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9809 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9810, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 246
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9810 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9811, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 181
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9811 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9812, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 245
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9812 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9813, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA COM TROCAS DE ÓLEOS E FILTROS CONFORME PROPOSTA  APROVADA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 159
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9813 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9814, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-25 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 200
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9814 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9817, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA COM TROCAS DE ÓLEOS E FILTROS CONFORME PROPOSTA  APROVADA', '2026-08-26 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 122
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9817 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9819, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-26 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 19
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9819 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9820, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA COM TROCAS DE ÓLEOS E FILTROS CONFORME PROPOSTA  APROVADA', '2026-08-26 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 96
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9820 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 10307, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-26 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 264
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 10307 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9799, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-27 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 212
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9799 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9821, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-27 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 90
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9821 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9822, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-27 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 265
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9822 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9823, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME O CRONOGRAMA', '2026-08-27 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 14
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9823 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9824, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA COM TROCA DE OLÉO E FILTROS POR NOSSA CONTA', '2026-08-27 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 202
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9824 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9826, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-28 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 56
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9826 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9827, c.id, 'concluida', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-28 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 151
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9827 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9828, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-28 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 60
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9828 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9829, c.id, 'agendado', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-28 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 53
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9829 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9830, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-28 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 55
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9830 on conflict do nothing;
insert into ordens_servico (numero_legado, cliente_id, status, descricao, data_inicio_prevista, data_fim_prevista, importado)
select 9831, c.id, 'andamento', 'MANUTENÇÃO PREVENTIVA CONFORME CRONOGRAMA', '2026-08-28 08:00:00-03'::timestamptz, null, true
from clientes c where c.codigo_legado = 59
on conflict (numero_legado) do nothing;
insert into os_tipos (os_id, tipo) select o.id, 'manutencao_preventiva' from ordens_servico o where o.numero_legado = 9831 on conflict do nothing;

commit;
