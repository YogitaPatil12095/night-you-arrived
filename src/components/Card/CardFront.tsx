import type { CardData } from '../../types/card';
import { THEMES } from '../../templates/themes';

interface Props {
  data: CardData;
}

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

export default function CardFront({ data }: Props) {
  const t = THEMES[data.theme];
  const time = formatDisplayTime(data.birthTime);

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
        className="absolute top-8 bottom-8 flex items-center justify-center text-[11px] tracking-[4px]"
        style={{ right: '26px', writingMode: 'vertical-rl', color: t.muted }}
      >
        THE&nbsp;NIGHT&nbsp;YOU&nbsp;ARRIVED
      </div>

      <div className="absolute inset-0 flex flex-col justify-center items-start px-8 pr-[70px]">
        <div className="text-[11px] tracking-[3px] mb-6" style={{ color: t.muted }}>
          A RECORD OF THE SKY
        </div>
        <div
          className="text-[34px] leading-tight tracking-wide mb-6"
          style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 500 }}
        >
          {data.recipientName || 'Recipient name'}
        </div>
        <div className="w-9 h-px mb-6" style={{ background: t.line }} />
        <div className="text-[13px] tracking-[1.5px] mb-2">
          {formatDisplayDate(data.birthDate) || 'BIRTH DATE'}
        </div>
        <div className="text-xs" style={{ color: t.muted }}>
          {time
            ? `${time}${data.location?.name ? ` · ${data.location.name}` : ''}`
            : data.location?.name
              ? `${data.location.name} · local noon`
              : 'Local noon'}
        </div>
        {data.timeIsApproximate && (
          <div className="text-[11px] italic mt-1.5" style={{ color: t.muted }}>
            No time provided — sky shown for local noon (approximate).
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-8 text-[11px] tracking-[2px]" style={{ color: t.muted }}>
        THE&nbsp;NIGHT&nbsp;YOU&nbsp;ARRIVED
      </div>
    </div>
  );
}
