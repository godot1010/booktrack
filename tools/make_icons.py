# Book Track 아이콘 만들기: 코랄 바탕 + 흰 책갈피 (앱 안 로고와 같은 모양)
# 외부 도구 없이 PNG를 직접 만든다.  실행: python tools/make_icons.py
import zlib, struct, os

CORAL = (247, 110, 90); WHITE = (255, 255, 255)
OUT = os.path.join(os.path.dirname(__file__), "..", "public")

def color_at(x, y, k):
    # 가운데를 기준으로 k배 크기로 그림 (maskable은 작게)
    u = 0.5 + (x - 0.5) / k; v = 0.5 + (y - 0.5) / k
    # 책갈피: 위는 둥근 모서리, 아래는 V자로 파임 (로고 path: M2 1.5h12v15l-6-4.2-6 4.2z 를 키운 것)
    l, r, t, b = 0.335, 0.665, 0.24, 0.76
    if l <= u <= r and t <= v <= b:
        notch = b - 0.15 * (1 - abs(u - 0.5) / 0.165)   # 가운데로 갈수록 위로 파임
        rad = 0.03                                       # 위쪽 모서리 둥글게
        if v < t + rad and (u < l + rad or u > r - rad):
            cx = l + rad if u < l + rad else r - rad
            if (u - cx) ** 2 + (v - (t + rad)) ** 2 > rad ** 2:
                return CORAL
        if v <= notch:
            return WHITE
    return CORAL

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
