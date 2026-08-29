import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar, confirmarAcao } from '../lib/avisos';
import { useTema } from '../lib/tema';
import { PAPEIS_USUARIO, rotuloPapel, normalizarLoginUsuario, ehPrivilegiado } from '../lib/auth';

const FORM_VAZIO = { nome: '', usuario: '', papel: 'tecnico', senha: '' };

export default function GestaoUsuarios({ onBack, userId }) {
  const { cores } = useTema();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('usuarios')
      .select('papel')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!ehPrivilegiado(data?.papel)) onBack?.();
      });
  }, [userId, onBack]);

  async function carregarUsuarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, papel, ativo')
      .order('nome');
    setLoading(false);

    if (error) {
      avisar(error.message, 'Erro ao carregar usuários');
      return;
    }
    setUsuarios(data || []);
  }

  function abrirFormulario() {
    setForm(FORM_VAZIO);
    setErroForm('');
    setFormAberto(true);
  }

  function fecharFormulario() {
    setForm(FORM_VAZIO);
    setErroForm('');
    setFormAberto(false);
  }

  async function criarUsuario() {
    setErroForm('');
    const nome = form.nome.trim();
    const usuario = normalizarLoginUsuario(form.usuario);
    const senha = form.senha;

    if (!nome) {
      setErroForm('Informe o nome completo.');
      return;
    }
    if (!usuario) {
      setErroForm('Informe o usuário de login.');
      return;
    }
    if (!senha || senha.length < 6) {
      setErroForm('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase.functions.invoke('admin-criar-usuario', {
      body: {
        nome,
        usuario,
        papel: form.papel,
        senha,
      },
    });
    setSalvando(false);
    setForm((prev) => ({ ...prev, senha: '' }));

    if (error) {
      let msg = error.message || 'Erro ao criar usuário.';
      try {
        const corpo = await error.context?.json?.();
        if (corpo?.error) msg = corpo.error;
      } catch {
        // mantém msg padrão
      }
      setErroForm(msg);
      return;
    }

    if (data?.error) {
      setErroForm(data.error);
      return;
    }

    fecharFormulario();
    await carregarUsuarios();
    avisar('Conta criada com sucesso.', 'Usuário criado');
  }

  async function alternarPapel(u) {
    const novoPapel = u.papel === 'tecnico' ? 'admin' : 'tecnico';
    const rotuloNovo = rotuloPapel(novoPapel);
    const confirmado = await confirmarAcao(
      `Alterar ${u.nome} para ${rotuloNovo}?`
    );
    if (!confirmado) return;

    setAtualizandoId(u.id);
    const { error } = await supabase
      .from('usuarios')
      .update({ papel: novoPapel })
      .eq('id', u.id);
    setAtualizandoId(null);

    if (error) {
      avisar(error.message, 'Erro ao atualizar papel');
      return;
    }

    setUsuarios((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, papel: novoPapel } : item))
    );
  }

  async function alternarAtivo(u) {
    const reativar = !u.ativo;
    const msg = reativar
      ? `Reativar a conta de ${u.nome}?`
      : `Desativar a conta de ${u.nome}? Ela não poderá mais entrar no app.`;
    const confirmado = await confirmarAcao(msg);
    if (!confirmado) return;

    setAtualizandoId(u.id);
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: reativar })
      .eq('id', u.id);
    setAtualizandoId(null);

    if (error) {
      avisar(error.message, 'Erro ao atualizar conta');
      return;
    }

    setUsuarios((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, ativo: reativar } : item))
    );
    avisar(reativar ? 'Conta reativada.' : 'Conta desativada.', 'Atualizado');
  }

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: cores.primario }]}>{'< Voltar'}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: cores.texto }]}>Gestão de usuários</Text>
        <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
          Cadastre contas da equipe e ajuste papéis de acesso.
        </Text>

        <TouchableOpacity
          style={[styles.botaoNovo, { backgroundColor: cores.primario }]}
          onPress={abrirFormulario}
        >
          <Text style={styles.botaoNovoTexto}>+ Novo usuário</Text>
        </TouchableOpacity>

        {loading ? <ActivityIndicator style={{ marginVertical: 24 }} /> : null}

        {!loading && usuarios.length === 0 ? (
          <Text style={[styles.vazio, { color: cores.textoSuave }]}>Nenhum usuário cadastrado.</Text>
        ) : null}

        {usuarios.map((u) => {
          const processando = atualizandoId === u.id;
          const ehEu = u.id === userId;
          return (
            <View
              key={u.id}
              style={[
                styles.card,
                {
                  borderColor: cores.borda,
                  backgroundColor: cores.fundoCard,
                  opacity: u.ativo ? 1 : 0.65,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardNome, { color: cores.texto }]}>
                  {u.nome}
                  {ehEu ? ' (você)' : ''}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: u.ativo ? '#4caf50' : '#9e9e9e' },
                  ]}
                >
                  <Text style={styles.statusBadgeTexto}>{u.ativo ? 'Ativo' : 'Inativo'}</Text>
                </View>
              </View>
              <Text style={[styles.cardPapel, { color: cores.textoSecundario }]}>
                Papel: {rotuloPapel(u.papel)}
              </Text>

              <View style={styles.acoesRow}>
                <TouchableOpacity
                  style={[styles.acaoBtn, { borderColor: cores.borda }]}
                  onPress={() => alternarPapel(u)}
                  disabled={processando || ehEu}
                >
                  <Text style={[styles.acaoBtnTexto, { color: cores.primario }]}>
                    {processando ? '...' : 'Alterar papel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acaoBtn, { borderColor: cores.borda }]}
                  onPress={() => alternarAtivo(u)}
                  disabled={processando || ehEu}
                >
                  <Text
                    style={[
                      styles.acaoBtnTexto,
                      { color: u.ativo ? '#e53935' : '#4caf50' },
                    ]}
                  >
                    {processando ? '...' : u.ativo ? 'Desativar' : 'Reativar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={formAberto} transparent animationType="slide" onRequestClose={fecharFormulario}>
        <Pressable style={styles.modalOverlay} onPress={fecharFormulario}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: cores.fundoCard }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitulo, { color: cores.texto }]}>Novo usuário</Text>

            <Text style={[styles.label, { color: cores.texto }]}>Nome completo</Text>
            <TextInput
              style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto }]}
              value={form.nome}
              onChangeText={(v) => setForm((p) => ({ ...p, nome: v }))}
              placeholder="Ex.: Marcelo Silva"
              placeholderTextColor={cores.placeholder}
            />

            <Text style={[styles.label, { color: cores.texto }]}>Usuário</Text>
            <TextInput
              style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto }]}
              value={form.usuario}
              onChangeText={(v) => setForm((p) => ({ ...p, usuario: v }))}
              placeholder="Ex.: marcelo"
              placeholderTextColor={cores.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { color: cores.texto }]}>Papel</Text>
            <View style={styles.papelRow}>
              {PAPEIS_USUARIO.map((p) => (
                <TouchableOpacity
                  key={p.valor}
                  style={[
                    styles.papelChip,
                    { borderColor: cores.borda },
                    form.papel === p.valor && {
                      backgroundColor: cores.primario,
                      borderColor: cores.primario,
                    },
                  ]}
                  onPress={() => setForm((prev) => ({ ...prev, papel: p.valor }))}
                >
                  <Text
                    style={[
                      styles.papelChipTexto,
                      { color: form.papel === p.valor ? '#fff' : cores.texto },
                    ]}
                  >
                    {p.rotulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: cores.texto }]}>Senha</Text>
            <TextInput
              style={[styles.input, { borderColor: cores.bordaInput, color: cores.texto }]}
              value={form.senha}
              onChangeText={(v) => setForm((p) => ({ ...p, senha: v }))}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={cores.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {erroForm ? (
              <Text style={[styles.erroForm, { color: cores.erro }]}>{erroForm}</Text>
            ) : null}

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.modalBtnSec} onPress={fecharFormulario}>
                <Text style={[styles.modalBtnSecTexto, { color: cores.textoSecundario }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPri, { backgroundColor: cores.primario }]}
                onPress={criarUsuario}
                disabled={salvando}
              >
                <Text style={styles.modalBtnPriTexto}>
                  {salvando ? 'Criando...' : 'Criar conta'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  scrollContent: { paddingHorizontal: 20 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitulo: { fontSize: 13, marginBottom: 16 },
  botaoNovo: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoNovoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  vazio: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardNome: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardPapel: { fontSize: 13, marginBottom: 10 },
  acoesRow: { flexDirection: 'row', gap: 8 },
  acaoBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  acaoBtnTexto: { fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  papelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  papelChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  papelChipTexto: { fontSize: 13, fontWeight: '600' },
  erroForm: { marginTop: 10, fontSize: 13 },
  modalBotoes: { flexDirection: 'row', marginTop: 20, gap: 10 },
  modalBtnSec: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  modalBtnSecTexto: { fontSize: 15, fontWeight: '600' },
  modalBtnPri: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalBtnPriTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
