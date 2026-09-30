/**
 * Corrige nomes gravados exatamente em dobro
 * (ex.: "FulanoFulano" → "Fulano").
 */
export function normalizarNomeResponsavel(nome) {
  const texto = String(nome || '').trim();
  if (texto.length < 4 || texto.length % 2 !== 0) return texto;
  const metade = texto.length / 2;
  const esquerda = texto.slice(0, metade);
  const direita = texto.slice(metade);
  if (esquerda === direita) return esquerda;
  return texto;
}
