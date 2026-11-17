import { LISTA_CATEGORIAS } from '../constants/categorias';
import type { CategoriaId, Ocorrencia, StatusOcorrencia } from '../types';

export interface IndicadorCategoria {
  categoria: CategoriaId;
  total: number;
  resolvidas: number;
}

export interface Indicadores {
  total: number;
  porStatus: Record<StatusOcorrencia, number>;
  taxaResolucao: number; // 0..1
  tempoMedioDias: number | null;
  dentroDoPrazo: number; // 0..1 entre as resolvidas
  atrasadas: number;
  acessibilidade: number;
  satisfacaoMedia: number | null;
  porCategoria: IndicadorCategoria[];
  /** Índice de Zeladoria do Bairro (0..100). */
  indiceZeladoria: number;
}

const DIA_MS = 86_400_000;

/**
 * Calcula todos os indicadores em UMA única passada pela lista (O(n)),
 * evitando vários .filter() encadeados que criariam arrays intermediários.
 * Espelha a procedure PL/SQL PRC_GERAR_INDICADORES.
 */
export function calcularIndicadores(lista: readonly Ocorrencia[], agora = Date.now()): Indicadores {
  const porStatus: Record<StatusOcorrencia, number> = { ABERTA: 0, EM_ANALISE: 0, EM_EXECUCAO: 0, RESOLVIDA: 0 };
  const mapaCat = new Map<CategoriaId, IndicadorCategoria>();
  let somaDias = 0;
  let noPrazo = 0;
  let atrasadas = 0;
  let acessibilidade = 0;
  let somaNotas = 0;
  let qtdNotas = 0;

  for (const o of lista) {
    porStatus[o.status]++;
    if (o.afetaAcessibilidade) acessibilidade++;

    let ic = mapaCat.get(o.categoria);
    if (!ic) {
      ic = { categoria: o.categoria, total: 0, resolvidas: 0 };
      mapaCat.set(o.categoria, ic);
    }
    ic.total++;

    if (o.status === 'RESOLVIDA' && o.resolvidaEm) {
      ic.resolvidas++;
      const fim = Date.parse(o.resolvidaEm);
      somaDias += (fim - Date.parse(o.criadaEm)) / DIA_MS;
      if (fim <= Date.parse(o.prazoEm)) noPrazo++;
    } else if (agora > Date.parse(o.prazoEm)) {
      atrasadas++;
    }

    if (o.avaliacao) {
      somaNotas += o.avaliacao;
      qtdNotas++;
    }
  }

  const total = lista.length;
  const resolvidas = porStatus.RESOLVIDA;
  const taxaResolucao = total ? resolvidas / total : 0;
  const dentroDoPrazo = resolvidas ? noPrazo / resolvidas : 0;
  const satisfacaoMedia = qtdNotas ? somaNotas / qtdNotas : null;

  // Índice composto: 50% resolução, 30% cumprimento de prazo, 20% satisfação.
  const indiceZeladoria = Math.round(
    100 * (0.5 * taxaResolucao + 0.3 * dentroDoPrazo + 0.2 * ((satisfacaoMedia ?? 3) / 5)),
  );

  const porCategoria = LISTA_CATEGORIAS.map(
    (c) => mapaCat.get(c.id) ?? { categoria: c.id, total: 0, resolvidas: 0 },
  ).sort((a, b) => b.total - a.total);

  return {
    total,
    porStatus,
    taxaResolucao,
    tempoMedioDias: resolvidas ? somaDias / resolvidas : null,
    dentroDoPrazo,
    atrasadas,
    acessibilidade,
    satisfacaoMedia,
    porCategoria,
    indiceZeladoria,
  };
}
