import type { Coordenada } from '../types';

const RAIO_TERRA_KM = 6371;
const toRad = (graus: number) => (graus * Math.PI) / 180;

/**
 * Distância em km entre duas coordenadas pela fórmula de Haversine.
 * Mesma lógica da função PL/SQL FN_DISTANCIA_KM, garantindo resultados idênticos
 * no app e no banco.
 */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Formata a distância para leitura humana ("350 m", "1,2 km"). */
export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/** Localização padrão (Av. Paulista - São Paulo) usada quando o GPS não é permitido. */
export const LOCAL_PADRAO: Coordenada = Object.freeze({ latitude: -23.5641, longitude: -46.6524 });
