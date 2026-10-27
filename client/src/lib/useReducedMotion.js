import { useEffect, useState } from 'react';

// True when the visitor's device asks for reduced motion (prefers-reduced-motion). Follows changes live.
const query = () => window.matchMedia('(prefers-reduced-motion: reduce)');

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => query().matches);
  useEffect(() => {
    const mq = query();
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
