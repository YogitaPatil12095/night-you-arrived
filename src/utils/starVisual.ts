export interface StarVisual {
  coreRadius: number;
  haloRadius: number;
  haloOpacity: number;
  coreOpacity: number;
  isBright: boolean; // gets a sparkle/diffraction-spike treatment
}

/**
 * Converts a star's real magnitude into rendering parameters. Brighter
 * stars (lower magnitude) get a larger soft halo plus a sparkle cross —
 * the way real star atlases distinguish Sirius from a barely-visible
 * mag-6 star — rather than every star being an identical flat dot.
 */
export function starVisual(magnitude: number): StarVisual {
  // clamp into a sane range; anything brighter than -1 or dimmer than 6 is rare/filtered already
  const m = Math.max(-1.5, Math.min(6, magnitude));
  const brightness = 1 - (m + 1.5) / 7.5; // 0 (dim) .. 1 (very bright)

  return {
    coreRadius: 0.35 + brightness * 1.1,
    haloRadius: 1.2 + brightness * 4.5,
    haloOpacity: 0.08 + brightness * 0.22,
    coreOpacity: 0.65 + brightness * 0.35,
    isBright: magnitude < 1.0,
  };
}
