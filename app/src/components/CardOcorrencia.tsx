import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CATEGORIAS, PRIORIDADE_INFO, STATUS_INFO } from '../constants/categorias';
import { useTema } from '../hooks/useTema';
import { formatarDistancia } from '../services/geo';
import type { Ocorrencia } from '../types';
import { IconeCategoria, Selo, Texto } from './ui';

interface Props {
  ocorrencia: Ocorrencia;
  distanciaKm?: number;
  onPress: (id: string) => void;
  onApoiar?: (id: string) => void;
}

/**
 * Card de ocorrência usado nas listas (FlatList).
 * `React.memo` + callbacks recebidos por id garantem que, ao apoiar uma
 * ocorrência, apenas o card alterado seja renderizado novamente.
 */
function CardOcorrenciaBase({ ocorrencia: o, distanciaKm, onPress, onApoiar }: Props) {
  const { cores, fs } = useTema();
  const cat = CATEGORIAS[o.categoria];
  const st = STATUS_INFO[o.status];
  const pr = PRIORIDADE_INFO[o.prioridade];

  const rotuloAcessivel =
    `${cat.nome}, ${st.rotulo}, prioridade ${pr.rotulo}. ${o.endereco}.` +
    (distanciaKm !== undefined ? ` A ${formatarDistancia(distanciaKm)} de você.` : '') +
    ` ${o.apoios} pessoas afetadas.`;

  return (
    <Pressable
      onPress={() => onPress(o.id)}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityHint="Abre os detalhes e o acompanhamento"
      style={({ pressed }) => [
        estilos.card,
        { backgroundColor: cores.superficie, borderColor: cores.borda, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={estilos.topo}>
        <IconeCategoria icone={cat.icone} cor={cat.cor} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="subtitulo" numberOfLines={1}>
            {cat.nome}
          </Texto>
          <Texto variante="legenda" secundario numberOfLines={1}>
            {o.endereco}
          </Texto>
        </View>
        {distanciaKm !== undefined && (
          <Texto variante="legenda" cor={cores.primaria}>
            {formatarDistancia(distanciaKm)}
          </Texto>
        )}
      </View>

      <Texto secundario numberOfLines={2} style={{ marginTop: 8 }}>
        {o.descricao}
      </Texto>

      <View style={estilos.rodape}>
        <View style={estilos.selos}>
          <Selo texto={st.rotulo} cor={st.cor} />
          <Selo texto={pr.rotulo} cor={pr.cor} icone="flag" />
          {o.afetaAcessibilidade && <Selo texto="Acessibilidade" cor="#7048E8" icone="accessibility" />}
        </View>
        {onApoiar && (
          <Pressable
            onPress={() => onApoiar(o.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: o.apoiadoPorMim }}
            accessibilityLabel={o.apoiadoPorMim ? 'Remover apoio' : 'Também me afeta'}
            style={[estilos.apoio, { borderColor: o.apoiadoPorMim ? cores.primaria : cores.borda }]}
          >
            <Ionicons name={o.apoiadoPorMim ? 'people' : 'people-outline'} size={fs(18)} color={cores.primaria} />
            <Texto variante="legenda" cor={cores.primaria}>
              {o.apoios}
            </Texto>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export const CardOcorrencia = memo(CardOcorrenciaBase);

const estilos = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rodape: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  selos: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  apoio: {
    minWidth: 48,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
});
