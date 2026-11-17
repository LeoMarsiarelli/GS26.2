import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Botao, Cartao, IconeCategoria, Selo, Texto } from '../components/ui';
import { CATEGORIAS, LISTA_CATEGORIAS, PRIORIDADE_INFO } from '../constants/categorias';
import { useOcorrencias } from '../context/OcorrenciasContext';
import { usePreferencias } from '../context/PreferenciasContext';
import { useLocalizacao } from '../hooks/useLocalizacao';
import { useTema } from '../hooks/useTema';
import { distanciaKm, formatarDistancia } from '../services/geo';
import { calcularTriagem, encontrarDuplicada } from '../services/triagem';
import type { CategoriaId } from '../types';

/**
 * Funcionalidade 1 — Registro inteligente de ocorrência.
 * Fluxo em 3 passos (o quê / onde / detalhes) com:
 *  - foto comprimida (qualidade 0.5) para economizar memória e dados;
 *  - GPS + endereço por geocodificação reversa;
 *  - triagem automática em tempo real (prioridade explicada ao cidadão);
 *  - detecção de duplicidade num raio de 150 m.
 */
export default function NovaOcorrencia() {
  const { lista, registrar, alternarApoio } = useOcorrencias();
  const { perfil } = usePreferencias();
  const { cores, fs } = useTema();
  const local = useLocalizacao({ buscarEndereco: true });

  const [categoria, setCategoria] = useState<CategoriaId | null>(null);
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [fotoUri, setFotoUri] = useState<string | undefined>();
  const [acess, setAcess] = useState(perfil?.necessidadeAcessibilidade ?? false);
  const [ignorarDuplicada, setIgnorarDuplicada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Preenche o endereço automaticamente quando o GPS responder (sem sobrescrever o usuário).
  useEffect(() => {
    if (local.endereco) setEndereco((atual) => atual || local.endereco);
  }, [local.endereco]);

  // Categoria de calçada já implica acessibilidade.
  useEffect(() => {
    if (categoria === 'CALCADA') setAcess(true);
  }, [categoria]);

  const triagem = useMemo(
    () => (categoria ? calcularTriagem({ categoria, descricao, afetaAcessibilidade: acess }) : null),
    [categoria, descricao, acess],
  );

  const duplicada = useMemo(
    () => (categoria && !ignorarDuplicada ? encontrarDuplicada(lista, categoria, local.coordenada) : undefined),
    [lista, categoria, local.coordenada, ignorarDuplicada],
  );

  const valido = !!categoria && descricao.trim().length >= 10 && endereco.trim().length >= 5;

  async function escolherFoto(daCamera: boolean) {
    const opcoes: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.5, // compressão: reduz o tamanho do arquivo e o uso de memória
      allowsEditing: true,
      aspect: [4, 3],
      base64: false, // NÃO carrega base64 na memória do JS — guardamos só a URI
      exif: false,
    };
    try {
      if (daCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      }
      const r = daCamera ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
      if (!r.canceled && r.assets[0]) setFotoUri(r.assets[0].uri);
    } catch {
      /* câmera indisponível (ex.: navegador/emulador) */
    }
  }

  function enviar() {
    if (!categoria || !valido) return;
    setEnviando(true);
    const nova = registrar({
      categoria,
      descricao,
      endereco,
      coordenada: local.coordenada,
      fotoUri,
      afetaAcessibilidade: acess,
    });
    router.replace({ pathname: '/ocorrencia/[id]', params: { id: nova.id, novo: '1' } });
  }

  function apoiarExistente() {
    if (!duplicada) return;
    if (!duplicada.apoiadoPorMim) alternarApoio(duplicada.id);
    router.replace({ pathname: '/ocorrencia/[id]', params: { id: duplicada.id } });
  }

  const estiloInput = { borderColor: cores.borda, color: cores.texto, backgroundColor: cores.superficie, fontSize: fs(16) };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {/* PASSO 1 — CATEGORIA */}
        <Passo numero={1} titulo="Qual é o problema?" />
        <View style={estilos.grade}>
          {LISTA_CATEGORIAS.map((c) => {
            const sel = categoria === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoria(c.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={c.nome}
                style={[estilos.opcaoCat, { borderColor: sel ? c.cor : cores.borda, backgroundColor: sel ? c.cor + '18' : cores.superficie }]}
              >
                <IconeCategoria icone={c.icone} cor={c.cor} tamanho={40} />
                <Texto variante="legenda" style={{ textAlign: 'center' }}>
                  {c.nome}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        {/* PASSO 2 — LOCAL */}
        <Passo numero={2} titulo="Onde fica?" />
        <View style={[estilos.gps, { backgroundColor: cores.primariaClara }]}>
          <Ionicons name="locate" size={fs(20)} color={cores.primaria} />
          <Texto variante="legenda" style={{ flex: 1 }}>
            {local.estado === 'carregando'
              ? 'Buscando sua localização…'
              : local.estado === 'ok'
                ? `GPS: ${local.coordenada.latitude.toFixed(5)}, ${local.coordenada.longitude.toFixed(5)}`
                : 'GPS indisponível. Informe o endereço abaixo.'}
          </Texto>
        </View>
        <TextInput
          value={endereco}
          onChangeText={setEndereco}
          placeholder="Rua, número e bairro"
          placeholderTextColor={cores.textoSecundario}
          accessibilityLabel="Endereço do problema"
          style={[estilos.input, estiloInput]}
        />

        {duplicada && (
          <Cartao style={{ borderColor: cores.aviso, borderWidth: 2, gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="copy" size={fs(20)} color={cores.aviso} />
              <Texto variante="subtitulo" style={{ flex: 1 }}>
                Já existe um chamado parecido aqui perto
              </Texto>
            </View>
            <Texto secundario>
              {CATEGORIAS[duplicada.categoria].nome} em {duplicada.endereco} (a{' '}
              {formatarDistancia(distanciaKm(duplicada.coordenada, local.coordenada))}), com {duplicada.apoios} apoio(s). Apoiar o chamado
              existente aumenta a prioridade dele mais rápido.
            </Texto>
            <Botao titulo="Apoiar chamado existente" icone="people" onPress={apoiarExistente} />
            <Botao titulo="É outro problema, continuar" variante="secundario" onPress={() => setIgnorarDuplicada(true)} />
          </Cartao>
        )}

        {/* PASSO 3 — DETALHES */}
        <Passo numero={3} titulo="Conte um pouco mais" />
        <TextInput
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreva o problema (ex.: poste apagado em frente à escola, rua muito escura)"
          placeholderTextColor={cores.textoSecundario}
          accessibilityLabel="Descrição do problema"
          multiline
          maxLength={500}
          style={[estilos.input, estiloInput, { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 }]}
        />
        <Texto variante="legenda" secundario style={{ alignSelf: 'flex-end' }}>
          {descricao.length}/500 {descricao.trim().length < 10 ? '• mínimo 10 caracteres' : ''}
        </Texto>

        <View style={estilos.fotos}>
          {fotoUri ? (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: fotoUri }} style={estilos.foto} resizeMode="cover" accessibilityLabel="Foto anexada" />
              <Botao titulo="Remover foto" icone="trash" variante="secundario" onPress={() => setFotoUri(undefined)} style={{ marginTop: 8 }} />
            </View>
          ) : (
            <>
              <Botao titulo="Câmera" icone="camera" variante="secundario" onPress={() => escolherFoto(true)} style={{ flex: 1 }} />
              <Botao titulo="Galeria" icone="images" variante="secundario" onPress={() => escolherFoto(false)} style={{ flex: 1 }} />
            </>
          )}
        </View>

        <View style={[estilos.switch, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
          <Ionicons name="accessibility" size={fs(24)} color="#7048E8" />
          <View style={{ flex: 1 }}>
            <Texto variante="subtitulo">Afeta a acessibilidade?</Texto>
            <Texto variante="legenda" secundario>
              Dificulta a passagem de cadeirantes, idosos, pessoas cegas ou com carrinho de bebê.
            </Texto>
          </View>
          <Switch value={acess} onValueChange={setAcess} accessibilityLabel="Afeta a acessibilidade" />
        </View>

        {triagem && (
          <Cartao style={{ gap: 6, borderColor: PRIORIDADE_INFO[triagem.prioridade].cor, borderWidth: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="sparkles" size={fs(20)} color={PRIORIDADE_INFO[triagem.prioridade].cor} />
              <Texto variante="subtitulo" style={{ flex: 1 }}>
                Triagem automática
              </Texto>
              <Selo texto={`${PRIORIDADE_INFO[triagem.prioridade].rotulo} • ${triagem.pontuacao} pts`} cor={PRIORIDADE_INFO[triagem.prioridade].cor} />
            </View>
            {triagem.motivos.map((m) => (
              <Texto key={m} variante="legenda" secundario>
                • {m}
              </Texto>
            ))}
            {categoria && (
              <Texto variante="legenda">
                Prazo de atendimento: até {CATEGORIAS[categoria].slaDias} dia(s) • {CATEGORIAS[categoria].orgao}
              </Texto>
            )}
          </Cartao>
        )}

        <Botao
          titulo="Enviar ocorrência"
          icone="send"
          onPress={enviar}
          desabilitado={!valido || !!duplicada}
          carregando={enviando}
          dica="Registra o problema e gera um número de protocolo"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Passo({ numero, titulo }: { numero: number; titulo: string }) {
  const { cores } = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <View style={[estilos.numero, { backgroundColor: cores.primaria }]}>
        <Texto variante="legenda" cor={cores.sobrePrimaria}>
          {numero}
        </Texto>
      </View>
      <Texto variante="subtitulo">{titulo}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opcaoCat: { flexBasis: '22%', flexGrow: 1, minWidth: 78, minHeight: 96, borderWidth: 2, borderRadius: 14, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12 },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14 },
  fotos: { flexDirection: 'row', gap: 10 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  numero: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
