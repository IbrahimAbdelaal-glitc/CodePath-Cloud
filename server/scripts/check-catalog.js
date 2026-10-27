// Checks the built-in course catalog without a database: answers match options, checkpoints fall inside their
// clips, keys are unique, and every module has enough block-quiz questions. Usage: npm run check:catalog
import courses from '../src/catalog/index.js';

const CHOICE = new Set(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTI_SELECT']);
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

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
for (const course of courses) {
  // Module and lesson keys are stored in different tables, so each only needs to be unique among its own kind
  const seen = { module: new Set(), lesson: new Set() };
  const unique = (kind, k, where) => (seen[kind].has(k) ? fail(where, `duplicate ${kind} key ${k}`) : seen[kind].add(k));
  for (const tag of Object.keys(course.topics)) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) fail(course.key, `bad topic tag ${tag}`);
  for (const m of course.modules) {
    unique('module', m.key, course.key);
    for (const l of m.lessons) {
      const where = `${course.key}/${m.key}/${l.key}`;
      unique('lesson', l.key, where);
      totals.lessons += 1;
      const v = l.video;
      const length = v.start != null && v.end != null ? v.end - v.start : v.duration;
      if (!v.youtubeId || !length) fail(where, 'video needs an id and a duration or start/end');
      if (!l.content || l.content.length < 10) fail(where, 'content too short');
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
      const qw = `${course.key}/${m.key}/bank ${i + 1}`;
      totals.bank += 1;
      const type = checkQuestion(q, qw);
      types[type] = (types[type] || 0) + 1;
      if (q.lesson && !lessonTitles.has(q.lesson)) fail(qw, `lesson "${q.lesson}" is not in this module`);
    }
    if ((m.bank || []).length < 10) fail(`${course.key}/${m.key}`, `only ${(m.bank || []).length} bank questions (need 10+)`);
    for (const r of m.readings || []) {
      totals.readings += 1;
      if (!/^https:\/\//.test(r.url)) fail(`${course.key}/${m.key}`, `reading URL must be https: ${r.url}`);
    }
  }
}

console.log(`${courses.length} courses, ${totals.lessons} lessons, ${totals.checkpoints} checkpoints, ${totals.bank} bank questions, ${totals.readings} readings`);
console.log('Question types:', types);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('Catalog OK');
