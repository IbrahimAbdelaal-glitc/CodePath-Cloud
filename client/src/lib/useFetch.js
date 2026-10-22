import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Loads data from the API with loading/error state and a reload function.
// Results are tied to the path they came from, so stale data is never shown when the path changes.
export function useFetch(path, { enabled = true } = {}) {
  const [state, setState] = useState({ key: null, data: null, error: null, loading: false });
  const [version, setVersion] = useState(0);
  const active = Boolean(path && enabled);

  useEffect(() => {
    if (!active) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: controller.signal })
      .then((data) => setState({ key: path, data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ key: path, data: null, error, loading: false });
      });
    return () => controller.abort();
  }, [path, active, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const mutate = useCallback((updater) => setState((s) => ({ ...s, data: updater(s.data) })), []);

  const fresh = state.key === path;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : null,
    loading: active && (!fresh || state.loading),
    reload,
    mutate,
  };
}
