import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Button,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema } from '../lib/tema';
import { cnpjValido, limparNumeros } from '../lib/mascaras';
import SeletorCliente from '../components/SeletorCliente';
import FormularioCliente from '../components/FormularioCliente';

const CAMPOS_VAZIOS = {
  nome: '',
  razao_social: '',
  cnpj: '',
  telefone: '',
  email: '',
  cidade: '',
  uf: '',
};

export default function EditarCliente({ onBack }) {
  const { cores } = useTema();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [form, setForm] = useState(CAMPOS_VAZIOS);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, razao_social')
      .order('nome');
    if (error) {
      avisar(error.message, 'Erro ao carregar clientes');
      return;
    }
    setClientes(data || []);
  }

  async function selecionarCliente(id) {
    setClienteId(id);
    setCarregando(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('nome, razao_social, cnpj, telefone, email, cidade, uf')
      .eq('id', id)
      .single();
    setCarregando(false);

    if (error) {
      avisar(error.message, 'Erro ao carregar cliente');
      return;
    }

    setForm({
      nome: data.nome || '',
      razao_social: data.razao_social || '',
      cnpj: data.cnpj || '',
      telefone: data.telefone || '',
      email: data.email || '',
      cidade: data.cidade || '',
      uf: data.uf || '',
    });
  }

  function alterarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    if (!clienteId) {
      avisar('Selecione um cliente.', 'Falta informação');
      return;
    }
    if (!form.nome.trim()) {
      avisar('Informe o nome do cliente.', 'Preencha o campo obrigatório');
      return;
    }
    const cnpjLimpo = limparNumeros(form.cnpj);
    if (cnpjLimpo && !cnpjValido(form.cnpj)) {
      avisar('CNPJ inválido. Verifique os dígitos.', 'Formato incorreto');
      return;
    }
    if (!form.email?.trim()) {
      avisar(
        'Este cliente não tem e-mail. O relatório não poderá ser enviado automaticamente.',
        'E-mail recomendado'
      );
    }

    setSalvando(true);
    const { error } = await supabase
      .from('clientes')
      .update({
        nome: form.nome.trim(),
        razao_social: form.razao_social?.trim() || null,
        cnpj: form.cnpj?.trim() || null,
        telefone: form.telefone?.trim() || null,
        email: form.email?.trim() || null,
        cidade: form.cidade?.trim() || null,
        uf: form.uf || null,
      })
      .eq('id', clienteId);
    setSalvando(false);

    if (error) {
      avisar(error.message, 'Erro ao salvar cliente');
      return;
    }

    setClientes((prev) =>
      prev
        .map((c) =>
          c.id === clienteId ? { ...c, nome: form.nome.trim(), razao_social: form.razao_social?.trim() || null } : c
        )
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
    avisar('Dados do cliente atualizados.', 'Salvo');
  }

  const clienteAtual = clientes.find((c) => c.id === clienteId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cores.texto }]}>Editar cliente</Text>
      <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
        Corrija CNPJ, telefone, e-mail e endereço dos clientes importados ou cadastrados.
      </Text>

      <Text style={[styles.label, { color: cores.texto }]}>Cliente</Text>
      <SeletorCliente
        clientes={clientes}
        clienteId={clienteId}
        onSelecionar={(c) => selecionarCliente(c.id)}
      />

      {carregando ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

      {clienteAtual && !carregando ? (
        <>
          <Text style={[styles.label, { color: cores.texto }]}>Dados — {clienteAtual.nome}</Text>
          <FormularioCliente valores={form} onChange={alterarCampo} mostrarRazaoSocial />
          <Button title={salvando ? 'Salvando...' : 'Salvar alterações'} onPress={salvar} disabled={salvando} />
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitulo: { fontSize: 13, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
});
