#!/usr/bin/env node
// Checks every date the course materials state against src/data/calendar.json.
//   npm run check:dates        → report mismatches, exit 1 if any
//   npm run fix:dates          → rewrite the mismatched dates in place, then re-check
// What it checks:
//   1. session-NN.json `meetings` equal the calendar's meeting days for that session
//   2. every "HW #N … due <Day Mon D>" / "Midterm … due …" / "Final Project … due …" in
//      session JSONs, decks (slides*.html) and flight cards matches the calendar
//   3. warns on relative dates next to a deliverable ("due tomorrow", "due Thursday")
//      and on mentions of retired deliverables — only for sessions still ahead of today;
//      past decks said what was true on the day, and stay as they were
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FIX = process.argv.includes('--fix');
const cal = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/calendar.json'), 'utf8'));

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDay = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${MON[m - 1]} ${d}`;
};

const byLabel = new Map(); // "HW #7" → deliverable
for (const d of cal.deliverables) byLabel.set(d.label.toLowerCase(), d);
const lookup = (kind, num) => {
  if (kind === 'midterm') return byLabel.get('midterm project');
  if (kind === 'final') return byLabel.get('final project');
  return byLabel.get(`hw #${num}`);
};

const errors = [], warnings = [], fixes = [];
const today = new Date().toISOString().slice(0, 10);
const lastMeeting = new Map(cal.sessions.map((x) => [x.number, x.meetings[x.meetings.length - 1]]));
const isHistorical = (f) => { const m = /session-(\d+)/.exec(f); return m ? (lastMeeting.get(Number(m[1])) || '9999') < today : false; };
const warn = (f, msg) => { if (!isHistorical(f)) warnings.push(msg); };
const files = [];
const walk = (dir, re) => { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) walk(p, re); else if (re.test(f)) files.push(p); } };
walk(path.join(ROOT, 'src/content/sessions'), /^session-\d+\.json$/);
walk(path.join(ROOT, 'public'), /^(slides.*|flight-card.*|midterm-project|kickoff-sheet)\.html$/);

// ── 1. meetings in session JSONs ──
for (const f of files.filter((x) => x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const s = cal.sessions.find((x) => x.number === j.number);
  if (!s) continue;
  const want = s.meetings.map(fmtDay);
  const have = (j.meetings || []).map((m) => m.replace(/\s*·.*$/, ''));
  if (JSON.stringify(have) !== JSON.stringify(want)) {
    errors.push(`${rel(f)}: meetings ${JSON.stringify(j.meetings)} ≠ calendar ${JSON.stringify(want)}`);
    if (FIX) { j.meetings = want; fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); fixes.push(`${rel(f)}: meetings → ${JSON.stringify(want)}`); }
  }
}

// ── 2. "… due <Day Mon D>" mentions ──
const DAY = '(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+(\\d{1,2})';
const HEAD = '(?:(HW|Homework)\\s*#?\\s*(\\d+)(?:\\s*[–-]\\s*\\d+)?|(Midterm)(?:\\s+Project)?|(Final)\\s+Project)';
const NOHEAD = '(?:(?!HW\\s*#?\\s*\\d|Homework\\s*#|Midterm|Final\\s+Project)[^.\\n]){0,80}?';
const mention = new RegExp(`${HEAD}(?<gap>${NOHEAD})\\b(due|DUE)\\b\\s*(?:<[^>]+>\\s*)*(?:\\s*(?:on|by)\\s+)?(?<date>${DAY})`, 'gi');
const relative = new RegExp(`${HEAD}${NOHEAD}\\b(due|closes)\\s+(?:<[^>]+>\\s*)*(tomorrow|tonight|today|Monday|Tuesday|Wednesday|Thursday|Friday)\\b`, 'gi');

for (const f of files) {
  let text = fs.readFileSync(f, 'utf8');
  let changed = false;
  text = text.replace(mention, (m, hwWord, hwNum, mid, fin, gap, dueWord, date, dow, mon, day, offset) => {
    const isRange = /\d\s*[–-]\s*\d/.test(m.slice(0, 12));
    if (isRange) { warn(f, `${rel(f)}: range mention "${clean(m)}" — can't check a range`); return m; }
    const d = lookup(mid ? 'midterm' : fin ? 'final' : 'hw', hwNum);
    if (!d) { warn(f, `${rel(f)}: unknown deliverable in "${clean(m)}"`); return m; }
    if (d.status === 'retired') { warn(f, `${rel(f)}: retired ${d.label} still has a due date: "${clean(m)}"`); return m; }
    const want = fmtDay(d.due);
    const have = `${cap(dow)} ${cap(mon)} ${Number(day)}`;
    if (have === want) return m;
    const msg = `${rel(f)}:${lineOf(text, offset)}: ${d.label} says "${have}", calendar says "${want}" — "${clean(m)}"`;
    if (isHistorical(f)) warnings.push(`(past session) ${msg}`); else errors.push(msg);
    if (!FIX) return m;
    const upper = date === date.toUpperCase();
    const fixed = m.replace(date, upper ? want.toUpperCase() : want);
    changed = true; fixes.push(`${rel(f)}: ${have} → ${want}`);
    return fixed;
  });
  for (const m of text.matchAll(relative)) warn(f, `${rel(f)}:${lineOf(text, m.index)}: relative date "${clean(m[0])}" — rots the day after`);
  if (changed) fs.writeFileSync(f, text);
}

function rel(f) { return path.relative(ROOT, f); }
function cap(s) { return s[0].toUpperCase() + s.slice(1).toLowerCase(); }
function clean(s) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 90); }
function lineOf(text, offset) { return text.slice(0, offset).split('\n').length; }

if (fixes.length) console.log(`✏️  fixed ${fixes.length}:\n  ` + fixes.join('\n  '));
if (warnings.length) console.log(`⚠️  ${warnings.length} warning(s):\n  ` + warnings.join('\n  '));
if (errors.length && !FIX) { console.log(`❌ ${errors.length} mismatch(es):\n  ` + errors.join('\n  ') + '\n\nRun: npm run fix:dates'); process.exit(1); }
console.log(errors.length ? `✅ ${fixes.length} fixed; re-run check:dates to confirm` : '✅ every stated date matches calendar.json');
