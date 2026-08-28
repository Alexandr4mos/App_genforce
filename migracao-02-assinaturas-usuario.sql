-- Vínculo de assinatura de técnico com conta de usuário (Dashboard comparativo)
alter table assinaturas add column if not exists usuario_id uuid references usuarios(id);

create index if not exists idx_assinaturas_usuario on assinaturas(usuario_id);
