const { mm, CARD } = require('./printGeometry');

/**
 * Draws the 8 standard crop-mark line segments (2 per corner), aligned
 * to the trim edges but starting outside the bleed box so they never
 * touch printed artwork. Drawn in solid black.
 */
function drawCropMarks(doc, edges) {
  const gap = mm(CARD.cropMarkGapMm);
  const len = mm(CARD.cropMarkLengthMm);
  const { bleed, trim } = edges;

  doc.save();
  doc.strokeColor([0, 0, 0, 100]); // registration-style solid black
  doc.lineWidth(0.5);

  const left = trim.x;
  const right = trim.x + trim.w;
  const top = trim.y;
  const bottom = trim.y + trim.h;

  const hStartLeft = bleed.x - gap;
  const hStartRight = bleed.x + bleed.w + gap;
  const vStartTop = bleed.y - gap;
  const vStartBottom = bleed.y + bleed.h + gap;

  // top-left
  doc.moveTo(hStartLeft, top).lineTo(hStartLeft - len, top).stroke();
  doc.moveTo(left, vStartTop).lineTo(left, vStartTop - len).stroke();
  // top-right
  doc.moveTo(hStartRight, top).lineTo(hStartRight + len, top).stroke();
  doc.moveTo(right, vStartTop).lineTo(right, vStartTop - len).stroke();
  // bottom-left
  doc.moveTo(hStartLeft, bottom).lineTo(hStartLeft - len, bottom).stroke();
  doc.moveTo(left, vStartBottom).lineTo(left, vStartBottom + len).stroke();
  // bottom-right
  doc.moveTo(hStartRight, bottom).lineTo(hStartRight + len, bottom).stroke();
  doc.moveTo(right, vStartBottom).lineTo(right, vStartBottom + len).stroke();

  doc.restore();
}

module.exports = { drawCropMarks };
