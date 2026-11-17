import { useMemo } from 'react';
import { usePreferencias } from '../context/PreferenciasContext';

/** Paleta padrão — contraste mínimo AA (WCAG 2.1) entre texto e fundo. */
const CORES_PADRAO = {
  primaria: '#0B6E4F',
  primariaClara: '#E3F4EC',
  sobrePrimaria: '#FFFFFF',
  fundo: '#F4F6F5',
  superficie: '#FFFFFF',
  texto: '#1B1F1D',
  textoSecundario: '#55605B',
  borda: '#D9DEDB',
  perigo: '#C92A2A',
  aviso: '#E67700',
  sucesso: '#2F9E44',
};

/** Paleta de alto contraste (AAA) para pessoas com baixa visão. */
const CORES_CONTRASTE: typeof CORES_PADRAO = {
  primaria: '#FFD400',
  primariaClara: '#2B2B00',
  sobrePrimaria: '#000000',
  fundo: '#000000',
  superficie: '#111111',
  texto: '#FFFFFF',
  textoSecundario: '#F1F1F1',
  borda: '#FFFFFF',
  perigo: '#FF6B6B',
  aviso: '#FFC078',
  sucesso: '#69DB7C',
};

export type Cores = typeof CORES_PADRAO;

export interface Tema {
  cores: Cores;
  altoContraste: boolean;
  /** Escala uma medida tipográfica conforme a preferência de fonte grande. */
  fs: (tamanho: number) => number;
  escala: number;
}

/**
 * Hook de tema acessível. O objeto retornado é memoizado e só muda quando o
 * usuário altera as preferências — os StyleSheets dependentes também.
 */
export function useTema(): Tema {
  const { acessibilidade } = usePreferencias();
  const { altoContraste, fonteGrande } = acessibilidade;
  return useMemo(() => {
    const escala = fonteGrande ? 1.3 : 1;
    return {
      cores: altoContraste ? CORES_CONTRASTE : CORES_PADRAO,
      altoContraste,
      escala,
      fs: (t: number) => Math.round(t * escala),
    };
  }, [altoContraste, fonteGrande]);
}
