import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';

export default function AppModeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = mode === 'system' ? (mq.matches ? 'dark' : 'light') : mode;
      document.documentElement.dataset.appmode = resolved;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [mode]);

  return (
    <div className="flex items-center gap-2.5 text-xs tracking-wide text-[var(--app-muted)]">
      <span>App appearance</span>
      {(['light', 'dark', 'system'] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className="px-3.5 py-1.5 border text-xs capitalize"
          style={{
            background: mode === m ? 'var(--app-btn-bg)' : 'var(--app-panel-bg)',
            color: mode === m ? 'var(--app-btn-text)' : 'var(--app-text)',
            borderColor: mode === m ? 'var(--app-btn-bg)' : 'var(--app-border)',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
