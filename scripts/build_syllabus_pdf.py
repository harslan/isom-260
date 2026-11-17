#!/usr/bin/env python3
"""Build the downloadable syllabus PDF from the same data the website uses.

Reads src/data/course.json, src/data/syllabus.json, src/data/calendar.json and
src/content/sessions/*.json, and writes public/isom-260-syllabus.pdf, which the
Syllabus page links to.

Run after changing dates, grading, policies or session titles:
    npm run syllabus:pdf          (needs: pip install reportlab)
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
OUT = ROOT / "public" / "isom-260-syllabus.pdf"
SITE = "https://isom-260.vercel.app"

# Palette: light paper version of the site's cyan/purple theme.
INK = colors.HexColor("#14161f")
MUTED = colors.HexColor("#5b6070")
CYAN = colors.HexColor("#0891b2")
PURPLE = colors.HexColor("#7c3aed")
RULE = colors.HexColor("#d9dce4")
TINT = colors.HexColor("#f3f6fa")
NAVY = colors.HexColor("#0f1424")

DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def clean(text: str) -> str:
    """Escape for Paragraph markup; swap glyphs the base PDF fonts lack."""
    return escape(text or "").replace("→", "->").replace("←", "<-")


def fmt_day(iso: str) -> str:
    d = dt.date.fromisoformat(iso[:10])
    return f"{DOW[d.weekday()]} {MON[d.month - 1]} {d.day}"


def fmt_time(iso: str) -> str:
    if len(iso) <= 10:
        return ""
    h, m = map(int, iso[11:16].split(":"))
    return f"{(h + 11) % 12 + 1}:{m:02d} {'AM' if h < 12 else 'PM'}"


def fmt_due(iso: str) -> str:
    t = fmt_time(iso)
    return f"{fmt_day(iso)}, {t}" if t else fmt_day(iso)


# ---------------------------------------------------------------- styles
S = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=8, leading=10,
                              textColor=CYAN, spaceAfter=0),
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=24, leading=28,
                            textColor=colors.white),
    "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=11, leading=14,
                               textColor=colors.HexColor("#b8c0d4")),
    "h2num": ParagraphStyle("h2num", fontName="Helvetica-Bold", fontSize=8, leading=10,
                            textColor=CYAN),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14, leading=18,
                         textColor=INK, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.5,
                           textColor=INK, alignment=TA_LEFT),
    "muted": ParagraphStyle("muted", fontName="Helvetica", fontSize=8.5, leading=12,
                            textColor=MUTED),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=9, leading=12, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Helvetica-Bold", fontSize=9.5, leading=12.5,
                            textColor=INK),
    "cellmuted": ParagraphStyle("cellmuted", fontName="Helvetica", fontSize=8.5, leading=11.5,
                                textColor=MUTED),
    "num": ParagraphStyle("num", fontName="Helvetica-Bold", fontSize=12, leading=14,
                          textColor=PURPLE),
    "date": ParagraphStyle("date", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
                           textColor=CYAN),
    "label": ParagraphStyle("label", fontName="Helvetica-Bold", fontSize=8, leading=11,
                            textColor=MUTED),
    "ptitle": ParagraphStyle("ptitle", fontName="Helvetica-Bold", fontSize=10.5, leading=13,
                             textColor=PURPLE, spaceAfter=3),
}


def section(num: str, label: str, title: str, note: str | None = None):
    parts = [
        Spacer(1, 16),
        Paragraph(f"{num} // {label.upper()}", S["h2num"]),
        Spacer(1, 2),
        Paragraph(clean(title), S["h2"]),
    ]
    if note:
        parts.append(Paragraph(note, S["muted"]))
    parts.append(Spacer(1, 6))
    return parts


def zebra(n_rows: int, header: bool = True):
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    start = 1 if header else 0
    if header:
        cmds += [("BACKGROUND", (0, 0), (-1, 0), NAVY),
                 ("LINEBELOW", (0, 0), (-1, 0), 1.2, CYAN)]
    for r in range(start, n_rows):
        if (r - start) % 2 == 1:
            cmds.append(("BACKGROUND", (0, r), (-1, r), TINT))
    return TableStyle(cmds)


def head(text: str) -> Paragraph:
    return Paragraph(text.upper(), ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=7.5,
                                                   leading=10, textColor=colors.white))


def build() -> Path:
    course = load(DATA / "course.json")
    syl = load(DATA / "syllabus.json")
    cal = load(DATA / "calendar.json")
    sessions = sorted(
        (load(p) for p in (ROOT / "src" / "content" / "sessions").glob("session-*.json")),
        key=lambda s: s["number"],
    )
    meetings = {s["number"]: s["meetings"] for s in cal["sessions"]}
    all_days = sorted({d for ms in meetings.values() for d in ms})
    meeting_days = " & ".join(
        sorted({fmt_day(d)[:3] for d in all_days}, key=lambda x: DOW.index(x))
    )
    first, last = all_days[0], all_days[-1]

    W = letter[0] - 1.5 * inch  # content width
    story = []

    # ---------------------------------------------------------------- header band
    band = Table(
        [[Paragraph(f"{clean(course['university']).upper()} &nbsp;·&nbsp; "
                    f"{clean(course['school']).upper()}", S["eyebrow"])],
         [Paragraph(f"{clean(course['code'])}: {clean(course['title'])}", S["title"])],
         [Paragraph(f"Course Syllabus &nbsp;·&nbsp; {clean(cal['semester'])}", S["subtitle"])]],
        colWidths=[W],
    )
    band.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, 0), 16),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 16),
        ("LINEBELOW", (0, -1), (-1, -1), 3, CYAN),
    ]))
    story += [band, Spacer(1, 14)]

    # ---------------------------------------------------------------- course info
    ins = course["instructor"]
    info_rows = [
        ("INSTRUCTOR", f"<b>{clean(ins['name'])}</b><br/>{clean(ins['title'])}"),
        ("EMAIL", f'<link href="mailto:{ins["email"]}" color="#0891b2">{clean(ins["email"])}</link>'),
        ("MEETINGS", f"{meeting_days}, {clean(cal['meetingTime'])} &nbsp;·&nbsp; "
                     f"{fmt_day(first)} – {fmt_day(last)}"),
        ("ROOM", clean(cal["room"])),
        ("COURSE SITE", f'<link href="{SITE}" color="#0891b2">{SITE.replace("https://", "")}</link>'),
        ("CANVAS", f'<link href="{cal["canvasCourse"]}" color="#0891b2">'
                   f'{cal["canvasCourse"].replace("https://", "")}</link>'),
    ]
    info = Table([[Paragraph(k, S["label"]), Paragraph(v, S["cell"])] for k, v in info_rows],
                 colWidths=[1.1 * inch, W - 1.1 * inch])
    info.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, RULE),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
    ]))
    story += [info, Spacer(1, 10)]

    story.append(Paragraph(
        "Master the technologies reshaping every industry. From neural networks to production "
        "AI systems, learn by building. Across 13 sessions you will go from how large language "
        "models work to designing, testing and shipping your own AI agents, finishing with a "
        "live Demo Day.", S["body"]))

    # ---------------------------------------------------------------- 01 schedule
    holidays = ", ".join(f"{fmt_day(h['date'])} ({clean(h['label'])})" for h in cal["holidays"])
    story += section("01", "Schedule", "Session Schedule",
                     f"{len(sessions)} sessions across {meeting_days} meetings, "
                     f"{clean(cal['meetingTime'])}, {clean(cal['room'])}. "
                     f"No class: {holidays}.")
    rows = [[head("#"), head("Session"), head("Meets")]]
    for s in sessions:
        days = "<br/>".join(fmt_day(d) for d in meetings.get(s["number"], []))
        rows.append([
            Paragraph(f"{s['number']:02d}", S["num"]),
            Paragraph(f"<b>{clean(s['title'])}</b><br/>"
                      f"<font color='#5b6070' size='8.5'>{clean(s.get('subtitle', ''))}</font>",
                      S["cell"]),
            Paragraph(days, S["date"]),
        ])
    t = Table(rows, colWidths=[0.45 * inch, W - 1.45 * inch, 1.0 * inch], repeatRows=1)
    t.setStyle(zebra(len(rows)))
    story.append(t)

    # ---------------------------------------------------------------- 02 key dates
    key = []
    for d in cal["deliverables"]:
        if d.get("due"):
            key.append((d["due"], fmt_due(d["due"]),
                        f"{clean(d['label'])} due: {clean(d['title'])}",
                        "Submit on Canvas" if d.get("canvas") else "", d.get("canvas")))
    for k in cal["keyDates"]:
        key.append((k["date"], fmt_day(k["date"]), clean(k["what"]), clean(k["note"]), None))
    for h in cal["holidays"]:
        key.append((h["date"], fmt_day(h["date"]), f"No class: {clean(h['label'])}", "", None))
    key.sort(key=lambda x: x[0])

    story += section("02", "Key Dates", "Mark Your Calendar",
                     f"Homework is due at {clean(cal['homeworkDueTime'])} on the date shown "
                     "unless a time is listed.")
    rows = [[head("Date"), head("What")]]
    for _, label, what, note, href in key:
        w = f'<link href="{href}" color="#14161f">{what}</link>' if href else what
        body = f"<b>{w}</b>" + (f"<br/><font color='#5b6070' size='8.5'>{note}</font>" if note else "")
        rows.append([Paragraph(label, S["date"]), Paragraph(body, S["cell"])])
    t = Table(rows, colWidths=[1.45 * inch, W - 1.45 * inch], repeatRows=1)
    t.setStyle(zebra(len(rows)))
    story.append(t)

    # ---------------------------------------------------------------- 03 grading
    rows = [[head("Component"), head("Weight")]]
    for g in syl["grading"]:
        rows.append([Paragraph(clean(g["component"]), S["cell"]),
                     Paragraph(f"<b>{g['weight']}%</b>", S["date"])])
    total = sum(g["weight"] for g in syl["grading"])
    rows.append([Paragraph("<b>Total</b>", S["cell"]), Paragraph(f"<b>{total}%</b>", S["date"])])
    t = Table(rows, colWidths=[W - 1.0 * inch, 1.0 * inch])
    st = zebra(len(rows))
    st.add("LINEABOVE", (0, -1), (-1, -1), 1, INK)
    st.add("ALIGN", (1, 0), (1, -1), "RIGHT")
    t.setStyle(st)
    story.append(KeepTogether(section("03", "Grading", "Grade Breakdown") + [t]))

    # ---------------------------------------------------------------- 04 policies
    cards = []
    for p in syl["policies"]:
        cards.append([Paragraph(clean(p["title"]), S["ptitle"]),
                      Paragraph(clean(p["description"]), S["body"])])
    grid_rows = []
    for i in range(0, len(cards), 2):
        pair = cards[i:i + 2] + ([[""]] if len(cards[i:i + 2]) == 1 else [])
        grid_rows.append(pair)
    gap = 0.18 * inch
    grid = Table(grid_rows, colWidths=[(W - gap) / 2, (W - gap) / 2])
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, -1), 0, colors.white),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ("BACKGROUND", (0, 0), (-1, -1), TINT),
        ("LINEBEFORE", (0, 0), (0, -1), 2, PURPLE),
        ("LINEBEFORE", (1, 0), (1, -1), 2, PURPLE),
        ("LINEAFTER", (0, 0), (0, -1), gap / 2, colors.white),
        ("LINEBELOW", (0, 0), (-1, -2), 6, colors.white),
    ]))
    story.append(KeepTogether(section("04", "Policies", "Course Policies") + [grid]))

    story += [Spacer(1, 18), Paragraph(
        f"Dates and assignments can change during the semester. The live syllabus at "
        f'<link href="{SITE}/syllabus" color="#0891b2">{SITE.replace("https://", "")}/syllabus</link> '
        f"and Canvas are always the current version. Questions? Email "
        f'<link href="mailto:{ins["email"]}" color="#0891b2">{ins["email"]}</link>.',
        S["muted"])]

    # ---------------------------------------------------------------- page chrome
    stamp = dt.date.today()
    footer_left = f"{course['code']} · {course['title']} · {cal['semester']} Syllabus"
    footer_mid = f"Updated {MON[stamp.month - 1]} {stamp.day}, {stamp.year}"

    def chrome(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(0.75 * inch, 0.6 * inch, letter[0] - 0.75 * inch, 0.6 * inch)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.75 * inch, 0.42 * inch, footer_left)
        canvas.drawCentredString(letter[0] / 2 + 0.9 * inch, 0.42 * inch, footer_mid)
        canvas.drawRightString(letter[0] - 0.75 * inch, 0.42 * inch, f"Page {doc.page}")
        canvas.restoreState()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT), pagesize=letter,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.65 * inch, bottomMargin=0.85 * inch,
        title=f"{course['code']}: {course['title']} - {cal['semester']} Syllabus",
        author=ins["name"], subject="Course syllabus",
        creator="scripts/build_syllabus_pdf.py",
    )
    doc.build(story, onFirstPage=chrome, onLaterPages=chrome)
    return OUT


if __name__ == "__main__":
    print(f"Wrote {build().relative_to(ROOT)}")
