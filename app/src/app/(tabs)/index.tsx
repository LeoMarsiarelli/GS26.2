import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { CardOcorrencia } from '../../components/CardOcorrencia';
import { Chip, Texto } from '../../components/ui';
import { useOcorrencias } from '../../context/OcorrenciasContext';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useTema } from '../../hooks/useTema';
import type { Ocorrencia } from '../../types';

type Aba = 'minhas' | 'apoiadas' | 'urgentes';

const PESO_PRIORIDADE = { CRITICA: 3, ALTA: 2, MEDIA: 1, BAIXA: 0 } as const;

/**
 * Tela inicial — Funcionalidade 3 (Acompanhamento):
 * reúne as ocorrências do cidadão, as que ele apoia e as mais urgentes do bairro.
 */
export default function Inicio() {
  const { lista, alternarApoio } = useOcorrencias();
  const { perfil } = usePreferencias();
  const { cores, fs } = useTema();
  const [aba, setAba] = useState<Aba>('minhas');

  // Resumo e filtros calculados apenas quando a lista ou a aba mudam.
  const resumo = useMemo(() => {
    let minhas = 0;
    let resolvidasMinhas = 0;
    for (const o of lista) {
      if (o.criadaPorMim || o.apoiadoPorMim) {
        minhas++;
        if (o.status === 'RESOLVIDA') resolvidasMinhas++;
      }
    }
    return { minhas, resolvidasMinhas };
  }, [lista]);

  const dados = useMemo(() => {
    switch (aba) {
      case 'minhas':
        return lista.filter((o) => o.criadaPorMim);
      case 'apoiadas':
        return lista.filter((o) => o.apoiadoPorMim);
      case 'urgentes':
        return lista
          .filter((o) => o.status !== 'RESOLVIDA')
          .sort((a, b) => PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade] || b.pontuacao - a.pontuacao)
          .slice(0, 10);
    }
  }, [lista, aba]);

  const abrir = useCallback((id: string) => router.push({ pathname: '/ocorrencia/[id]', params: { id } }), []);
  const renderItem = useCallback(
    ({ item }: { item: Ocorrencia }) => <CardOcorrencia ocorrencia={item} onPress={abrir} onApoiar={alternarApoio} />,
    [abrir, alternarApoio],
  );

  const cabecalho = (
    <View style={{ gap: 16, marginBottom: 12 }}>
      <View>
        <Texto variante="titulo">Olá, {perfil?.nome?.split(' ')[0]} 👋</Texto>
        <Texto secundario>Bairro {perfil?.bairro}</Texto>
      </View>

      <Pressable
        onPress={() => router.push('/nova')}
        accessibilityRole="button"
        accessibilityLabel="Registrar um problema no bairro"
        accessibilityHint="Abre o formulário com foto e localização"
        style={({ pressed }) => [estilos.cta, { backgroundColor: cores.primaria, opacity: pressed ? 0.9 : 1 }]}
      >
        <Ionicons name="camera" size={fs(34)} color={cores.sobrePrimaria} />
        <View style={{ flex: 1 }}>
          <Texto variante="subtitulo" cor={cores.sobrePrimaria}>
            Registrar problema
          </Texto>
          <Texto variante="legenda" cor={cores.sobrePrimaria}>
            Foto + localização em menos de 1 minuto
          </Texto>
        </View>
        <Ionicons name="chevron-forward" size={fs(24)} color={cores.sobrePrimaria} />
      </Pressable>

      <View style={estilos.resumo}>
        <View style={[estilos.kpi, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <Texto variante="destaque" cor={cores.primaria}>
            {resumo.minhas}
          </Texto>
          <Texto variante="legenda" secundario>
            que você acompanha
          </Texto>
        </View>
        <View style={[estilos.kpi, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <Texto variante="destaque" cor={cores.sucesso}>
            {resumo.resolvidasMinhas}
          </Texto>
          <Texto variante="legenda" secundario>
            já resolvidas
          </Texto>
        </View>
      </View>

      <View style={estilos.chips} accessibilityRole="tablist">
        <Chip rotulo="Minhas" icone="person" selecionado={aba === 'minhas'} onPress={() => setAba('minhas')} />
        <Chip rotulo="Apoiadas" icone="people" selecionado={aba === 'apoiadas'} onPress={() => setAba('apoiadas')} />
        <Chip rotulo="Urgentes" icone="flame" selecionado={aba === 'urgentes'} onPress={() => setAba('urgentes')} />
      </View>
    </View>
  );

  return (
    <FlatList
      data={dados}
      keyExtractor={(o) => o.id}
      renderItem={renderItem}
      ListHeaderComponent={cabecalho}
      ItemSeparatorComponent={Separador}
      ListEmptyComponent={
        <View style={estilos.vazio}>
          <Ionicons name="file-tray-outline" size={48} color={cores.textoSecundario} />
          <Texto secundario style={{ textAlign: 'center' }}>
            {aba === 'minhas'
              ? 'Você ainda não registrou problemas. Toque em "Registrar problema".'
              : aba === 'apoiadas'
                ? 'Toque no ícone de pessoas em uma ocorrência para dizer que ela também te afeta.'
                : 'Nenhuma ocorrência pendente. 🎉'}
          </Texto>
        </View>
      }
      contentContainerStyle={estilos.lista}
      initialNumToRender={6}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const Separador = () => <View style={{ height: 12 }} />;

const estilos = StyleSheet.create({
  lista: { padding: 16, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, minHeight: 80 },
  resumo: { flexDirection: 'row', gap: 12 },
  kpi: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vazio: { alignItems: 'center', gap: 8, padding: 32 },
});
