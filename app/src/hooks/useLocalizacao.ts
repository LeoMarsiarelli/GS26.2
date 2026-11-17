import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LOCAL_PADRAO } from '../services/geo';
import type { Coordenada } from '../types';

type EstadoLocalizacao = 'carregando' | 'ok' | 'negada' | 'erro';

/**
 * Obtém a localização atual UMA vez (sem watchPosition contínuo), economizando
 * bateria e memória. Usa precisão "Balanced" e cai para um local padrão se a
 * permissão for negada, para o app continuar utilizável.
 */
export function useLocalizacao(opcoes: { buscarEndereco?: boolean } = {}) {
  const [coordenada, setCoordenada] = useState<Coordenada>(LOCAL_PADRAO);
  const [endereco, setEndereco] = useState<string>('');
  const [estado, setEstado] = useState<EstadoLocalizacao>('carregando');
  const montado = useRef(true);
  const buscarEndereco = opcoes.buscarEndereco ?? false;

  const atualizar = useCallback(async () => {
    setEstado('carregando');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (montado.current) setEstado('negada');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!montado.current) return;
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoordenada(c);
      setEstado('ok');
      if (buscarEndereco) {
        try {
          const [r] = await Location.reverseGeocodeAsync(c);
          if (r && montado.current) {
            const partes = [r.street, r.streetNumber, r.district, r.city].filter(Boolean);
            setEndereco(partes.join(', '));
          }
        } catch {
          /* geocodificação reversa é opcional */
        }
      }
    } catch {
      if (montado.current) setEstado('erro');
    }
  }, [buscarEndereco]);

  useEffect(() => {
    montado.current = true;
    atualizar();
    return () => {
      montado.current = false;
    };
  }, [atualizar]);

  return { coordenada, endereco, estado, atualizar };
}
