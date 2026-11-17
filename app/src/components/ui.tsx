import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { IconeNome } from '../constants/categorias';
import { useTema } from '../hooks/useTema';

/**
 * Componentes de interface básicos, todos:
 *  - acessíveis (accessibilityRole/Label, área de toque mínima de 48dp);
 *  - adaptados ao tema (alto contraste e fonte ampliada);
 *  - envolvidos em React.memo para evitar re-render quando as props não mudam.
 */

type Variante = 'titulo' | 'subtitulo' | 'corpo' | 'legenda' | 'destaque';

const TAMANHOS: Record<Variante, number> = { titulo: 24, subtitulo: 18, corpo: 15, legenda: 13, destaque: 32 };
const PESOS: Record<Variante, TextStyle['fontWeight']> = {
  titulo: '800',
  subtitulo: '700',
  corpo: '400',
  legenda: '500',
  destaque: '800',
};

export const Texto = memo(function Texto(props: {
  children: ReactNode;
  variante?: Variante;
  cor?: string;
  secundario?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { cores, fs } = useTema();
  const v = props.variante ?? 'corpo';
  return (
    <Text
      numberOfLines={props.numberOfLines}
      accessibilityRole={v === 'titulo' ? 'header' : undefined}
      style={[
        {
          fontSize: fs(TAMANHOS[v]),
          lineHeight: Math.round(fs(TAMANHOS[v]) * 1.35),
          fontWeight: PESOS[v],
          color: props.cor ?? (props.secundario ? cores.textoSecundario : cores.texto),
        },
        props.style,
      ]}
    >
      {props.children}
    </Text>
  );
});

export const Botao = memo(function Botao(props: {
  titulo: string;
  onPress: () => void;
  icone?: IconeNome;
  variante?: 'primario' | 'secundario' | 'perigo';
  desabilitado?: boolean;
  carregando?: boolean;
  dica?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { cores, fs } = useTema();
  const variante = props.variante ?? 'primario';
  const fundo = variante === 'primario' ? cores.primaria : variante === 'perigo' ? cores.perigo : 'transparent';
  const corTexto = variante === 'secundario' ? cores.primaria : cores.sobrePrimaria;
  const inativo = props.desabilitado || props.carregando;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={props.titulo}
      accessibilityHint={props.dica}
      accessibilityState={{ disabled: !!inativo, busy: !!props.carregando }}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundo, borderColor: cores.primaria, opacity: inativo ? 0.5 : pressed ? 0.85 : 1 },
        props.style,
      ]}
    >
      {props.carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {props.icone && <Ionicons name={props.icone} size={fs(20)} color={corTexto} />}
          <Text style={{ color: corTexto, fontSize: fs(16), fontWeight: '700' }}>{props.titulo}</Text>
        </>
      )}
    </Pressable>
  );
});

export const Cartao = memo(function Cartao(props: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { cores } = useTema();
  return (
    <View style={[estilos.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }, props.style]}>
      {props.children}
    </View>
  );
});

/** Etiqueta colorida (status, prioridade, categoria). */
export const Selo = memo(function Selo(props: { texto: string; cor: string; icone?: IconeNome }) {
  const { fs, altoContraste } = useTema();
  return (
    <View
      style={[
        estilos.selo,
        altoContraste ? { borderColor: props.cor, borderWidth: 2 } : { backgroundColor: props.cor + '22' },
      ]}
    >
      {props.icone && <Ionicons name={props.icone} size={fs(12)} color={props.cor} />}
      <Text style={{ color: props.cor, fontSize: fs(12), fontWeight: '700' }}>{props.texto}</Text>
    </View>
  );
});

/** Botão de filtro selecionável. */
export const Chip = memo(function Chip(props: {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
  icone?: IconeNome;
  cor?: string;
}) {
  const { cores, fs } = useTema();
  const cor = props.cor ?? cores.primaria;
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: props.selecionado }}
      accessibilityLabel={props.rotulo}
      style={[
        estilos.chip,
        { borderColor: props.selecionado ? cor : cores.borda, backgroundColor: props.selecionado ? cor : cores.superficie },
      ]}
    >
      {props.icone && <Ionicons name={props.icone} size={fs(16)} color={props.selecionado ? '#fff' : cor} />}
      <Text style={{ fontSize: fs(14), fontWeight: '600', color: props.selecionado ? '#fff' : cores.texto }}>
        {props.rotulo}
      </Text>
    </Pressable>
  );
});

/** Ícone redondo da categoria. */
export const IconeCategoria = memo(function IconeCategoria(props: { icone: IconeNome; cor: string; tamanho?: number }) {
  const t = props.tamanho ?? 44;
  return (
    <View
      style={{ width: t, height: t, borderRadius: t / 2, backgroundColor: props.cor + '22', alignItems: 'center', justifyContent: 'center' }}
      importantForAccessibility="no"
    >
      <Ionicons name={props.icone} size={t * 0.5} color={props.cor} />
    </View>
  );
});

const estilos = StyleSheet.create({
  botao: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cartao: { borderRadius: 16, borderWidth: 1, padding: 16 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
});
