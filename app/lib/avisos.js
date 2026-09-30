// Feedback ao usuário. A API (avisar / confirmarAcao) é a mesma de antes, mas agora
// renderiza toast e modal de confirmação próprios (components/ui/FeedbackHost.js)
// no lugar de window.alert/confirm.

let ouvinte = null;

export function registrarOuvinteFeedback(fn) {
  ouvinte = fn;
  return () => {
    if (ouvinte === fn) ouvinte = null;
  };
}

function ehErro(mensagem, titulo) {
  return /erro|não foi possível|falha|sem permissão|inválid/i.test(`${titulo} ${mensagem}`);
}

export function avisar(mensagem, titulo = 'Aviso') {
  if (ouvinte) {
    ouvinte({
      tipo: 'toast',
      mensagem: String(mensagem ?? ''),
      titulo,
      variante: ehErro(mensagem, titulo) ? 'erro' : 'info',
    });
    return;
  }
  // Fallback antes do host montar (não deve acontecer em uso normal).
  console.warn(`[${titulo}] ${mensagem}`);
}

export function confirmarAcao(mensagem) {
  return new Promise((resolve) => {
    if (!ouvinte) {
      resolve(false);
      return;
    }
    ouvinte({ tipo: 'confirmar', mensagem: String(mensagem ?? ''), resolver: resolve });
  });
}
