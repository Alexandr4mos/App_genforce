import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/avisos';
import { useTema, RAIO, SOMBRA, ALVO_TOQUE, LARGURA_DESKTOP } from '../lib/tema';
import { corDoStatus, estiloBadgeStatus, rotuloStatus, statusEfetivo } from '../lib/constantes';
import DateRangeFilter from '../components/DateRangeFilter';
import Icone from '../components/ui/Icone';
import { BadgeStatus } from '../components/ui/Badge';
import { SkeletonBloco } from '../components/ui/Skeleton';
import EstadoVazio from '../components/ui/EstadoVazio';
import {
  limitesConsulta,
  criarEstadoInicialFiltroData,
  hojeNoTimezone,
  formatarIsoData,
  formatarJanelaPrevista,
} from '../lib/dateRangeService';

const STATUS_DO_PAINEL = ['andamento', 'pendente', 'pausada', 'agendado'];

export default function Dashboard({ onAbrirOS }) {
  const { cores, modoEscuro } = useTema();
  const { width } = useWindowDimensions();
  const desktop = width >= LARGURA_DESKTOP;

  const [dateFilter, setDateFilter] = useState(() => criarEstadoInicialFiltroData());
  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  const [abertas, setAbertas] = useState([]);
  const [concluidasHoje, setConcluidasHoje] = useState(0);
  const [pendenciasAbertas, setPendenciasAbertas] = useState(0);
  const [loadingOperacao, setLoadingOperacao] = useState(true);
  const [erroOperacao, setErroOperacao] = useState('');

  const carregarOperacao = useCallback(async () => {
    setLoadingOperacao(true);
    setErroOperacao('');
    const hoje = formatarIsoData(hojeNoTimezone());

    const [osRes, hojeRes, pendRes] = await Promise.all([
      supabase
        .from('ordens_servico')
        .select('id, numero, status, data_inicio_prevista, data_fim_prevista, checkin_em, checkout_em, clientes(nome)')
        .not('status', 'in', '(finalizado,concluida)')
        .order('data_inicio_prevista', { ascending: true })
        .limit(500),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).gte('checkout_em', hoje),
      supabase
        .from('pendencias')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '(resolvida,recusada)'),
    ]);

    const erro = osRes.error || hojeRes.error || pendRes.error;
    if (erro) {
      setErroOperacao(erro.message);
    } else {
      setAbertas(osRes.data || []);
      setConcluidasHoje(hojeRes.count || 0);
      setPendenciasAbertas(pendRes.count || 0);
    }
    setLoadingOperacao(false);
  }, []);

  useEffect(() => {
    carregarOperacao();
  }, [carregarOperacao]);

  useEffect(() => {
    carregarRanking(dateFilter.appliedRange);
  }, [dateFilter.appliedRange]);

  async function carregarRanking(range) {
    setLoadingRanking(true);
    let query = supabase
      .from('assinaturas')
      .select('id, usuario_id, criado_em, usuarios(id, nome)')
      .eq('tipo', 'tecnico')
      .not('usuario_id', 'is', null);

    const limites = range ? limitesConsulta(range) : null;
    if (limites?.inicioIso) query = query.gte('criado_em', limites.inicioIso);
    if (limites?.fimExclusivoIso) query = query.lt('criado_em', limites.fimExclusivoIso);

    const { data, error } = await query;
    setLoadingRanking(false);

    if (error) {
      avisar(error.message, 'Erro ao carregar desempenho');
      return;
    }

    const contagem = {};
    (data || []).forEach((a) => {
      const id = a.usuario_id;
      const nome = a.usuarios?.nome || 'Técnico';
      if (!contagem[id]) contagem[id] = { id, nome, total: 0 };
      contagem[id].total += 1;
    });

    setRanking(
      Object.values(contagem).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
    );
  }

  const { contagem, atencao } = useMemo(() => {
    const c = { andamento: 0, pendente: 0, pausada: 0, agendado: 0 };
    const precisaAtencao = [];
    abertas.forEach((os) => {
      const efetivo = statusEfetivo(os);
      if (c[efetivo] !== undefined) c[efetivo] += 1;
      if (efetivo === 'pausada' || efetivo === 'pendente') precisaAtencao.push({ os, efetivo });
    });
    // pausadas (atrasadas) primeiro, depois pendentes; dentro de cada grupo, a mais antiga primeiro
    precisaAtencao.sort((a, b) => {
      if (a.efetivo !== b.efetivo) return a.efetivo === 'pausada' ? -1 : 1;
      return (a.os.data_inicio_prevista || '').localeCompare(b.os.data_inicio_prevista || '');
    });
    return { contagem: c, atencao: precisaAtencao };
  }, [abertas]);

  const maxTotal = useMemo(() => Math.max(1, ...ranking.map((r) => r.total)), [ranking]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={[styles.conteudo, desktop && styles.conteudoDesktop]}
    >
      <View style={styles.tituloRow}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={[styles.title, { color: cores.texto }]}>
            Painel
          </Text>
          <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>Como está a operação agora</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar painel"
          onPress={carregarOperacao}
          style={({ hovered }) => [
            styles.iconeBotao,
            { borderColor: cores.borda, backgroundColor: hovered ? cores.fundoSecundario : cores.fundoCard },
          ]}
        >
          <Icone nome="refresh" tamanho={18} cor={cores.textoSecundario} />
        </Pressable>
      </View>

      {erroOperacao ? (
        <EstadoVazio
          tom="erro"
          icone="alert"
          titulo="Não foi possível carregar o painel"
          texto={`${erroOperacao}. Verifique sua conexão e tente novamente.`}
          acao="Tentar de novo"
          onAcao={carregarOperacao}
        />
      ) : (
        <>
          <View style={styles.kpis}>
            {STATUS_DO_PAINEL.map((status) => (
              <KpiStatus
                key={status}
                status={status}
                valor={contagem[status]}
                carregando={loadingOperacao}
                modoEscuro={modoEscuro}
              />
            ))}
          </View>
          <View style={styles.kpis}>
            <KpiSimples
              rotulo="Concluídas hoje"
              valor={concluidasHoje}
              icone="check"
              tom="sucesso"
              carregando={loadingOperacao}
            />
            <KpiSimples
              rotulo="Pendências de peças abertas"
              valor={pendenciasAbertas}
              icone="package"
              tom="alerta"
              carregando={loadingOperacao}
            />
          </View>

          <Secao titulo="Precisa de atenção" detalhe={loadingOperacao ? '' : `${atencao.length}`}>
            {loadingOperacao ? (
              <View style={{ padding: 16, gap: 10 }}>
                <SkeletonBloco altura={16} largura="60%" />
                <SkeletonBloco altura={12} largura="35%" />
              </View>
            ) : atencao.length === 0 ? (
              <View style={styles.tudoEmDia}>
                <Icone nome="check" tamanho={20} cor={cores.sucesso} />
                <Text style={[styles.tudoEmDiaTexto, { color: cores.textoSecundario }]}>
                  Nenhuma OS pausada ou pendente. Tudo em dia.
                </Text>
              </View>
            ) : (
              atencao.slice(0, 8).map(({ os, efetivo }, i) => (
                <Pressable
                  key={os.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir OS ${os.numero}`}
                  onPress={() => onAbrirOS?.(os.id)}
                  style={({ hovered }) => [
                    styles.linhaAtencao,
                    i > 0 && { borderTopWidth: 1, borderTopColor: cores.borda },
                    hovered && { backgroundColor: cores.fundoSecundario },
                  ]}
                >
                  <View style={[styles.faixaAtencao, { backgroundColor: corDoStatus(efetivo) }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.atencaoTitulo, { color: cores.texto }]} numberOfLines={1}>
                      OS #{os.numero} · {os.clientes?.nome || 'Sem cliente'}
                    </Text>
                    <Text style={[styles.atencaoSub, { color: cores.textoSecundario }]}>
                      {formatarJanelaPrevista(os.data_inicio_prevista, os.data_fim_prevista) || 'Sem data prevista'}
                    </Text>
                  </View>
                  <BadgeStatus status={efetivo} />
                  <Icone nome="chevronRight" tamanho={18} cor={cores.textoSuave} />
                </Pressable>
              ))
            )}
          </Secao>
        </>
      )}

      <Secao titulo="Desempenho dos técnicos" detalhe="Assinaturas de técnico por pessoa">
        <View style={{ padding: 16, paddingBottom: 4 }}>
          <DateRangeFilter
            estado={dateFilter}
            onEstado={setDateFilter}
            onPeriodoAplicado={(range) => setDateFilter((prev) => ({ ...prev, appliedRange: range }))}
          />
        </View>
        {loadingRanking ? (
          <View style={{ padding: 16, gap: 12 }}>
            <SkeletonBloco altura={14} largura="50%" />
            <SkeletonBloco altura={8} />
            <SkeletonBloco altura={14} largura="40%" />
            <SkeletonBloco altura={8} largura="70%" />
          </View>
        ) : ranking.length === 0 ? (
          <EstadoVazio
            icone="users"
            titulo="Sem assinaturas no período"
            texto="Nenhuma assinatura de técnico vinculada a um usuário neste período."
          />
        ) : (
          ranking.map((item, indice) => (
            <View
              key={item.id}
              style={[styles.linhaRanking, indice > 0 && { borderTopWidth: 1, borderTopColor: cores.borda }]}
            >
              <Text style={[styles.posicao, { color: indice === 0 ? cores.primario : cores.textoSuave }]}>
                {indice + 1}º
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text>
                <View style={[styles.barraTrack, { backgroundColor: cores.fundoSecundario }]}>
                  <View
                    style={[
                      styles.barraFill,
                      { width: `${Math.round((item.total / maxTotal) * 100)}%`, backgroundColor: cores.primario },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.total, { color: cores.texto }]}>{item.total}</Text>
            </View>
          ))
        )}
      </Secao>
    </ScrollView>
  );
}

function Secao({ titulo, detalhe, children }) {
  const { cores } = useTema();
  return (
    <View style={[styles.secao, { backgroundColor: cores.fundoCard, borderColor: cores.borda, boxShadow: SOMBRA.sm }]}>
      <View style={[styles.secaoCab, { borderBottomColor: cores.borda }]}>
        <Text accessibilityRole="header" style={[styles.secaoTitulo, { color: cores.texto }]}>
          {titulo}
        </Text>
        {detalhe ? <Text style={[styles.secaoDetalhe, { color: cores.textoSuave }]}>{detalhe}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function KpiStatus({ status, valor, carregando, modoEscuro }) {
  const { cores } = useTema();
  const { fg, bg } = estiloBadgeStatus(status, modoEscuro);
  return (
    <View
      accessibilityLabel={`${rotuloStatus(status)}: ${valor}`}
      style={[styles.kpi, { backgroundColor: cores.fundoCard, borderColor: cores.borda, boxShadow: SOMBRA.sm }]}
    >
      <View style={[styles.kpiPonto, { backgroundColor: bg }]}>
        <View style={[styles.kpiPontoInterno, { backgroundColor: corDoStatus(status) }]} />
      </View>
      {carregando ? (
        <SkeletonBloco largura={44} altura={30} style={{ marginTop: 10 }} />
      ) : (
        <Text style={[styles.kpiValor, { color: cores.texto }]}>{valor}</Text>
      )}
      <Text style={[styles.kpiRotulo, { color: fg }]}>{rotuloStatus(status)}</Text>
    </View>
  );
}

function KpiSimples({ rotulo, valor, icone, tom, carregando }) {
  const { cores } = useTema();
  const fg = tom === 'sucesso' ? cores.sucesso : cores.alerta;
  const bg = tom === 'sucesso' ? cores.sucessoFundo : cores.alertaFundo;
  return (
    <View
      accessibilityLabel={`${rotulo}: ${valor}`}
      style={[styles.kpiLargo, { backgroundColor: cores.fundoCard, borderColor: cores.borda, boxShadow: SOMBRA.sm }]}
    >
      <View style={[styles.kpiIcone, { backgroundColor: bg }]}>
        <Icone nome={icone} tamanho={20} cor={fg} />
      </View>
      <View style={{ flex: 1 }}>
        {carregando ? (
          <SkeletonBloco largura={36} altura={28} />
        ) : (
          <Text style={[styles.kpiValor, { color: cores.texto, marginTop: 0 }]}>{valor}</Text>
        )}
        <Text style={[styles.kpiRotuloSimples, { color: cores.textoSecundario }]}>{rotulo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 40 },
  conteudoDesktop: { padding: 32, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  subtitulo: { fontSize: 14, marginTop: 2 },
  iconeBotao: {
    width: ALVO_TOQUE,
    height: ALVO_TOQUE,
    borderRadius: RAIO.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  kpi: { flexGrow: 1, flexBasis: 140, borderWidth: 1, borderRadius: RAIO.lg, padding: 16 },
  kpiPonto: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  kpiPontoInterno: { width: 10, height: 10, borderRadius: 5 },
  kpiValor: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginTop: 10 },
  kpiRotulo: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  kpiLargo: {
    flexGrow: 1,
    flexBasis: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: RAIO.lg,
    padding: 16,
  },
  kpiIcone: { width: 44, height: 44, borderRadius: RAIO.md, alignItems: 'center', justifyContent: 'center' },
  kpiRotuloSimples: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  secao: { borderWidth: 1, borderRadius: RAIO.lg, marginTop: 12, marginBottom: 4 },
  secaoCab: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  secaoTitulo: { fontSize: 16, fontWeight: '700' },
  secaoDetalhe: { fontSize: 13, flexShrink: 1, textAlign: 'right' },
  tudoEmDia: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  tudoEmDiaTexto: { fontSize: 14, flex: 1 },
  linhaAtencao: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 64 },
  faixaAtencao: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  atencaoTitulo: { fontSize: 15, fontWeight: '600' },
  atencaoSub: { fontSize: 13, marginTop: 2 },
  linhaRanking: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  posicao: { fontSize: 15, fontWeight: '700', width: 30 },
  nome: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  barraTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 3 },
  total: { fontSize: 20, fontWeight: '700', minWidth: 36, textAlign: 'right' },
});
