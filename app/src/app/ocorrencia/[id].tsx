import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinhaDoTempo } from '../../components/LinhaDoTempo';
import { Botao, Cartao, IconeCategoria, Selo, Texto } from '../../components/ui';
import { CATEGORIAS, PRIORIDADE_INFO, STATUS_INFO } from '../../constants/categorias';
import { useOcorrencia, useOcorrencias } from '../../context/OcorrenciasContext';
import { useLeitorVoz } from '../../hooks/useLeitorVoz';
import { useTema } from '../../hooks/useTema';
import { proximoStatus } from '../../services/ocorrenciaFactory';
import { retriar } from '../../services/triagem';

const fmtData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const DIA_MS = 86_400_000;

/**
 * Funcionalidade 3 — Acompanhamento transparente do chamado.
 * Protocolo, prazo (SLA), linha do tempo, apoio comunitário, leitura em voz
 * e avaliação do atendimento após a resolução.
 */
export default function DetalheOcorrencia() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const o = useOcorrencia(id);
  const { alternarApoio, avancarStatus, avaliar } = useOcorrencias();
  const { cores, fs } = useTema();
  const voz = useLeitorVoz();
  const motivos = useMemo(() => (o ? retriar(o).motivos : []), [o]);

  if (!o) {
    return (
      <View style={estilos.vazio}>
        <Texto>Ocorrência não encontrada.</Texto>
        <Botao titulo="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  const cat = CATEGORIAS[o.categoria];
  const st = STATUS_INFO[o.status];
  const pr = PRIORIDADE_INFO[o.prioridade];
  const prazo = Date.parse(o.prazoEm);
  const diasRestantes = Math.ceil((prazo - Date.now()) / DIA_MS);
  const atrasada = o.status !== 'RESOLVIDA' && diasRestantes < 0;
  const proximo = proximoStatus(o.status);

  const textoFalado =
    `Protocolo ${o.id.split('').join(' ')}. ${cat.nome} em ${o.endereco}. ` +
    `Situação: ${st.rotulo}. Prioridade ${pr.rotulo}. ${o.descricao}. ` +
    (o.status === 'RESOLVIDA'
      ? 'Este problema já foi resolvido.'
      : atrasada
        ? `O prazo venceu há ${-diasRestantes} dias.`
        : `Prazo para atendimento: ${diasRestantes} dias.`);

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      {novo === '1' && (
        <Cartao style={{ backgroundColor: cores.primariaClara, borderColor: cores.primaria, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={fs(32)} color={cores.primaria} />
          <View style={{ flex: 1 }}>
            <Texto variante="subtitulo">Ocorrência registrada!</Texto>
            <Texto variante="legenda">Guarde seu protocolo. Você será avisado a cada atualização.</Texto>
          </View>
        </Cartao>
      )}

      <Cartao style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconeCategoria icone={cat.icone} cor={cat.cor} tamanho={52} />
          <View style={{ flex: 1 }}>
            <Texto variante="titulo">{cat.nome}</Texto>
            <Texto variante="legenda" secundario>
              Protocolo {o.id}
            </Texto>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Selo texto={st.rotulo} cor={st.cor} />
          <Selo texto={`Prioridade ${pr.rotulo}`} cor={pr.cor} icone="flag" />
          {o.afetaAcessibilidade && <Selo texto="Acessibilidade" cor="#7048E8" icone="accessibility" />}
        </View>
        <Linha icone="location" texto={o.endereco} />
        <Linha icone="calendar" texto={`Aberta em ${fmtData.format(new Date(o.criadaEm))}`} />
        <Linha icone="business" texto={cat.orgao} />
        <Linha
          icone="alarm"
          cor={o.status === 'RESOLVIDA' ? cores.sucesso : atrasada ? cores.perigo : undefined}
          texto={
            o.status === 'RESOLVIDA'
              ? `Resolvida em ${fmtData.format(new Date(o.resolvidaEm ?? o.criadaEm))}`
              : atrasada
                ? `Prazo vencido há ${-diasRestantes} dia(s)`
                : `Prazo: ${diasRestantes} dia(s) restante(s)`
          }
        />
        <Texto style={{ marginTop: 4 }}>{o.descricao}</Texto>
        {o.fotoUri && <Image source={{ uri: o.fotoUri }} style={estilos.foto} resizeMode="cover" accessibilityLabel="Foto do problema" />}

        {voz.habilitado && (
          <Botao
            titulo={voz.falando ? 'Parar leitura' : 'Ouvir detalhes'}
            icone={voz.falando ? 'stop' : 'volume-high'}
            variante="secundario"
            onPress={() => (voz.falando ? voz.parar() : voz.falar(textoFalado))}
          />
        )}
      </Cartao>

      <Cartao style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="people" size={fs(26)} color={cores.primaria} />
          <View style={{ flex: 1 }}>
            <Texto variante="subtitulo">{o.apoios} pessoa(s) afetada(s)</Texto>
            <Texto variante="legenda" secundario>
              Cada apoio aumenta a prioridade do chamado.
            </Texto>
          </View>
        </View>
        {o.status !== 'RESOLVIDA' && (
          <Botao
            titulo={o.apoiadoPorMim ? 'Você apoia este chamado ✓' : 'Também me afeta'}
            icone={o.apoiadoPorMim ? 'heart' : 'heart-outline'}
            variante={o.apoiadoPorMim ? 'secundario' : 'primario'}
            onPress={() => alternarApoio(o.id)}
          />
        )}
        <View style={{ gap: 2 }}>
          <Texto variante="legenda" secundario>
            Por que a prioridade é {pr.rotulo.toLowerCase()} ({o.pontuacao} pts):
          </Texto>
          {motivos.map((m) => (
            <Texto key={m} variante="legenda" secundario>
              • {m}
            </Texto>
          ))}
        </View>
      </Cartao>

      <Cartao style={{ gap: 14 }}>
        <Texto variante="subtitulo">Linha do tempo</Texto>
        <LinhaDoTempo historico={o.historico} statusAtual={o.status} />
        {proximo && (
          <Botao
            titulo={`Simular atualização do órgão → ${STATUS_INFO[proximo].rotulo}`}
            icone="play-forward"
            variante="secundario"
            onPress={() => avancarStatus(o.id)}
            dica="Somente para demonstração: avança o chamado para a próxima etapa"
          />
        )}
      </Cartao>

      {o.status === 'RESOLVIDA' && (
        <Cartao style={{ gap: 10, alignItems: 'center' }}>
          <Texto variante="subtitulo">{o.avaliacao ? 'Obrigado pela avaliação!' : 'Como foi o atendimento?'}</Texto>
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => avaliar(o.id, n)}
                accessibilityRole="radio"
                accessibilityState={{ selected: o.avaliacao === n }}
                accessibilityLabel={`${n} estrela${n > 1 ? 's' : ''}`}
                hitSlop={4}
                style={estilos.estrela}
              >
                <Ionicons name={(o.avaliacao ?? 0) >= n ? 'star' : 'star-outline'} size={fs(36)} color="#E0A800" />
              </Pressable>
            ))}
          </View>
          <Texto variante="legenda" secundario style={{ textAlign: 'center' }}>
            Sua nota compõe o Índice de Zeladoria do bairro.
          </Texto>
        </Cartao>
      )}
    </ScrollView>
  );
}

function Linha({ icone, texto, cor }: { icone: React.ComponentProps<typeof Ionicons>['name']; texto: string; cor?: string }) {
  const { cores, fs } = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icone} size={fs(18)} color={cor ?? cores.textoSecundario} />
      <Texto cor={cor} style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 14, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },
  estrela: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
