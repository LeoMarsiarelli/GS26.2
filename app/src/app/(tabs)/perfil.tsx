import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Botao, Cartao, Texto } from '../../components/ui';
import type { IconeNome } from '../../constants/categorias';
import { useOcorrencias } from '../../context/OcorrenciasContext';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useLeitorVoz } from '../../hooks/useLeitorVoz';
import { useTema } from '../../hooks/useTema';
import type { PreferenciasAcessibilidade } from '../../types';

/**
 * Funcionalidade 5 — Central de acessibilidade.
 * Fonte ampliada, alto contraste e leitura em voz alta aplicados a TODO o app
 * em tempo real (via contexto), atendendo idosos e pessoas com deficiência.
 */
export default function Perfil() {
  const { perfil, acessibilidade, alterarAcessibilidade, sair } = usePreferencias();
  const { restaurarDemo } = useOcorrencias();
  const { cores } = useTema();
  const voz = useLeitorVoz();

  const confirmar = (titulo: string, msg: string, acao: () => void) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (globalThis.confirm?.(`${titulo}\n\n${msg}`)) acao();
      return;
    }
    Alert.alert(titulo, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: acao },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={[estilos.avatar, { backgroundColor: cores.primaria }]}>
          <Texto variante="titulo" cor={cores.sobrePrimaria}>
            {perfil?.nome?.charAt(0).toUpperCase()}
          </Texto>
        </View>
        <View style={{ flex: 1 }}>
          <Texto variante="subtitulo">{perfil?.nome}</Texto>
          <Texto secundario>Bairro {perfil?.bairro}</Texto>
        </View>
      </Cartao>

      <Texto variante="titulo">Acessibilidade</Texto>
      <Cartao style={{ gap: 4, paddingVertical: 6 }}>
        <Opcao chave="fonteGrande" icone="text" titulo="Letras grandes" descricao="Aumenta em 30% o tamanho de todos os textos." valor={acessibilidade.fonteGrande} onChange={alterarAcessibilidade} />
        <Opcao chave="altoContraste" icone="contrast" titulo="Alto contraste" descricao="Cores fortes (amarelo sobre preto) para baixa visão." valor={acessibilidade.altoContraste} onChange={alterarAcessibilidade} />
        <Opcao chave="leituraVoz" icone="volume-high" titulo="Leitura em voz alta" descricao="Mostra botões para ouvir ocorrências e indicadores." valor={acessibilidade.leituraVoz} onChange={alterarAcessibilidade} />
      </Cartao>

      {acessibilidade.leituraVoz && (
        <Botao
          titulo={voz.falando ? 'Parar' : 'Testar leitura em voz alta'}
          icone="mic"
          variante="secundario"
          onPress={() =>
            voz.falando
              ? voz.parar()
              : voz.falar(`Olá ${perfil?.nome ?? ''}! A leitura em voz alta está funcionando. Você pode ouvir os detalhes de cada ocorrência.`)
          }
        />
      )}

      <Cartao style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Ionicons name="information-circle" size={22} color={cores.primaria} />
          <Texto variante="subtitulo">Também compatível com</Texto>
        </View>
        <Texto secundario>• Leitores de tela TalkBack (Android) e VoiceOver (iOS)</Texto>
        <Texto secundario>• Tamanho de fonte do sistema</Texto>
        <Texto secundario>• Áreas de toque de no mínimo 48 dp</Texto>
      </Cartao>

      <Texto variante="titulo">Demonstração</Texto>
      <Botao
        titulo="Restaurar dados de exemplo"
        icone="refresh"
        variante="secundario"
        onPress={() => confirmar('Restaurar dados', 'As ocorrências serão substituídas pelos dados de demonstração.', restaurarDemo)}
      />
      <Botao
        titulo="Sair e apagar dados"
        icone="log-out"
        variante="perigo"
        onPress={() =>
          confirmar('Sair', 'Seu perfil e preferências serão apagados deste aparelho.', () => {
            sair();
            restaurarDemo();
            router.replace('/onboarding');
          })
        }
      />
      <Texto variante="legenda" secundario style={{ textAlign: 'center' }}>
        BairroAtivo v1.0 • Global Solution 2026 • ODS 11, 10 e 6
      </Texto>
    </ScrollView>
  );
}

function Opcao(props: {
  chave: keyof PreferenciasAcessibilidade;
  icone: IconeNome;
  titulo: string;
  descricao: string;
  valor: boolean;
  onChange: (p: Partial<PreferenciasAcessibilidade>) => void;
}) {
  const { cores, fs } = useTema();
  return (
    <View style={estilos.opcao}>
      <Ionicons name={props.icone} size={fs(24)} color={cores.primaria} />
      <View style={{ flex: 1 }}>
        <Texto variante="subtitulo">{props.titulo}</Texto>
        <Texto variante="legenda" secundario>
          {props.descricao}
        </Texto>
      </View>
      <Switch
        value={props.valor}
        onValueChange={(v) => props.onChange({ [props.chave]: v })}
        accessibilityLabel={props.titulo}
        trackColor={{ true: cores.primaria, false: cores.borda }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 14, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8 },
});
