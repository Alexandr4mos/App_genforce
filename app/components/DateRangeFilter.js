import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  DIAS_SEMANA,
  PRESETS,
  PRESET_OPCOES,
  RANGE_SELECTION,
  calcularPreset,
  dataEhAntes,
  dataNoIntervalo,
  gradeDoMes,
  hojeNoTimezone,
  mesAnterior,
  mesmaData,
  mesmoMes,
  proximoMes,
  rotuloGatilho,
  tituloMesAno,
} from '../lib/dateRangeService';

function DayCell({ date, year, month, highlightStart, highlightEnd, onPress }) {
  const noMes = mesmoMes(date, year, month);
  const inicio = highlightStart && mesmaData(date, highlightStart);
  const fim = highlightEnd && mesmaData(date, highlightEnd);
  const noMeio =
    highlightStart &&
    highlightEnd &&
    dataNoIntervalo(date, highlightStart, highlightEnd) &&
    !inicio &&
    !fim;
  const soUmDia = inicio && (!highlightEnd || mesmaData(highlightStart, highlightEnd));

  return (
    <TouchableOpacity style={styles.diaWrap} onPress={() => onPress(date)} activeOpacity={0.7}>
      {noMeio ? <View style={styles.faixaMeio} /> : null}
      {inicio && highlightEnd && !soUmDia ? <View style={styles.faixaInicio} /> : null}
      {fim && !soUmDia ? <View style={styles.faixaFim} /> : null}
      <View
        style={[
          styles.diaCirculo,
          (inicio || fim || soUmDia) && styles.diaExtremo,
          !noMes && styles.diaForaDoMes,
        ]}
      >
        <Text
          style={[
            styles.diaTexto,
            !noMes && styles.diaTextoFora,
            (inicio || fim || soUmDia) && styles.diaTextoExtremo,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DateRangeFilter({ estado, onEstado, onPeriodoAplicado }) {
  const { titulo, subtitulo } = rotuloGatilho(estado.selectedPreset, estado.appliedRange);

  function atualizar(parcial) {
    onEstado((prev) => ({ ...prev, ...parcial }));
  }

  function abrirPresets() {
    atualizar({ ui: { ...estado.ui, presetMenuOpen: true, calendarOpen: false } });
  }

  function fecharPresets() {
    atualizar({ ui: { ...estado.ui, presetMenuOpen: false } });
  }

  function abrirCalendarioPersonalizado() {
    const usarAplicado = estado.selectedPreset === PRESETS.CUSTOM && estado.appliedRange?.start;
    const visivel = usarAplicado ? estado.appliedRange.start : estado.appliedRange.start;
    atualizar({
      ui: { presetMenuOpen: false, calendarOpen: true },
      draftRange: usarAplicado
        ? { start: estado.appliedRange.start, end: estado.appliedRange.end }
        : { start: null, end: null },
      rangeSelectionState: RANGE_SELECTION.IDLE,
      calendar: {
        visibleMonth: visivel.getMonth(),
        visibleYear: visivel.getFullYear(),
      },
    });
  }

  function fecharCalendario() {
    atualizar({
      ui: { ...estado.ui, calendarOpen: false },
      draftRange: { start: null, end: null },
      rangeSelectionState: RANGE_SELECTION.IDLE,
    });
  }

  function aplicarPreset(preset) {
    if (preset === PRESETS.CUSTOM) {
      abrirCalendarioPersonalizado();
      return;
    }
    const range = calcularPreset(preset, hojeNoTimezone());
    const proximo = {
      ...estado,
      mode: 'PRESET',
      selectedPreset: preset,
      appliedRange: range,
      draftRange: { start: null, end: null },
      rangeSelectionState: RANGE_SELECTION.COMPLETE,
      ui: { presetMenuOpen: false, calendarOpen: false },
    };
    onEstado(proximo);
    onPeriodoAplicado(range);
  }

  function navegarMes(direcao) {
    const prox =
      direcao < 0
        ? mesAnterior(estado.calendar.visibleYear, estado.calendar.visibleMonth)
        : proximoMes(estado.calendar.visibleYear, estado.calendar.visibleMonth);
    atualizar({ calendar: prox });
  }

  function tocarData(date) {
    if (estado.rangeSelectionState !== RANGE_SELECTION.SELECTING_END) {
      atualizar({
        draftRange: { start: date, end: null },
        rangeSelectionState: RANGE_SELECTION.SELECTING_END,
      });
      return;
    }

    const inicio = estado.draftRange.start;
    if (dataEhAntes(date, inicio)) {
      atualizar({
        draftRange: { start: date, end: null },
        rangeSelectionState: RANGE_SELECTION.SELECTING_END,
      });
      return;
    }

    const range = { start: inicio, end: date };
    const proximo = {
      ...estado,
      mode: 'CUSTOM',
      selectedPreset: PRESETS.CUSTOM,
      appliedRange: range,
      draftRange: range,
      rangeSelectionState: RANGE_SELECTION.COMPLETE,
      ui: { presetMenuOpen: false, calendarOpen: false },
    };
    onEstado(proximo);
    onPeriodoAplicado(range);
  }

  const highlightStart = estado.draftRange.start;
  const highlightEnd = estado.draftRange.end;

  const dias = gradeDoMes(estado.calendar.visibleYear, estado.calendar.visibleMonth);

  return (
    <>
      <TouchableOpacity style={styles.gatilho} onPress={abrirPresets} activeOpacity={0.8}>
        <View>
          <Text style={styles.gatilhoTitulo}>{titulo}</Text>
          <Text style={styles.gatilhoSubtitulo}>{subtitulo}</Text>
        </View>
        <Text style={styles.gatilhoSeta}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={estado.ui.presetMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={fecharPresets}
      >
        <Pressable style={styles.overlay} onPress={fecharPresets}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetPuxador} />
            <Text style={styles.sheetTitulo}>Período</Text>
            {PRESET_OPCOES.map((opcao) => {
              const ativo = estado.selectedPreset === opcao.valor;
              return (
                <TouchableOpacity
                  key={opcao.valor}
                  style={[styles.presetLinha, ativo && styles.presetLinhaAtiva]}
                  onPress={() => aplicarPreset(opcao.valor)}
                >
                  <Text style={[styles.presetTexto, ativo && styles.presetTextoAtivo]}>{opcao.rotulo}</Text>
                  {ativo ? <Text style={styles.presetCheck}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={estado.ui.calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={fecharCalendario}
      >
        <Pressable style={styles.overlay} onPress={fecharCalendario}>
          <Pressable style={styles.calendarioSheet} onPress={() => {}}>
            <View style={styles.sheetPuxador} />
            <Text style={styles.sheetTitulo}>Personalizado</Text>
            <Text style={styles.calendarioDica}>
              {estado.rangeSelectionState === RANGE_SELECTION.SELECTING_END
                ? 'Toque a data final do intervalo.'
                : 'Toque a data inicial e, em seguida, a data final.'}
            </Text>

            <View style={styles.calHeader}>
              <TouchableOpacity style={styles.navMes} onPress={() => navegarMes(-1)}>
                <Text style={styles.navMesTexto}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMesAno}>
                {tituloMesAno(estado.calendar.visibleYear, estado.calendar.visibleMonth)}
              </Text>
              <TouchableOpacity style={styles.navMes} onPress={() => navegarMes(1)}>
                <Text style={styles.navMesTexto}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.semanaRow}>
              {DIAS_SEMANA.map((dia) => (
                <Text key={dia} style={styles.semanaTexto}>
                  {dia}
                </Text>
              ))}
            </View>

            <View style={styles.grade}>
              {dias.map((date) => (
                <DayCell
                  key={formatarIsoLocal(date)}
                  date={date}
                  year={estado.calendar.visibleYear}
                  month={estado.calendar.visibleMonth}
                  highlightStart={highlightStart}
                  highlightEnd={highlightEnd}
                  onPress={tocarData}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function formatarIsoLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  gatilho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  gatilhoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  gatilhoSubtitulo: { fontSize: 12, color: '#666', marginTop: 2 },
  gatilhoSeta: { fontSize: 18, color: '#666' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
  },
  calendarioSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sheetPuxador: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  sheetTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, paddingHorizontal: 4 },
  presetLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  presetLinhaAtiva: { backgroundColor: '#e8f1ff' },
  presetTexto: { fontSize: 16, color: '#222' },
  presetTextoAtivo: { color: '#007AFF', fontWeight: '700' },
  presetCheck: { color: '#007AFF', fontWeight: 'bold' },
  calendarioDica: { fontSize: 13, color: '#666', marginBottom: 12, paddingHorizontal: 4 },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navMes: { paddingHorizontal: 16, paddingVertical: 6 },
  navMesTexto: { fontSize: 28, color: '#007AFF', fontWeight: '300' },
  calMesAno: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  semanaRow: { flexDirection: 'row', marginBottom: 4 },
  semanaTexto: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    color: '#888',
    textTransform: 'lowercase',
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  diaWrap: {
    width: '14.285%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  diaCirculo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  diaExtremo: { backgroundColor: '#007AFF' },
  diaForaDoMes: { opacity: 0.45 },
  diaTexto: { fontSize: 14, color: '#222' },
  diaTextoFora: { color: '#999' },
  diaTextoExtremo: { color: '#fff', fontWeight: '700' },
  faixaMeio: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#cfe3ff',
  },
  faixaInicio: {
    position: 'absolute',
    left: '50%',
    right: 0,
    height: 36,
    backgroundColor: '#cfe3ff',
  },
  faixaFim: {
    position: 'absolute',
    left: 0,
    right: '50%',
    height: 36,
    backgroundColor: '#cfe3ff',
  },
});
