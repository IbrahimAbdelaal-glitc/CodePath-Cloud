import { useCallback, useEffect, useState } from 'react';

// Background animation is on unless the visitor turned it off here or their system asks for reduced motion.
const KEY = 'codepath.motion';
const EVENT = 'codepath:motion';
const query = () => window.matchMedia('(prefers-reduced-motion: reduce)');

function readChoice() {
  try {
    return localStorage.getItem(KEY) === 'off' ? 'off' : 'on';
  } catch {
    return 'on';
  }
}

export function useMotionPreference() {
  const [choice, setChoice] = useState(readChoice);
  const [reduced, setReduced] = useState(() => query().matches);

  useEffect(() => {
    const mq = query();
    const onChange = () => setReduced(mq.matches);
    const onToggle = () => setChoice(readChoice());
    mq.addEventListener('change', onChange);
    window.addEventListener(EVENT, onToggle);
    window.addEventListener('storage', onToggle);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener(EVENT, onToggle);
      window.removeEventListener('storage', onToggle);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = readChoice() === 'on' ? 'off' : 'on';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this page only */
    }
    setChoice(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { animate: choice === 'on' && !reduced, choice, reduced, toggle };
}
