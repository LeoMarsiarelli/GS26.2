import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ORDEM_STATUS, STATUS_INFO } from '../constants/categorias';
import { useTema } from '../hooks/useTema';
import type { EventoHistorico, StatusOcorrencia } from '../types';
import { Texto } from './ui';

const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Linha do tempo das etapas de atendimento (concluídas e pendentes). */
function LinhaDoTempoBase({ historico, statusAtual }: { historico: EventoHistorico[]; statusAtual: StatusOcorrencia }) {
  const { cores, fs } = useTema();
  const ordemAtual = STATUS_INFO[statusAtual].ordem;

  return (
    <View accessibilityRole="list">
      {ORDEM_STATUS.map((st, i) => {
        const evento = historico.find((h) => h.status === st);
        const feito = STATUS_INFO[st].ordem <= ordemAtual;
        const cor = feito ? STATUS_INFO[st].cor : cores.borda;
        const ultimo = i === ORDEM_STATUS.length - 1;
        return (
          <View
            key={st}
            style={estilos.linha}
            accessible
            accessibilityLabel={`${STATUS_INFO[st].rotulo}: ${feito ? 'concluída' : 'pendente'}. ${evento?.observacao ?? ''}`}
          >
            <View style={estilos.trilho}>
              <View style={[estilos.bolinha, { backgroundColor: feito ? cor : cores.superficie, borderColor: cor }]}>
                {feito && <Ionicons name="checkmark" size={fs(14)} color="#fff" />}
              </View>
              {!ultimo && <View style={[estilos.traco, { backgroundColor: feito ? cor : cores.borda }]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: ultimo ? 0 : 18 }}>
              <Texto variante="subtitulo" secundario={!feito}>
                {STATUS_INFO[st].rotulo}
              </Texto>
              {evento ? (
                <>
                  <Texto variante="legenda" secundario>
                    {fmt.format(new Date(evento.data))}
                  </Texto>
                  <Texto>{evento.observacao}</Texto>
                </>
              ) : (
                <Texto variante="legenda" secundario>
                  Aguardando
                </Texto>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const LinhaDoTempo = memo(LinhaDoTempoBase);

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 12 },
  trilho: { alignItems: 'center', width: 26 },
  bolinha: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  traco: { width: 3, flex: 1, marginVertical: 2, borderRadius: 2 },
});
