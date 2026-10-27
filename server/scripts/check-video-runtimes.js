// Audits the runtime of every YouTube video in the course catalog against the video's own page (src/lib/youtubeRuntime.js).
//   npm run check:videos              compare live runtimes with src/catalog/video-runtimes.json; exit 1 on any difference
//   npm run check:videos -- --write   record the verified runtimes in src/catalog/video-runtimes.json
// A failed check never erases a runtime verified earlier (YouTube rate-limits bursts of requests); a video that was
// never verified is recorded with seconds: null and shown on the site as "runtime unavailable".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import courses from '../src/catalog/index.js';
import { youtubeRuntime } from '../src/lib/youtubeRuntime.js';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/catalog/video-runtimes.json');
const write = process.argv.includes('--write');
const stored = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};

const ids = [...new Set(courses.flatMap((c) => c.modules.flatMap((m) => m.lessons.filter((l) => l.video).map((l) => l.video.youtubeId))))];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
for (const id of ids) {
  let r = await youtubeRuntime(id);
  for (let retry = 1; !r.verified && /HTTP 429|timed out/.test(r.reason) && retry <= 3; retry++) {
    await wait(20000 * retry);
    r = await youtubeRuntime(id);
  }
  results.push(r);
  await wait(1500);
}

let problems = 0;
const today = new Date().toISOString().slice(0, 10);
const next = {};
for (const r of results) {
  const before = stored[r.id]?.seconds ?? null;
  if (!r.verified) {
    problems++;
    console.log(`UNVERIFIED ${r.id}: ${r.reason}`);
  } else if (before !== r.seconds) {
    problems++;
    console.log(`CHANGED    ${r.id}: recorded ${before ?? 'none'} s, video page ${r.seconds} s  ${r.title ?? ''}`);
  }
  next[r.id] = r.verified
    ? { seconds: r.seconds, title: r.title, channel: r.channel, checked: today }
    : { ...(stored[r.id] ?? { seconds: null, title: null, channel: null, checked: null }), lastFailure: r.reason };
}
console.log(`${results.length} videos: ${results.filter((r) => r.verified).length} verified, ${results.filter((r) => !r.verified).length} unverified`);

if (write) {
  const sorted = Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]]));
  fs.writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), file)}`);
} else if (problems) {
  process.exitCode = 1;
}
