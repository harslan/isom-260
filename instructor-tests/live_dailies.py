# Live rehearsal: Dailies Jr. Studio (a team's run, every cell) -> Premiere ticket -> Dailies Jr. demo renders that ticket.
import requests, time, json as _json
from IPython import get_ipython
ip = get_ipython()
RAW = "https://raw.githubusercontent.com/harslan/isom-260/master/public/session-08/"
def run_nb(name, subs, skip=()):
    nb = requests.get(RAW + name + f"?t={time.time()}").json()
    for i, c in enumerate(x for x in nb["cells"] if x["cell_type"] == "code"):
        src = "".join(c["source"])
        if src.startswith("!pip") or any(k in src for k in skip): print(f"──── {name[:18]} code cell {i}: skipped"); continue
        for a, b in subs: src = src.replace(a, b)
        t0 = time.time(); r = ip.run_cell(src)
        print(f"──── {name[:18]} code cell {i}: {'❌ ' + repr(r.error_in_exec or r.error_before_exec) if not r.success else '✅'} {time.time()-t0:.1f}s ────")
        if not r.success: return False
    return True
ok = run_nb("ISOM260_Dailies_Jr_Studio.ipynb", [
    ('"TODO: your team name"', '"Rams Test Team"'),
    ('INDUSTRY = "Marketing"', f'INDUSTRY = {LIVE_INDUSTRY!r}'),
    ('"TODO: one line, e.g. a 20-second ad for a late-night ramen truck near the Common"', repr(LIVE_IDEA)),
    ('"TODO: yes, because ... / no, because ..."', '"yes, because the plan passed every check and tells one clear story"')])
print("STUDIO OK:", ok, "| TICKET:", "TICKET" in globals())
if ok and "TICKET" in globals() and LIVE_RENDER:
    t = _json.dumps(TICKET, ensure_ascii=False).replace('"""', "'''")
    run_nb("ISOM260_Demo_Dailies_Jr_AI_Video_Harness.ipynb", [('TICKET = """TODO"""', 'TICKET = """' + t + '"""')], skip=("MAKE_REAL_VIDEO",))
