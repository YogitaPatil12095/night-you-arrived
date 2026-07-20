export type ThemeName =
  | 'ivory'
  | 'charcoal'
  | 'forest'
  | 'navy'
  | 'warmgrey'
  | 'sand'
  | 'sage'
  | 'dustyblue'
  | 'burgundy'
  | 'midnightcopper';

export interface BirthLocation {
  /** Display label, e.g. "Kyoto, Japan" */
  name: string;
  lat: number;
  lon: number;
}

export interface CardData {
  recipientName: string;
  /** ISO date string, e.g. "2019-09-14" */
  birthDate: string;
  /** "HH:MM" 24h, omitted if the creator didn't provide one */
  birthTime?: string;
  /** true when birthTime was not supplied and noon was assumed */
  timeIsApproximate: boolean;
  location: BirthLocation;
  theme: ThemeName;
  musicUrl?: string;
  poem?: string;
  /** Storage path/URL for an uploaded voice message, filled in after upload */
  voiceMessageUrl?: string;
  /** Permanent short code used in the /night/:code URL, assigned on save */
  shareCode?: string;
}

export interface StarPoint {
  id: number;
  name: string;
  constellation: string;
  magnitude: number;
  altitude: number;
  azimuth: number;
  /** projected 2D position for rendering, 0-1 normalized */
  x: number;
  y: number;
}

export interface ConstellationLine {
  constellation: string;
  /** projected 0-1 normalized [x,y] pairs for each visible segment (already split at the horizon) */
  segments: [number, number][][];
}

export interface SkyResult {
  observedAt: Date;
  moonPhaseName: string;
  moonIllumination: number;
  visiblePlanets: string[];
  stars: StarPoint[];
  constellationLines: ConstellationLine[];
}