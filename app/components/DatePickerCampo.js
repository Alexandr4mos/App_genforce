import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
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
 * Calendário compacto em sheet modal — mês inteiro visível ou com scroll interno.
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

  return (
    <>
      <TouchableOpacity
        style={[styles.wrap, { borderColor: cores.bordaInput, backgroundColor: cores.fundoCard }]}
        onPress={abrir}
        activeOpacity={0.8}
      >
        <Text style={{ color: value ? cores.texto : cores.placeholder, fontSize: 16 }}>
          {selecionado ? dateParaDisplay(selecionado) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={aberto}
        transparent
        animationType="slide"
        onRequestClose={() => setAberto(false)}
        statusBarTranslucent
      >
        <Pressable style={[styles.overlay, { backgroundColor: cores.overlay }]} onPress={() => setAberto(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.puxador} />
            <Text style={[styles.sheetTitulo, { color: cores.texto }]}>{placeholder}</Text>

            <View style={styles.navMes}>
              <TouchableOpacity
                onPress={() => {
                  const p = mesAnterior(anoVisivel, mesVisivel);
                  setAnoVisivel(p.visibleYear);
                  setMesVisivel(p.visibleMonth);
                }}
                style={styles.navBtn}
              >
                <Text style={{ color: cores.primario, fontSize: 20 }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ color: cores.texto, fontWeight: '700', fontSize: 15 }}>
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
                <Text style={{ color: cores.primario, fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.calendarioScroll} bounces={false} showsVerticalScrollIndicator={false}>
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
                      style={[
                        styles.celula,
                        isSel && { backgroundColor: cores.primario },
                        !noMes && styles.celulaForaMes,
                      ]}
                      onPress={() => {
                        if (!noMes) return;
                        onChange(dateParaIso(date));
                        setAberto(false);
                      }}
                      disabled={!noMes}
                    >
                      <Text
                        style={{
                          color: !noMes ? cores.textoSuave : isSel ? '#fff' : cores.texto,
                          fontWeight: isSel ? '700' : '500',
                          fontSize: 14,
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={[styles.rodape, { borderTopColor: cores.borda }]}>
              {value ? (
                <TouchableOpacity
                  onPress={() => {
                    onChange('');
                    setAberto(false);
                  }}
                  style={styles.rodapeBtn}
                >
                  <Text style={{ color: cores.erro, textAlign: 'center', fontWeight: '600' }}>Limpar data</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => setAberto(false)} style={styles.rodapeBtn}>
                <Text style={{ color: cores.primario, textAlign: 'center', fontWeight: '600' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
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
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: '78%',
  },
  puxador: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 8,
  },
  sheetTitulo: { fontSize: 15, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  navMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navBtn: { paddingHorizontal: 12, paddingVertical: 2 },
  calendarioScroll: {
    maxHeight: 280,
  },
  diasHeader: { flexDirection: 'row', marginBottom: 2 },
  diaHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  celulaForaMes: { opacity: 0.35 },
  rodape: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 4,
  },
  rodapeBtn: { paddingVertical: 10 },
});
