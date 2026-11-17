import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { storage } from '../services/storage';
import type { Perfil, PreferenciasAcessibilidade } from '../types';

/**
 * Perfil do cidadão e preferências de acessibilidade.
 * Mantido em um contexto SEPARADO das ocorrências: mudar a lista de
 * ocorrências não re-renderiza componentes que só dependem do tema, e vice-versa.
 */

const ACESS_PADRAO: PreferenciasAcessibilidade = { fonteGrande: false, altoContraste: false, leituraVoz: true };

interface PreferenciasApi {
  carregado: boolean;
  perfil: Perfil | null;
  acessibilidade: PreferenciasAcessibilidade;
  salvarPerfil: (p: Perfil) => void;
  alterarAcessibilidade: (parcial: Partial<PreferenciasAcessibilidade>) => void;
  sair: () => void;
}

const Ctx = createContext<PreferenciasApi | null>(null);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [carregado, setCarregado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [acessibilidade, setAcessibilidade] = useState<PreferenciasAcessibilidade>(ACESS_PADRAO);

  useEffect(() => {
    let ativo = true;
    Promise.all([storage.carregarPerfil(), storage.carregarAcessibilidade()]).then(([p, a]) => {
      if (!ativo) return;
      setPerfil(p);
      if (a) setAcessibilidade({ ...ACESS_PADRAO, ...a });
      setCarregado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const salvarPerfil = useCallback((p: Perfil) => {
    setPerfil(p);
    storage.salvarPerfil(p);
    // Quem declara necessidade de acessibilidade já começa com fonte ampliada.
    if (p.necessidadeAcessibilidade) {
      setAcessibilidade((atual) => {
        const novo = { ...atual, fonteGrande: true };
        storage.salvarAcessibilidade(novo);
        return novo;
      });
    }
  }, []);

  const alterarAcessibilidade = useCallback((parcial: Partial<PreferenciasAcessibilidade>) => {
    setAcessibilidade((atual) => {
      const novo = { ...atual, ...parcial };
      storage.salvarAcessibilidade(novo);
      return novo;
    });
  }, []);

  const sair = useCallback(() => {
    setPerfil(null);
    storage.limparTudo();
  }, []);

  const api = useMemo(
    () => ({ carregado, perfil, acessibilidade, salvarPerfil, alterarAcessibilidade, sair }),
    [carregado, perfil, acessibilidade, salvarPerfil, alterarAcessibilidade, sair],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePreferencias(): PreferenciasApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePreferencias deve ser usado dentro de <PreferenciasProvider>');
  return ctx;
}
