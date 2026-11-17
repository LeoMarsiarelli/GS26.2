import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { CardOcorrencia } from '../../components/CardOcorrencia';
import { Chip, Texto } from '../../components/ui';
import { LISTA_CATEGORIAS } from '../../constants/categorias';
import { useOcorrencias } from '../../context/OcorrenciasContext';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import { useTema } from '../../hooks/useTema';
import { distanciaKm } from '../../services/geo';
import type { CategoriaId, Ocorrencia } from '../../types';

type FiltroStatus = 'pendentes' | 'resolvidas' | 'todas';
type Item = { o: Ocorrencia; d: number };

const RAIOS = [0.5, 1, 3] as const;

/**
 * Funcionalidade 2 — Mapa colaborativo "Perto de mim".
 * Lista ocorrências ordenadas por distância (Haversine), com filtros por raio,
 * categoria, status e acessibilidade. O cidadão pode apoiar ("também me afeta"),
 * o que eleva a prioridade do chamado.
 */
export default function Proximas() {
  const { lista, alternarApoio } = useOcorrencias();
  const { coordenada, estado, atualizar } = useLocalizacao();
  const { cores } = useTema();
  const [raio, setRaio] = useState<number>(3);
  const [categoria, setCategoria] = useState<CategoriaId | null>(null);
  const [status, setStatus] = useState<FiltroStatus>('pendentes');
  const [soAcess, setSoAcess] = useState(false);

  // 1) distâncias: recalculadas só quando a lista ou a posição mudam.
  const comDistancia = useMemo<Item[]>(
    () => lista.map((o) => ({ o, d: distanciaKm(coordenada, o.coordenada) })).sort((a, b) => a.d - b.d),
    [lista, coordenada],
  );

  // 2) filtros: barato, roda sobre o array já ordenado.
  const filtrados = useMemo(
    () =>
      comDistancia.filter(
        ({ o, d }) =>
          d <= raio &&
          (!categoria || o.categoria === categoria) &&
          (!soAcess || o.afetaAcessibilidade) &&
          (status === 'todas' || (status === 'resolvidas') === (o.status === 'RESOLVIDA')),
      ),
    [comDistancia, raio, categoria, soAcess, status],
  );

  const abrir = useCallback((id: string) => router.push({ pathname: '/ocorrencia/[id]', params: { id } }), []);
  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <CardOcorrencia ocorrencia={item.o} distanciaKm={item.d} onPress={abrir} onApoiar={alternarApoio} />
    ),
    [abrir, alternarApoio],
  );

  const cabecalho = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      <View style={[estilos.aviso, { backgroundColor: cores.primariaClara }]}>
        <Ionicons name={estado === 'ok' ? 'navigate' : 'navigate-outline'} size={20} color={cores.primaria} />
        <Texto variante="legenda" style={{ flex: 1 }}>
          {estado === 'carregando'
            ? 'Obtendo sua localização…'
            : estado === 'ok'
              ? 'Usando sua localização atual.'
              : 'Localização indisponível — mostrando a região da Av. Paulista.'}
        </Texto>
        <Chip rotulo="Atualizar" icone="refresh" selecionado={false} onPress={atualizar} />
      </View>

      <Texto variante="legenda" secundario>
        RAIO
      </Texto>
      <View style={estilos.linha}>
        {RAIOS.map((r) => (
          <Chip key={r} rotulo={r < 1 ? `${r * 1000} m` : `${r} km`} selecionado={raio === r} onPress={() => setRaio(r)} />
        ))}
        <Chip rotulo="Acessibilidade" icone="accessibility" cor="#7048E8" selecionado={soAcess} onPress={() => setSoAcess((v) => !v)} />
      </View>

      <Texto variante="legenda" secundario>
        SITUAÇÃO
      </Texto>
      <View style={estilos.linha}>
        <Chip rotulo="Pendentes" selecionado={status === 'pendentes'} onPress={() => setStatus('pendentes')} />
        <Chip rotulo="Resolvidas" selecionado={status === 'resolvidas'} onPress={() => setStatus('resolvidas')} />
        <Chip rotulo="Todas" selecionado={status === 'todas'} onPress={() => setStatus('todas')} />
      </View>

      <Texto variante="legenda" secundario>
        CATEGORIA
      </Texto>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip rotulo="Todas" selecionado={!categoria} onPress={() => setCategoria(null)} />
        {LISTA_CATEGORIAS.map((c) => (
          <Chip
            key={c.id}
            rotulo={c.nome}
            icone={c.icone}
            cor={c.cor}
            selecionado={categoria === c.id}
            onPress={() => setCategoria(categoria === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>

      <Texto variante="subtitulo">
        {filtrados.length} ocorrência(s) encontrada(s)
      </Texto>
    </View>
  );

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(i) => i.o.id}
      renderItem={renderItem}
      ListHeaderComponent={cabecalho}
      ItemSeparatorComponent={Separador}
      ListEmptyComponent={
        <Texto secundario style={{ textAlign: 'center', padding: 24 }}>
          Nenhuma ocorrência com esses filtros. Aumente o raio ou registre um novo problema.
        </Texto>
      }
      contentContainerStyle={estilos.lista}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const Separador = () => <View style={{ height: 12 }} />;

const estilos = StyleSheet.create({
  lista: { padding: 16, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
