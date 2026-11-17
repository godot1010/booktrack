# 사용: python make.py <에피소드이름> [시드없음]  → _run_<이름>.js 를 만든다 (Playwright run_code filename으로 실행)
import sys, json, pathlib
M = pathlib.Path(__file__).parent
name = sys.argv[1]
SCR = pathlib.Path(r"C:/Users/user/AppData/Local/Temp/claude/28ed2ca0a847da83/145278a0-5527-4f94-826e-b2afb35437cd/scratchpad")
cfg = json.load(open(M / f"{name}_대본.json", encoding="utf-8"))
durs = json.load(open(SCR / name / "durs.json"))
body = (M / f"{name}_장면.js").read_text(encoding="utf-8")
base = (M / "rec_base.js").read_text(encoding="utf-8")
lib = (M / "lib.js").read_text(encoding="utf-8")
out = base.replace("__LIB__", lib).replace("__OUT__", (SCR / name / "rec").as_posix()).replace("__DURS__", json.dumps(durs))
out = out.replace("__SITE__", cfg.get("site", "https://preview.booktrack.pages.dev/")).replace("__NEXT__", cfg.get("next", ""))
out = out.replace("__SEEDFLAG__", "false" if cfg.get("noseed") else "true").replace("__BODY__", body)
(M / f"_run_{name}.js").write_text(out, encoding="utf-8")
print("만듦", f"_run_{name}.js", durs)
