/** Domínio interno para logins criados pelo app (Parte 1 Prompt 5). */
export const DOMINIO_INTERNO = 'genforce.app';

/** Converte o texto digitado no login para e-mail do Supabase Auth. */
export function emailAuthDeLogin(login) {
  const texto = (login || '').trim();
  if (!texto) return '';
  if (texto.includes('@')) return texto;
  return `${texto.toLowerCase()}@${DOMINIO_INTERNO}`;
}

export function ehPrivilegiado(papel) {
  return papel === 'admin' || papel === 'supervisor';
}

export const PAPEIS_USUARIO = [
  { valor: 'tecnico', rotulo: 'Técnico' },
  { valor: 'admin', rotulo: 'Admin / supervisor' },
];

export function rotuloPapel(papel) {
  if (papel === 'admin' || papel === 'supervisor') return 'Admin / supervisor';
  if (papel === 'tecnico') return 'Técnico';
  return papel || '—';
}

/** Normaliza login digitado no cadastro (sem @): minúsculas, sem acentos, só [a-z0-9._-]. */
export function normalizarLoginUsuario(texto) {
  return (texto || '')
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9._-]/g, '');
}

/** Primeira palavra do nome completo como sugestão de login. */
export function loginSugeridoDeNome(nome) {
  const primeira = (nome || '').trim().split(/\s+/)[0] || '';
  return normalizarLoginUsuario(primeira);
}
