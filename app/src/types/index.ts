/**
 * Tipos de domínio do BairroAtivo.
 * Espelham as tabelas do modelo relacional Oracle (ver /database).
 */

/** Identificador das categorias de problema urbano (tabela CATEGORIA). */
export type CategoriaId =
  | 'ILUMINACAO'
  | 'BURACO'
  | 'CALCADA'
  | 'LIXO'
  | 'AGUA'
  | 'ARVORE'
  | 'SINALIZACAO'
  | 'ALAGAMENTO';

/** Ciclo de vida de uma ocorrência (coluna OCORRENCIA.STATUS). */
export type StatusOcorrencia = 'ABERTA' | 'EM_ANALISE' | 'EM_EXECUCAO' | 'RESOLVIDA';

/** Prioridade calculada pela triagem automática. */
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface Coordenada {
  latitude: number;
  longitude: number;
}

/** Registro de mudança de status (tabela HISTORICO_STATUS). */
export interface EventoHistorico {
  status: StatusOcorrencia;
  data: string; // ISO-8601
  observacao: string;
}

/** Ocorrência registrada por um cidadão (tabela OCORRENCIA). */
export interface Ocorrencia {
  id: string;
  categoria: CategoriaId;
  titulo: string;
  descricao: string;
  endereco: string;
  coordenada: Coordenada;
  fotoUri?: string;
  status: StatusOcorrencia;
  prioridade: Prioridade;
  pontuacao: number; // 0..100, base da prioridade
  afetaAcessibilidade: boolean;
  apoios: number; // quantidade de cidadãos que "também são afetados"
  apoiadoPorMim: boolean;
  criadaPorMim: boolean;
  criadaEm: string;
  prazoEm: string; // SLA da categoria
  resolvidaEm?: string;
  avaliacao?: number; // 1..5 (tabela AVALIACAO)
  historico: EventoHistorico[];
}

/** Perfil do cidadão (tabela CIDADAO). */
export interface Perfil {
  nome: string;
  bairro: string;
  necessidadeAcessibilidade: boolean;
}

/** Preferências de acessibilidade da interface. */
export interface PreferenciasAcessibilidade {
  fonteGrande: boolean;
  altoContraste: boolean;
  leituraVoz: boolean;
}

/** Dados novos informados no formulário de registro. */
export interface NovaOcorrenciaInput {
  categoria: CategoriaId;
  descricao: string;
  endereco: string;
  coordenada: Coordenada;
  fotoUri?: string;
  afetaAcessibilidade: boolean;
}
