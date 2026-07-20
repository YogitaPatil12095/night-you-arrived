import type { BirthLocation } from '../types/card';

interface OpenMeteoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string; // state/region
}

/**
 * Real city search via Open-Meteo's free geocoding API — no API key
 * required, no account needed. Covers essentially any city worldwide,
 * unlike the earlier ~15-city demo list.
 *
 * If you'd rather use a different provider (OpenCage, Google, Mapbox),
 * this function's signature is the only thing that needs to stay the
 * same — swap the fetch call below.
 */
export async function searchCities(query: string): Promise<BirthLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    const results: OpenMeteoResult[] = json.results || [];

    return results.map((r) => ({
      name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      lat: r.latitude,
      lon: r.longitude,
    }));
  } catch {
    // Network hiccup or the API being briefly unavailable shouldn't crash
    // the form — just return no results, the input stays usable.
    return [];
  }
}

/** Best-effort browser geolocation, used when the creator skips location entirely. */
export function getCurrentLocation(): Promise<BirthLocation> {
  return new Promise((resolve) => {
    const fallback: BirthLocation = { name: 'Kyoto, Japan', lat: 35.0116, lon: 135.7681 };
    if (!navigator.geolocation) {
      resolve(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ name: 'Current location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(fallback),
      { timeout: 4000 },
    );
  });
}
