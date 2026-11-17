# 대본 JSON의 줄마다 Supertonic 목소리 wav를 만들고 길이를 적는다
# 사용: python 목소리_만들기.py 대본.json 출력폴더
import json, sys, numpy as np, soundfile as sf
from supertonic import TTS
cfg = json.load(open(sys.argv[1], encoding="utf-8")); out = sys.argv[2]
t = TTS(); st = t.get_voice_style(cfg["voice"]); sr = t.sample_rate; durs = []
for i, s in enumerate(cfg["lines"]):
    w, _ = t.synthesize(s, st, total_steps=16, speed=cfg.get("speed", 0.92), lang="ko")
    w = np.asarray(w).reshape(-1); sf.write(f"{out}/s{i}.wav", w, sr); durs.append(round(len(w) / sr, 2))
json.dump(durs, open(f"{out}/durs.json", "w")); print(durs, round(sum(durs), 1))
