# 스토어 스크린샷용 사본: 가상의 책과 직접 지은 문장으로 채운다 (실제 앱 코드는 그대로)
import sys, json
p = sys.argv[1]
s = open(p, encoding='utf-8').read()

def iso(y, m, d): return f"{y}-{m:02d}-{d:02d}T10:00:00.000Z"
B = []
def book(i, title, author, status, genre, quotes=(), fmt="paper", rec=False, created=iso(2026, 9, 1), started="", finished="", feeling=""):
    B.append({"id": f"d{i}", "title": title, "author": author, "publisher": "별빛출판", "status": status, "genre": genre, "format": fmt, "rec": rec,
              "createdAt": created, "updatedAt": created, "startedAt": started, "finishedAt": finished, "feeling": feeling,
              "summary": "사막에 떨어진 조종사가 작은 별에서 온 아이를 만나며 잊고 있던 마음을 다시 찾아가는 이야기.",
              "quotes": [{"id": f"q{i}{k}", "text": t, "page": pg, "createdAt": iso(2026, 10, 1 + k + i)} for k, (t, pg) in enumerate(quotes)]})
book(1, "별을 세는 밤", "한여름", "reading", "소설", [("오래 바라본 것들은 결국 내 안에 별자리를 만든다.", "48"), ("천천히 걷는 사람만 볼 수 있는 길이 있다.", "112")],
     rec=True, started=iso(2026, 10, 3), feeling="잠들기 전에 한 장씩 아껴 읽는 책.")
book(2, "사막의 우물", "윤서하", "reading", "수필", [("목이 마를 때 찾던 우물은 사실 함께 걷던 시간이었다.", "23")], started=iso(2026, 10, 8))
book(3, "여우의 편지", "이도담", "done", "소설", [("기다리는 시간도 만남의 일부라는 걸 너에게 배웠어.", "77"), ("익숙해진다는 건 서로의 이름을 오래 부르는 일이다.", "131")],
     finished=iso(2026, 3, 14), rec=True)
book(4, "작은 정원의 기록", "박온", "done", "수필", [("물을 주는 날보다 기다리는 날이 더 많았다.", "15")], finished=iso(2026, 6, 2))
book(5, "바람이 머문 자리", "서늘", "done", "시", [("바람은 머물지 않아서 늘 새롭다.", "9")], finished=iso(2026, 9, 21))
book(6, "가로등 아래에서", "정은솔", "want", "소설", created=iso(2026, 10, 10))
book(7, "왕의 하루", "김하람", "want", "인문", created=iso(2026, 10, 12))
book(8, "장미를 위한 시간", "문채", "want", "시", created=iso(2026, 10, 14))
book(9, "철도원의 노트", "류세", "done", "인문", finished=iso(2026, 8, 11))
book(10, "밤하늘 산책", "오로라", "reading", "자기계발", fmt="audio", started=iso(2026, 10, 12))

def rep(a, b):
    global s
    assert s.count(a) == 1, (a[:60], s.count(a))
    s = s.replace(a, b)
rep('try { books = (await dbAll()).map(normalizeBook).filter(Boolean); }',
    'try { books = ' + json.dumps(B, ensure_ascii=False) + '.map(normalizeBook).filter(Boolean); }')
rep('const storySeen = () =>', 'const storySeen = () => true; const _storySeen0 = () =>')
rep('const skyPhase = h =>', 'const skyPhase = h => "night"; const _skyPhase0 = h =>')
rep('async function saveBook(b){', 'async function saveBook(b){ return;')
rep('  if(!storySeen()) openStory();', '  if(location.hash === "#/story"){ openStory(); document.querySelector(".story [data-st=skip]").click(); }\n  if(location.hash === "#/fox"){ location.hash = "#/quotes"; setTimeout(openFoxPick, 400); }\n  if(!storySeen()) openStory();')
rep('let foxLast = "";', 'let foxLast = "q30";')
# 서비스 워커는 찍을 때 필요 없음
rep('if("serviceWorker" in navigator)', 'if(false)')
open(p, 'w', encoding='utf-8').write(s)
print('ok', len(B))
