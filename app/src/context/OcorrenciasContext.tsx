import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { avancarStatus, criarOcorrencia } from '../services/ocorrenciaFactory';
import { gerarOcorrenciasDemo } from '../services/seed';
import { storage } from '../services/storage';
import { retriar } from '../services/triagem';
import type { NovaOcorrenciaInput, Ocorrencia } from '../types';

/**
 * Estado global das ocorrências.
 *
 * - `useReducer` centraliza as transições de estado (previsível e testável);
 * - todas as atualizações são IMUTÁVEIS: só o item alterado ganha nova referência,
 *   permitindo que `React.memo` nos cards evite re-renderizações desnecessárias;
 * - a gravação em disco é feita com *debounce* (300 ms), agrupando várias
 *   alterações seguidas em uma única escrita no AsyncStorage.
 */

interface Estado {
  carregado: boolean;
  lista: Ocorrencia[];
}

type Acao =
  | { tipo: 'CARREGAR'; lista: Ocorrencia[] }
  | { tipo: 'ADICIONAR'; ocorrencia: Ocorrencia }
  | { tipo: 'ALTERNAR_APOIO'; id: string }
  | { tipo: 'AVANCAR_STATUS'; id: string }
  | { tipo: 'AVALIAR'; id: string; nota: number }
  | { tipo: 'RESTAURAR_DEMO' };

/** Aplica `fn` somente ao item com o id informado, preservando as demais referências. */
function atualizarItem(lista: Ocorrencia[], id: string, fn: (o: Ocorrencia) => Ocorrencia): Ocorrencia[] {
  const i = lista.findIndex((o) => o.id === id);
  if (i < 0) return lista;
  const copia = lista.slice();
  copia[i] = fn(lista[i]);
  return copia;
}

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'CARREGAR':
      return { carregado: true, lista: acao.lista };
    case 'ADICIONAR':
      return { ...estado, lista: [acao.ocorrencia, ...estado.lista] };
    case 'ALTERNAR_APOIO':
      return {
        ...estado,
        lista: atualizarItem(estado.lista, acao.id, (o) => {
          const apoiado = !o.apoiadoPorMim;
          const novo = { ...o, apoiadoPorMim: apoiado, apoios: Math.max(0, o.apoios + (apoiado ? 1 : -1)) };
          const t = retriar(novo);
          return { ...novo, pontuacao: t.pontuacao, prioridade: t.prioridade };
        }),
      };
    case 'AVANCAR_STATUS':
      return { ...estado, lista: atualizarItem(estado.lista, acao.id, (o) => avancarStatus(o)) };
    case 'AVALIAR':
      return { ...estado, lista: atualizarItem(estado.lista, acao.id, (o) => ({ ...o, avaliacao: acao.nota })) };
    case 'RESTAURAR_DEMO':
      return { carregado: true, lista: gerarOcorrenciasDemo() };
    default:
      return estado;
  }
}

interface OcorrenciasApi {
  carregado: boolean;
  lista: Ocorrencia[];
  registrar: (input: NovaOcorrenciaInput) => Ocorrencia;
  alternarApoio: (id: string) => void;
  avancarStatus: (id: string) => void;
  avaliar: (id: string, nota: number) => void;
  restaurarDemo: () => void;
}

const Ctx = createContext<OcorrenciasApi | null>(null);

export function OcorrenciasProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, { carregado: false, lista: [] });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carga inicial (com flag `ativo` para não atualizar estado após desmontagem).
  useEffect(() => {
    let ativo = true;
    storage.carregarOcorrencias().then((salvas) => {
      if (ativo) dispatch({ tipo: 'CARREGAR', lista: salvas ?? gerarOcorrenciasDemo() });
    });
    return () => {
      ativo = false;
    };
  }, []);

  // Persistência com debounce + limpeza do timer (evita vazamento de memória).
  useEffect(() => {
    if (!estado.carregado) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => storage.salvarOcorrencias(estado.lista), 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [estado.lista, estado.carregado]);

  // Callbacks estáveis: não mudam de referência entre renders.
  const registrar = useCallback((input: NovaOcorrenciaInput) => {
    const nova = criarOcorrencia(input);
    dispatch({ tipo: 'ADICIONAR', ocorrencia: nova });
    return nova;
  }, []);
  const alternarApoio = useCallback((id: string) => dispatch({ tipo: 'ALTERNAR_APOIO', id }), []);
  const avancar = useCallback((id: string) => dispatch({ tipo: 'AVANCAR_STATUS', id }), []);
  const avaliar = useCallback((id: string, nota: number) => dispatch({ tipo: 'AVALIAR', id, nota }), []);
  const restaurarDemo = useCallback(() => dispatch({ tipo: 'RESTAURAR_DEMO' }), []);

  const api = useMemo<OcorrenciasApi>(
    () => ({
      carregado: estado.carregado,
      lista: estado.lista,
      registrar,
      alternarApoio,
      avancarStatus: avancar,
      avaliar,
      restaurarDemo,
    }),
    [estado, registrar, alternarApoio, avancar, avaliar, restaurarDemo],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useOcorrencias(): OcorrenciasApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOcorrencias deve ser usado dentro de <OcorrenciasProvider>');
  return ctx;
}

/** Seletor memoizado de uma ocorrência por id. */
export function useOcorrencia(id: string | undefined): Ocorrencia | undefined {
  const { lista } = useOcorrencias();
  return useMemo(() => lista.find((o) => o.id === id), [lista, id]);
}
