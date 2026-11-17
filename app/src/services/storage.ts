import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ocorrencia, Perfil, PreferenciasAcessibilidade } from '../types';

/**
 * Camada de persistência local (offline-first).
 * Em produção, a mesma interface seria implementada contra a API REST que
 * conversa com o banco Oracle (procedures do pacote PKG_BAIRRO_ATIVO).
 */

const CHAVES = {
  ocorrencias: '@bairroativo/ocorrencias/v1',
  perfil: '@bairroativo/perfil/v1',
  acessibilidade: '@bairroativo/acessibilidade/v1',
} as const;

async function lerJson<T>(chave: string): Promise<T | null> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch (erro) {
    console.warn(`[storage] falha ao ler ${chave}`, erro);
    return null;
  }
}

async function gravarJson(chave: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.warn(`[storage] falha ao gravar ${chave}`, erro);
  }
}

export const storage = {
  carregarOcorrencias: () => lerJson<Ocorrencia[]>(CHAVES.ocorrencias),
  salvarOcorrencias: (lista: readonly Ocorrencia[]) => gravarJson(CHAVES.ocorrencias, lista),
  carregarPerfil: () => lerJson<Perfil>(CHAVES.perfil),
  salvarPerfil: (p: Perfil) => gravarJson(CHAVES.perfil, p),
  carregarAcessibilidade: () => lerJson<PreferenciasAcessibilidade>(CHAVES.acessibilidade),
  salvarAcessibilidade: (p: PreferenciasAcessibilidade) => gravarJson(CHAVES.acessibilidade, p),
  limparTudo: () => AsyncStorage.multiRemove(Object.values(CHAVES)),
};
