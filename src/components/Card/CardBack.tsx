import { QRCodeSVG } from 'qrcode.react';
import type { CardData, SkyResult } from '../../types/card';
import { THEMES } from '../../templates/themes';
import { visibleConstellations } from '../../astronomy/skyEngine';
import { starVisual } from '../../utils/starVisual';

interface Props {
  data: CardData;
  sky: SkyResult;
  showLabels?: boolean;
}

const VIEW = 288; // sky viewBox size, square

export default function CardBack({ data, sky, showLabels = false }: Props) {
  const t = THEMES[data.theme];
  const constellations = visibleConstellations(sky, 3);
  const shareUrl = data.shareCode
    ? `https://nightyouarrived.com/night/${data.shareCode}`
    : 'https://nightyouarrived.com/night/preview';

  return (
    <div
      className="relative w-full h-full overflow-hidden border"
      style={{ background: t.bg, color: t.ink, borderColor: t.line }}
    >
      <svg className="absolute top-8 left-8" width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="9.5" fill="none" stroke={t.line} strokeWidth="1" />
        <path
          d="M11 6 L12.2 9.8 L16 9.8 L12.9 12.1 L14.1 16 L11 13.6 L7.9 16 L9.1 12.1 L6 9.8 L9.8 9.8 Z"
          fill={t.star}
        />
      </svg>

      <div
        className="absolute top-8 flex items-center justify-center text-[11px] tracking-[3px]"
        style={{ right: '26px', writingMode: 'vertical-rl', color: t.muted }}
      >
        {Math.abs(data.location.lat).toFixed(4)}°{data.location.lat >= 0 ? 'N' : 'S'}
        &nbsp;/&nbsp;
        {Math.abs(data.location.lon).toFixed(4)}°{data.location.lon >= 0 ? 'E' : 'W'}
      </div>

      {/* moon phase, simple two-circle crescent sized by illumination */}
      <svg className="absolute top-8" style={{ right: '60px' }} width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="11" fill={t.star} />
        <circle cx={13 + (sky.moonIllumination / 100) * 5} cy="13" r="11" fill={t.bg} />
      </svg>

      <svg
        className="absolute"
        style={{ top: '78px', left: '32px', right: '60px', bottom: '168px' }}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
      >
        {sky.constellationLines.map((line, li) => (
          <g key={`${line.constellation}-${li}`}>
            {line.segments.map((seg, si) => (
              <polyline
                key={si}
                points={seg.map(([x, y]) => `${x * VIEW},${y * VIEW}`).join(' ')}
                fill="none"
                stroke={t.star}
                strokeWidth={0.4}
                opacity={0.35}
              />
            ))}
            {showLabels && line.segments[0] && (
              <text
                x={line.segments[0][Math.floor(line.segments[0].length / 2)][0] * VIEW}
                y={line.segments[0][Math.floor(line.segments[0].length / 2)][1] * VIEW - 3}
                fontSize={5.5}
                letterSpacing={0.5}
                fill={t.muted}
                textAnchor="middle"
              >
                {line.constellation.toUpperCase()}
              </text>
            )}
          </g>
        ))}

        {sky.stars.map((s) => {
          const v = starVisual(s.magnitude);
          const cx = s.x * VIEW;
          const cy = s.y * VIEW;
          return (
            <g key={s.id}>
              <circle cx={cx} cy={cy} r={v.haloRadius} fill={t.star} opacity={v.haloOpacity} />
              <circle cx={cx} cy={cy} r={v.coreRadius} fill={t.star} opacity={v.coreOpacity} />
              {v.isBright && (
                <g stroke={t.star} strokeWidth={0.4} opacity={0.5}>
                  <line x1={cx - v.haloRadius * 1.8} y1={cy} x2={cx + v.haloRadius * 1.8} y2={cy} />
                  <line x1={cx} y1={cy - v.haloRadius * 1.8} x2={cx} y2={cy + v.haloRadius * 1.8} />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div
        className="absolute left-8 right-8 flex justify-between items-end pt-4"
        style={{ bottom: '32px', borderTop: `1px solid ${t.line}` }}
      >
        <div className="flex gap-6">
          <div className="text-[10px]">
            <div className="tracking-[1.5px] mb-1" style={{ color: t.muted }}>MOON</div>
            <div className="text-xs tracking-wide">{sky.moonPhaseName} · {sky.moonIllumination}%</div>
          </div>
          <div className="text-[10px]">
            <div className="tracking-[1.5px] mb-1" style={{ color: t.muted }}>CONSTELLATIONS</div>
            <div className="text-xs tracking-wide">{constellations.join(', ') || '—'}</div>
          </div>
        </div>
        <QRCodeSVG value={shareUrl} size={46} fgColor={t.ink} bgColor={t.bg} />
      </div>
    </div>
  );
}
