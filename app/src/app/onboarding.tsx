import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Texto } from '../components/ui';
import { usePreferencias } from '../context/PreferenciasContext';
import { useTema } from '../hooks/useTema';

/** Primeiro acesso: perfil simples (sem senha), focado em inclusão digital. */
export default function Onboarding() {
  const { salvarPerfil } = usePreferencias();
  const { cores, fs } = useTema();
  const [nome, setNome] = useState('');
  const [bairro, setBairro] = useState('Bela Vista');
  const [acess, setAcess] = useState(false);

  const valido = nome.trim().length >= 2 && bairro.trim().length >= 2;
  const estiloInput = [estilos.input, { borderColor: cores.borda, color: cores.texto, backgroundColor: cores.superficie, fontSize: fs(16) }];

  const continuar = () => {
    salvarPerfil({ nome: nome.trim(), bairro: bairro.trim(), necessidadeAcessibilidade: acess });
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <View style={[estilos.logo, { backgroundColor: cores.primaria }]}>
            <Ionicons name="home" size={44} color={cores.sobrePrimaria} />
          </View>
          <Texto variante="destaque" style={{ textAlign: 'center' }}>
            BairroAtivo
          </Texto>
          <Texto secundario style={{ textAlign: 'center', marginBottom: 12 }}>
            Registre problemas do seu bairro, acompanhe a solução e veja seu bairro melhorar — junto com seus vizinhos.
          </Texto>

          <Texto variante="subtitulo">Como podemos te chamar?</Texto>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            placeholderTextColor={cores.textoSecundario}
            accessibilityLabel="Seu nome"
            autoComplete="name"
            style={estiloInput}
          />

          <Texto variante="subtitulo">Seu bairro</Texto>
          <TextInput
            value={bairro}
            onChangeText={setBairro}
            placeholder="Ex.: Bela Vista"
            placeholderTextColor={cores.textoSecundario}
            accessibilityLabel="Seu bairro"
            style={estiloInput}
          />

          <View style={[estilos.linha, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
            <Ionicons name="accessibility" size={fs(26)} color="#7048E8" />
            <View style={{ flex: 1 }}>
              <Texto variante="subtitulo">Tenho mobilidade reduzida ou baixa visão</Texto>
              <Texto variante="legenda" secundario>
                Ativa letras maiores e destaca rotas e problemas de acessibilidade.
              </Texto>
            </View>
            <Switch value={acess} onValueChange={setAcess} accessibilityLabel="Tenho mobilidade reduzida ou baixa visão" />
          </View>

          <Botao titulo="Começar" icone="arrow-forward" onPress={continuar} desabilitado={!valido} dica="Salva seu perfil e abre o aplicativo" />
          <Texto variante="legenda" secundario style={{ textAlign: 'center' }}>
            Seus dados ficam apenas neste aparelho (LGPD).
          </Texto>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 24, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  logo: { width: 88, height: 88, borderRadius: 24, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginVertical: 8 },
});
