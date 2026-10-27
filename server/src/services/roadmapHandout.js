// The downloadable roadmap: one data builder (from the live database, so it always matches the website) used by
// the print page (JSON) and the PDF. Only published paths with two or more stages qualify.
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';

const isStage = (m) => m.learningOutcomes.length > 0 || Boolean(m.practice) || m.linkedRoadmapIds.length > 0 || (Array.isArray(m.specialties) && m.specialties.length > 0);

export async function roadmapHandout(slug) {
  const r = await prisma.roadmap.findFirst({
    where: { slug, isPublished: true },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, estimatedMinutes: true, videoProvider: true, videoCredit: true, videoSourceUrl: true, _count: { select: { quizzes: true } } },
          },
          readings: { orderBy: { order: 'asc' } },
          _count: { select: { blockQuestions: true } },
        },
      },
    },
  });
  if (!r) return null;
  const stages = r.modules.filter(isStage);
  if (stages.length < 2) return null;

  const linkedIds = [...new Set(stages.flatMap((m) => m.linkedRoadmapIds))];
  const linked = await prisma.roadmap.findMany({ where: { id: { in: linkedIds }, isPublished: true }, select: { id: true, slug: true, title: true } });
  const linkedById = new Map(linked.map((c) => [c.id, c]));
  const site = config.appUrl;

  return {
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    description: r.description,
    prerequisites: r.prerequisites,
    learningOutcomes: r.learningOutcomes,
    url: `${site}/paths/${r.slug}`,
    videoPassPercent: r.checkpointPassPercent ?? 80,
    updatedAt: r.updatedAt,
    stages: stages.map((m, i) => ({
      number: i + 1,
      title: m.title,
      description: m.description,
      time: m.timeEstimate,
      prerequisites: m.prerequisiteNotes,
      outcomes: m.learningOutcomes,
      lessons: m.lessons.map((l) => ({
        title: l.title,
        minutes: l.estimatedMinutes,
        video: Boolean(l.videoProvider),
        questions: l._count.quizzes,
        credit: l.videoCredit,
        sourceUrl: l.videoSourceUrl,
        url: `${site}/learn/${r.slug}/${l.id}`,
      })),
      courses: m.linkedRoadmapIds.map((id) => linkedById.get(id)).filter(Boolean).map((c) => ({ title: c.title, url: `${site}/paths/${c.slug}` })),
      practice: m.practice,
      exam: m._count.blockQuestions ? { questions: Math.min(m.quizQuestionCount, m._count.blockQuestions), passPercent: m.quizPassPercent } : null,
      selfAssessment: m.allowTestOut,
      readings: m.readings.map(({ title, authors, publisher, year, url, kind, access, note }) => ({ title, authors, publisher, year, url, kind, access, note })),
      specialties: (Array.isArray(m.specialties) ? m.specialties : []).map((sp) => ({
        title: sp.title,
        summary: sp.summary,
        roles: sp.roles ?? [],
        courses: (sp.courses ?? []).map((c) => ({ title: c.title, url: `${site}/paths/${c.slug}` })),
        resources: sp.resources ?? [],
      })),
      nextSteps: m.nextSteps,
    })),
  };
}

// ── PDF ─────────────────────────────────────────────────────────────
// Built-in PDF fonts only cover Windows-1252, so a few characters are spelled out
const SUPERSCRIPT = { '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9' };
const WIN1252_EXTRA = new Set([...'€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ']);
function clean(text) {
  return String(text ?? '')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUPERSCRIPT[c])
    .replace(/≈/g, '~')
    .replace(/[→⟶]/g, '->')
    .replace(/[←]/g, '<-')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[^\n\t\x20-\x7e\xa0-\xff]/g, (c) => (WIN1252_EXTRA.has(c) ? c : ''));
}

const C = { ink: '#10201a', muted: '#4b5f56', brand: '#0b6b45', brandSoft: '#e6f4ec', line: '#c9dccf', link: '#0a58ca', accent: '#5a8f00' };
const ACCESS = { FREE: 'Free', ACCOUNT: 'Free account', PAID: 'Paid' };
const M = 50; // page margin

export function renderRoadmapPdf(h) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: M, bottom: M + 14, left: M, right: M },
    bufferPages: true,
    info: { Title: clean(h.title), Author: 'CodePath Cloud', Subject: 'Learning roadmap', Keywords: 'cybersecurity, roadmap' },
    lang: 'en',
    displayTitle: true,
  });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const width = doc.page.width - M * 2;

  const ensure = (space) => {
    if (doc.y + space > doc.page.height - doc.page.margins.bottom) doc.addPage();
  };
  const heading = (text, size, color = C.ink) => {
    ensure(size * 3);
    doc.moveDown(0.6).font('Helvetica-Bold').fontSize(size).fillColor(color).text(clean(text), M, doc.y, { width });
    doc.moveDown(0.25);
  };
  const para = (text, opts = {}) => {
    if (!text) return;
    ensure(30);
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size ?? 10.5).fillColor(opts.color ?? C.ink);
    doc.text(clean(text), opts.x ?? M, doc.y, { width: opts.width ?? width, lineGap: 2 });
    doc.moveDown(0.35);
  };
  // Inline markdown: **bold**, `code`, [text](url)
  const runs = (text) => {
    const out = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
    let last = 0;
    for (const m of String(text).matchAll(re)) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      const t = m[0];
      if (t.startsWith('**')) out.push({ text: t.slice(2, -2), bold: true });
      else if (t.startsWith('`')) out.push({ text: t.slice(1, -1), code: true });
      else {
        const [, label, url] = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        out.push({ text: label, link: url });
      }
      last = m.index + t.length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  };
  // Inline text with mixed styles, laid out word by word. pdfkit's own continued text starts a new line after a
  // styled run that wraps, so each word is measured in its font, placed, and wrapped at the margin here instead.
  const rich = (text, { x = M, w = width, size = 10.5, color = C.ink } = {}) => {
    // A string is read as inline markdown; an array is already styled parts ({ text, bold, link, color })
    const parts = (Array.isArray(text) ? text.map((p) => ({ ...p, text: clean(p.text) })) : runs(clean(text))).filter((p) => p.text);
    if (!parts.length) return;
    const lineHeight = size * 1.16 + 2;
    const bottom = () => doc.page.height - doc.page.margins.bottom;
    let y = doc.y;
    let cx = x;
    // A link gets one clickable area and one underline per line it spans (not one per word)
    let linkStart = null;
    const closeLink = (url) => {
      if (linkStart === null || cx <= linkStart) return;
      doc.link(linkStart, y - 1, cx - linkStart, size + 3, url);
      doc.save().moveTo(linkStart, y + size).lineTo(cx, y + size).lineWidth(0.6).strokeColor(C.link).stroke().restore();
      linkStart = null;
    };
    const newLine = (url) => {
      closeLink(url);
      y += lineHeight;
      cx = x;
      if (y + lineHeight > bottom()) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    };
    for (const p of parts) {
      doc
        .font(p.bold || p.code ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(size)
        .fillColor(p.link ? C.link : p.code ? C.brand : (p.color ?? color));
      for (const token of p.text.split(/(\s+)/)) {
        if (!token) continue;
        const space = /^\s+$/.test(token);
        if (space && cx === x) continue; // no leading spaces on a new line
        const tw = doc.widthOfString(space ? ' ' : token);
        if (!space && cx + tw > x + w && cx > x) newLine(p.link);
        if (p.link && !space && linkStart === null) linkStart = cx;
        doc.text(space ? ' ' : token, cx, y, { lineBreak: false });
        cx += tw;
      }
      if (p.link) closeLink(p.link);
    }
    doc.x = x;
    doc.y = y + lineHeight;
  };
  const bullets = (items, { marker = '•', size = 10.5, indent = 14 } = {}) => {
    items.forEach((item, i) => {
      ensure(24);
      const y = doc.y;
      const mark = marker === '#' ? `${i + 1}.` : marker;
      doc.font('Helvetica').fontSize(size).fillColor(C.brand).text(mark, M, y, { width: indent + 4 });
      doc.y = y;
      rich(item, { x: M + indent + 6, w: width - indent - 6, size });
      doc.moveDown(0.2);
    });
    doc.x = M;
    doc.moveDown(0.2);
  };
  // Block markdown used in practice and next steps: ### headings, > quotes, numbered and bulleted lists, paragraphs
  const markdown = (md) => {
    if (!md) return;
    const lines = clean(md).split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      if (/^#{1,6}\s/.test(line)) {
        ensure(30);
        doc.moveDown(0.2).font('Helvetica-Bold').fontSize(11).fillColor(C.ink).text(line.replace(/^#+\s*/, ''), M, doc.y, { width });
        doc.moveDown(0.2);
        i++;
      } else if (line.startsWith('>')) {
        const quote = [];
        while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
        ensure(50);
        const top = doc.y;
        rich(quote.join(' '), { x: M + 14, w: width - 20, size: 10, color: C.ink });
        doc.save().rect(M, top - 2, 3, doc.y - top + 4).fill(C.brand).restore();
        doc.moveDown(0.4);
      } else if (/^\s*(\d+\.|[-*])\s/.test(line)) {
        const numbered = /^\s*\d+\./.test(line);
        const items = [];
        while (i < lines.length && /^\s*(\d+\.|[-*])\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*(\d+\.|[-*])\s+/, ''));
        bullets(items, { marker: numbered ? '#' : '•' });
      } else {
        const p = [];
        while (i < lines.length && lines[i].trim() && !/^(#|>|\s*(\d+\.|[-*])\s)/.test(lines[i])) p.push(lines[i++]);
        ensure(30);
        rich(p.join(' '));
        doc.moveDown(0.4);
      }
    }
  };
  const label = (text) => {
    ensure(40);
    doc.moveDown(0.4).font('Helvetica-Bold').fontSize(9).fillColor(C.brand).text(clean(text).toUpperCase(), M, doc.y, { width, characterSpacing: 0.8 });
    doc.moveDown(0.2);
  };
  const linkLine = (text, url, meta) => {
    ensure(28);
    rich([{ text, link: url }, ...(meta ? [{ text: `  ${meta}`, color: C.muted }] : [])], { x: M + 20, w: width - 20, size: 10 });
    doc.moveDown(0.15);
  };

  // ── Cover ──
  doc.rect(0, 0, doc.page.width, 190).fill('#04140b');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#4dff9c').text('CODEPATH CLOUD  ·  LEARNING ROADMAP', M, 46, { characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(24).fillColor('#ffffff').text(clean(h.title), M, 68, { width });
  doc.font('Helvetica').fontSize(11).fillColor('#b2ecc6').text(clean(h.summary || ''), M, doc.y + 6, { width });
  doc.y = 210;
  rich([{ text: 'Online version (with your progress): ' }, { text: h.url, link: h.url }], { size: 10, color: C.muted });
  doc.moveDown(0.6);
  para(h.description);

  // Route overview: the stages as milestones on a line, like the website
  ensure(110);
  const top = doc.y + 18;
  const step = width / h.stages.length;
  doc.save().moveTo(M + step / 2, top).lineTo(M + width - step / 2, top).lineWidth(4).strokeColor(C.brand).stroke().restore();
  h.stages.forEach((s, i) => {
    const cx = M + step * i + step / 2;
    doc.circle(cx, top, 15).fillAndStroke('#ffffff', C.brand);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.brand).text(String(s.number), cx - 15, top - 7, { width: 30, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.ink).text(clean(s.title.replace(/^Stage \d+:\s*/, '')), cx - step / 2 + 4, top + 22, { width: step - 8, align: 'center' });
    if (s.time) doc.font('Helvetica').fontSize(8).fillColor(C.muted).text(clean(s.time.split(':')[0]), cx - step / 2 + 4, doc.y + 2, { width: step - 8, align: 'center' });
  });
  doc.x = M;
  doc.y = top + 80;

  heading('How the roadmap works', 14, C.brand);
  bullets([
    `Each video has questions. Score at least ${h.videoPassPercent}% on a video's questions to unlock the next video.`,
    'Finish every video in a stage (and its linked courses) to open the stage exam.',
    'Each stage exam has at least 10 questions with explanations. Score at least 80% to unlock the next stage; attempts are saved and you can retry.',
    'Already experienced? Stages with a self-assessment let you skip material you have mastered by passing it at 80%.',
    '**Stay legal and safe:** only test systems you own or have written permission to test.',
  ]);
  if (h.prerequisites?.length) {
    label('Before you start');
    bullets(h.prerequisites);
  }

  // ── Stages ──
  for (const s of h.stages) {
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 8).fill(C.brand);
    doc.circle(M + 18, M + 16, 18).fill(C.brand);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text(String(s.number), M, M + 7, { width: 36, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(C.ink).text(clean(s.title), M + 48, M + 6, { width: width - 48 });
    doc.x = M;
    doc.y = Math.max(doc.y, M + 40) + 6;
    para(s.description, { color: C.muted });
    if (s.time) {
      rich([{ text: 'Estimated time: ', bold: true }, { text: s.time }]);
      doc.moveDown(0.3);
    }
    if (s.prerequisites.length) {
      label('Prerequisites');
      bullets(s.prerequisites);
    }
    if (s.outcomes.length) {
      label('Learning outcomes');
      bullets(s.outcomes);
    }
    if (s.selfAssessment) {
      label('Experienced? Self-assessment');
      para(`Take this stage's self-assessment (skip test) on the website. Score at least ${s.exam?.passPercent ?? 80}% and the stage counts as complete; its lessons stay open for review. You have two tries.`);
    }
    if (s.lessons.length) {
      label('Lessons');
      s.lessons.forEach((l, i) => {
        ensure(40);
        const meta = [l.minutes ? `${l.minutes} min` : null, l.video ? `${l.questions} question${l.questions === 1 ? '' : 's'} in the video` : 'reading'].filter(Boolean).join(' · ');
        rich([{ text: `${i + 1}. `, bold: true }, { text: l.title, link: l.url }, { text: `  ${meta}`, color: C.muted }]);
        if (l.credit) {
          rich([{ text: `Video: ${l.credit}` }, ...(l.sourceUrl ? [{ text: '  (watch on YouTube)', link: l.sourceUrl }] : [])], {
            x: M + 16,
            w: width - 16,
            size: 9,
            color: C.muted,
          });
        }
        doc.x = M;
        doc.moveDown(0.25);
      });
    }
    if (s.courses.length) {
      label('Courses in this stage');
      s.courses.forEach((c) => linkLine(c.title, c.url, 'Full course on CodePath Cloud'));
    }
    if (s.practice) {
      label('Practical exercises');
      markdown(s.practice);
    }
    if (s.exam) {
      label('Stage exam');
      para(`${s.exam.questions} questions with explanations. Score at least ${s.exam.passPercent}% to pass and unlock the next stage. Attempts are saved and you can retry.`);
    }
    if (s.specialties.length) {
      label('Choose a specialty');
      for (const sp of s.specialties) {
        ensure(80);
        doc.font('Helvetica-Bold').fontSize(11.5).fillColor(C.ink).text(clean(sp.title), M, doc.y, { width });
        para(sp.summary, { color: C.muted, size: 10 });
        if (sp.roles.length) para(`Roles: ${sp.roles.join(', ')}`, { size: 9.5 });
        sp.courses.forEach((c) => linkLine(c.title, c.url, 'Course on CodePath Cloud'));
        sp.resources.forEach((res) => linkLine(res.title, res.url, [res.publisher, ACCESS[res.access], res.note].filter(Boolean).join(' · ')));
        doc.moveDown(0.3);
      }
    }
    if (s.readings.length) {
      label('Reports, papers and references');
      s.readings.forEach((rd) => {
        ensure(44);
        linkLine(rd.title, rd.url);
        para([...new Set([rd.authors, rd.publisher, rd.year, ACCESS[rd.access]].filter(Boolean))].join(' · '), { x: M + 20, width: width - 20, size: 9, color: C.muted });
      });
    }
    if (s.nextSteps) {
      label('Next step');
      markdown(s.nextSteps);
    }
  }

  // Footer on every page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // The footer sits in the bottom margin; lift the margin so writing there does not start a new page
    doc.page.margins.bottom = 0;
    const y = doc.page.height - M + 6;
    doc.font('Helvetica').fontSize(8).fillColor(C.muted);
    doc.text(`${clean(h.title)}  ·  CodePath Cloud`, M, y, { width: width / 2, lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, M + width / 2, y, { width: width / 2, align: 'right', lineBreak: false });
  }
  doc.end();
  return done;
}
