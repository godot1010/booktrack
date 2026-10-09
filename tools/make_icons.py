# 서고 앱 아이콘 만들기 (로고 B: 기댔다 일어서는 책)
# 코랄 바탕 위에 — 비스듬히 기댄 책(반투명), 우뚝 선 책(흰색, 코랄 책갈피), 작은 책, 그리고 선반.
# 앱 안 로고(public/index.html의 LOGO_MARK)와 같은 모양이다. 좌표는 112×112 기준.
# 외부 도구 없이 PNG를 직접 만든다.  실행: python tools/make_icons.py
import zlib, struct, os, math

CORAL = (247, 110, 90); WHITE = (255, 255, 255)
OUT = os.path.join(os.path.dirname(__file__), "..", "public")

def mix(a):  # 흰색을 코랄 위에 a만큼 겹친 색
    return tuple(round(c * (1 - a) + 255 * a) for c in CORAL)

def in_rrect(x, y, rx, ry, w, h, r):
    if not (rx <= x <= rx + w and ry <= y <= ry + h): return False
    cx = min(max(x, rx + r), rx + w - r); cy = min(max(y, ry + r), ry + h - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

def in_rotated_rrect(x, y, rx, ry, w, h, r, deg, ox, oy):
    # (ox, oy)를 중심으로 deg만큼 돌린 둥근 네모: 점을 반대로 돌려서 검사
    t = math.radians(-deg)
    dx, dy = x - ox, y - oy
    ux = ox + dx * math.cos(t) - dy * math.sin(t)
    uy = oy + dx * math.sin(t) + dy * math.cos(t)
    return in_rrect(ux, uy, rx, ry, w, h, r)

def in_ribbon(x, y):  # M60 20 h7 v17 l-3.5 -3 -3.5 3 z
    if not (60 <= x <= 67 and 20 <= y <= 37): return False
    notch = 37 - 3 * (1 - abs(x - 63.5) / 3.5)
    return y <= notch

def color_at(u, v):
    # u, v: 0~112 좌표. 위에 그린 것이 이긴다(나중 것 우선)
    c = CORAL
    if in_rotated_rrect(u, v, 24, 34, 20, 54, 4, -18, 40, 88): c = mix(0.55)
    if in_rrect(u, v, 78, 40, 14, 48, 3): c = mix(0.8)
    if in_rrect(u, v, 50, 20, 24, 68, 4): c = WHITE
    if in_ribbon(u, v): c = CORAL
    if in_rrect(u, v, 18, 88, 78, 5, 2.5): c = mix(0.85)
    return c

def make(size, k, name):
    ss = 3  # 가장자리를 매끄럽게 하려고 한 칸을 3x3으로 나눠 평균
    rows = bytearray()
    for py in range(size):
        rows.append(0)
        for px in range(size):
            acc = [0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    x = (px + (sx + .5) / ss) / size; y = (py + (sy + .5) / ss) / size
                    # 가운데를 기준으로 k배 (maskable은 작게), 그림 중심이 조금 아래(선반)라 위로 살짝 올림
                    u = 56 + (x - 0.5) * 112 / k; v = 54 + (y - 0.5) * 112 / k
                    col = color_at(u, v)
                    acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]
            rows += bytes(round(a / ss / ss) for a in acc)
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
    with open(os.path.join(OUT, name), "wb") as f: f.write(png)
    print(name, size)

make(192, 1.0, "icon-192.png")
make(512, 1.0, "icon-512.png")
make(512, 0.8, "icon-maskable-512.png")
