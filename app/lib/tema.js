import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_TEMA = '@genforce/modo_escuro';

// Design tokens — fonte única de verdade visual. Ver docs/DESIGN-SYSTEM.md.
// As chaves antigas (fundo, texto, primario…) foram mantidas para que as telas
// existentes herdem a nova paleta sem alterações.
export const TEMAS = {
  claro: {
    fundo: '#F5F7FA',
    fundoSecundario: '#EEF1F6',
    fundoCard: '#FFFFFF',
    texto: '#0F172A',
    textoSecundario: '#475569',
    textoSuave: '#64748B',
    borda: '#E5E9F0',
    bordaInput: '#CBD5E1',
    primario: '#1E8CFF',
    primarioHover: '#1570D4',
    primarioFundo: '#E8F3FF',
    primarioTexto: '#0F5FB8',
    sobrePrimario: '#FFFFFF',
    sucesso: '#15803D',
    sucessoFundo: '#DCFCE7',
    alerta: '#B45309',
    alertaFundo: '#FEF3C7',
    erro: '#DC2626',
    erroFundo: '#FEE2E2',
    info: '#1E8CFF',
    infoFundo: '#E8F3FF',
    overlay: 'rgba(15,23,42,0.45)',
    placeholder: '#94A3B8',
    chipTipoFundo: '#E8F3FF',
    chipEquipFundo: '#EEF1F6',
    foco: 'rgba(30,140,255,0.35)',
  },
  escuro: {
    fundo: '#0B1120',
    fundoSecundario: '#182238',
    fundoCard: '#131C2E',
    texto: '#E6EAF2',
    textoSecundario: '#A3AFC2',
    textoSuave: '#8492A6',
    borda: '#23304A',
    bordaInput: '#34435F',
    primario: '#5BAEFF',
    primarioHover: '#84C3FF',
    primarioFundo: '#0F2A4A',
    primarioTexto: '#A8D4FF',
    sobrePrimario: '#0B1120',
    sucesso: '#4ADE80',
    sucessoFundo: '#14301F',
    alerta: '#FBBF24',
    alertaFundo: '#3A2A0B',
    erro: '#F87171',
    erroFundo: '#3B1616',
    info: '#5BAEFF',
    infoFundo: '#0F2A4A',
    overlay: 'rgba(0,0,0,0.6)',
    placeholder: '#64748B',
    chipTipoFundo: '#0F2A4A',
    chipEquipFundo: '#182238',
    foco: 'rgba(91,174,255,0.45)',
  },
};

// Cor de marca estática (Genforce Manutenções — alinhada a lib/brand.js).
export const COR_MARCA = '#1E8CFF';

// Escalas não-cromáticas (iguais nos dois temas).
export const RAIO = { sm: 8, md: 12, lg: 16, pill: 999 };
export const ESPACO = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const FONTE = {
  familia:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  tamanho: { xs: 12, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28 },
};
export const MOVIMENTO = { rapido: 150, normal: 200 };
export const LARGURA_DESKTOP = 1024;
export const ALVO_TOQUE = 44;

// Sombras em camadas (boxShadow — `shadow*` está deprecado no react-native-web).
export const SOMBRA = {
  sm: '0 1px 2px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.04)',
  md: '0 4px 12px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.06)',
  lg: '0 12px 32px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.08)',
};

/**
 * Alinha status bar / nav chrome do PWA e o fundo de html/body/#root
 * com a cor do app (evita faixas azul/preta no Android standalone).
 */
export function aplicarChromeWeb(corFundo) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const cor = corFundo || TEMAS.claro.fundo;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', cor);

  document.documentElement.style.backgroundColor = cor;
  if (document.body) document.body.style.backgroundColor = cor;
  const root = document.getElementById('root');
  if (root) root.style.backgroundColor = cor;
}

const TemaContext = createContext(null);

// Web: carrega a Inter e define estilos globais (foco visível, números tabulares).
function instalarEstilosGlobaisWeb() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('gf-estilos')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
  const estilo = document.createElement('style');
  estilo.id = 'gf-estilos';
  estilo.textContent = `
    html, body { font-family: ${FONTE.familia}; -webkit-font-smoothing: antialiased; }
    body { font-variant-numeric: tabular-nums; }
    [role="button"]:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible,
    textarea:focus-visible, [tabindex]:focus-visible { outline: 2px solid #1E8CFF; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `;
  document.head.appendChild(estilo);
}

export function TemaProvider({ children }) {
  const [modoEscuro, setModoEscuro] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    instalarEstilosGlobaisWeb();
    AsyncStorage.getItem(CHAVE_TEMA)
      .then((valor) => {
        if (valor === '1') setModoEscuro(true);
        else if (valor === '0') setModoEscuro(false);
      })
      .catch(console.log)
      .finally(() => setCarregado(true));
  }, []);

  const alternarTema = () => {
    setModoEscuro((atual) => {
      const proximo = !atual;
      AsyncStorage.setItem(CHAVE_TEMA, proximo ? '1' : '0').catch(console.log);
      return proximo;
    });
  };

  const value = useMemo(
    () => ({
      modoEscuro,
      carregado,
      cores: modoEscuro ? TEMAS.escuro : TEMAS.claro,
      alternarTema,
      aplicarChromeWeb,
    }),
    [modoEscuro, carregado]
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error('useTema precisa estar dentro de TemaProvider');
  }
  return ctx;
}
