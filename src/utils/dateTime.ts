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

  const time = normalizeTime(data.birthTime);
  const date = new Date(`${data.birthDate}T${time}`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Could not parse birth date/time: "${data.birthDate}T${time}"`);
  }

  return date;
}

/**
 * birthTime can arrive as "HH:MM" (the format the create-card form uses) or
 * as "HH:MM:SS" (e.g. Postgres's `time` type often round-trips with seconds
 * included). Normalize to a full "HH:MM:SS" string so we never blindly
 * append our own ":00" onto a value that already has seconds.
 */
function normalizeTime(raw?: string): string {
  if (!raw) return '12:00:00';
  const parts = raw.split(':');
  if (parts.length === 2) return `${raw}:00`;
  if (parts.length === 3) return raw;
  throw new Error(`Unrecognized birth time format: ${JSON.stringify(raw)}`);
}