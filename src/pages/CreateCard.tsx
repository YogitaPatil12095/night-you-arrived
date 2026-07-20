import { useRef, useState } from 'react';
import type { CardData } from '../types/card';
import { useSky } from '../hooks/useSky';
import CardFront from '../components/Card/CardFront';
import CardBack from '../components/Card/CardBack';
import ThemeSwitcher from '../components/ThemeSwitcher';
import AppModeToggle from '../components/AppModeToggle';
import VoiceRecorder from '../components/VoiceRecorder';
import { searchCities } from '../services/geocoding';
import { saveCard } from '../services/cardService';

const DEFAULT_LOCATION = { name: 'Kyoto, Japan', lat: 35.0116, lon: 135.7681 };

export default function CreateCard() {
  const [draftId] = useState(() => crypto.randomUUID());
  const [data, setData] = useState<CardData>({
    recipientName: 'Elena Marchetti',
    birthDate: '2019-09-14',
    birthTime: '21:42',
    timeIsApproximate: false,
    location: DEFAULT_LOCATION,
    theme: 'ivory',
    musicUrl: '',
  });
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<typeof DEFAULT_LOCATION[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sky = useSky(data);

  function update<K extends keyof CardData>(key: K, value: CardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function handleTimeChange(value: string) {
    update('birthTime', value || undefined);
    update('timeIsApproximate', !value);
  }

  async function handleCitySearch(q: string) {
    setCityQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) {
      setCityResults([]);
      return;
    }
    setCityLoading(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchCities(q);
      setCityResults(results);
      setCityLoading(false);
    }, 350);
  }

  async function handleGenerateLink() {
    setSaving(true);
    setShareError(null);
    try {
      const { shareCode } = await saveCard(data);
      update('shareCode', shareCode);
      const publicUrl = (import.meta.env.VITE_PUBLIC_URL as string | undefined) || window.location.origin;
      setShareUrl(`${publicUrl}/night/${shareCode}`);
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'Could not save this card. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const isLocalLink = !import.meta.env.VITE_PUBLIC_URL &&
    /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);

  function printSide(side: 'front' | 'back') {
    document.body.dataset.printSide = side;
    window.print();
  }

  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  // .replace strips any trailing slash(es) — an env value like ".../" would
  // otherwise produce a double slash before "/api/pdf/generate" and 404.
  const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');

  async function downloadPressReadyPdf() {
    if (!API_URL) {
      setPdfError('Set VITE_API_URL to your deployed PDF server to enable this.');
      return;
    }
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch(`${API_URL}/api/pdf/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.errors?.join(', ') || 'PDF generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.recipientName || 'card'}-night-you-arrived.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'PDF generation failed');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-14 gap-10">
      <AppModeToggle />

      <div
        className="w-full max-w-2xl p-7"
        style={{ background: 'var(--app-panel-bg)', border: '1px solid var(--app-border)' }}
      >
        <h2 className="text-xs tracking-[2px] mb-5" style={{ color: 'var(--app-muted)' }}>
          CARD DETAILS
        </h2>

        <div className="flex gap-4 flex-wrap mb-3.5">
          <Field label="Recipient name">
            <input
              value={data.recipientName}
              onChange={(e) => update('recipientName', e.target.value)}
            />
          </Field>
          <Field label="Birth date">
            <input type="date" value={data.birthDate} onChange={(e) => update('birthDate', e.target.value)} />
          </Field>
        </div>

        <div className="flex gap-4 flex-wrap mb-3.5">
          <Field label="Birth time (optional)">
            <input type="time" value={data.birthTime ?? ''} onChange={(e) => handleTimeChange(e.target.value)} />
          </Field>
          <Field label="Birth location (optional)">
            <input
              placeholder="Search a city"
              value={cityQuery || data.location.name}
              onChange={(e) => handleCitySearch(e.target.value)}
            />
            {cityLoading && (
              <div className="mt-1 text-xs px-2 py-1.5" style={{ color: 'var(--app-muted)' }}>
                Searching…
              </div>
            )}
            {!cityLoading && cityQuery.trim().length >= 2 && cityResults.length === 0 && (
              <div className="mt-1 text-xs px-2 py-1.5" style={{ color: 'var(--app-muted)' }}>
                No cities found.
              </div>
            )}
            {!cityLoading && cityResults.length > 0 && (
              <div className="mt-1 border max-h-40 overflow-auto" style={{ borderColor: 'var(--app-input-border)' }}>
                {cityResults.map((c) => (
                  <button
                    key={`${c.name}-${c.lat}-${c.lon}`}
                    type="button"
                    className="block w-full text-left px-2.5 py-1.5 text-xs hover:bg-black/5"
                    onClick={() => {
                      update('location', c);
                      setCityQuery('');
                      setCityResults([]);
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>

        {data.timeIsApproximate && (
          <p className="text-[11px] italic mb-3" style={{ color: 'var(--app-muted)' }}>
            No time provided — sky shown for local noon (approximate).
          </p>
        )}

        <div className="flex gap-4 flex-wrap mb-4">
          <Field label="Your song (Spotify, Apple Music, or YouTube Music link)">
            <input
              type="url"
              placeholder="https://open.spotify.com/track/..."
              value={data.musicUrl}
              onChange={(e) => update('musicUrl', e.target.value)}
            />
          </Field>
          <VoiceRecorder
            draftId={draftId}
            value={data.voiceMessageUrl}
            onChange={(url) => update('voiceMessageUrl', url)}
          />
        </div>

        <div className="mb-4">
          <label className="text-[11px] tracking-wide mb-1 block" style={{ color: 'var(--app-muted)' }}>
            A personal note or poem (optional)
          </label>
          <textarea
            value={data.poem ?? ''}
            onChange={(e) => update('poem', e.target.value)}
            rows={3}
            className="w-full text-sm p-2.5"
            style={{
              fontFamily: "'Shippori Mincho', serif",
              border: '1px solid var(--app-input-border)',
              background: 'var(--app-input-bg)',
              color: 'var(--app-text)',
            }}
          />
        </div>

        <h3 className="text-xs tracking-[2px] mb-2.5 mt-6" style={{ color: 'var(--app-muted)' }}>
          THEME
        </h3>
        <ThemeSwitcher value={data.theme} onChange={(t) => update('theme', t)} />

        <label className="flex items-center gap-2 mt-4 text-xs" style={{ color: 'var(--app-text)' }}>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Show constellation labels on the star map
        </label>

        <div className="flex gap-3 flex-wrap items-center mt-6">
          <ActionButton onClick={downloadPressReadyPdf} disabled={pdfLoading}>
            {pdfLoading ? 'Generating…' : 'Download print-ready PDF (both sides)'}
          </ActionButton>
          <ActionButton onClick={() => printSide('front')} secondary>Quick preview: front</ActionButton>
          <ActionButton onClick={() => printSide('back')} secondary>Quick preview: back</ActionButton>
          <ActionButton onClick={handleGenerateLink} secondary disabled={saving}>
            {saving ? 'Saving…' : 'Get shareable digital link'}
          </ActionButton>
          {shareUrl && (
            <code className="text-xs px-2 py-1" style={{ background: 'var(--app-input-bg)' }}>
              {shareUrl}
            </code>
          )}
        </div>
        {isLocalLink && shareUrl && (
          <p className="text-[11px] mt-2" style={{ color: '#A65E6A' }}>
            This link points to localhost — it only works on this machine. Open the site at your real Netlify URL to generate a link other people can actually use.
          </p>
        )}
        {shareError && (
          <p className="text-[11px] mt-2" style={{ color: '#A65E6A' }}>{shareError}</p>
        )}
        {pdfError && (
          <p className="text-[11px] mt-2" style={{ color: '#A65E6A' }}>{pdfError}</p>
        )}
      </div>

      <div className="flex gap-10 flex-wrap justify-center">
        <div className="w-[380px] h-[580px]" id="print-front">
          <CardFront data={data} />
        </div>
        <div className="w-[380px] h-[580px]" id="print-back">
          {sky && <CardBack data={data} sky={sky} showLabels={showLabels} />}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-[180px] flex flex-col">
      <label className="text-[11px] tracking-wide mb-1" style={{ color: 'var(--app-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  secondary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs tracking-wide px-4.5 py-2.5 disabled:opacity-50"
      style={
        secondary
          ? { background: 'transparent', color: 'var(--app-text)', border: '1px solid var(--app-text)' }
          : { background: 'var(--app-btn-bg)', color: 'var(--app-btn-text)', border: 'none' }
      }
    >
      {children}
    </button>
  );
}
