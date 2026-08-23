import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useTema } from '../lib/tema';
import {
  DIAS_SEMANA,
  gradeDoMes,
  mesAnterior,
  mesmaData,
  mesmoMes,
  proximoMes,
  tituloMesAno,
} from '../lib/dateRangeService';

function isoParaDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateParaIso(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateParaDisplay(date) {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

/**
 * Seletor de data única. value/onChange no formato YYYY-MM-DD.
 */
export default function DatePickerCampo({ value, onChange, placeholder = 'Escolher data' }) {
  const { cores } = useTema();
  const selecionado = isoParaDate(value);
  const [aberto, setAberto] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(() => (selecionado || new Date()).getFullYear());
  const [mesVisivel, setMesVisivel] = useState(() => (selecionado || new Date()).getMonth());

  const dias = useMemo(() => gradeDoMes(anoVisivel, mesVisivel), [anoVisivel, mesVisivel]);

  function abrir() {
    const base = selecionado || new Date();
    setAnoVisivel(base.getFullYear());
    setMesVisivel(base.getMonth());
    setAberto(true);
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.wrap,
          { borderColor: cores.bordaInput, backgroundColor: cores.fundoCard },
        ]}
      >
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || '')}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: cores.texto,
            fontSize: 16,
            padding: 10,
            width: '100%',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.wrap, { borderColor: cores.bordaInput, backgroundColor: cores.fundoCard }]}
        onPress={abrir}
      >
        <Text style={{ color: value ? cores.texto : cores.placeholder, fontSize: 16, padding: 10 }}>
          {selecionado ? dateParaDisplay(selecionado) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.overlay} onPress={() => setAberto(false)}>
          <Pressable
            style={[styles.modal, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.navMes}>
              <TouchableOpacity
                onPress={() => {
                  const p = mesAnterior(anoVisivel, mesVisivel);
                  setAnoVisivel(p.visibleYear);
                  setMesVisivel(p.visibleMonth);
                }}
                style={styles.navBtn}
              >
                <Text style={{ color: cores.primario, fontSize: 18 }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ color: cores.texto, fontWeight: '700' }}>
                {tituloMesAno(anoVisivel, mesVisivel)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const p = proximoMes(anoVisivel, mesVisivel);
                  setAnoVisivel(p.visibleYear);
                  setMesVisivel(p.visibleMonth);
                }}
                style={styles.navBtn}
              >
                <Text style={{ color: cores.primario, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.diasHeader}>
              {DIAS_SEMANA.map((d) => (
                <Text key={d} style={[styles.diaHeader, { color: cores.textoSuave }]}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.grade}>
              {dias.map((date) => {
                const noMes = mesmoMes(date, anoVisivel, mesVisivel);
                const isSel = selecionado && mesmaData(date, selecionado);
                return (
                  <TouchableOpacity
                    key={dateParaIso(date)}
                    style={[styles.celula, isSel && { backgroundColor: cores.primario }]}
                    onPress={() => {
                      onChange(dateParaIso(date));
                      setAberto(false);
                    }}
                    disabled={!noMes}
                  >
                    <Text
                      style={{
                        color: !noMes ? cores.textoSuave : isSel ? '#fff' : cores.texto,
                        fontWeight: isSel ? '700' : '400',
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={() => setAberto(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: cores.primario, textAlign: 'center' }}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  navMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  diasHeader: { flexDirection: 'row', marginBottom: 4 },
  diaHeader: { flex: 1, textAlign: 'center', fontSize: 11, textTransform: 'uppercase' },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
