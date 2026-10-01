import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_TEMA = '@genforce/modo_escuro';

export const TEMAS = {
  claro: {
    fundo: '#ffffff',
    fundoSecundario: '#fafafa',
    fundoCard: '#ffffff',
    texto: '#111111',
    textoSecundario: '#666666',
    textoSuave: '#888888',
    borda: '#eeeeee',
    bordaInput: '#cccccc',
    primario: '#007AFF',
    primarioFundo: '#e8f1ff',
    primarioTexto: '#0b5ed7',
    erro: '#e53935',
    overlay: 'rgba(0,0,0,0.45)',
    placeholder: '#999999',
    chipTipoFundo: '#eef5ff',
    chipEquipFundo: '#f3f3f3',
  },
  escuro: {
    fundo: '#121212',
    fundoSecundario: '#1e1e1e',
    fundoCard: '#1c1c1c',
    texto: '#f2f2f2',
    textoSecundario: '#b0b0b0',
    textoSuave: '#999999',
    borda: '#333333',
    bordaInput: '#555555',
    primario: '#4da3ff',
    primarioFundo: '#1a3050',
    primarioTexto: '#8ec5ff',
    erro: '#ff6b6b',
    overlay: 'rgba(0,0,0,0.6)',
    placeholder: '#888888',
    chipTipoFundo: '#1a3050',
    chipEquipFundo: '#2a2a2a',
  },
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

export function TemaProvider({ children }) {
  const [modoEscuro, setModoEscuro] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
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
