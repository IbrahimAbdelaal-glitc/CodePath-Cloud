// Reads a YouTube video's real runtime from its watch page. Two independent fields on the page must agree (within
// 1 second): "lengthSeconds" in the player response and the itemprop="duration" meta tag (ISO 8601). Anything else
// (blocked request, consent page, private or removed video) returns verified: false and no runtime: never a guess.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

const isoSeconds = (s) => {
  const m = s?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : null;
};
const unescape = (s) => (s == null ? null : JSON.parse(`"${s}"`));

export async function youtubeRuntime(id, { timeoutMs = 15000 } = {}) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}&hl=en`, {
      headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', cookie: 'CONSENT=YES+1' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { id, verified: false, seconds: null, reason: `HTTP ${res.status}` };
    const html = await res.text();
    const playability = html.match(/"playabilityStatus":\{"status":"(\w+)"/)?.[1] ?? null;
    const length = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1]) || null;
    const meta = isoSeconds(html.match(/itemprop="duration" content="([^"]+)"/)?.[1]);
    const verified = playability === 'OK' && length != null && meta != null && Math.abs(length - meta) <= 1;
    return {
      id,
      verified,
      seconds: verified ? length : null,
      title: unescape(html.match(/"title":"((?:[^"\\]|\\.)*)","lengthSeconds"/)?.[1]),
      channel: unescape(html.match(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/)?.[1]),
      reason: verified ? null : playability !== 'OK' ? `video ${playability ?? 'unavailable'}` : 'runtime not found on the video page',
    };
  } catch (err) {
    return { id, verified: false, seconds: null, reason: err.name === 'TimeoutError' ? 'timed out' : err.message };
  }
}
