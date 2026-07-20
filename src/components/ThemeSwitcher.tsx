import { THEMES, THEME_ORDER } from '../templates/themes';
import type { ThemeName } from '../types/card';

interface Props {
  value: ThemeName;
  onChange: (t: ThemeName) => void;
}

export default function ThemeSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex gap-2.5 flex-wrap" role="radiogroup" aria-label="Card color theme">
      {THEME_ORDER.map((key) => {
        const t = THEMES[key];
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            title={t.label}
            onClick={() => onChange(key)}
            className="w-8 h-8 rounded-full border transition-shadow"
            style={{
              background: t.bg,
              borderColor: active ? '#46433C' : 'rgba(0,0,0,0.15)',
              boxShadow: active ? '0 0 0 2px rgba(0,0,0,0.08)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
