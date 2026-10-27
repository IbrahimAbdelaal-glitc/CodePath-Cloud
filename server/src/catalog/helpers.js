// Helpers for writing catalog courses.

// A YouTube lesson video. With start/end it plays only that clip (times in seconds).
export function youtube(id, { start, end, duration, credit }) {
  return {
    youtubeId: id,
    start: start ?? null,
    end: end ?? null,
    duration: duration ?? null,
    credit,
    sourceUrl: `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`,
  };
}

// Seconds from "h:mm:ss" or "mm:ss"
export function t(stamp) {
  return stamp.split(':').reduce((s, part) => s * 60 + Number(part), 0);
}

export const TF = 'TRUE_FALSE';
export const MULTI = 'MULTI_SELECT';
export const FILL = 'FILL_IN_THE_BLANK';
