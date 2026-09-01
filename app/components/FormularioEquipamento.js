import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../lib/tema';
import { TIPOS_FILTRO, PERIODICIDADES_MANUTENCAO } from '../lib/constantes';
import SecaoColapsavel from './SecaoColapsavel';
import DatePickerCampo from './DatePickerCampo';

export default function FormularioEquipamento({ valores, onChange, filtros, onChangeFiltros }) {
  const { cores } = useTema();
  const inputStyle = [
    styles.input,
    { borderColor: cores.bordaInput, color: cores.texto, backgroundColor: cores.fundo },
  ];

  function adicionarFiltro() {
    onChangeFiltros([...(filtros || []), { tipo_filtro: 'oleo', numero_peca: '', observacao: '' }]);
  }

  function removerFiltro(indice) {
    onChangeFiltros((filtros || []).filter((_, i) => i !== indice));
  }

  function atualizarFiltro(indice, campo, valor) {
    onChangeFiltros(
      (filtros || []).map((f, i) => (i === indice ? { ...f, [campo]: valor } : f))
    );
  }

  return (
    <View>
      <SecaoColapsavel titulo="Identificação" subtitulo="Campos obrigatórios" abertoInicial>
        <TextInput
          style={inputStyle}
          placeholder="Identificação / tag (ex: GMG 03) *"
          placeholderTextColor={cores.placeholder}
          value={valores.tag}
          onChangeText={(v) => onChange('tag', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Fabricante do GMG"
          placeholderTextColor={cores.placeholder}
          value={valores.fabricante_gmg || ''}
          onChangeText={(v) => onChange('fabricante_gmg', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Potência (KVA)"
          placeholderTextColor={cores.placeholder}
          value={valores.potencia_kva || ''}
          onChangeText={(v) => onChange('potencia_kva', v)}
          keyboardType="numeric"
        />
        <TextInput
          style={inputStyle}
          placeholder="Tensão"
          placeholderTextColor={cores.placeholder}
          value={valores.tensao || ''}
          onChangeText={(v) => onChange('tensao', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Tipo de GMG"
          placeholderTextColor={cores.placeholder}
          value={valores.tipo_gmg || ''}
          onChangeText={(v) => onChange('tipo_gmg', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Nº série GMG"
          placeholderTextColor={cores.placeholder}
          value={valores.n_serie_gmg || ''}
          onChangeText={(v) => onChange('n_serie_gmg', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Ano de fabricação"
          placeholderTextColor={cores.placeholder}
          value={valores.ano_fabricacao || ''}
          onChangeText={(v) => onChange('ano_fabricacao', v)}
          keyboardType="numeric"
        />
      </SecaoColapsavel>

      <SecaoColapsavel titulo="Motor">
        <TextInput
          style={inputStyle}
          placeholder="Fabricante do motor"
          placeholderTextColor={cores.placeholder}
          value={valores.fabricante_motor || ''}
          onChangeText={(v) => onChange('fabricante_motor', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Modelo do motor"
          placeholderTextColor={cores.placeholder}
          value={valores.modelo_motor || ''}
          onChangeText={(v) => onChange('modelo_motor', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Nº série do motor"
          placeholderTextColor={cores.placeholder}
          value={valores.n_serie_motor || ''}
          onChangeText={(v) => onChange('n_serie_motor', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Placa do motor"
          placeholderTextColor={cores.placeholder}
          value={valores.placa_motor || ''}
          onChangeText={(v) => onChange('placa_motor', v)}
        />
      </SecaoColapsavel>

      <SecaoColapsavel titulo="Alternador">
        <TextInput
          style={inputStyle}
          placeholder="Fabricante do alternador"
          placeholderTextColor={cores.placeholder}
          value={valores.fabricante_alternador || ''}
          onChangeText={(v) => onChange('fabricante_alternador', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Modelo do alternador"
          placeholderTextColor={cores.placeholder}
          value={valores.modelo_alternador || ''}
          onChangeText={(v) => onChange('modelo_alternador', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Nº série do alternador"
          placeholderTextColor={cores.placeholder}
          value={valores.n_serie_alternador || ''}
          onChangeText={(v) => onChange('n_serie_alternador', v)}
        />
        <TextInput
          style={inputStyle}
          placeholder="Placa do alternador"
          placeholderTextColor={cores.placeholder}
          value={valores.placa_alternador || ''}
          onChangeText={(v) => onChange('placa_alternador', v)}
        />
      </SecaoColapsavel>

      <SecaoColapsavel titulo="Contrato e filtros">
        <Text style={[styles.labelData, { color: cores.texto }]}>Periodicidade de manutenção</Text>
        <View style={styles.tipoFiltroRow}>
          {PERIODICIDADES_MANUTENCAO.map((p) => {
            const selecionado = valores.periodicidade_manutencao === p.valor;
            return (
              <TouchableOpacity
                key={p.valor}
                style={[
                  styles.tipoChip,
                  {
                    borderColor: cores.borda,
                    backgroundColor: selecionado ? cores.primario : cores.fundoCard,
                  },
                ]}
                onPress={() => onChange('periodicidade_manutencao', selecionado ? '' : p.valor)}
              >
                <Text style={{ color: selecionado ? '#fff' : cores.texto, fontSize: 11 }}>
                  {p.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.labelData, { color: cores.texto }]}>Início do contrato de manutenção</Text>
        <DatePickerCampo
          value={valores.data_inicio_contrato || ''}
          onChange={(v) => onChange('data_inicio_contrato', v)}
          placeholder="Toque para escolher a data"
        />

        <Text style={[styles.subtituloFiltros, { color: cores.texto }]}>Numeração dos filtros</Text>
        {(filtros || []).map((filtro, indice) => (
          <View
            key={`filtro-${indice}`}
            style={[styles.filtroCard, { borderColor: cores.borda, backgroundColor: cores.fundoSecundario }]}
          >
            <Text style={[styles.filtroIndice, { color: cores.textoSecundario }]}>Filtro {indice + 1}</Text>
            <View style={styles.tipoFiltroRow}>
              {TIPOS_FILTRO.map((t) => (
                <TouchableOpacity
                  key={t.valor}
                  style={[
                    styles.tipoChip,
                    {
                      borderColor: cores.borda,
                      backgroundColor: filtro.tipo_filtro === t.valor ? cores.primario : cores.fundoCard,
                    },
                  ]}
                  onPress={() => atualizarFiltro(indice, 'tipo_filtro', t.valor)}
                >
                  <Text style={{ color: filtro.tipo_filtro === t.valor ? '#fff' : cores.texto, fontSize: 11 }}>
                    {t.rotulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={inputStyle}
              placeholder="Nº da peça *"
              placeholderTextColor={cores.placeholder}
              value={filtro.numero_peca}
              onChangeText={(v) => atualizarFiltro(indice, 'numero_peca', v)}
            />
            <TextInput
              style={inputStyle}
              placeholder="Observação"
              placeholderTextColor={cores.placeholder}
              value={filtro.observacao || ''}
              onChangeText={(v) => atualizarFiltro(indice, 'observacao', v)}
            />
            <TouchableOpacity onPress={() => removerFiltro(indice)}>
              <Text style={[styles.removerFiltro, { color: cores.erro || '#e53935' }]}>Remover filtro</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.adicionarFiltro, { borderColor: cores.primario }]} onPress={adicionarFiltro}>
          <Text style={[styles.adicionarFiltroTexto, { color: cores.primario }]}>+ Adicionar filtro</Text>
        </TouchableOpacity>
      </SecaoColapsavel>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  labelData: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  subtituloFiltros: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  filtroCard: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  filtroIndice: { fontSize: 12, marginBottom: 6 },
  tipoFiltroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tipoChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  removerFiltro: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  adicionarFiltro: { borderWidth: 1, borderRadius: 8, borderStyle: 'dashed', padding: 10, alignItems: 'center' },
  adicionarFiltroTexto: { fontWeight: '600' },
});
