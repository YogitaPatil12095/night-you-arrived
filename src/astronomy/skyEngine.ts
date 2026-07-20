import * as Astronomy from 'astronomy-engine';
import starsRaw from './stars_naked_eye.json';
import constellationLinesRaw from './constellation_lines.json';
import type { SkyResult, StarPoint, ConstellationLine, BirthLocation } from '../types/card';

interface RawStar {
  id: number;
  name: string;
  bayer: string;
  con: string;
  ra: number;   // hours
  dec: number;  // degrees
  mag: number;
  ci: number | null;
}

const STARS = starsRaw as RawStar[];

/**
 * The full bundled catalogue goes down to mag 6.0 (true naked-eye limit),
 * but rendering all ~2,500 of those stars produces a dense, hazy field
 * that reads as visual noise rather than a clean chart. Cutting to a
 * brighter subset gives a sparse, legible sky closer to how a star chart
 * or planetarium screenshot actually looks. Raise this back toward 6.0
 * if a denser, more "photographically complete" sky is ever wanted.
 */
const DISPLAY_MAGNITUDE_LIMIT = 4.0;
const DISPLAY_STARS = STARS.filter((s) => s.mag <= DISPLAY_MAGNITUDE_LIMIT);

const PLANETS: Astronomy.Body[] = [
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
];

function moonPhaseName(angleDeg: number): string {
  if (angleDeg < 22.5 || angleDeg >= 337.5) return 'New moon';
  if (angleDeg < 67.5) return 'Waxing crescent';
  if (angleDeg < 112.5) return 'First quarter';
  if (angleDeg < 157.5) return 'Waxing gibbous';
  if (angleDeg < 202.5) return 'Full moon';
  if (angleDeg < 247.5) return 'Waning gibbous';
  if (angleDeg < 292.5) return 'Last quarter';
  return 'Waning crescent';
}

/**
 * Projects a star's horizontal (altitude/azimuth) position onto a flat
 * disc using an azimuthal-equidistant projection, normalized to 0-1
 * so it can be scaled to any card size at render time. Zenith is the
 * disc's center; the horizon is the disc's edge.
 */
function projectToDisc(altitude: number, azimuth: number): { x: number; y: number } {
  const r = (90 - altitude) / 90; // 0 at zenith, 1 at horizon
  const azRad = (azimuth * Math.PI) / 180;
  const x = 0.5 + r * 0.5 * Math.sin(azRad);
  const y = 0.5 - r * 0.5 * Math.cos(azRad);
  return { x, y };
}

interface RawLine {
  con: string;
  points: [number, number][]; // [ra_hours, dec_deg]
}

const CONSTELLATION_LINES = constellationLinesRaw as RawLine[];

/**
 * Computes which constellation-line segments are actually visible (both
 * endpoints above the horizon) for this moment/location, splitting a
 * path wherever it dips below the horizon rather than drawing a
 * misleading line straight through the ground.
 */
function computeConstellationLines(observer: Astronomy.Observer, time: Astronomy.AstroTime): ConstellationLine[] {
  const result: ConstellationLine[] = [];

  for (const line of CONSTELLATION_LINES) {
    const projected: ([number, number] | null)[] = line.points.map(([ra, dec]) => {
      const hor = Astronomy.Horizon(time, observer, ra, dec, 'normal');
      if (hor.altitude <= 0) return null;
      const p = projectToDisc(hor.altitude, hor.azimuth);
      return [p.x, p.y];
    });

    let current: [number, number][] = [];
    const segments: [number, number][][] = [];
    for (const p of projected) {
      if (p) {
        current.push(p);
      } else if (current.length > 1) {
        segments.push(current);
        current = [];
      } else {
        current = [];
      }
    }
    if (current.length > 1) segments.push(current);

    if (segments.length > 0) {
      result.push({ constellation: line.con, segments });
    }
  }

  return result;
}

/**
 * Computes the real night sky for a given moment and location:
 * moon phase, visible planets, and every naked-eye star that was
 * actually above the horizon.
 */
export function computeSky(date: Date, location: BirthLocation): SkyResult {
  const observer = new Astronomy.Observer(location.lat, location.lon, 0);
  const time = Astronomy.MakeTime(date);

  const moonAngle = Astronomy.MoonPhase(time);
  const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, time);

  const visiblePlanets: string[] = [];
  for (const body of PLANETS) {
    const eq = Astronomy.Equator(body, time, observer, true, true);
    const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
    if (hor.altitude > 0) visiblePlanets.push(body.toString());
  }

  const stars: StarPoint[] = [];
  for (const s of DISPLAY_STARS) {
    const hor = Astronomy.Horizon(time, observer, s.ra, s.dec, 'normal');
    if (hor.altitude <= 0) continue; // below horizon, not visible that night
    const { x, y } = projectToDisc(hor.altitude, hor.azimuth);
    stars.push({
      id: s.id,
      name: s.name || `${s.bayer} ${s.con}`.trim(),
      constellation: s.con,
      magnitude: s.mag,
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      x,
      y,
    });
  }

  return {
    observedAt: date,
    moonPhaseName: moonPhaseName(moonAngle),
    moonIllumination: Math.round(moonIllum.phase_fraction * 100),
    visiblePlanets,
    stars,
    constellationLines: computeConstellationLines(observer, time),
  };
}

/** Distinct constellations represented among the currently visible stars. */
export function visibleConstellations(sky: SkyResult, limit = 6): string[] {
  const seen = new Set<string>();
  for (const star of sky.stars) {
    if (star.constellation) seen.add(star.constellation);
    if (seen.size >= limit) break;
  }
  return [...seen];
}
