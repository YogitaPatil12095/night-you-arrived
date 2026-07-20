const Astronomy = require('astronomy-engine');
const STARS = require('./stars_naked_eye.json');
const CONSTELLATION_LINES = require('./constellation_lines.json');

// see src/astronomy/skyEngine.ts for the reasoning -- keep these in sync
const DISPLAY_MAGNITUDE_LIMIT = 4.0;
const DISPLAY_STARS = STARS.filter((s) => s.mag <= DISPLAY_MAGNITUDE_LIMIT);

const PLANETS = [
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
];

function moonPhaseName(angleDeg) {
  if (angleDeg < 22.5 || angleDeg >= 337.5) return 'New moon';
  if (angleDeg < 67.5) return 'Waxing crescent';
  if (angleDeg < 112.5) return 'First quarter';
  if (angleDeg < 157.5) return 'Waxing gibbous';
  if (angleDeg < 202.5) return 'Full moon';
  if (angleDeg < 247.5) return 'Waning gibbous';
  if (angleDeg < 292.5) return 'Last quarter';
  return 'Waning crescent';
}

function projectToDisc(altitude, azimuth) {
  const r = (90 - altitude) / 90;
  const azRad = (azimuth * Math.PI) / 180;
  const x = 0.5 + r * 0.5 * Math.sin(azRad);
  const y = 0.5 - r * 0.5 * Math.cos(azRad);
  return { x, y };
}

function computeConstellationLines(observer, time) {
  const result = [];

  for (const line of CONSTELLATION_LINES) {
    const projected = line.points.map(([ra, dec]) => {
      const hor = Astronomy.Horizon(time, observer, ra, dec, 'normal');
      if (hor.altitude <= 0) return null;
      const p = projectToDisc(hor.altitude, hor.azimuth);
      return [p.x, p.y];
    });

    let current = [];
    const segments = [];
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
 * Computes the real night sky for a given moment and location.
 * Mirrors src/astronomy/skyEngine.ts on the frontend exactly, so a
 * PDF export always matches what the creator saw in the live preview.
 */
function computeSky(date, location) {
  const observer = new Astronomy.Observer(location.lat, location.lon, 0);
  const time = Astronomy.MakeTime(date);

  const moonAngle = Astronomy.MoonPhase(time);
  const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, time);

  const visiblePlanets = [];
  for (const body of PLANETS) {
    const eq = Astronomy.Equator(body, time, observer, true, true);
    const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
    if (hor.altitude > 0) visiblePlanets.push(body.toString());
  }

  const stars = [];
  for (const s of DISPLAY_STARS) {
    const hor = Astronomy.Horizon(time, observer, s.ra, s.dec, 'normal');
    if (hor.altitude <= 0) continue;
    const { x, y } = projectToDisc(hor.altitude, hor.azimuth);
    stars.push({
      id: s.id,
      name: s.name || `${s.bayer} ${s.con}`.trim(),
      constellation: s.con,
      magnitude: s.mag,
      x,
      y,
    });
  }

  return {
    moonPhaseName: moonPhaseName(moonAngle),
    moonIllumination: Math.round(moonIllum.phase_fraction * 100),
    visiblePlanets,
    stars,
    constellationLines: computeConstellationLines(observer, time),
  };
}

function visibleConstellations(sky, limit = 3) {
  const seen = new Set();
  for (const star of sky.stars) {
    if (star.constellation) seen.add(star.constellation);
    if (seen.size >= limit) break;
  }
  return [...seen];
}

module.exports = { computeSky, visibleConstellations };
