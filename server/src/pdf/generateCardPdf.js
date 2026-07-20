const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { computeEdges } = require('./printGeometry');
const { drawCropMarks } = require('./cropMarks');
const { themeToCmyk } = require('./colors');
const { computeSky, visibleConstellations } = require('../astronomy/skyEngine');

function starVisual(magnitude) {
  const m = Math.max(-1.5, Math.min(6, magnitude));
  const brightness = 1 - (m + 1.5) / 7.5;
  return {
    coreRadius: 0.35 + brightness * 1.1,
    haloRadius: 1.2 + brightness * 4.5,
    haloOpacity: 0.08 + brightness * 0.22,
    coreOpacity: 0.65 + brightness * 0.35,
    isBright: magnitude < 1.0,
  };
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY',
    'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDisplayTime(hhmm) {
  if (!hhmm) return null;
  const [h, min] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

function drawSeal(doc, x, y, cmyk) {
  doc.save();
  doc.strokeColor(cmyk.line).lineWidth(0.7);
  doc.circle(x + 8, y + 8, 8.5).stroke();
  doc.fillColor(cmyk.star);
  doc.polygon(
    [x + 8, y + 3], [x + 8.9, y + 6.8], [x + 12.5, y + 6.8],
    [x + 9.6, y + 9], [x + 10.5, y + 12.8], [x + 8, y + 10.4],
    [x + 5.5, y + 12.8], [x + 6.4, y + 9], [x + 3.5, y + 6.8], [x + 7.1, y + 6.8],
  ).fill();
  doc.restore();
}

function drawVerticalLabel(doc, text, x, yCenter, cmyk, size = 6.5, tracking = 1.6) {
  doc.save();
  doc.translate(x, yCenter);
  doc.rotate(90);
  doc.font('Helvetica').fontSize(size).fillColor(cmyk.muted);
  doc.text(text, -200, 0, { width: 400, align: 'center', characterSpacing: tracking });
  doc.restore();
}

function drawFront(doc, edges, card, cmyk) {
  const { bleed, trim, safeArea } = edges;

  doc.rect(bleed.x, bleed.y, bleed.w, bleed.h).fill(cmyk.bg);

  drawSeal(doc, trim.x + 22, trim.y + 22, cmyk);
  drawVerticalLabel(doc, 'THE NIGHT YOU ARRIVED', trim.x + trim.w - 22, trim.y + trim.h / 2, cmyk);

  const time = formatDisplayTime(card.birthTime);
  const contentX = safeArea.x;
  const contentW = safeArea.w - 24; // leave room for the vertical spine text
  let cy = trim.y + trim.h / 2 - 55;

  doc.font('Helvetica').fontSize(8).fillColor(cmyk.muted);
  doc.text('A RECORD OF THE SKY', contentX, cy, { characterSpacing: 2, width: contentW });
  cy += 26;

  doc.font('Times-Roman').fontSize(24).fillColor(cmyk.ink);
  doc.text(card.recipientName || 'Recipient name', contentX, cy, { width: contentW });
  cy += 36;

  doc.save().strokeColor(cmyk.line).lineWidth(0.75)
    .moveTo(contentX, cy).lineTo(contentX + 26, cy).stroke().restore();
  cy += 18;

  doc.font('Helvetica').fontSize(9.5).fillColor(cmyk.ink);
  doc.text(formatDisplayDate(card.birthDate) || 'BIRTH DATE', contentX, cy, { characterSpacing: 1, width: contentW });
  cy += 16;

  doc.font('Helvetica').fontSize(8.5).fillColor(cmyk.muted);
  const subLine = time
    ? `${time}${card.location?.name ? ` \u00B7 ${card.location.name}` : ''}`
    : card.location?.name
      ? `${card.location.name} \u00B7 local noon`
      : 'Local noon';
  doc.text(subLine, contentX, cy, { width: contentW });
  cy += 14;

  if (card.timeIsApproximate) {
    doc.font('Helvetica-Oblique').fontSize(7).fillColor(cmyk.muted);
    doc.text('No time provided \u2014 sky shown for local noon (approximate).', contentX, cy, { width: contentW });
  }

  doc.font('Helvetica').fontSize(7.5).fillColor(cmyk.muted);
  doc.text('THE NIGHT YOU ARRIVED', trim.x + 22, trim.y + trim.h - 30, { characterSpacing: 1.4 });

  drawCropMarks(doc, edges);
}

function drawBack(doc, edges, card, sky, cmyk) {
  const { bleed, trim, safeArea } = edges;

  doc.rect(bleed.x, bleed.y, bleed.w, bleed.h).fill(cmyk.bg);

  drawSeal(doc, trim.x + 22, trim.y + 22, cmyk);

  const lat = Math.abs(card.location.lat).toFixed(4);
  const lon = Math.abs(card.location.lon).toFixed(4);
  const coordLabel = `${lat}\u00B0${card.location.lat >= 0 ? 'N' : 'S'} / ${lon}\u00B0${card.location.lon >= 0 ? 'E' : 'W'}`;
  drawVerticalLabel(doc, coordLabel, trim.x + trim.w - 22, trim.y + 70, cmyk, 6, 1.2);

  // moon phase icon: two overlapping circles form a crescent proportional to illumination
  const moonCx = trim.x + trim.w - 46;
  const moonCy = trim.y + 30;
  doc.save();
  doc.fillColor(cmyk.star).circle(moonCx, moonCy, 9).fill();
  doc.fillColor(cmyk.bg).circle(moonCx + (sky.moonIllumination / 100) * 4, moonCy, 9).fill();
  doc.restore();

  // star field, mapped into a square sky area
  const skyTop = trim.y + 60;
  const skyBottom = trim.y + trim.h - 130;
  const skySize = Math.min(trim.w - 48, skyBottom - skyTop);
  const skyX = trim.x + (trim.w - skySize) / 2;
  const skyY = skyTop;

  doc.save();
  doc.strokeColor(cmyk.star, 0.35).lineWidth(0.4);
  for (const line of sky.constellationLines) {
    for (const seg of line.segments) {
      doc.moveTo(skyX + seg[0][0] * skySize, skyY + seg[0][1] * skySize);
      for (let i = 1; i < seg.length; i++) {
        doc.lineTo(skyX + seg[i][0] * skySize, skyY + seg[i][1] * skySize);
      }
      doc.stroke();
    }
  }
  doc.restore();

  doc.save();
  for (const s of sky.stars) {
    const v = starVisual(s.magnitude);
    const cx = skyX + s.x * skySize;
    const cy = skyY + s.y * skySize;

    doc.fillColor(cmyk.star, v.haloOpacity).circle(cx, cy, v.haloRadius).fill();
    doc.fillColor(cmyk.star, v.coreOpacity).circle(cx, cy, v.coreRadius).fill();

    if (v.isBright) {
      doc.strokeColor(cmyk.star, 0.5).lineWidth(0.4);
      const spike = v.haloRadius * 1.8;
      doc.moveTo(cx - spike, cy).lineTo(cx + spike, cy).stroke();
      doc.moveTo(cx, cy - spike).lineTo(cx, cy + spike).stroke();
    }
  }
  doc.restore();

  // bottom data panel
  const panelY = trim.y + trim.h - 96;
  doc.save().strokeColor(cmyk.line).lineWidth(0.5)
    .moveTo(safeArea.x, panelY).lineTo(safeArea.x + safeArea.w, panelY).stroke().restore();

  const constellations = visibleConstellations(sky, 3);

  doc.font('Helvetica').fontSize(6.5).fillColor(cmyk.muted);
  doc.text('MOON', safeArea.x, panelY + 12, { characterSpacing: 1.2 });
  doc.font('Helvetica').fontSize(8.5).fillColor(cmyk.ink);
  doc.text(`${sky.moonPhaseName} \u00B7 ${sky.moonIllumination}%`, safeArea.x, panelY + 22);

  doc.font('Helvetica').fontSize(6.5).fillColor(cmyk.muted);
  doc.text('CONSTELLATIONS', safeArea.x, panelY + 40, { characterSpacing: 1.2 });
  doc.font('Helvetica').fontSize(8.5).fillColor(cmyk.ink);
  doc.text(constellations.join(', ') || '\u2014', safeArea.x, panelY + 50, { width: safeArea.w - 60 });

  drawCropMarks(doc, edges);
  return { skyX, skyY, skySize };
}

/**
 * Generates a press-ready, two-page PDF (front + back) for a card:
 * true CMYK color, full bleed, safe margins, and crop marks at every
 * corner. Returns a Buffer.
 */
async function generateCardPdf(card) {
  const edges = computeEdges();
  const cmyk = themeToCmyk(card.theme);

  const observedAt = new Date(`${card.birthDate}T${card.birthTime || '12:00'}:00`);
  const sky = computeSky(observedAt, card.location);

  const doc = new PDFDocument({
    size: [edges.pageW, edges.pageH],
    margin: 0,
    autoFirstPage: false,
    info: { Title: `The Night You Arrived \u2014 ${card.recipientName}`, Producer: 'The Night You Arrived' },
  });

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.addPage();
  drawFront(doc, edges, card, cmyk);

  doc.addPage();
  const skyBox = drawBack(doc, edges, card, sky, cmyk);

  // QR code, embedded as a crisp raster image sized well above print resolution
  const shareCode = card.shareCode || 'PREVIEW';
  const shareUrl = `https://nightyouarrived.com/night/${shareCode}`;
  const qrPngBuffer = await QRCode.toBuffer(shareUrl, { width: 600, margin: 0, color: { dark: '#000000', light: '#00000000' } });
  const qrSizePt = 46;
  doc.image(qrPngBuffer, edges.safeArea.x + edges.safeArea.w - qrSizePt, edges.trim.y + edges.trim.h - 96 + 6, {
    width: qrSizePt,
    height: qrSizePt,
  });

  doc.end();
  return done;
}

module.exports = { generateCardPdf };
