# 9편 시험용 가상의 책 한 쪽(직접 지어낸 문장) 그림 만들기
from PIL import Image, ImageDraw, ImageFont
W, H = 1080, 1500
im = Image.new("RGB", (W, H), (246, 240, 226)); d = ImageDraw.Draw(im)
f = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 46)
lines = ["새벽의 골목에는 아직 불이 켜진", "창이 하나 있었다. 누군가 나를", "", "먼 곳의 불빛은 늘 가까운 마음에서", "켜진다.", "", "나는 한참을 서서 그 불빛을", "바라보았다."]
y = 420
for i, t in enumerate(lines):
    d.text((110, y), t, font=f, fill=(40, 36, 30))
    if i in (3, 4):
        w = d.textlength(t, font=f); d.line((110, y + 62, 110 + w, y + 62), fill=(40, 36, 30), width=3)
    y += 84
d.text((W // 2 - 20, H - 90), "58", font=f, fill=(90, 80, 70))
im.save(r"C:/projects/booktrack/store-assets/youtube/만들기/가상의책쪽.png"); print("img ok")
