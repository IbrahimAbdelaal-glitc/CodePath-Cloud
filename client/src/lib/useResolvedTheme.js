import { useEffect, useState } from 'react';

// The resolved theme ("light" or "dark") that the inline script in index.html sets on <html data-theme>
export function useResolvedTheme() {
  const read = () => document.documentElement.getAttribute('data-theme') || 'dark';
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}
