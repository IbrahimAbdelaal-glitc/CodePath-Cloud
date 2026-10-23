import { useEffect, useState } from 'react';
import { Clock, Moon, Sun } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

// The theme logic and switch times live in the inline script in index.html, which also applies the theme before first paint
const theme = window.codepathTheme;
const OPTIONS = [
  { mode: 'auto', icon: Clock },
  { mode: 'light', icon: Sun },
  { mode: 'dark', icon: Moon },
];

export default function ThemeControl() {
  const { t } = useI18n();
  const [mode, setMode] = useState(theme.getMode);
  const [current, setCurrent] = useState(() => theme.resolve(theme.getMode()));

  // In Auto, switch at the configured times. Timers pause while a device sleeps, so also re-check when the tab is shown again.
  useEffect(() => {
    setCurrent(theme.apply(mode));
    if (mode !== 'auto') return undefined;
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setCurrent(theme.apply('auto'));
        schedule();
      }, theme.msUntilNextSwitch() + 1000);
    };
    schedule();
    const onVisible = () => {
      if (document.visibilityState === 'visible') setCurrent(theme.apply('auto'));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [mode]);

  // Keep other open tabs in sync with a change made here
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === theme.KEY) setMode(theme.getMode());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const choose = (next) => {
    theme.setMode(next);
    setMode(next);
  };

  return (
    <fieldset className="theme-control">
      <legend className="sr-only">{t('theme.label')}</legend>
      {OPTIONS.map(({ mode: option, icon: Icon }) => (
        <label
          key={option}
          className="theme-control__option"
          title={
            option === 'auto'
              ? t('theme.autoHint', { from: theme.LIGHT_FROM, to: theme.DARK_FROM, current: t(`theme.${current}`) })
              : t(`theme.${option}`)
          }
        >
          <input
            type="radio"
            name="theme-mode"
            value={option}
            checked={mode === option}
            onChange={() => choose(option)}
            className="sr-only"
          />
          <Icon size={16} aria-hidden="true" />
          <span className="theme-control__text">{t(`theme.${option}`)}</span>
        </label>
      ))}
    </fieldset>
  );
}
