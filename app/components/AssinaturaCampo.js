// Assinatura digital sem libs extras: canvas HTML + pointer events no web (PWA);
// no nativo, PanResponder + export SVG — evita react-native-webview / signature-canvas
// (não instalados; app é principalmente PWA no Expo 57).
import { useEffect, useRef, useState, createElement } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  PanResponder,
} from 'react-native';
import { useTema } from '../lib/tema';
import { avisar } from '../lib/avisos';

const LARGURA = 320;
const ALTURA = 140;

function pathsParaSvg(paths, width, height) {
  const d = paths
    .filter((s) => s.length > 0)
    .map((stroke) =>
      stroke.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    )
    .join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <path d="${d}" stroke="#111111" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function redesenharCanvas(canvas, paths) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paths.forEach((stroke) => {
    if (stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  });
}

export default function AssinaturaCampo({ titulo, assinatura, onSalvar, onExcluir, desabilitado }) {
  const { cores } = useTema();
  const [editando, setEditando] = useState(!assinatura);
  const [nome, setNome] = useState(assinatura?.nome_responsavel || '');
  const [paths, setPaths] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);
  const pathsRef = useRef([]);

  useEffect(() => {
    setEditando(!assinatura);
    setNome(assinatura?.nome_responsavel || '');
    setPaths([]);
    pathsRef.current = [];
    limparCanvas();
  }, [assinatura?.id, assinatura?.imagem_url]);

  function limparCanvas() {
    if (Platform.OS === 'web' && canvasRef.current) {
      redesenharCanvas(canvasRef.current, []);
    }
  }

  function iniciarTraco(x, y) {
    desenhandoRef.current = true;
    const atual = [...pathsRef.current, [{ x, y }]];
    pathsRef.current = atual;
    if (Platform.OS !== 'web') {
      setPaths(atual);
    }
    if (Platform.OS === 'web' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }

  function continuarTraco(x, y) {
    if (!desenhandoRef.current) return;
    const atual = pathsRef.current.slice();
    const ultimo = atual[atual.length - 1];
    if (!ultimo) return;
    ultimo.push({ x, y });
    pathsRef.current = atual;
    if (Platform.OS !== 'web') {
      setPaths(atual.map((s) => s.slice()));
    }

    if (Platform.OS === 'web' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }

  function finalizarTraco() {
    desenhandoRef.current = false;
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        iniciarTraco(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        continuarTraco(locationX, locationY);
      },
      onPanResponderRelease: finalizarTraco,
      onPanResponderTerminate: finalizarTraco,
    })
  ).current;

  function coordsDoEventoWeb(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function vincularCanvas(el) {
    if (canvasRef.current === el) return;
    canvasRef.current = el;
    if (el) limparCanvas();
  }

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current || !editando) return;
    const canvas = canvasRef.current;
    limparCanvas();

    const onPointerDown = (e) => {
      e.preventDefault();
      canvas.setPointerCapture?.(e.pointerId);
      const { x, y } = coordsDoEventoWeb(e);
      iniciarTraco(x, y);
    };
    const onPointerMove = (e) => {
      if (!desenhandoRef.current) return;
      e.preventDefault();
      const { x, y } = coordsDoEventoWeb(e);
      continuarTraco(x, y);
    };
    const onPointerUp = (e) => {
      e.preventDefault();
      finalizarTraco();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [editando]);

  async function gerarBlob() {
    const temTraço = pathsRef.current.some((s) => s.length > 1);
    if (!temTraço) return null;

    if (Platform.OS === 'web' && canvasRef.current) {
      redesenharCanvas(canvasRef.current, pathsRef.current);
      return new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => resolve(blob), 'image/png');
      }).then((blob) => ({ blob, contentType: 'image/png', extensao: 'png' }));
    }

    const svg = pathsParaSvg(pathsRef.current, LARGURA, ALTURA);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return { blob, contentType: 'image/svg+xml', extensao: 'svg' };
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      avisar('Informe o nome de quem assina.', 'Nome obrigatório');
      return;
    }
    const gerado = await gerarBlob();
    if (!gerado) {
      avisar('Desenhe a assinatura antes de salvar.', 'Assinatura vazia');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar({
        nome_responsavel: nome.trim(),
        blob: gerado.blob,
        contentType: gerado.contentType,
        extensao: gerado.extensao,
      });
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar() {
    setEditando(true);
    setNome(assinatura?.nome_responsavel || '');
    setPaths([]);
    pathsRef.current = [];
    setTimeout(limparCanvas, 0);
  }

  async function handleExcluir() {
    setSalvando(true);
    try {
      await onExcluir();
      setEditando(true);
      setNome('');
      setPaths([]);
      pathsRef.current = [];
      limparCanvas();
    } finally {
      setSalvando(false);
    }
  }

  function limparDesenho() {
    setPaths([]);
    pathsRef.current = [];
    limparCanvas();
  }

  if (assinatura && !editando) {
    return (
      <View style={[styles.bloco, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}>
        <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
        <View style={styles.miniaturaRow}>
          <Image source={{ uri: assinatura.imagem_url }} style={styles.miniatura} resizeMode="contain" />
          <Text style={[styles.nomeAssinado, { color: cores.texto }]}>
            {assinatura.nome_responsavel || '—'}
          </Text>
          {!desabilitado ? (
            <View style={styles.acoesRow}>
              <TouchableOpacity style={styles.acaoBotao} onPress={handleEditar}>
                <Text style={{ color: cores.primario }}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acaoBotao} onPress={handleExcluir} disabled={salvando}>
                <Text>🗑</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bloco, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}>
      <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
      <TextInput
        style={[
          styles.nomeInput,
          { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundo },
        ]}
        placeholder="Nome de quem assina"
        placeholderTextColor={cores.placeholder}
        value={nome}
        onChangeText={setNome}
        editable={!desabilitado && !salvando}
      />

      {Platform.OS === 'web'
        ? createElement('canvas', {
            ref: vincularCanvas,
            width: LARGURA,
            height: ALTURA,
            style: {
              width: LARGURA,
              height: ALTURA,
              border: `1px solid ${cores.bordaInput}`,
              borderRadius: 8,
              touchAction: 'none',
              backgroundColor: '#fff',
              maxWidth: '100%',
              display: 'block',
            },
          })
        : (
        <View
          style={[styles.areaNativa, { borderColor: cores.bordaInput }]}
          {...panResponder.panHandlers}
        >
          {paths.map((stroke, si) =>
            stroke.map((p, pi) => {
              if (pi === 0) return null;
              const prev = stroke[pi - 1];
              const dx = p.x - prev.x;
              const dy = p.y - prev.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <View
                  key={`${si}-${pi}`}
                  style={{
                    position: 'absolute',
                    left: prev.x,
                    top: prev.y - 1.25,
                    width: len,
                    height: 2.5,
                    backgroundColor: '#111',
                    transform: [{ rotate: `${angle}deg` }],
                  }}
                />
              );
            })
          )}
        </View>
      )}

      {!desabilitado ? (
        <View style={styles.botoesRow}>
          <TouchableOpacity style={styles.limparBotao} onPress={limparDesenho}>
            <Text style={{ color: cores.textoSecundario }}>Limpar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.salvarBotao, { backgroundColor: cores.primario }]}
            onPress={handleSalvar}
            disabled={salvando}
          >
            <Text style={styles.salvarTexto}>{salvando ? 'Salvando...' : 'Salvar assinatura'}</Text>
          </TouchableOpacity>
          {assinatura ? (
            <TouchableOpacity style={styles.acaoBotao} onPress={handleExcluir} disabled={salvando}>
              <Text>🗑</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  titulo: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  nomeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  areaNativa: {
    width: LARGURA,
    maxWidth: '100%',
    height: ALTURA,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  botoesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  limparBotao: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  salvarBotao: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  salvarTexto: { color: '#fff', fontWeight: '600' },
  miniaturaRow: { flexDirection: 'row', alignItems: 'center' },
  miniatura: {
    width: 120,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  nomeAssinado: { flex: 1, fontSize: 14, fontWeight: '600' },
  acoesRow: { flexDirection: 'row' },
  acaoBotao: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
