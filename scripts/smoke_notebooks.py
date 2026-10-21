#!/usr/bin/env python3
"""Run the course's Colab notebooks end to end with a real Gemini key, outside Colab.

    GOOGLE_API_KEY=... python scripts/smoke_notebooks.py            # execute every notebook in NOTEBOOKS
    python scripts/smoke_notebooks.py --dry-run                      # transform + syntax-check only, no key needed
    python scripts/smoke_notebooks.py --only session-06              # substring filter on the path

How a Colab notebook runs here:
  * `from google.colab import userdata` is shimmed: userdata.get(name) reads the environment.
  * `!pip install …` cells, Telegram polling loops, `files.download(...)` and any cell tagged with a
    per-notebook skip pattern are skipped.
  * `input()` always answers "no", so approval gates take the BLOCKED path instead of hanging.
Executed notebooks are written to smoke-out/ so a failure can be read cell by cell.
"""
import argparse, ast, json, os, re, sys, time, traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# path → extra regexes whose cells are skipped (in addition to the global skips); "optional" = failure doesn't fail the run
NOTEBOOKS = {
    "public/session-03/ISOM260_Session3_First_API_Call.ipynb": {},
    "public/session-04/ISOM260_Session4_Build_Your_First_Agent_Gemini.ipynb": {},
    "public/session-06/ISOM260_Session6_Make_It_Think_Gemini.ipynb": {"skip": [r'MY_QUESTION = "TODO']},
    "public/session-06/ISOM260_Session6_MCP_Live_Demo.ipynb": {},
    "public/session-06/ISOM260_Midterm_Starter.ipynb": {"skip": [r'ask\("TODO', r'OPTIONAL — Telegram'], "optional": True},
    "public/session-07/ISOM260_Session7_Your_Agent_Reads_Your_Documents.ipynb": {"skip": [r'MY_DOC_NAME = "TODO']},
    "public/session-08/ISOM260_Session8_When_One_Agent_Becomes_Two.ipynb": {},
    "public/session-08/ISOM260_Session8_Same_Model_Different_Harness.ipynb": {"optional": True},   # class photo is fetched from Unsplash
    "public/session-09/ISOM260_The_Cover_Letter_That_Lies.ipynb": {},
}
GLOBAL_SKIP = [r"^\s*!pip", r"run_bot\(\)", r"files\.download\(", r"^\s*!"]

PRELUDE = r'''
import sys, types, os, builtins
_colab = types.ModuleType("google.colab")
_colab.userdata = types.SimpleNamespace(get=lambda k: os.environ[k])           # Colab Secrets → environment
_colab.files = types.SimpleNamespace(download=lambda *a, **k: None)
sys.modules["google.colab"] = _colab
builtins.input = lambda *a, **k: "no"                                         # every approval gate says no
os.environ.setdefault("SMOKE_TEST", "1")
print("🧪 smoke prelude loaded")
'''


def transform(nb, extra_skip):
    """Return (cells_to_run, skipped) with the smoke prelude prepended."""
    skip_res = [re.compile(p, re.M) for p in GLOBAL_SKIP + extra_skip]
    keep, skipped = [], []
    for i, c in enumerate(nb["cells"]):
        if c["cell_type"] != "code":
            continue
        src = "".join(c["source"])
        if any(r.search(src) for r in skip_res):
            skipped.append((i, src.strip().splitlines()[0][:70] if src.strip() else "(empty)"))
            continue
        keep.append((i, src))
    return keep, skipped


def run(path, cfg, dry, timeout):
    nb = json.load(open(ROOT / path))
    keep, skipped = transform(nb, cfg.get("skip", []))
    for i, src in keep:                                   # syntax first — cheap, and catches a bad edit without a key
        try:
            ast.parse(src)
        except SyntaxError as e:
            return False, f"cell {i}: syntax error: {e}", skipped
    if dry:
        return True, f"{len(keep)} cells parse, {len(skipped)} skipped", skipped

    import nbformat
    from nbclient import NotebookClient
    out = nbformat.v4.new_notebook()
    out.cells = [nbformat.v4.new_code_cell(PRELUDE)] + [nbformat.v4.new_code_cell(src) for _, src in keep]
    client = NotebookClient(out, timeout=timeout, kernel_name="python3", allow_errors=False, resources={"metadata": {"path": str(ROOT / "smoke-out")}})
    t0 = time.time()
    try:
        client.execute()
        ok, msg = True, f"{len(keep)} cells ran in {time.time() - t0:.0f}s, {len(skipped)} skipped"
    except Exception as e:                                # CellExecutionError carries the traceback text
        ok, msg = False, f"failed after {time.time() - t0:.0f}s: {str(e).strip().splitlines()[-1][:300]}"
    (ROOT / "smoke-out").mkdir(exist_ok=True)
    nbformat.write(out, ROOT / "smoke-out" / Path(path).name)
    return ok, msg, skipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--timeout", type=int, default=600)
    a = ap.parse_args()
    if not a.dry_run and not os.environ.get("GOOGLE_API_KEY"):
        sys.exit("GOOGLE_API_KEY is not set. Use --dry-run to check without a key.")
    (ROOT / "smoke-out").mkdir(exist_ok=True)
    results, failed = [], False
    for path, cfg in NOTEBOOKS.items():
        if a.only and a.only not in path:
            continue
        ok, msg, skipped = run(path, cfg, a.dry_run, a.timeout)
        tag = "✅" if ok else ("⚠️ optional" if cfg.get("optional") else "❌")
        results.append(f"{tag} {Path(path).name}: {msg}")
        for i, first in skipped:
            results.append(f"     · skipped cell {i}: {first}")
        if not ok and not cfg.get("optional"):
            failed = True
    print("\n".join(results))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
