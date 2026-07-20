// PDF points are the native PDFKit unit: 72pt = 1 inch = 25.4mm.
const PT_PER_MM = 72 / 25.4;

function mm(value) {
  return value * PT_PER_MM;
}

/**
 * Card dimensions. A6 (105 x 148mm) is a common premium postcard/keepsake
 * size and prints cleanly at most commercial presses. Change here to
 * resize the whole product -- every other module reads from this.
 *
 * The physical PDF page is larger than the card itself: it includes the
 * bleed (ink that gets trimmed off) plus extra margin so crop marks can
 * sit outside the bleed without being cut into the artwork -- this is
 * how professional press-ready files are actually structured.
 */
const CARD = {
  trimWidthMm: 105,
  trimHeightMm: 148,
  bleedMm: 3,
  safeMarginMm: 6,
  markMarginMm: 6,
  cropMarkLengthMm: 4,
  cropMarkGapMm: 2, // gap between bleed edge and start of the crop mark
};

CARD.bleedWidthMm = CARD.trimWidthMm + CARD.bleedMm * 2;
CARD.bleedHeightMm = CARD.trimHeightMm + CARD.bleedMm * 2;
CARD.pageWidthMm = CARD.bleedWidthMm + CARD.markMarginMm * 2;
CARD.pageHeightMm = CARD.bleedHeightMm + CARD.markMarginMm * 2;

/** Returns every key edge position (in points) for the card geometry. */
function computeEdges() {
  const pageW = mm(CARD.pageWidthMm);
  const pageH = mm(CARD.pageHeightMm);
  const bleedX = mm(CARD.markMarginMm);
  const bleedY = mm(CARD.markMarginMm);
  const bleedW = mm(CARD.bleedWidthMm);
  const bleedH = mm(CARD.bleedHeightMm);
  const trimX = bleedX + mm(CARD.bleedMm);
  const trimY = bleedY + mm(CARD.bleedMm);
  const trimW = mm(CARD.trimWidthMm);
  const trimH = mm(CARD.trimHeightMm);
  const safe = mm(CARD.safeMarginMm);

  return {
    pageW, pageH,
    bleed: { x: bleedX, y: bleedY, w: bleedW, h: bleedH },
    trim: { x: trimX, y: trimY, w: trimW, h: trimH },
    safeArea: { x: trimX + safe, y: trimY + safe, w: trimW - safe * 2, h: trimH - safe * 2 },
  };
}

module.exports = { mm, PT_PER_MM, CARD, computeEdges };
