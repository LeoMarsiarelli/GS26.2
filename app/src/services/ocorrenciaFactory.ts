import { CATEGORIAS, ORDEM_STATUS, STATUS_INFO } from '../constants/categorias';
import type { NovaOcorrenciaInput, Ocorrencia, StatusOcorrencia } from '../types';
import { calcularTriagem, retriar } from './triagem';

const DIA_MS = 86_400_000;

/** Gera um id curto e único localmente (protocolo exibido ao cidadão). */
export function gerarProtocolo(): string {
  const ano = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');
  return `BA-${ano}-${rand}`;
}

/** Cria uma ocorrência nova já triada, com prazo (SLA) e histórico inicial. */
export function criarOcorrencia(input: NovaOcorrenciaInput, agora = new Date()): Ocorrencia {
  const cat = CATEGORIAS[input.categoria];
  const triagem = calcularTriagem({
    categoria: input.categoria,
    descricao: input.descricao,
    afetaAcessibilidade: input.afetaAcessibilidade,
  });
  const criadaEm = agora.toISOString();
  return {
    id: gerarProtocolo(),
    categoria: input.categoria,
    titulo: cat.nome,
    descricao: input.descricao.trim(),
    endereco: input.endereco.trim(),
    coordenada: input.coordenada,
    fotoUri: input.fotoUri,
    status: 'ABERTA',
    prioridade: triagem.prioridade,
    pontuacao: triagem.pontuacao,
    afetaAcessibilidade: input.afetaAcessibilidade,
    apoios: 0,
    apoiadoPorMim: false,
    criadaPorMim: true,
    criadaEm,
    prazoEm: new Date(agora.getTime() + cat.slaDias * DIA_MS).toISOString(),
    historico: [{ status: 'ABERTA', data: criadaEm, observacao: `Ocorrência registrada e encaminhada para ${cat.orgao}.` }],
  };
}

/** Próximo status do ciclo de atendimento (ou null se já resolvida). */
export function proximoStatus(atual: StatusOcorrencia): StatusOcorrencia | null {
  const i = ORDEM_STATUS.indexOf(atual);
  return i >= 0 && i < ORDEM_STATUS.length - 1 ? ORDEM_STATUS[i + 1] : null;
}

const OBSERVACOES: Record<StatusOcorrencia, string> = {
  ABERTA: 'Ocorrência reaberta.',
  EM_ANALISE: 'Equipe técnica analisando a solicitação.',
  EM_EXECUCAO: 'Equipe de campo designada. Serviço em andamento.',
  RESOLVIDA: 'Serviço concluído. Avalie o atendimento!',
};

/** Retorna NOVA ocorrência (imutável) com o status alterado e histórico atualizado. */
export function avancarStatus(o: Ocorrencia, agora = new Date()): Ocorrencia {
  const novo = proximoStatus(o.status);
  if (!novo) return o;
  const data = agora.toISOString();
  const atualizada: Ocorrencia = {
    ...o,
    status: novo,
    resolvidaEm: novo === 'RESOLVIDA' ? data : o.resolvidaEm,
    historico: [...o.historico, { status: novo, data, observacao: OBSERVACOES[novo] }],
  };
  const t = retriar(atualizada, agora.getTime());
  return { ...atualizada, pontuacao: t.pontuacao, prioridade: t.prioridade };
}

export function rotuloStatus(s: StatusOcorrencia) {
  return STATUS_INFO[s].rotulo;
}
