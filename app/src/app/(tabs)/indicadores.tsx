import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Botao, Cartao, Texto } from '../../components/ui';
import { CATEGORIAS, ORDEM_STATUS, STATUS_INFO, type IconeNome } from '../../constants/categorias';
import { useOcorrencias } from '../../context/OcorrenciasContext';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useLeitorVoz } from '../../hooks/useLeitorVoz';
import { useTema } from '../../hooks/useTema';
import { calcularIndicadores } from '../../services/indicadores';

const pct = (v: number) => `${Math.round(v * 100)}%`;

/**
 * Funcionalidade 4 — Painel de indicadores do bairro (transparência).
 * Mostra ao cidadão e ao poder público como a zeladoria está funcionando:
 * taxa de resolução, cumprimento de prazo, tempo médio, satisfação e ranking.
 */
export default function Indicadores() {
  const { lista } = useOcorrencias();
  const { perfil } = usePreferencias();
  const { cores, fs } = useTema();
  const voz = useLeitorVoz();
  const ind = useMemo(() => calcularIndicadores(lista), [lista]);
  const maxCat = Math.max(1, ...ind.porCategoria.map((c) => c.total));

  const corIndice = ind.indiceZeladoria >= 70 ? cores.sucesso : ind.indiceZeladoria >= 45 ? cores.aviso : cores.perigo;
  const resumoFalado =
    `Índice de zeladoria do bairro ${perfil?.bairro}: ${ind.indiceZeladoria} de 100. ` +
    `${ind.total} ocorrências, ${pct(ind.taxaResolucao)} resolvidas, ${ind.atrasadas} fora do prazo.`;

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Cartao style={{ alignItems: 'center', gap: 4 }}>
        <Texto variante="legenda" secundario>
          ÍNDICE DE ZELADORIA • {perfil?.bairro?.toUpperCase()}
        </Texto>
        <View
          style={[estilos.anel, { borderColor: corIndice }]}
          accessible
          accessibilityLabel={`Índice de zeladoria: ${ind.indiceZeladoria} de 100`}
        >
          <Texto variante="destaque" cor={corIndice} style={{ fontSize: fs(44), lineHeight: fs(52) }}>
            {ind.indiceZeladoria}
          </Texto>
          <Texto variante="legenda" secundario>
            de 100
          </Texto>
        </View>
        <Texto secundario style={{ textAlign: 'center' }}>
          Combina resolução (50%), cumprimento de prazo (30%) e satisfação dos moradores (20%).
        </Texto>
        {voz.habilitado && (
          <Botao
            titulo={voz.falando ? 'Parar leitura' : 'Ouvir resumo'}
            icone={voz.falando ? 'stop' : 'volume-high'}
            variante="secundario"
            onPress={() => (voz.falando ? voz.parar() : voz.falar(resumoFalado))}
            style={{ marginTop: 8, alignSelf: 'stretch' }}
          />
        )}
      </Cartao>

      <View style={estilos.grade}>
        <Kpi icone="documents" rotulo="Ocorrências" valor={String(ind.total)} cor={cores.primaria} />
        <Kpi icone="checkmark-done" rotulo="Resolvidas" valor={pct(ind.taxaResolucao)} cor={cores.sucesso} />
        <Kpi icone="time" rotulo="Tempo médio" valor={ind.tempoMedioDias === null ? '—' : `${ind.tempoMedioDias.toFixed(1).replace(".", ",")} d`} cor="#1971C2" />
        <Kpi icone="alarm" rotulo="Fora do prazo" valor={String(ind.atrasadas)} cor={cores.perigo} />
        <Kpi icone="ribbon" rotulo="No prazo" valor={pct(ind.dentroDoPrazo)} cor="#0B7285" />
        <Kpi icone="star" rotulo="Satisfação" valor={ind.satisfacaoMedia === null ? '—' : `${ind.satisfacaoMedia.toFixed(1).replace(".", ",")}/5`} cor="#E0A800" />
      </View>

      <Cartao style={{ gap: 10 }}>
        <Texto variante="subtitulo">Situação dos chamados</Texto>
        <View style={estilos.barraEmpilhada} accessibilityLabel="Distribuição por situação">
          {ORDEM_STATUS.map((s) =>
            ind.porStatus[s] ? <View key={s} style={{ flex: ind.porStatus[s], backgroundColor: STATUS_INFO[s].cor }} /> : null,
          )}
        </View>
        <View style={estilos.legendas}>
          {ORDEM_STATUS.map((s) => (
            <View key={s} style={estilos.legenda}>
              <View style={[estilos.ponto, { backgroundColor: STATUS_INFO[s].cor }]} />
              <Texto variante="legenda">
                {STATUS_INFO[s].rotulo}: {ind.porStatus[s]}
              </Texto>
            </View>
          ))}
        </View>
      </Cartao>

      <Cartao style={{ gap: 12 }}>
        <Texto variante="subtitulo">Problemas mais frequentes</Texto>
        {ind.porCategoria
          .filter((c) => c.total > 0)
          .map((c) => {
            const cat = CATEGORIAS[c.categoria];
            return (
              <View key={c.categoria} accessible accessibilityLabel={`${cat.nome}: ${c.total} ocorrências, ${c.resolvidas} resolvidas`}>
                <View style={estilos.linhaCat}>
                  <Ionicons name={cat.icone} size={fs(16)} color={cat.cor} />
                  <Texto variante="legenda" style={{ flex: 1 }}>
                    {cat.nome}
                  </Texto>
                  <Texto variante="legenda" secundario>
                    {c.resolvidas}/{c.total}
                  </Texto>
                </View>
                <View style={[estilos.trilho, { backgroundColor: cores.borda }]}>
                  <View style={{ width: `${(c.total / maxCat) * 100}%`, height: '100%', backgroundColor: cat.cor + '55', borderRadius: 6 }}>
                    <View style={{ width: `${(c.resolvidas / c.total) * 100}%`, height: '100%', backgroundColor: cat.cor, borderRadius: 6 }} />
                  </View>
                </View>
              </View>
            );
          })}
        <Texto variante="legenda" secundario>
          Barra escura = resolvidas • barra clara = total
        </Texto>
      </Cartao>

      <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="accessibility" size={fs(32)} color="#7048E8" />
        <View style={{ flex: 1 }}>
          <Texto variante="subtitulo">{ind.acessibilidade} problemas de acessibilidade</Texto>
          <Texto variante="legenda" secundario>
            Barreiras que afetam idosos, cadeirantes e pessoas com deficiência recebem prioridade extra na triagem.
          </Texto>
        </View>
      </Cartao>
    </ScrollView>
  );
}

function Kpi({ icone, rotulo, valor, cor }: { icone: IconeNome; rotulo: string; valor: string; cor: string }) {
  const { cores, fs } = useTema();
  return (
    <View
      style={[estilos.kpi, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
      accessible
      accessibilityLabel={`${rotulo}: ${valor}`}
    >
      <Ionicons name={icone} size={fs(20)} color={cor} />
      <Texto variante="titulo" cor={cor}>
        {valor}
      </Texto>
      <Texto variante="legenda" secundario>
        {rotulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 14, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' },
  anel: { width: 150, height: 150, borderRadius: 75, borderWidth: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { flexBasis: '30%', flexGrow: 1, minWidth: 100, borderWidth: 1, borderRadius: 14, padding: 12, gap: 2 },
  barraEmpilhada: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden' },
  legendas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  linhaCat: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  trilho: { height: 12, borderRadius: 6, overflow: 'hidden' },
});
