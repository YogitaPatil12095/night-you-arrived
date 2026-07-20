import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardData, SkyResult } from '../types/card';
import { getCardByShareCode } from '../services/cardService';
import { computeSky, visibleConstellations } from '../astronomy/skyEngine';
import { starVisual } from '../utils/starVisual';
import { resolveObservationMoment } from '../utils/dateTime';
import { THEMES } from '../templates/themes';

type Stage = 'loading' | 'date' | 'sky' | 'content';

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY',
    'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDisplayTime(hhmm?: string): string | null {
  if (!hhmm) return null;
  const [h, min] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

export default function NightPage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<CardData | null>(null);
  const [sky, setSky] = useState<SkyResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'missing'>('loading');
  const [stage, setStage] = useState<Stage>('loading');

  useEffect(() => {
    if (!code) return;
    getCardByShareCode(code).then((card) => {
      if (!card) {
        setStatus('missing');
        return;
      }
      setData(card);
      setSky(computeSky(resolveObservationMoment(card), card.location));
      setStatus('found');
    });
  }, [code]);

  // staged reveal, advancing automatically -- loading -> birth date -> sky -> full content
  useEffect(() => {
    if (status !== 'found') return;
    setStage('loading');
    const t1 = setTimeout(() => setStage('date'), 500);
    const t2 = setTimeout(() => setStage('sky'), 500 + 1600);
    const t3 = setTimeout(() => setStage('content'), 500 + 1600 + 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [status]);

  if (status === 'loading') {
    return <CenteredMessage>Loading the sky…</CenteredMessage>;
  }
  if (status === 'missing' || !data || !sky) {
    return <CenteredMessage>This card couldn't be found.</CenteredMessage>;
  }

  const t = THEMES[data.theme];
  const constellations = visibleConstellations(sky, 6);
  const time = formatDisplayTime(data.birthTime);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: t.bg, color: t.ink }}>
      {stage !== 'content' && (
        <button
          onClick={() => setStage('content')}
          className="absolute top-6 right-6 text-[11px] tracking-widest z-20 px-3 py-1.5 border"
          style={{ color: t.muted, borderColor: t.line }}
        >
          SKIP INTRO
        </button>
      )}

      <AnimatePresence mode="wait">
        {stage === 'loading' && (
          <motion.div
            key="loading"
            className="min-h-screen flex items-center justify-center text-xs tracking-[3px]"
            style={{ color: t.muted }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            PREPARING THE SKY
          </motion.div>
        )}

        {stage === 'date' && (
          <motion.div
            key="date"
            className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.p
              className="text-[11px] tracking-[3px]"
              style={{ color: t.muted }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9 }}
            >
              THE NIGHT YOU ARRIVED
            </motion.p>
            <motion.h1
              className="text-4xl"
              style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 500 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 1 }}
            >
              {data.recipientName}
            </motion.h1>
            <motion.div
              className="text-sm tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 1 }}
            >
              {formatDisplayDate(data.birthDate)}
            </motion.div>
            <motion.div
              className="text-xs"
              style={{ color: t.muted }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 1 }}
            >
              {time ? `${time} · ${data.location.name}` : `${data.location.name} · local noon`}
            </motion.div>
          </motion.div>
        )}

        {(stage === 'sky' || stage === 'content') && (
          <motion.div
            key="main"
            className="max-w-xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-8 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <p className="text-[11px] tracking-[3px]" style={{ color: t.muted }}>
              THE NIGHT YOU ARRIVED
            </p>
            <h1 className="text-3xl" style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 500 }}>
              {data.recipientName}
            </h1>

            <svg viewBox="0 0 288 288" className="w-full max-w-sm">
              {stage === 'content' && sky.constellationLines.map((line, li) => (
                <g key={`${line.constellation}-${li}`}>
                  {line.segments.map((seg, si) => (
                    <motion.polyline
                      key={si}
                      points={seg.map(([x, y]) => `${x * 288},${y * 288}`).join(' ')}
                      fill="none"
                      stroke={t.star}
                      strokeWidth={0.4}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.35 }}
                      transition={{ delay: 0.3, duration: 1.2 }}
                    />
                  ))}
                </g>
              ))}
              {sky.stars.map((s, i) => {
                const v = starVisual(s.magnitude);
                const cx = s.x * 288;
                const cy = s.y * 288;
                const delay = Math.min(i * 0.004, 1.2);
                return (
                  <motion.g
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay, duration: 0.8 }}
                  >
                    <circle cx={cx} cy={cy} r={v.haloRadius} fill={t.star} opacity={v.haloOpacity} />
                    <circle cx={cx} cy={cy} r={v.coreRadius} fill={t.star} opacity={v.coreOpacity} />
                    {v.isBright && (
                      <g stroke={t.star} strokeWidth={0.4} opacity={0.5}>
                        <line x1={cx - v.haloRadius * 1.8} y1={cy} x2={cx + v.haloRadius * 1.8} y2={cy} />
                        <line x1={cx} y1={cy - v.haloRadius * 1.8} x2={cx} y2={cy + v.haloRadius * 1.8} />
                      </g>
                    )}
                  </motion.g>
                );
              })}
            </svg>

            <div className="text-sm" style={{ color: t.muted }}>
              {sky.moonPhaseName} · {sky.moonIllumination}% illuminated
              <br />
              {constellations.join(', ')}
            </div>

            <AnimatePresence>
              {stage === 'content' && (
                <>
                  {data.poem && (
                    <motion.p
                      className="text-base leading-relaxed max-w-md"
                      style={{ fontFamily: "'Shippori Mincho', serif" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 1 }}
                    >
                      {data.poem}
                    </motion.p>
                  )}

                  {data.musicUrl && (
                    <motion.a
                      href={data.musicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs tracking-wide px-5 py-3 border"
                      style={{ borderColor: t.line }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 1 }}
                    >
                      PLAY OUR SONG
                    </motion.a>
                  )}

                  {data.voiceMessageUrl && (
                    <motion.div
                      className="w-full max-w-sm flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 1 }}
                    >
                      <p className="text-[10px] tracking-[2px]" style={{ color: t.muted }}>
                        A MESSAGE FOR YOU
                      </p>
                      <audio controls src={data.voiceMessageUrl} className="w-full" />
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'var(--app-muted)' }}>
      {children}
    </div>
  );
}
