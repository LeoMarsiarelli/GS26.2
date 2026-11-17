import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';
import { usePreferencias } from '../context/PreferenciasContext';

/**
 * Leitura em voz alta (text-to-speech) em português, para pessoas com baixa
 * visão, idosos ou com baixa alfabetização.
 * Interrompe a fala automaticamente ao sair da tela (libera o recurso nativo).
 */
export function useLeitorVoz() {
  const { acessibilidade } = usePreferencias();
  const [falando, setFalando] = useState(false);

  const parar = useCallback(() => {
    Speech.stop();
    setFalando(false);
  }, []);

  const falar = useCallback((texto: string) => {
    Speech.stop();
    setFalando(true);
    Speech.speak(texto, {
      language: 'pt-BR',
      rate: 0.95,
      onDone: () => setFalando(false),
      onStopped: () => setFalando(false),
      onError: () => setFalando(false),
    });
  }, []);

  // Cleanup: ao desmontar, para qualquer fala pendente.
  useEffect(() => () => {
    Speech.stop();
  }, []);

  return { habilitado: acessibilidade.leituraVoz, falando, falar, parar };
}
