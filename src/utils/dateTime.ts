import type { CardData } from '../types/card';

/**
 * Combines birthDate + birthTime into a single Date. If no time was
 * given, assumes local noon at the birth location, per the product spec.
 *
 * Throws a descriptive error if the underlying data can't produce a valid
 * date, instead of silently handing astronomy-engine an Invalid Date (which
 * it rejects with an opaque validation error deep inside its own code).
 */
export function resolveObservationMoment(data: Pick<CardData, 'birthDate' | 'birthTime'>): Date {
  if (!data.birthDate || typeof data.birthDate !== 'string') {
    throw new Error(`Missing or invalid birth date: ${JSON.stringify(data.birthDate)}`);
  }

  const time = data.birthTime || '12:00';
  const date = new Date(`${data.birthDate}T${time}:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Could not parse birth date/time: "${data.birthDate}T${time}:00"`);
  }

  return date;
}