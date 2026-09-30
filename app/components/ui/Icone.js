import { createElement } from 'react';
import { Platform, View } from 'react-native';

// Conjunto único de ícones (traço 24x24, estilo Lucide). Renderiza SVG inline na web
// sem depender de biblioteca; no nativo fica um espaço reservado do mesmo tamanho.
const CAMINHOS = {
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  refresh: ['M21 12a9 9 0 1 1-2.64-6.36', 'M21 3v6h-6'],
  plus: ['M12 5v14', 'M5 12h14'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  chart: ['M3 3v18h18', 'M7 15l4-4 3 3 5-6'],
  package: ['M21 8l-9-5-9 5v8l9 5 9-5z', 'M3.3 7.5L12 12.5l8.7-5', 'M12 22V12.5'],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  building: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-6h6v6', 'M9 10h.01', 'M15 10h.01'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'],
  sun: [
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M12 2v2',
    'M12 20v2',
    'M4.9 4.9l1.4 1.4',
    'M17.7 17.7l1.4 1.4',
    'M2 12h2',
    'M20 12h2',
    'M4.9 19.1l1.4-1.4',
    'M17.7 6.3l1.4-1.4',
  ],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  more: ['M12 5h.01', 'M12 12h.01', 'M12 19h.01'],
  check: ['M20 6L9 17l-5-5'],
  alert: [
    'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 16v-4', 'M12 8h.01'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronRight: ['M9 6l6 6-6 6'],
  chevronLeft: ['M15 6l-6 6 6 6'],
  calendar: [
    'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
    'M16 2v4',
    'M8 2v4',
    'M3 10h18',
  ],
  file: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M16 13H8',
    'M16 17H8',
  ],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  trash: [
    'M3 6h18',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  ],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  inbox: [
    'M22 12h-6l-2 3h-4l-2-3H2',
    'M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z',
  ],
  zap: ['M13 2L3 14h9l-1 8 10-12h-9z'],
};

export default function Icone({ nome, tamanho = 20, cor = 'currentColor', espessura = 2 }) {
  const caminhos = CAMINHOS[nome];
  if (Platform.OS !== 'web' || !caminhos) {
    return <View style={{ width: tamanho, height: tamanho }} />;
  }
  return (
    <View style={{ width: tamanho, height: tamanho, pointerEvents: 'none' }} accessibilityElementsHidden>
      {createElement(
        'svg',
        {
          width: tamanho,
          height: tamanho,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: cor,
          strokeWidth: espessura,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        caminhos.map((d, i) => createElement('path', { key: i, d }))
      )}
    </View>
  );
}
