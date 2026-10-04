# 북트랙 아이콘 만들기: 종이색 바탕 + 남색 책 + 빨간 책갈피 리본
# 외부 도구 없이 PNG를 직접 만든다.  실행: python tools/make_icons.py
import zlib, struct, os

PAPER = (241, 233, 216); BOOK = (47, 74, 109); SPINE = (86, 112, 145); RIBBON = (155, 47, 58)
OUT = os.path.join(os.path.dirname(__file__), "..", "public")

def color_at(x, y, k):
    # 가운데를 기준으로 k배 크기로 그림 (maskable은 작게)
    u = 0.5 + (x - 0.5) / k; v = 0.5 + (y - 0.5) / k
    # 리본: 책 위쪽부터 책 아래로 삐져나오고 끝이 V자로 파임
    if 0.565 <= u <= 0.635 and 0.20 <= v <= 0.88:
        notch = 0.88 - 0.045 * (1 - abs(u - 0.6) / 0.035)
        if v <= notch: return RIBBON
    # 책 (모서리 둥글게)
    l, r, t, b, rad = 0.30, 0.70, 0.18, 0.80, 0.03
    if l <= u <= r and t <= v <= b:
        cx = min(max(u, l + rad), r - rad); cy = min(max(v, t + rad), b - rad)
        if (u - cx) ** 2 + (v - cy) ** 2 <= rad ** 2:
            return SPINE if 0.345 <= u <= 0.355 else BOOK
    return PAPER

def make(size, k, name):
    ss = 3  # 가장자리를 매끄럽게 하려고 한 칸을 3x3으로 나눠 평균
    rows = bytearray()
    for py in range(size):
        rows.append(0)
        for px in range(size):
            acc = [0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    c = color_at((px + (sx + .5) / ss) / size, (py + (sy + .5) / ss) / size, k)
                    acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]
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
