/**
 * Converts a hex RGB color to CMYK percentages (0-100), the format
 * PDFKit expects for doc.fillColor([c, m, y, k]).
 *
 * NOTE: this is a naive device CMYK conversion (no ICC color profile).
 * It's enough to produce a genuinely CMYK-encoded PDF — which is what
 * "CMYK-ready" means structurally — but a professional press will still
 * want to run their own color-managed conversion/proof before a real
 * print run, since naive conversion can shift how colors look on paper.
 */
function hexToCmyk(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 100];

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return [c, m, y, k].map((v) => Math.round(v * 100));
}

const THEME_HEX = {
  ivory:     { bg: '#F7F4EC', ink: '#201E1A', muted: '#8C8574', line: '#DAD3C2', star: '#B69A5E' },
  charcoal:  { bg: '#201F1D', ink: '#EDE9E0', muted: '#A39D8E', line: '#3A3936', star: '#C9A15A' },
  forest:    { bg: '#1B2620', ink: '#E8E6DD', muted: '#93A08F', line: '#33413A', star: '#B9A46A' },
  navy:      { bg: '#171C26', ink: '#E7E6E0', muted: '#8F97A6', line: '#2B323F', star: '#C2B27A' },
  warmgrey:  { bg: '#EDEAE4', ink: '#2A2822', muted: '#8A8477', line: '#D2CDC2', star: '#9C8A5E' },
  sand:      { bg: '#EFE6D6', ink: '#2B2418', muted: '#93815F', line: '#DCCFB4', star: '#A6813F' },
  sage:      { bg: '#E4E7DD', ink: '#262B22', muted: '#7C8873', line: '#CBD1C0', star: '#7C8A5E' },
  dustyblue: { bg: '#DCE2E6', ink: '#222A2E', muted: '#6E7F87', line: '#C0CBD1', star: '#5E7A8A' },
  burgundy:  { bg: '#241417', ink: '#E9DFDD', muted: '#A98D8F', line: '#3E262B', star: '#A65E6A' },
};

function themeToCmyk(themeName) {
  const hex = THEME_HEX[themeName] || THEME_HEX.ivory;
  return {
    bg: hexToCmyk(hex.bg),
    ink: hexToCmyk(hex.ink),
    muted: hexToCmyk(hex.muted),
    line: hexToCmyk(hex.line),
    star: hexToCmyk(hex.star),
  };
}

module.exports = { hexToCmyk, themeToCmyk, THEME_HEX };
