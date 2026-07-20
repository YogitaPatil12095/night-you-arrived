# The Night You Arrived

## Recent fixes

- **Star field was too dense/cluttered** — the full naked-eye catalogue (mag ≤ 6.0, ~2,500 stars per sky) rendered as a hazy cloud rather than a legible chart. Tightened the display cutoff to mag ≤ 4.0 (~500 stars in the catalogue, fewer once filtered to what's actually above the horizon) — sparse and clean like a real star chart. Adjustable in one place (`DISPLAY_MAGNITUDE_LIMIT` in both `skyEngine.ts` and `skyEngine.js`) if a denser sky is ever wanted back.
- **Constellation lines** — stars were previously just scattered points with no connecting lines. Added real constellation stick-figure data (78 constellations, from the [d3-celestial](https://github.com/ofrohn/d3-celestial) project, BSD-licensed) — each line segment is computed the same way as stars (real RA/Dec → real altitude/azimuth for the moment/location), and split wherever it dips below the horizon rather than drawing through the ground. Optional constellation-abbreviation labels can be toggled on in the create-card form.
- **Render deploy** — `server/package.json` was missing a `build` script; Render's autofilled `npm run build` was silently failing the deploy, which is why PDF generation appeared broken. Added a no-op build script.
- **Theme not retaining on print/download** — the real PDF (`server/`) always had correct theme colors (verified by generating a PDF with a non-default theme and inspecting it). The browser's "quick preview" print was the actual bug: browsers strip background colors when printing unless told not to. Fixed with `print-color-adjust: exact` in `src/index.css`.
- **Limited city list** — replaced the ~15-city demo list with real, live geocoding via [Open-Meteo's free API](https://open-meteo.com/en/docs/geocoding-api) (no API key needed). Any city worldwide now works, with debounced search-as-you-type.
- **Stars looked like flat dots** — replaced single flat circles with a halo + core + sparkle-cross treatment for the brightest stars, matching how real star atlases render brightness rather than uniform dots. Applied consistently across the live card preview, the digital `/night/:code` page, and the printed PDF.

A premium keepsake card generator: real night-sky astronomy for a birth date/time/location, rendered as a printable two-sided card plus a digital page behind a QR code.

## What's real vs. placeholder right now

**Real, working today:**
- Star field, moon phase, and visible-planet computation — powered by [Astronomy Engine](https://github.com/cosinekitty/astronomy) and a naked-eye-visible subset (5,070 stars, mag <= 6.0) derived from the [HYG star catalogue](https://github.com/astronexus/HYG-Database).
- Live card preview (front + back) that updates as you edit the form.
- 9 curated print themes.
- Light/dark app-shell toggle (separate from the card's own paper color).
- Shareable `/night/:code` digital page and QR code.
- **Shareable `/night/:code` digital page** — now with the full staged reveal: loading → birth date typographic reveal → stars fading in → poem/music/voice message appearing in sequence, matching the QR_EXPERIENCE spec. A "Skip" link is available for repeat visitors.
- **Voice message recording and upload** — record directly in the browser (MediaRecorder) or upload an audio file. Uploads to Supabase Storage when configured; falls back to a local-only preview URL otherwise (see note below).
- **Press-ready PDF export** (`server/`) — a real Node/Express service that generates true `/DeviceCMYK` PDFs (verified by inspecting the raw content stream, not just assumed), full 3mm bleed, 6mm safe margins, and crop marks on every corner, at 105 x 148mm (A6). See `server/README.md`.

- **Real city geocoding** — `src/services/geocoding.ts` now uses Open-Meteo's free geocoding API, no key required, covers any city worldwide.

**Stubbed, needs your credentials to go live:**
- **Supabase** — card storage. Without env vars set, cards are kept in memory only (lost on refresh). See `src/database/supabaseClient.ts` for the table schema to create.
- **Supabase Storage bucket for voice messages** — create a public bucket named `voice-messages` (see `src/services/voiceUpload.ts` for the exact SQL/dashboard steps). Without it, recorded voice messages only work in the same browser tab they were recorded in — they will NOT survive a page reload or work for the recipient on another device. Treat this as required before printing any real card with a voice message.
- **PDF font matching** — the PDF currently uses PDFKit's built-in fonts rather than the exact web fonts; see `server/README.md` for how to embed the real ones.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Create a `.env` file (Vite reads anything prefixed `VITE_`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-pdf-server.onrender.com
VITE_PUBLIC_URL=https://your-site.netlify.app
```

`VITE_PUBLIC_URL` is optional — without it, the shareable `/night/:code` link is built from wherever the browser currently is (`window.location.origin`), which is exactly right once you're actually on your deployed Netlify site, but will produce a `localhost` link if you generate one while running `npm run dev` locally. The app now visibly warns you when that happens. Setting `VITE_PUBLIC_URL` explicitly avoids the ambiguity entirely, which matters if you ever deploy behind a custom domain or a staging URL that differs from what `window.location.origin` would report.

Run the SQL in `src/database/supabaseClient.ts`'s comment block once in your Supabase project's SQL editor to create the `cards` table.

## Deploying

This is a static Vite app — any static host works:

- **Vercel**: `vercel deploy` (or connect the GitHub repo — it auto-detects Vite).
- **Netlify**: connect the repo, build command `npm run build`, publish directory `dist`.
- **Cloudflare Pages**: same build command/output directory.

Set the two `VITE_SUPABASE_*` environment variables in whichever host's dashboard so cards persist for real.

The `/night/:code` route needs SPA fallback routing (all paths serve `index.html`) — Vercel/Netlify do this automatically for Vite projects; if self-hosting, configure your server to rewrite unmatched paths to `/index.html`.

## Folder structure

```
src/
  components/Card/    CardFront, CardBack -- the actual printed card
  components/          ThemeSwitcher, AppModeToggle
  pages/                CreateCard (form + preview), NightPage (QR destination)
  templates/            the 9 curated color themes
  astronomy/            skyEngine.ts (real calculations) + bundled star catalogue
  hooks/                useSky -- memoized sky computation from card data
  services/             geocoding, cardService (save/load cards)
  database/             supabaseClient
  types/                shared TypeScript types
```

## Not yet built

- AI-generated poem option (spec says custom text for MVP, which is what's implemented)
- Interactive (pan/zoom) star map on the digital page -- currently static SVG
- Real ICC color-managed CMYK conversion and exact web-font embedding in the PDF (see `server/README.md`)
