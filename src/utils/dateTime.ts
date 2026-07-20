import type { CardData } from '../types/card';

/**
 * Combines birthDate + birthTime into a single Date. If no time was
 * given, assumes local noon at the birth location, per the product spec.
 */
export function resolveObservationMoment(data: Pick<CardData, 'birthDate' | 'birthTime'>): Date {
  const time = data.birthTime || '12:00';
  return new Date(`${data.birthDate}T${time}:00`);
}
