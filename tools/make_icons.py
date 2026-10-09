# Book612 앱 아이콘 만들기 (로고: 소행성 B612 위의 장미 한 송이)
# 앱 안 로고(public/index.html의 ROSE_ICON)와 같은 그림을 같은 좌표(104×104)로 그린다.
# 바탕화면 아이콘은 움직일 수 없어서 장미가 활짝 핀 모습으로 멈춰 있다.
# 외부 도구 없이 PNG를 직접 만든다(SVG 길을 잘게 나눈 다각형으로 칠함).  실행: python tools/make_icons.py
import zlib, struct, os, re, math

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

# ── SVG 길(path)을 점 목록으로 바꾸기: M m L l H h V v C c Q q Z 만 쓴다
def flatten(d, steps=16):
    toks = re.findall(r"[MmLlHhVvCcQqZz]|-?\d*\.?\d+", d)
    polys, cur, x, y, sx, sy, i, cmd = [], [], 0.0, 0.0, 0.0, 0.0, 0, None
    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v
    while i < len(toks):
        if re.match(r"[A-Za-z]", toks[i]): cmd = toks[i]; i += 1
        rel = cmd.islower(); c = cmd.upper()
        if c == "Z":
            if cur: polys.append(cur); cur = []
            x, y = sx, sy; continue
        if c == "M":
            if cur: polys.append(cur)
            nx, ny = num(), num()
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            sx, sy = x, y; cur = [(x, y)]
            cmd = "l" if rel else "L"; continue
        if c == "L":
            nx, ny = num(), num(); x, y = (x + nx, y + ny) if rel else (nx, ny); cur.append((x, y))
        elif c == "H":
            nx = num(); x = x + nx if rel else nx; cur.append((x, y))
        elif c == "V":
            ny = num(); y = y + ny if rel else ny; cur.append((x, y))
        elif c in "CQ":
            n = 3 if c == "C" else 2
            pts = [(num(), num()) for _ in range(n)]
            if rel: pts = [(x + a, y + b) for a, b in pts]
            p0 = (x, y)
            for k in range(1, steps + 1):
                t = k / steps; u = 1 - t
                if c == "C":
                    (x1, y1), (x2, y2), (x3, y3) = pts
                    px = u**3 * p0[0] + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3
                    py = u**3 * p0[1] + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3
                else:
                    (x1, y1), (x2, y2) = pts
                    px = u * u * p0[0] + 2 * u * t * x1 + t * t * x2
                    py = u * u * p0[1] + 2 * u * t * y1 + t * t * y2
                cur.append((px, py))
            x, y = pts[-1]
    if cur: polys.append(cur)
    return polys

def tf(polys, tx, ty, sc):  # translate(tx ty) scale(sc)
    return [[(tx + px * sc, ty + py * sc) for px, py in poly] for poly in polys]

def bbox(points, pad=0):
    xs = [p[0] for p in points]; ys = [p[1] for p in points]
    return (min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)

# ── 그릴 것 목록: (종류, 자료, 색, 바깥 상자). 뒤에 있는 것이 위에 칠해진다
shapes = []
def circle(cx, cy, r, col):
    shapes.append(("c", (cx, cy, r), hexc(col), (cx - r, cy - r, cx + r, cy + r)))
def fill(polys, col):
    shapes.append(("f", polys, hexc(col), bbox([p for poly in polys for p in poly])))
def stroke(polys, w, col):
    shapes.append(("s", (polys, w / 2), hexc(col), bbox([p for poly in polys for p in poly], w / 2)))

NAVY = "#2b3a72"
DOTS = [[18,20,1.6,1],[90,44,1.2],[13,52,1],[28,36,.9],[9,30,.8],[36,12,1.1],[62,9,.9],[72,24,1.3,1],[95,62,.9],
  [87,88,1.1],[13,82,1],[22,95,.8],[79,97,.9],[96,26,.8],[27,60,.9],[80,52,.8,1],[46,22,.7],[8,66,.7],[94,78,.7],[30,80,.6],[70,40,.6]]
for d in DOTS:
    # 아주 작은 점은 작은 아이콘에서 안 보이므로 조금 키운다
    circle(d[0], d[1], max(d[2], 1.0), "#f6c453" if len(d) > 3 else "#ffffff")
for x, y, s in [[24,27,3.2],[86,70,3],[40,6,2.4]]:
    fill(flatten(f"M{x} {y-s}Q{x} {y} {x+s} {y}Q{x} {y} {x} {y+s}Q{x} {y} {x-s} {y}Q{x} {y} {x} {y-s}z"), "#ffffff")
fill(flatten("M84 10l2.2 5 5 .6-3.8 3.3 1.1 5-4.5-2.6-4.5 2.6 1.1-5-3.8-3.3 5-.6z"), "#f6c453")
circle(52, 70, 22, "#f5eedc")
for cx, cy, r, col in [(42,76,4.4,"#b9a982"),(41.2,75.2,2.8,"#9c8b62"),(60,83,3.4,"#b9a982"),(59.4,82.4,2.1,"#9c8b62"),
                       (64,67,2.2,"#b9a982"),(63.6,66.6,1.3,"#9c8b62"),(50,87,1.8,"#b9a982")]:
    circle(cx, cy, r, col)
R = lambda d: tf(flatten(d), 51, 67, 1.6)
stroke(R("M0 0c-.6-5 .4-9 0-12"), 1.8 * 1.6, "#3d8a5a")
fill(R("M0-5c-4-.4-6-3-5.8-5.6 3 .2 5.4 2 5.8 5.6z"), "#3d8a5a")
fill(R("M0-12c-5-1-6.4-5.6-4.4-9.4 1.6-2 3.6-1.8 4.4.2.8-2 2.8-2.2 4.4-.2 2 3.8.6 8.4-4.4 9.4z"), "#e4574f")
stroke(R("M-2.4-19.4c1.2 1.8 3.6 1.8 4.8 0"), 1.1 * 1.6, "#c43c35")

def inside_poly(x, y, polys):  # 짝홀 규칙
    hit = False
    for poly in polys:
        n = len(poly)
        for k in range(n):
            (x1, y1), (x2, y2) = poly[k], poly[(k + 1) % n]
            if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                hit = not hit
    return hit

def near_line(x, y, polys, r):
    for poly in polys:
        for k in range(len(poly) - 1):
            (x1, y1), (x2, y2) = poly[k], poly[k + 1]
            dx, dy = x2 - x1, y2 - y1; L = dx * dx + dy * dy or 1e-9
            t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / L))
            if (x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2 <= r * r: return True
    return False

def color_at(u, v):
    c = hexc(NAVY)
    for kind, data, col, (x0, y0, x1, y1) in shapes:
        if not (x0 <= u <= x1 and y0 <= v <= y1): continue
        if kind == "c":
            cx, cy, r = data
            if (u - cx) ** 2 + (v - cy) ** 2 <= r * r: c = col
        elif kind == "f":
            if inside_poly(u, v, data): c = col
        elif near_line(u, v, data[0], data[1]): c = col
    return c

def make(size, k, name):
    # k: 그림 크기 배율(maskable은 폰이 가장자리를 잘라 내므로 0.8로 작게). 바탕은 끝까지 남색으로 채운다(모양은 폰이 깎음)
    ss = 3  # 가장자리를 매끄럽게 하려고 한 칸을 3x3으로 나눠 평균
    rows = bytearray()
    for py in range(size):
        rows.append(0)
        for px in range(size):
            acc = [0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    x = (px + (sx + .5) / ss) / size; y = (py + (sy + .5) / ss) / size
                    col = color_at(52 + (x - 0.5) * 104 / k, 52 + (y - 0.5) * 104 / k)
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
