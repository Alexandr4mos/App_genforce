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

/** Normaliza login digitado no cadastro (sem @). */
export function normalizarLoginUsuario(texto) {
  return (texto || '').trim().toLowerCase().replace(/@.*/, '');
}
