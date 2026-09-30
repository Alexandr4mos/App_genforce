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
  { valor: 'supervisor', rotulo: 'Supervisor' },
  { valor: 'admin', rotulo: 'Admin' },
];

export function rotuloPapel(papel) {
  return PAPEIS_USUARIO.find((p) => p.valor === papel)?.rotulo || papel || '—';
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

/**
 * Logout resiliente: tenta revogar sessão global; em 5xx/rede faz retry e,
 * se ainda falhar, limpa só a sessão local (UI volta ao login de qualquer forma).
 */
export async function sairComRetry(clienteAuth, { tentativas = 2 } = {}) {
  let ultimoErro = null;
  for (let i = 0; i < tentativas; i++) {
    const { error } = await clienteAuth.signOut({ scope: 'global' });
    if (!error) return { ok: true, escopo: 'global' };
    ultimoErro = error;
    const status = error?.status || error?.statusCode;
    const intermitente = !status || status >= 500 || status === 429;
    if (!intermitente) break;
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }

  const { error: erroLocal } = await clienteAuth.signOut({ scope: 'local' });
  if (!erroLocal) return { ok: true, escopo: 'local', aviso: ultimoErro };
  return { ok: false, erro: erroLocal || ultimoErro };
}
