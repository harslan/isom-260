// ISOM 260 · Render Desk. Students' render requests → the approver → AtlasCloud (Seedance 2.5 Flash).
// Students authenticate with their class pass (checked by the Sawyer AI Sandbox on every AI call).
// The approver authenticates with their own AtlasCloud key, sent per request and never stored.
import postgres from "npm:postgres@3.4.4";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 3 });
const GATEWAY = "https://sawyer-ai-sandbox.vercel.app/api/gemini/v1beta/models";
const GOOGLE = "https://generativelanguage.googleapis.com/v1beta/models";
const LLM = "gemini-2.5-flash";
const ATLAS = "https://api.atlascloud.ai/api/v1/model";
const VIDEO_MODEL = "bytedance/seedance-2.5-flash/text-to-video";
const PRICE_PER_SEC = 0.109;          // Atlas launch price for Seedance 2.5 Flash, 720p (list $0.167)
const MAX_RENDERS_PER_DAY = 20;       // hard cap on approvals per day
const COMPANIES = ["Marketing", "Finance", "HR / Recruiting", "Healthcare", "Real estate", "Restaurant & Hospitality", "Our final project"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...CORS, "Content-Type": "application/json" } });
class Oops extends Error { constructor(msg: string, public status = 400) { super(msg); } }
const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

// ───────────── Gemini through the class pass (or a personal key) ─────────────
async function gemini(pass: string, system: string, contents: unknown[], schema = true) {
  pass = clip(pass, 120);
  if (!pass) throw new Oops("Type your class pass first (CODE:First L).", 401);
  const viaPass = pass.includes(":");
  if (!viaPass && !pass.startsWith("AIza")) throw new Oops("A class pass has a colon in the middle, like CODE:Maya R.", 401);
  const url = `${viaPass ? GATEWAY : GOOGLE}/${LLM}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.7, ...(schema ? { responseMimeType: "application/json" } : {}), thinkingConfig: { thinkingBudget: 0 } },
  };
  let last = "";
  for (let i = 0; i < 2; i++) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": pass }, body: JSON.stringify(body) });
    const t = await r.text();
    if (r.status === 401 || r.status === 403) throw new Oops("The class pass didn't work. Check it at sawyer-ai-sandbox.vercel.app/start.", 401);
    if (r.status === 429) { last = "The class is over its AI budget for now. Raise your hand."; await new Promise((s) => setTimeout(s, 1500)); continue; }
    if (!r.ok) { last = `The AI said no (HTTP ${r.status}): ${t.slice(0, 160)}`; continue; }
    try {
      const j = JSON.parse(t);
      const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
      return schema ? JSON.parse(text.replace(/^```(json)?|```$/g, "").trim()) : text;
    } catch { last = "The AI's answer came back garbled. Try again."; }
  }
  throw new Oops(last || "The AI didn't answer. Try again.", 502);
}

const DIRECTOR = `You are the Director, an AI agent in a business school class (ISOM 260, AI for Business). A team of two students is making ONE short AI video (4 to 10 seconds) for a company. You help them turn an idea into a render request that their professor (the approver) will read in ten seconds and approve, send back, or decline. The video model is Seedance 2.5 Flash: text in, 720p video with sound out.

How you work:
- Be warm, fast and concrete. Plain words. 2 to 4 short sentences per turn. At most ONE question per turn.
- Turn 1: if they haven't said it, ask what the video is for: which company, who will watch it, and the one feeling or message.
- As soon as you know enough (usually by turn 2 or 3), WRITE THE DRAFT. Don't keep interviewing. If they say "just make something", pick a fun idea yourself and draft.
- When they ask for changes, change the draft and keep it whole.
- The video prompt: one continuous shot or 2 to 3 quick beats; say the setting, the subject, the action, the camera move, the lighting and style, and the sound (music, sound effects, or at most one short spoken line). 60 to 120 words. Present tense.
- Keep it safe to post under the company's name: no real people, no celebrities, no real brands or logos, no copyrighted characters, nothing unsafe for children, no medical, legal or money promises. If the students ask for any of that, say why in one sentence and suggest a fix.
- The approval card is honest. Name real risks in "risks"; never write "none" if there is any doubt.

Return only JSON: {"say": "<what you tell the students>", "draft": null or {"title": "<4 to 8 words>", "prompt": "<the video prompt>", "seconds": <4 to 10>, "who": "<who is asking and for whom, one line>", "shows": "<what the video shows, one line>", "undo": "<can it be undone once posted, one line>", "why_safe": "<why it is safe to post under the company's name, one line>", "risks": "<what the approver should check, one line>"}}
Set "draft" only when you write or change the draft; otherwise null.`;

const READER = (d: Record<string, unknown>, team: string, company: string) =>
  `You are the second reader on an approval desk. You never write and never fix. A student team wants a short AI video rendered and posted under a company's name. Say how sure you are, 0 to 100, that it can go out with NOBODY looking at it.
90-100: harmless and clearly on-brand. 60-89: fine, some judgment. 30-59: touches people, health, money, safety, children, claims, or could embarrass the company. 0-29: breaks a rule: real people, real brands or logos, copyrighted characters, unsafe content, or a promise the company never made.
Judge the prompt itself, not the card's claims about it.

TEAM: ${team} · COMPANY: ${company}
TITLE: ${d.title}
PROMPT: ${d.prompt}
WHAT IT SHOWS: ${d.shows}
WHY SAFE (their words): ${d.why_safe}
RISKS (their words): ${d.risks}

Return only JSON: {"sure": <0-100>, "why": "<one plain sentence, at most 15 words>"}`;

function cleanDraft(d: Record<string, unknown>) {
  const sec = Math.round(Number(d.seconds) || 6);
  return {
    title: clip(d.title, 80) || "Untitled",
    prompt: clip(d.prompt, 1500),
    seconds: Math.min(10, Math.max(4, sec)),
    who: clip(d.who, 200), shows: clip(d.shows, 300), undo: clip(d.undo, 200),
    why_safe: clip(d.why_safe, 300), risks: clip(d.risks, 300),
  };
}

// ───────────── the approver: their own Atlas key, checked by Atlas ─────────────
async function checkApprover(key: string) {
  key = clip(key, 300);
  if (key.length < 16) throw new Oops("Paste your AtlasCloud API key.", 401);
  const r = await fetch("https://api.atlascloud.ai/public/v1/balance", { headers: { Authorization: `Bearer ${key}` } });
  if (r.status === 401 || r.status === 403) throw new Oops("AtlasCloud didn't accept that key.", 401);
  let balance: unknown = null;
  try { const j = await r.json(); balance = j?.data?.balance ?? j?.data?.available_balance ?? j?.balance ?? null; } catch { /* shape unknown */ }
  if (!r.ok && r.status >= 500) throw new Oops("AtlasCloud is not answering. Try again in a moment.", 502);
  return { key, balance };
}

async function startRender(key: string, row: { prompt: string; seconds: number }) {
  const r = await fetch(`${ATLAS}/generateVideo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: VIDEO_MODEL, prompt: row.prompt, duration: row.seconds, resolution: "720p", ratio: "16:9", output_format: "mp4", generate_audio: true, watermark: false }),
  });
  const t = await r.text();
  let j: any = {}; try { j = JSON.parse(t); } catch { /* */ }
  if (!r.ok || !j?.data?.id) throw new Oops(`AtlasCloud refused: ${String(j?.msg ?? j?.message ?? t).slice(0, 200)}`, 502);
  return String(j.data.id);
}

async function pollRender(key: string, pid: string) {
  const r = await fetch(`${ATLAS}/prediction/${encodeURIComponent(pid)}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!r.ok) return { state: "rendering" as const };
  const d = (await r.json())?.data ?? {};
  const st = String(d.status ?? "").toLowerCase();
  if (["completed", "succeeded", "success"].includes(st)) return { state: "done" as const, url: (d.outputs ?? [])[0] ?? null };
  if (["failed", "error", "timeout", "canceled", "cancelled"].includes(st)) return { state: "failed" as const, error: String(d.error ?? st).slice(0, 200) };
  return { state: "rendering" as const };
}

const PUBLIC_COLS = sql`id, created_at, team, company, title, prompt, seconds, who, shows, undo, why_safe, risks, sure, sure_why, status, note, video_url, cost_usd`;

// ───────────── the actions ─────────────
async function handle(a: Record<string, any>) {
  switch (a.action) {
    case "director": {
      const team = clip(a.team, 40), company = clip(a.company, 60);
      const msgs = (Array.isArray(a.messages) ? a.messages : []).slice(-14).map((m: any) => ({
        role: m.role === "director" ? "model" : "user", parts: [{ text: clip(m.text, 2000) }],
      }));
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") throw new Oops("Say something to the Director first.");
      msgs[0].parts[0].text = `[Team: ${team || "unnamed"} · Company: ${company || "not chosen"}${a.draft ? ` · Current draft: ${JSON.stringify(cleanDraft(a.draft))}` : ""}]\n${msgs[0].parts[0].text}`;
      const out = await gemini(a.pass, DIRECTOR, msgs);
      return { say: clip(out?.say, 1500) || "Tell me a bit more.", draft: out?.draft ? cleanDraft(out.draft) : null };
    }
    case "submit": {
      const team = clip(a.team, 40), company = clip(a.company, 60);
      if (!team) throw new Oops("Give your team a name first.");
      if (!COMPANIES.includes(company)) throw new Oops("Pick your company first.");
      const d = cleanDraft(a.draft ?? {});
      if (d.prompt.length < 10) throw new Oops("The video prompt is empty. Ask the Director for a draft first.");
      const [{ n }] = await sql`select count(*)::int as n from render_desk.requests where created_at > now() - interval '12 hours' and team = ${team} and status in ('waiting')`;
      if (n >= 2) throw new Oops("Your team already has requests waiting. Wait for the approver.", 429);
      const r = await gemini(a.pass, "You are a careful second reader. Return only JSON.", [{ role: "user", parts: [{ text: READER(d, team, company) }] }]);
      const sure = Math.max(0, Math.min(100, Math.round(Number(r?.sure)))), sureWhy = clip(r?.why, 160);
      const [row] = await sql`insert into render_desk.requests ${sql({ team, company, ...d, sure: Number.isFinite(sure) ? sure : 0, sure_why: sureWhy })} returning id, token, sure, sure_why`;
      return { id: row.id, token: row.token, sure: row.sure, sure_why: row.sure_why, cost: +(d.seconds * PRICE_PER_SEC).toFixed(2) };
    }
    case "status": {
      const [row] = await sql`select ${PUBLIC_COLS} from render_desk.requests where id = ${clip(a.id, 40)} and token = ${clip(a.token, 40)}`;
      if (!row) throw new Oops("Request not found.", 404);
      return { request: row };
    }
    case "queue": {
      const { key, balance } = await checkApprover(a.key);
      const rows = await sql`select ${PUBLIC_COLS}, prediction_id from render_desk.requests where created_at > now() - interval '14 hours' order by created_at asc`;
      // refresh renders while we're here
      for (const row of rows) {
        if (row.status === "rendering" && row.prediction_id) {
          const p = await pollRender(key, row.prediction_id);
          if (p.state !== "rendering") {
            const status = p.state === "done" && p.url ? "done" : "failed";
            const note = p.state === "failed" ? p.error : row.note;
            await sql`update render_desk.requests set status = ${status}, video_url = ${p.state === "done" ? p.url : null}, note = ${note ?? ""}, updated_at = now() where id = ${row.id}`;
            Object.assign(row, { status, video_url: p.state === "done" ? p.url : null, note: note ?? "" });
          }
        }
        delete row.prediction_id;
      }
      const [{ spent, renders }] = await sql`select coalesce(sum(cost_usd),0)::float as spent, count(*)::int as renders from render_desk.requests where created_at > now() - interval '14 hours' and status in ('rendering','done')`;
      return { requests: rows, spent, renders, cap: MAX_RENDERS_PER_DAY, balance, price: PRICE_PER_SEC, model: VIDEO_MODEL };
    }
    case "decide": {
      const { key } = await checkApprover(a.key);
      const id = clip(a.id, 40), decision = clip(a.decision, 20), note = clip(a.note, 300);
      const [row] = await sql`select id, prompt, seconds, status from render_desk.requests where id = ${id}`;
      if (!row) throw new Oops("Request not found.", 404);
      if (decision === "approve") {
        if (!["waiting", "failed", "sent_back"].includes(row.status)) throw new Oops(`Already ${row.status}.`);
        const [{ renders }] = await sql`select count(*)::int as renders from render_desk.requests where created_at > now() - interval '14 hours' and status in ('rendering','done')`;
        if (renders >= MAX_RENDERS_PER_DAY) throw new Oops(`Daily cap of ${MAX_RENDERS_PER_DAY} renders reached.`, 429);
        const pid = await startRender(key, row);
        await sql`update render_desk.requests set status = 'rendering', prediction_id = ${pid}, note = ${note}, cost_usd = ${+(row.seconds * PRICE_PER_SEC).toFixed(3)}, updated_at = now() where id = ${id}`;
        return { ok: true, status: "rendering" };
      }
      if (decision === "send_back" || decision === "decline") {
        const status = decision === "send_back" ? "sent_back" : "declined";
        await sql`update render_desk.requests set status = ${status}, note = ${note}, updated_at = now() where id = ${id}`;
        return { ok: true, status };
      }
      throw new Oops("Unknown decision.");
    }
    default: throw new Oops("Unknown action.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const a = await req.json();
    return json(await handle(a ?? {}));
  } catch (e) {
    const status = e instanceof Oops ? e.status : 500;
    if (!(e instanceof Oops)) console.error(e);
    return json({ error: e instanceof Oops ? e.message : "Something broke on the server. Try again." }, status);
  }
});
