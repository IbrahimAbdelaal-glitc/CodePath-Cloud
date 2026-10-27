// Checks the built-in course catalog without a database: answers match options, checkpoints fall inside their
// clips, every video has a question, keys are unique, every module has enough block-quiz questions, pass marks are
// at least 80%, linked courses exist, and resources carry an access label. Usage: npm run check:catalog
import courses from '../src/catalog/index.js';
import RUNTIMES from '../src/catalog/video-runtimes.json' with { type: 'json' };

const unverified = new Set();
const CHOICE = new Set(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTI_SELECT']);
const ACCESS = new Set(['FREE', 'ACCOUNT', 'PAID']);
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const https = (url) => /^https:\/\//.test(url);

function checkQuestion(q, where) {
  const type = q.type || (q.options ? 'MULTIPLE_CHOICE' : 'FILL_IN_THE_BLANK');
  const options = type === 'TRUE_FALSE' ? ['True', 'False'] : q.options;
  if (!q.q) fail(where, 'missing question text');
  if (!q.explanation) fail(where, 'missing explanation');
  if (CHOICE.has(type)) {
    const picks = type === 'MULTI_SELECT' ? q.answer : [q.answer];
    if (!Array.isArray(picks) || !picks.length) fail(where, 'missing answer');
    else if (picks.some((p) => !options?.includes(p))) fail(where, `answer not in options: ${JSON.stringify(q.answer)}`);
    if (options && new Set(options).size !== options.length) fail(where, 'repeated options');
  } else if (!String(q.answer ?? '').trim()) {
    fail(where, 'missing answer');
  }
  if (type === 'CODE_OUTPUT' && !q.code) fail(where, 'CODE_OUTPUT needs code');
  return type;
}

let totals = { lessons: 0, checkpoints: 0, bank: 0, readings: 0 };
const types = {};
// Linked courses are synced first, so a course may only link courses listed before it
const earlier = new Set();
const linkOk = (key, where) => earlier.has(key) || fail(where, `links "${key}", which is not a course listed before it`);

for (const course of courses) {
  // Module and lesson keys are stored in different tables, so each only needs to be unique among its own kind
  const seen = { module: new Set(), lesson: new Set() };
  const unique = (kind, k, where) => (seen[kind].has(k) ? fail(where, `duplicate ${kind} key ${k}`) : seen[kind].add(k));
  for (const tag of Object.keys(course.topics)) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) fail(course.key, `bad topic tag ${tag}`);
  if ((course.roadmap.checkpointPassPercent ?? 80) < 80) fail(course.key, 'in-video question pass mark is below 80%');

  for (const m of course.modules) {
    const mw = `${course.key}/${m.key}`;
    unique('module', m.key, course.key);
    if ((m.passPercent ?? 80) < 80) fail(mw, 'block quiz pass mark is below 80%');
    for (const key of m.linkedCourses || []) linkOk(key, mw);
    for (const sp of m.specialties || []) {
      const sw = `${mw}/specialty ${sp.key}`;
      for (const key of sp.courses || []) linkOk(key, sw);
      for (const r of sp.resources || []) {
        if (!ACCESS.has(r.access)) fail(sw, `resource "${r.title}" needs access FREE, ACCOUNT or PAID`);
        if (!https(r.url)) fail(sw, `resource URL must be https: ${r.url}`);
      }
    }

    for (const l of m.lessons) {
      const where = `${mw}/${l.key}`;
      unique('lesson', l.key, where);
      totals.lessons += 1;
      if (!l.content || l.content.length < 10) fail(where, 'content too short');
      // Reading-only lessons (no video) are allowed; every video needs at least one in-video question
      const v = l.video;
      if (!v) {
        if (l.checkpoints?.length) fail(where, 'checkpoints need a video');
        continue;
      }
      const length = v.start != null && v.end != null ? v.end - v.start : v.duration;
      if (!v.youtubeId || !length) fail(where, 'video needs an id and a duration or start/end');
      // Runtimes verified from each video's page (npm run check:videos): a whole video must state its real runtime,
      // and a clip must end within the video
      const runtime = RUNTIMES[v.youtubeId]?.seconds;
      if (runtime == null) unverified.add(v.youtubeId);
      else if (v.start == null && v.end == null && Math.abs(v.duration - runtime) > 1) fail(where, `duration ${v.duration}s but the video runs ${runtime}s`);
      else if (v.end != null && v.end > runtime + 1) fail(where, `clip ends at ${v.end}s but the video runs ${runtime}s`);
      if (!l.checkpoints?.length) fail(where, 'every video needs at least one in-video question');
      for (const [i, c] of (l.checkpoints || []).entries()) {
        const cw = `${where}/checkpoint ${i + 1}`;
        totals.checkpoints += 1;
        const type = checkQuestion(c, cw);
        types[type] = (types[type] || 0) + 1;
        if (!(c.at > 0 && c.at < length)) fail(cw, `trigger ${c.at}s is outside the ${length}s clip`);
        if (!course.topics[c.topic]) fail(cw, `unknown topic ${c.topic}`);
      }
    }

    const lessonTitles = new Set(m.lessons.map((l) => l.title));
    for (const [i, q] of (m.bank || []).entries()) {
      const qw = `${mw}/bank ${i + 1}`;
      totals.bank += 1;
      const type = checkQuestion(q, qw);
      types[type] = (types[type] || 0) + 1;
      if (q.lesson && !lessonTitles.has(q.lesson)) fail(qw, `lesson "${q.lesson}" is not in this module`);
    }
    if ((m.bank || []).length < 10) fail(mw, `only ${(m.bank || []).length} bank questions (need 10+)`);
    if ((m.quizCount ?? 10) < 10) fail(mw, 'block quiz must draw at least 10 questions');
    for (const r of m.readings || []) {
      totals.readings += 1;
      if (!https(r.url)) fail(mw, `reading URL must be https: ${r.url}`);
      if (r.access != null && !ACCESS.has(r.access)) fail(mw, `reading "${r.title}" has an unknown access label`);
    }
  }
  earlier.add(course.key);
}

console.log(`${courses.length} courses, ${totals.lessons} lessons, ${totals.checkpoints} checkpoints, ${totals.bank} bank questions, ${totals.readings} readings`);
console.log('Question types:', types);
if (unverified.size) console.warn(`Runtime unavailable (not verified) for ${unverified.size} video(s): ${[...unverified].join(', ')}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('Catalog OK');
