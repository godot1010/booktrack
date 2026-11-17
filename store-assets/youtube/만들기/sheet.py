# 사용: python sheet.py 영상.mp4 시각들(쉼표) 출력.png  → 장면 확인용 이어 붙인 그림
import subprocess, sys, tempfile, os
from PIL import Image
FF = r"C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
mp4, ts, out = sys.argv[1], [float(x) for x in sys.argv[2].split(",")], sys.argv[3]
d = tempfile.mkdtemp(); ims = []
for i, t in enumerate(ts):
    f = os.path.join(d, f"{i}.png"); subprocess.run([FF, "-v", "error", "-y", "-ss", str(t), "-i", mp4, "-frames:v", "1", "-vf", "scale=300:-1", f], check=True); ims.append(Image.open(f))
c = Image.new("RGB", (sum(i.width for i in ims), max(i.height for i in ims))); x = 0
for i in ims: c.paste(i, (x, 0)); x += i.width
c.save(out); print("ok", out)
