import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';

function normalizarCabecalho(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function splitCsv(linha, delim) {
  const result = [];
  let atual = '';
  let emAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (emAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        emAspas = !emAspas;
      }
    } else if (ch === delim && !emAspas) {
      result.push(atual.trim());
      atual = '';
    } else {
      atual += ch;
    }
  }
  result.push(atual.trim());
  return result;
}

function indiceColuna(cabecalho, candidatos) {
  return cabecalho.findIndex((c) => candidatos.includes(c));
}

export function parsearCsvClientes(texto) {
  const limpo = String(texto || '').replace(/^\uFEFF/, '');
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length === 0) return [];

  const amostra = linhas[0];
  const delim =
    amostra.split(';').length > amostra.split(',').length ? ';' : ',';

  const primeira = splitCsv(linhas[0], delim).map(normalizarCabecalho);
  const temCabecalho =
    indiceColuna(primeira, ['nome', 'nome fantasia', 'cliente', 'name']) >= 0 ||
    indiceColuna(primeira, ['razao social', 'razao_social', 'razao']) >= 0;

  const cabecalho = temCabecalho ? primeira : [];
  const idxNome = temCabecalho
    ? indiceColuna(cabecalho, ['nome', 'nome fantasia', 'cliente', 'name'])
    : 0;
  const idxRazao = temCabecalho
    ? indiceColuna(cabecalho, ['razao social', 'razao_social', 'razao'])
    : 1;
  const idxEndereco = temCabecalho
    ? indiceColuna(cabecalho, ['endereco', 'endereco completo', 'address'])
    : 2;

  const dados = temCabecalho ? linhas.slice(1) : linhas;
  const resultado = [];

  dados.forEach((linha, i) => {
    const cols = splitCsv(linha, delim);
    const nome = (idxNome >= 0 ? cols[idxNome] : cols[0] || '').trim();
    if (!nome) return;
    resultado.push({
      chave: `${i}-${nome}`,
      nome,
      razao_social: (idxRazao >= 0 ? cols[idxRazao] : '').trim() || null,
      endereco: (idxEndereco >= 0 ? cols[idxEndereco] : '').trim() || null,
    });
  });

  return resultado;
}

export default function ImportarClientes({ onBack }) {
  const { cores } = useTema();
  const [linhas, setLinhas] = useState([]);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [importando, setImportando] = useState(false);

  function escolherArquivo() {
    if (Platform.OS !== 'web') {
      avisar(
        'A importação por arquivo está disponível na versão web (PWA) do app.',
        'Importar clientes'
      );
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv,text/plain';
    input.onchange = async (evento) => {
      const file = evento.target.files && evento.target.files[0];
      if (!file) return;
      try {
        const texto = await file.text();
        const parsed = parsearCsvClientes(texto);
        if (parsed.length === 0) {
          avisar(
            'Não encontrei clientes neste arquivo. Use um CSV com as colunas nome, razão social e endereço.',
            'Arquivo vazio'
          );
          setLinhas([]);
          setNomeArquivo('');
          return;
        }
        setNomeArquivo(file.name);
        setLinhas(parsed);
      } catch (err) {
        avisar(err.message || 'Não foi possível ler o arquivo.', 'Erro ao ler CSV');
      }
    };
    input.click();
  }

  async function importar() {
    if (linhas.length === 0) {
      avisar('Escolha um arquivo CSV antes de importar.', 'Falta o arquivo');
      return;
    }

    setImportando(true);
    const payload = linhas.map((l) => ({
      nome: l.nome,
      razao_social: l.razao_social,
      endereco: l.endereco,
    }));

    const { error } = await supabase.from('clientes').insert(payload);
    setImportando(false);

    if (error) {
      avisar(error.message || 'Tente novamente.', 'Erro ao importar');
      return;
    }

    avisar(`${payload.length} cliente(s) importado(s) com sucesso.`, 'Importação concluída');
    setLinhas([]);
    setNomeArquivo('');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Importar clientes</Text>
      <Text style={[styles.texto, { color: cores.textoSecundario }]}>
        Envie um arquivo CSV com as colunas nome, razão social e endereço. A primeira linha pode ser o
        cabeçalho.
      </Text>

      <TouchableOpacity
        style={[styles.botaoArquivo, { borderColor: cores.primario }]}
        onPress={escolherArquivo}
      >
        <Text style={[styles.botaoArquivoTexto, { color: cores.primario }]}>
          {nomeArquivo ? `Arquivo: ${nomeArquivo}` : 'Escolher arquivo CSV'}
        </Text>
      </TouchableOpacity>

      {linhas.length > 0 ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>
            Prévia — {linhas.length} cliente(s)
          </Text>
          {linhas.slice(0, 30).map((l) => (
            <View
              key={l.chave}
              style={[styles.card, { borderColor: cores.borda, backgroundColor: cores.fundoCard }]}
            >
              <Text style={[styles.cardNome, { color: cores.texto }]}>{l.nome}</Text>
              {l.razao_social ? (
                <Text style={[styles.cardDetalhe, { color: cores.textoSecundario }]}>{l.razao_social}</Text>
              ) : null}
              {l.endereco ? (
                <Text style={[styles.cardDetalhe, { color: cores.textoSuave }]}>{l.endereco}</Text>
              ) : null}
            </View>
          ))}
          {linhas.length > 30 ? (
            <Text style={[styles.texto, { color: cores.textoSuave }]}>
              ...e mais {linhas.length - 30} na importação.
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.botaoImportar, { backgroundColor: cores.primario }]}
            onPress={importar}
            disabled={importando}
          >
            {importando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoImportarTexto}>Importar {linhas.length} cliente(s)</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  texto: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  botaoArquivo: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoArquivoTexto: { fontWeight: '700' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  cardNome: { fontWeight: '700' },
  cardDetalhe: { fontSize: 12, marginTop: 2 },
  botaoImportar: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoImportarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
