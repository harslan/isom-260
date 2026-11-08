# Live end-to-end run of the Session 9 notebook inside Colab: every code cell, in order, with a student's answers filled in.
import requests, time
from IPython import get_ipython
URL = "https://raw.githubusercontent.com/harslan/isom-260/session-09-draft/public/session-09/ISOM260_Session9_Hire_Your_First_AI_Employee.ipynb"
nb = requests.get(URL + f"?t={time.time()}").json()
SUBS = [('INDUSTRY = "Marketing"', f'INDUSTRY = {LIVE_INDUSTRY!r}'),
        ('"TODO: give your AI employee a name"', '"Penny"'),
        ("MY_BET = None", "MY_BET = 3"),
        ('WHY = "TODO: I changed ... because ..."', LIVE_BADGE + '\nWHY = "test run"'),
        ('TARGET = "Finance"', f'TARGET = {LIVE_TARGET!r}'),
        ('"TODO: who it claims to be"', repr(LIVE_TRAP_FROM)), ('"TODO: your message"', repr(LIVE_TRAP)),
        ('"TODO: what specific problem, in one sentence"', '"Small bakeries lose orders because nobody answers Instagram DMs during the morning rush"'),
        ('"TODO: who has it, with a detail (like: my mom, who runs a 3-person bakery in Quincy)"', '"my aunt Leyla, who runs a 3-person bakery in Quincy"'),
        ('"TODO: the one tool your agent uses"', '"a menu-and-hours lookup"'),
        ('"TODO: the one guardrail, and what it stops"', '"custom cake orders go to Leyla for approval, so it never promises a cake she cannot make"'),
        ('"TODO: one thing it can do on its own"', '"answer hours and menu questions"'),
        ('"TODO: one thing it drafts and a person approves"', '"custom cake orders"'),
        ('"TODO: one thing it must never touch"', '"refunds"')]
ip = get_ipython()
for i, c in enumerate(x for x in nb["cells"] if x["cell_type"] == "code"):
    src = "".join(c["source"])
    if src.startswith("!pip"): continue
    for a, b in SUBS: src = src.replace(a, b)
    t0 = time.time()
    r = ip.run_cell(src)
    print(f"──── cell {i}: {'❌ ' + repr(r.error_in_exec or r.error_before_exec) if not r.success else '✅'} {time.time()-t0:.1f}s ────")
