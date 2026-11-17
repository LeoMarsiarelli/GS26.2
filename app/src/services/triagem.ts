import { CATEGORIAS } from '../constants/categorias';
import type { CategoriaId, Ocorrencia, Prioridade } from '../types';
import { distanciaKm } from './geo';

/**
 * Triagem inteligente de ocorrências.
 *
 * Um classificador baseado em regras (explicável e que roda 100% offline no
 * aparelho) que estima a urgência de um problema a partir de:
 *  1. peso de risco da categoria;
 *  2. palavras-chave de risco encontradas na descrição;
 *  3. impacto em acessibilidade (idosos, PcD, cadeirantes);
 *  4. quantidade de apoios de outros cidadãos (impacto coletivo);
 *  5. atraso em relação ao prazo (SLA).
 *
 * A mesma regra é implementada no banco pela função PL/SQL FN_CALCULAR_PRIORIDADE.
 */

interface PalavraChave {
  termos: readonly string[];
  peso: number;
}

const PALAVRAS_RISCO: readonly PalavraChave[] = [
  { termos: ['fio', 'fiação', 'choque', 'eletric', 'poste caido', 'poste caído'], peso: 30 },
  { termos: ['acidente', 'atropel', 'queda', 'caiu', 'ferido', 'machuc'], peso: 25 },
  { termos: ['escola', 'creche', 'hospital', 'ubs', 'posto de saúde'], peso: 15 },
  { termos: ['criança', 'idoso', 'cadeirante', 'cego', 'deficiente', 'gestante'], peso: 15 },
  { termos: ['escuro', 'assalto', 'insegur', 'perigo', 'perigoso'], peso: 12 },
  { termos: ['enchente', 'alag', 'inund', 'desliz'], peso: 20 },
  { termos: ['urgente', 'grave', 'dias', 'semanas'], peso: 8 },
];

/** Remove acentos e normaliza para comparação de palavras-chave. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Pré-normaliza os termos uma única vez (evita trabalho repetido a cada digitação).
const PALAVRAS_NORMALIZADAS = PALAVRAS_RISCO.map((p) => ({ peso: p.peso, termos: p.termos.map(normalizar) }));

export interface ResultadoTriagem {
  pontuacao: number;
  prioridade: Prioridade;
  motivos: string[];
}

export function prioridadePorPontuacao(pontos: number): Prioridade {
  if (pontos >= 75) return 'CRITICA';
  if (pontos >= 50) return 'ALTA';
  if (pontos >= 30) return 'MEDIA';
  return 'BAIXA';
}

/** Calcula pontuação (0..100) e prioridade de uma ocorrência. */
export function calcularTriagem(params: {
  categoria: CategoriaId;
  descricao: string;
  afetaAcessibilidade: boolean;
  apoios?: number;
  diasAtraso?: number;
}): ResultadoTriagem {
  const cat = CATEGORIAS[params.categoria];
  const motivos: string[] = [`Categoria "${cat.nome}" (+${cat.pesoRisco})`];
  let pontos = cat.pesoRisco;

  const texto = normalizar(params.descricao);
  for (const grupo of PALAVRAS_NORMALIZADAS) {
    const achado = grupo.termos.find((t) => texto.includes(t));
    if (achado) {
      pontos += grupo.peso;
      motivos.push(`Menção a "${achado}" (+${grupo.peso})`);
    }
  }

  if (params.afetaAcessibilidade) {
    pontos += 15;
    motivos.push('Afeta pessoas com mobilidade reduzida (+15)');
  }

  const apoios = params.apoios ?? 0;
  if (apoios > 0) {
    const bonus = Math.min(20, apoios * 2);
    pontos += bonus;
    motivos.push(`${apoios} cidadão(s) afetado(s) (+${bonus})`);
  }

  const atraso = params.diasAtraso ?? 0;
  if (atraso > 0) {
    const bonus = Math.min(15, atraso * 3);
    pontos += bonus;
    motivos.push(`${atraso} dia(s) após o prazo (+${bonus})`);
  }

  const pontuacao = Math.min(100, pontos);
  return { pontuacao, prioridade: prioridadePorPontuacao(pontuacao), motivos };
}

/** Recalcula a triagem de uma ocorrência existente (após apoio ou atraso). */
export function retriar(o: Ocorrencia, agora = Date.now()): ResultadoTriagem {
  const diasAtraso =
    o.status === 'RESOLVIDA' ? 0 : Math.max(0, Math.floor((agora - Date.parse(o.prazoEm)) / 86_400_000));
  return calcularTriagem({
    categoria: o.categoria,
    descricao: o.descricao,
    afetaAcessibilidade: o.afetaAcessibilidade,
    apoios: o.apoios,
    diasAtraso,
  });
}

/** Raio (km) para considerar duas ocorrências como possível duplicidade. */
export const RAIO_DUPLICIDADE_KM = 0.15;

/**
 * Procura ocorrência em aberto da mesma categoria a até 150 m — evita registros
 * duplicados e incentiva o cidadão a apoiar o chamado existente.
 * (Mesma regra da procedure PRC_REGISTRAR_OCORRENCIA.)
 */
export function encontrarDuplicada(
  lista: readonly Ocorrencia[],
  categoria: CategoriaId,
  coordenada: { latitude: number; longitude: number },
): Ocorrencia | undefined {
  return lista.find(
    (o) =>
      o.categoria === categoria &&
      o.status !== 'RESOLVIDA' &&
      distanciaKm(o.coordenada, coordenada) <= RAIO_DUPLICIDADE_KM,
  );
}
