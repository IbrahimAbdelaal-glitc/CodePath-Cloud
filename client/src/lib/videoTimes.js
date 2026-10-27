// One wording for video durations everywhere (course player, lesson page, path page, roadmap, print page).
// seconds: what the lesson plays; runtimeSeconds: the full video's verified runtime (null when unavailable);
// isClip: the lesson plays part of the video. A lesson's estimated time is a separate number.
export const minutesOf = (seconds) => (seconds ? Math.max(1, Math.round(seconds / 60)) : null);

// "Clip 40 min of a 1 hr 55 min video", "Video 5 min", or the runtime-unavailable wording
export function videoLabel(t, fmt, v) {
  if (!v) return null;
  const plays = fmt.duration(minutesOf(v.seconds));
  const full = v.runtimeSeconds ? fmt.duration(minutesOf(v.runtimeSeconds)) : null;
  if (v.isClip) return full ? t('video.clipOf', { plays, full }) : t('video.clipUnknown', { plays });
  return full ? t('video.full', { full }) : t('video.unavailable');
}

// Short form for tight spaces such as the course outline: "40 min clip" or "1 hr 30 min"
export function videoShort(t, fmt, v) {
  if (!v) return null;
  if (v.isClip) return t('video.clipShort', { plays: fmt.duration(minutesOf(v.seconds)) });
  return v.runtimeSeconds ? fmt.duration(minutesOf(v.runtimeSeconds)) : t('video.unavailableShort');
}

// 0:17, 39:52 or 1:05:03
export function clockTime(seconds) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
