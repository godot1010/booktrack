# 녹화 영상 + 줄별 목소리(s0.wav…) + 배경음악을 쇼츠 한 편으로 합친다
# 사용: python 합치기.py 녹화.webm 목소리폴더 배경음악.wav 출력.mp4 "T0,T1,…" Tend
# T = 녹화 스크립트가 돌려준 장면 시작 시각(초). 목소리는 장면 시작 0.25초 뒤에 나온다.
import subprocess, sys
FF = r"C:\Users\user\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
webm, vdir, bgm, out, Ts, Tend = sys.argv[1:7]
T = [float(x) for x in Ts.split(",")]; Tend = float(Tend)
start = T[0] - 0.4
# 장면이 목소리보다 짧으면 다음 말과 겹친다 → 알리고 멈춤
import wave
for i in range(len(T) - 1):
    with wave.open(f"{vdir}/s{i}.wav") as w: d = w.getnframes() / w.getframerate()
    if T[i + 1] - T[i] < d + 0.25:
        sys.exit(f"겹침: 장면 {i} 목소리 {d:.2f}초 > 장면 길이 {T[i+1]-T[i]:.2f}초")
args = [FF, "-v", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{Tend - start:.3f}", "-i", webm]
for i in range(len(T)): args += ["-i", f"{vdir}/s{i}.wav"]
args += ["-i", bgm]
parts, labels = [], ""
for i, t in enumerate(T):
    ms = int((t - start + 0.25) * 1000)
    parts.append(f"[{i+1}:a]aresample=48000,adelay={ms}|{ms},volume=1.6[a{i}]"); labels += f"[a{i}]"
nb = len(T) + 1
fc = ";".join(parts) + f";{labels}amix=inputs={len(T)}:normalize=0,asplit=2[v1][v2]"
fc += f";[{nb}:a]aresample=48000,volume=0.22,afade=t=out:st={Tend - start - 2.5:.2f}:d=2.5[bg]"
fc += ";[bg][v1]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=500[bgd]"
fc += ";[v2][bgd]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=11[aout]"
args += ["-filter_complex", fc, "-map", "0:v", "-map", "[aout]", "-r", "30", "-c:v", "libx264", "-crf", "19",
         "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", out]
subprocess.run(args, check=True); print("ok", out)
