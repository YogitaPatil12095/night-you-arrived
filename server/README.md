# The Night You Arrived — PDF Server

Generates press-ready, two-page PDFs (front + back) for a card: true
`/DeviceCMYK` color (verified — not RGB tagged as CMYK), full 3mm bleed,
6mm safe margins, and crop marks at every corner, on a 105 x 148mm (A6)
card. Star field, moon phase, and constellations are computed server-side
with the same Astronomy Engine + HYG-derived catalogue as the frontend, so
the PDF always matches what the creator saw in the live preview.

## Run locally

```bash
npm install
node src/index.js
# -> Night You Arrived PDF server listening on :4000
```

## Test it

```bash
curl -X POST http://localhost:4000/api/pdf/generate \
  -H "Content-Type: application/json" \
  -d '{
    "recipientName": "Elena Marchetti",
    "birthDate": "2019-09-14",
    "birthTime": "21:42",
    "location": { "name": "Kyoto, Japan", "lat": 35.0116, "lon": 135.7681 },
    "theme": "ivory",
    "shareCode": "ABX82K"
  }' \
  -o card.pdf
```

## Deploying

This needs a real Node process (not a static host) — Render, Railway, or
Fly.io are the simplest options:

1. Push this `server/` folder as its own repo (or a subdirectory Render/Railway can target).
2. **Render**: New → Web Service → connect repo → root directory `server` → build command `npm install` → start command `node src/index.js`.
3. **Railway**: New Project → Deploy from repo → set root directory to `server` — it auto-detects Node.
4. Once deployed, copy the service URL (e.g. `https://your-app.onrender.com`) and set it as `VITE_API_URL` in your frontend's Netlify/Vercel environment variables, then redeploy the frontend.

## Known limitations (honest list)

- **Color conversion is naive device CMYK**, not ICC color-managed. The PDF is structurally, verifiably CMYK — confirmed by inspecting the raw content stream — but for a real print run, have your printer (or a tool like Adobe Acrobat's preflight) run a proper color-managed conversion/soft proof before the job goes to press. Screen-to-print color always shifts somewhat; this is normal, not a bug.
- **Fonts are PDFKit's built-ins** (Times-Roman, Helvetica) rather than the Shippori Mincho / Zen Kaku Gothic New used on the web preview, since embedding those requires bundling actual font files (not fetched here to keep the server dependency-free). To match exactly, download the `.ttf` files and `doc.registerFont('Shippori', 'path/to/font.ttf')` in `generateCardPdf.js`.
- **No auth/rate limiting** on the endpoint — add both before this is public, since PDF generation is CPU work an anonymous client could hammer.
