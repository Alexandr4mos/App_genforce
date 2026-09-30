import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useTema } from '../lib/tema';
import { avisar } from '../lib/avisos';
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

function mascararDataDigitada(texto) {
  const nums = String(texto || '')
    .replace(/\D/g, '')
    .slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`;
}

/** Converte DD/MM/AAAA em YYYY-MM-DD, ou null se inválida. */
export function parseDisplayParaIso(texto) {
  const m = String(texto || '')
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (ano < 1900 || ano > 2100) return null;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return dateParaIso(d);
}

/**
 * Seletor de data única. value/onChange no formato YYYY-MM-DD.
 * Grade do calendário + modo digitação (rótulo clicável).
 */
export default function DatePickerCampo({ value, onChange, placeholder = 'Escolher data' }) {
  const { cores } = useTema();
  const selecionado = isoParaDate(value);
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState('grade'); // 'grade' | 'digitar'
  const [textoDigitado, setTextoDigitado] = useState('');
  const [anoVisivel, setAnoVisivel] = useState(() => (selecionado || new Date()).getFullYear());
  const [mesVisivel, setMesVisivel] = useState(() => (selecionado || new Date()).getMonth());

  const dias = useMemo(() => gradeDoMes(anoVisivel, mesVisivel), [anoVisivel, mesVisivel]);

  useEffect(() => {
    if (!aberto) return;
    setTextoDigitado(selecionado ? dateParaDisplay(selecionado) : '');
  }, [aberto, value]);

  function abrir() {
    const base = selecionado || new Date();
    setAnoVisivel(base.getFullYear());
    setMesVisivel(base.getMonth());
    setModo('grade');
    setTextoDigitado(selecionado ? dateParaDisplay(selecionado) : '');
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    setModo('grade');
  }

  function alternarModo() {
    if (modo === 'grade') {
      setTextoDigitado(selecionado ? dateParaDisplay(selecionado) : '');
      setModo('digitar');
    } else {
      const iso = parseDisplayParaIso(textoDigitado);
      if (iso) {
        const d = isoParaDate(iso);
        if (d) {
          setAnoVisivel(d.getFullYear());
          setMesVisivel(d.getMonth());
        }
      }
      setModo('grade');
    }
  }

  function confirmarDigitacao() {
    const iso = parseDisplayParaIso(textoDigitado);
    if (!iso) {
      avisar('Digite uma data válida no formato DD/MM/AAAA.', 'Data inválida');
      return;
    }
    onChange(iso);
    fechar();
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
        onRequestClose={fechar}
        statusBarTranslucent
      >
        <Pressable style={[styles.overlay, { backgroundColor: cores.overlay }]} onPress={fechar}>
          <Pressable
            style={[styles.sheet, { backgroundColor: cores.fundoCard, borderColor: cores.borda }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.puxador} />

            <TouchableOpacity onPress={alternarModo} activeOpacity={0.7} style={styles.tituloClicavel}>
              <Text style={[styles.sheetTitulo, { color: cores.primario }]}>{placeholder}</Text>
              <Text style={[styles.tituloDica, { color: cores.textoSecundario }]}>
                {modo === 'grade' ? 'Toque para digitar a data' : '◀ Voltar ao calendário'}
              </Text>
            </TouchableOpacity>

            {modo === 'digitar' ? (
              <View style={styles.modoDigitar}>
                <Text style={[styles.digitarLabel, { color: cores.texto }]}>Digite a data (DD/MM/AAAA)</Text>
                <TextInput
                  style={[
                    styles.digitarInput,
                    {
                      borderColor: cores.bordaInput,
                      color: cores.texto,
                      backgroundColor: cores.fundo,
                    },
                  ]}
                  value={textoDigitado}
                  onChangeText={(v) => setTextoDigitado(mascararDataDigitada(v))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={cores.placeholder}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.confirmarBtn, { backgroundColor: cores.primario }]}
                  onPress={confirmarDigitacao}
                >
                  <Text style={styles.confirmarBtnTexto}>Confirmar data</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={alternarModo} style={styles.voltarCalendario}>
                  <Text style={{ color: cores.primario, fontWeight: '600', textAlign: 'center' }}>
                    ◀ Voltar ao calendário
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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
                            fechar();
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
              </>
            )}

            <View style={[styles.rodape, { borderTopColor: cores.borda }]}>
              {value ? (
                <TouchableOpacity
                  onPress={() => {
                    onChange('');
                    fechar();
                  }}
                  style={styles.rodapeBtn}
                >
                  <Text style={{ color: cores.erro, textAlign: 'center', fontWeight: '600' }}>Limpar data</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={fechar} style={styles.rodapeBtn}>
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
  tituloClicavel: { marginBottom: 8, alignItems: 'center' },
  sheetTitulo: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  tituloDica: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  modoDigitar: { paddingVertical: 8, minHeight: 180 },
  digitarLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  digitarInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 18,
    marginBottom: 12,
    letterSpacing: 1,
  },
  confirmarBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmarBtnTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  voltarCalendario: { paddingVertical: 10 },
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
