import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { CategoriaId, Prioridade, StatusOcorrencia } from '../types';

/** Nome de um ícone do conjunto Ionicons (@expo/vector-icons). */
export type IconeNome = ComponentProps<typeof Ionicons>['name'];

export interface Categoria {
  id: CategoriaId;
  nome: string;
  icone: IconeNome;
  cor: string;
  /** Prazo de atendimento (SLA) em dias — espelha CATEGORIA.SLA_DIAS. */
  slaDias: number;
  /** Peso de risco (0..40) usado pela triagem — espelha CATEGORIA.PESO_RISCO. */
  pesoRisco: number;
  orgao: string;
}

/** Catálogo de categorias. Objeto congelado: criado uma única vez e compartilhado. */
export const CATEGORIAS: Readonly<Record<CategoriaId, Categoria>> = Object.freeze({
  ILUMINACAO: { id: 'ILUMINACAO', nome: 'Iluminação pública', icone: 'bulb', cor: '#E0A800', slaDias: 3, pesoRisco: 25, orgao: 'Ilume / Subprefeitura' },
  BURACO: { id: 'BURACO', nome: 'Buraco na via', icone: 'warning', cor: '#D9480F', slaDias: 7, pesoRisco: 25, orgao: 'Subprefeitura - Zeladoria' },
  CALCADA: { id: 'CALCADA', nome: 'Calçada / Acessibilidade', icone: 'accessibility', cor: '#7048E8', slaDias: 10, pesoRisco: 20, orgao: 'Secretaria da Pessoa com Deficiência' },
  LIXO: { id: 'LIXO', nome: 'Lixo / Entulho', icone: 'trash', cor: '#2B8A3E', slaDias: 2, pesoRisco: 15, orgao: 'Limpeza Urbana' },
  AGUA: { id: 'AGUA', nome: 'Vazamento de água', icone: 'water', cor: '#1971C2', slaDias: 1, pesoRisco: 30, orgao: 'Companhia de Saneamento' },
  ARVORE: { id: 'ARVORE', nome: 'Árvore / Poda', icone: 'leaf', cor: '#5C940D', slaDias: 15, pesoRisco: 20, orgao: 'Meio Ambiente' },
  SINALIZACAO: { id: 'SINALIZACAO', nome: 'Sinalização / Semáforo', icone: 'car', cor: '#C2255C', slaDias: 2, pesoRisco: 30, orgao: 'Engenharia de Tráfego' },
  ALAGAMENTO: { id: 'ALAGAMENTO', nome: 'Alagamento / Bueiro', icone: 'rainy', cor: '#0B7285', slaDias: 2, pesoRisco: 35, orgao: 'Defesa Civil / Drenagem' },
});

export const LISTA_CATEGORIAS: readonly Categoria[] = Object.freeze(Object.values(CATEGORIAS));

export const STATUS_INFO: Readonly<Record<StatusOcorrencia, { rotulo: string; cor: string; ordem: number }>> =
  Object.freeze({
    ABERTA: { rotulo: 'Aberta', cor: '#868E96', ordem: 0 },
    EM_ANALISE: { rotulo: 'Em análise', cor: '#1C7ED6', ordem: 1 },
    EM_EXECUCAO: { rotulo: 'Em execução', cor: '#F08C00', ordem: 2 },
    RESOLVIDA: { rotulo: 'Resolvida', cor: '#2F9E44', ordem: 3 },
  });

export const ORDEM_STATUS: readonly StatusOcorrencia[] = ['ABERTA', 'EM_ANALISE', 'EM_EXECUCAO', 'RESOLVIDA'];

export const PRIORIDADE_INFO: Readonly<Record<Prioridade, { rotulo: string; cor: string }>> = Object.freeze({
  BAIXA: { rotulo: 'Baixa', cor: '#495057' },
  MEDIA: { rotulo: 'Média', cor: '#1971C2' },
  ALTA: { rotulo: 'Alta', cor: '#E8590C' },
  CRITICA: { rotulo: 'Crítica', cor: '#C92A2A' },
});
