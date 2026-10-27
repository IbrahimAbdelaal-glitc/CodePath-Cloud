import { Pause, Play } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useMotionPreference } from '../lib/useMotionPreference.js';

// Lets visitors pause the background animation (WCAG 2.2.2). Hidden when the system already requests reduced motion.
export default function MotionToggle() {
  const { t } = useI18n();
  const { choice, reduced, toggle } = useMotionPreference();
  if (reduced) return null;
  const on = choice === 'on';
  return (
    <button
      type="button"
      className="icon-btn motion-toggle"
      aria-pressed={!on}
      onClick={toggle}
      title={on ? t('motion.pause') : t('motion.play')}
    >
      {on ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      <span className="sr-only">{on ? t('motion.pause') : t('motion.play')}</span>
    </button>
  );
}
