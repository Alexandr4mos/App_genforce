-- E-mail alternativo do cliente (Prompt 3, Parte 1)
alter table clientes add column if not exists email_alternativo text;
