// The one place dates live. Everything else — session pages, the syllabus, and the
// date checker (scripts/check-dates.mjs) — reads from calendar.json. Change a date
// there, run `npm run fix:dates`, and the decks and flight cards follow.
import cal from './calendar.json';

export type Deliverable = (typeof cal.deliverables)[number] & { due?: string; status?: string };
export const calendar = cal;

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-14" or "2026-10-14T23:59" → "Wed Oct 14" */
export function fmtDay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DOW[dt.getUTCDay()]} ${MON[m - 1]} ${d}`;
}

/** "2026-10-22T23:59" → "11:59 PM" */
export function fmtTime(iso: string): string {
  const t = iso.slice(11, 16);
  if (!t) return '';
  const [h, mi] = t.split(':').map(Number);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "2026-10-22T23:59" → "Thu Oct 22, 11:59 PM" */
export function fmtDue(iso: string): string {
  return `${fmtDay(iso)}, ${fmtTime(iso)}`;
}

export function meetingLabels(sessionNumber: number): string[] | undefined {
  const s = cal.sessions.find((x) => x.number === sessionNumber);
  return s ? s.meetings.map(fmtDay) : undefined;
}

export const activeDeliverables = (cal.deliverables as Deliverable[])
  .filter((d) => d.due)
  .sort((a, b) => (a.due! < b.due! ? -1 : 1));

export function deliverablesForSession(sessionNumber: number): Deliverable[] {
  return activeDeliverables.filter((d) => d.session === sessionNumber);
}

/** Key dates for the syllabus: every graded deliverable plus the milestones, in date order. */
export const keyDates = [
  ...activeDeliverables.map((d) => ({
    date: d.due!,
    label: d.due!.length > 10 ? fmtDue(d.due!) : fmtDay(d.due!),
    what: `${d.label} due — ${d.title}`,
    note: d.canvas ? 'Submit on Canvas' : '',
    href: d.canvas,
  })),
  ...cal.keyDates.map((k) => ({ date: k.date, label: fmtDay(k.date), what: k.what, note: k.note, href: undefined as string | undefined })),
  ...cal.holidays.map((h) => ({ date: h.date, label: fmtDay(h.date), what: `No class — ${h.label}`, note: '', href: undefined as string | undefined })),
].sort((a, b) => (a.date < b.date ? -1 : 1));
