import { useEffect } from 'react';
import { api } from '../api/client.js';

// Reports active learning time on a lesson. A heartbeat goes out every HEARTBEAT_MS while the page is
// visible and focused and the student has interacted within IDLE_AFTER_MS. The server credits only the
// gaps between consecutive heartbeats (at most 60 seconds each), so idle or hidden time is not counted.
const HEARTBEAT_MS = 30 * 1000;
const IDLE_AFTER_MS = 2 * 60 * 1000;
const INPUT_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'];

export function useActivityHeartbeat(lessonId, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    let lastInput = Date.now();
    const onInput = () => {
      lastInput = Date.now();
    };
    const isActive = () =>
      document.visibilityState === 'visible' && document.hasFocus() && Date.now() - lastInput < IDLE_AFTER_MS;
    const beat = () => {
      if (isActive()) api(`/api/lessons/${lessonId}/activity`, { method: 'POST' }).catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') onInput();
    };

    INPUT_EVENTS.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(timer);
      INPUT_EVENTS.forEach((e) => window.removeEventListener(e, onInput));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [lessonId, enabled]);
}
