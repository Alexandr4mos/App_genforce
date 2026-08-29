-- Parte 3.3: remove cliente de teste "Alexandre Luiz" (sobra manual, não é cliente real)
-- Já aplicado no Supabase em 29/08/2026.
delete from ordens_servico where cliente_id = '57899825-9d40-48fe-a6f8-97517c4dbbab';
delete from clientes where id = '57899825-9d40-48fe-a6f8-97517c4dbbab';
