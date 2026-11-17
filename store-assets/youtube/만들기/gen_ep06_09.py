# 6~9편 대본·장면 파일 만들기 (한 번 돌리면 ep06~09_대본.json, ep06~09_장면.js가 생긴다)
import json
END = """  await p.evaluate((NEXT) => { document.getElementById('__cap')?.remove(); const e = document.createElement('div'); e.id = '__end';
    e.innerHTML = '<div style="font-family:Jua,sans-serif;font-size:64px;color:#f6c453">B<span style="font-size:.56em;color:#fdf3dc">ook</span>612</div><div class="t">' + NEXT + '</div><div class="s">구독하고 다음 편도 보세요</div>'; document.documentElement.appendChild(e); }, NEXT);
"""
def ep(n, voice, nxt, lines, scenes):
    json.dump({"voice": voice, "speed": 0.92, "next": nxt, "lines": lines}, open(f"ep0{n}_대본.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(f"ep0{n}_장면.js", "w", encoding="utf-8").write("  await p.evaluate(() => window.scrollTo(0, 0));\n" + scenes.replace("__END__", END))

ep(6, "M1", "다음 편: 친구에게 바치는 책", [
 "북 육일이 사용법, 여섯 번째 시간이에요. 오늘은 조종사 화면이에요. 나의 기록을 한눈에 볼 수 있어요.",
 "아래 맨 오른쪽, 조종사 칸을 눌러요.",
 "맨 위 비행 일지에는, 읽는 중인 책과 문장 수가 나와요. 왕의 명령은 올해 목표예요. 정하기를 눌러 볼게요.",
 "올해 읽고 싶은 권수를 넣고, 정하기를 눌러요.",
 "다 읽은 책 한 권이, 별 하나가 돼요. 나의 별 지도에 나만의 별자리가 그려져요.",
 "달마다 몇 권을 읽었는지도, 막대로 볼 수 있어요. 다음 시간에는, 친구에게 책을 바치는 방법이에요."],
"""  seg(0); await cap('Book612 사용법 ⑥<br><b>조종사 · 나의 별 지도</b>', 'top'); await fill(0);
  seg(1); await cap('아래 맨 오른쪽 <b>조종사</b>', 'top'); log.push(await hl('css:#nav-me', { scroll: false, up: true })); await sleep(2800);
  await tap('css:#nav-me'); await sleep(1200); await fill(1);
  seg(2); await cap('왕의 명령 = <b>올해 목표</b>', 'top'); log.push(await hl('css:[data-goal]', { scroll: false, up: false })); await sleep(5200);
  await tap('css:[data-goal]'); await sleep(1000); await fill(2);
  seg(3); await cap('권수를 넣고 → <b>정하기</b>', 'top'); await p.locator('#goal-input').pressSequentially('12', { delay: 300 }); await sleep(600);
  log.push(await hl('css:#goal-yes', { scroll: false, up: true })); await sleep(1500); await tap('css:#goal-yes'); await sleep(1500); await fill(3);
  seg(4); await cap('책 한 권 = <b>별 하나</b>', 'top'); log.push(await hl('css:.starmap', { scroll: true, finger: false })); await fill(4);
  seg(5); await cap('<b>달마다</b> 읽은 책', 'top'); log.push(await hl('css:.months', { scroll: true, finger: false })); await fill(5);
__END__  await sleep(5500);
""")

ep(7, "F2", "다음 편: 기록 지키기 백업", [
 "북 육일이 사용법, 일곱 번째 시간이에요. 오늘은 친구에게 책을 바치는 방법이에요.",
 "다 읽은 책 화면을 열고, 위쪽 공유 단추를 눌러요.",
 "받는 친구의 이름을 쓰면, 어린 시절의 친구에게, 라는 헌사가 카드에 들어가요.",
 "함께 보낼 문장도 고를 수 있어요.",
 "공유하기를 누르면, 카카오톡 같은 곳으로 보낼 수 있어요. 받는 친구는 앱이 없어도 볼 수 있어요.",
 "책 한 권으로 마음을 전해 보세요. 다음 시간에는, 기록을 지키는 백업이에요."],
"""  seg(0); await cap('Book612 사용법 ⑦<br><b>친구에게 바치는 책</b>', 'top'); await fill(0);
  seg(1); await cap('책 화면 → 위쪽 <b>공유</b>', 'top'); await p.evaluate(() => { location.hash = '#/book/d3'; }); await sleep(1500);
  log.push(await hl('css:[data-share]', { scroll: false, up: false })); await sleep(2200); await tap('css:[data-share]'); await sleep(1200); await fill(1);
  seg(2); await cap('친구 이름 → <b>어린 시절의 ○○에게</b>', 'top'); await p.locator('#share-to').click(); await p.locator('#share-to').pressSequentially('민지', { delay: 350 }); await sleep(1200); await fill(2);
  seg(3); await cap('함께 보낼 <b>문장</b> 고르기', 'top'); log.push(await hl('css:.share-opts', { scroll: true, finger: false })); await fill(3);
  seg(4); await cap('<b>공유하기</b> → 카톡으로', 'top'); log.push(await hl('css:#share-go', { scroll: true, up: true })); await fill(4);
  seg(5); await cap('책 한 권으로 <b>마음을 전해요</b>', 'top'); await unhl(); await sleep(5200);
__END__  await sleep(5500);
""")

ep(8, "M1", "다음 편: 사진에서 글자 가져오기", [
 "북 육일이 사용법, 여덟 번째 시간이에요. 오늘은 기록을 지키는 백업이에요.",
 "내 기록은 이 폰 안에만 저장돼요. 그래서 폰을 바꾸기 전에는, 꼭 백업을 해 두세요.",
 "조종사 화면 맨 아래에서, 백업 저장을 눌러요.",
 "백업 파일이 만들어져요. 카톡 나에게 보내기나, 드라이브에 보관해 두세요.",
 "새 폰에서는 불러오기를 눌러서, 그 파일을 고르면, 기록이 그대로 돌아와요.",
 "이제 마음 놓고 기록해요. 다음 시간이 마지막이에요. 사진에서 글자를 가져오는 방법이에요."],
"""  seg(0); await cap('Book612 사용법 ⑧<br><b>기록 지키기 · 백업</b>', 'top'); await fill(0);
  seg(1); await cap('기록은 <b>이 폰 안에만</b> 저장돼요', 'top'); await tap('css:#nav-me'); await sleep(1200); await fill(1);
  seg(2); await cap('맨 아래 → <b>백업 저장</b>', 'top'); await p.evaluate(() => document.querySelector('.backup').scrollIntoView({ behavior: 'smooth', block: 'center' })); await sleep(1200);
  log.push(await hl('css:[data-export]', { scroll: false, up: true })); await sleep(2800);
  await unhl(); { const dl = p.waitForEvent('download', { timeout: 6000 }).catch(() => null); await p.locator('[data-export]').click(); await dl; } await sleep(800); await fill(2);
  seg(3); await cap('<b>백업 파일</b>을 안전한 곳에', 'top'); await sleep(1000); await fill(3);
  seg(4); await cap('새 폰에서 → <b>불러오기</b>', 'top'); log.push(await hl('css:[data-import]', { scroll: false, up: true })); await fill(4);
  seg(5); await cap('<b>마음 놓고</b> 기록해요', 'top'); await unhl(); await sleep(5200);
__END__  await sleep(5500);
""")

ep(9, "F2", "구독하고 Book612를 만나요", [
 "북 육일이 사용법, 마지막 아홉 번째 시간이에요. 오늘은 사진에서 글자를 가져오는 방법이에요.",
 "문장 길들이기 창에서, 사진으로를 눌러요. 책의 쪽을 찍어요.",
 "밑줄 친 부분에 네모를 맞춰요. 모서리 손잡이를 끌면, 크기를 바꿀 수 있어요.",
 "이 부분 읽기를 누르면, 사진 속 글자가 칸에 들어가요. 폰 안에서 읽기 때문에, 사진은 서버로 보내지 않아요.",
 "틀린 글자는 고쳐서 저장하면 돼요. 소리 내어 읽어서 받아 적을 수도 있어요.",
 "여기까지가 북 육일이 사용법이었어요. 책을 심고, 마음에 남은 문장을 길들이며, 즐거운 독서 되세요."],
"""  seg(0); await cap('Book612 사용법 ⑨<br><b>사진에서 글자 가져오기</b>', 'top'); await fill(0);
  seg(1); await cap('<b>사진으로</b> → 책의 쪽 찍기', 'top');
  await p.evaluate(() => document.querySelector('.now')?.scrollIntoView({ behavior: 'smooth', block: 'center' })); await sleep(800);
  await tap('css:.now .btn'); await sleep(1000); log.push(await hl('css:#ocr-pick', { scroll: false, finger: true, up: false })); await sleep(2200); await unhl();
  { const fc = p.waitForEvent('filechooser'); await p.locator('#ocr-pick').click(); const ch = await fc; await ch.setFiles('C:/projects/booktrack/store-assets/youtube/만들기/가상의책쪽.png'); } await sleep(1800); await fill(1);
  seg(2); await cap('밑줄 친 부분에 <b>네모</b> 맞추기', 'top'); await sleep(1000); log.push(await hl('css:#crop-sel', { scroll: true, finger: false })); await fill(2);
  seg(3); await cap('<b>이 부분 읽기</b> → 글자가 칸에', 'top'); log.push(await hl('css:#ocr-read', { scroll: true, up: true })); await sleep(2200); await tap('css:#ocr-read');
  { const t0 = Date.now(); for (let i = 0; i < 120; i++) { const v = await p.locator('#qq-text').inputValue().catch(() => ''); if (v.length > 5) break; await sleep(500); } log.push('ocr ' + Math.round((Date.now() - t0) / 1000) + 's: ' + (await p.locator('#qq-text').inputValue().catch(() => ''))); }
  await sleep(1200); await fill(3);
  seg(4); await cap('고쳐서 → <b>저장</b>', 'top'); log.push(await hl('css:#qq-text', { scroll: true, finger: false })); await sleep(3000);
  log.push(await hl('css:.qpage-row .btn', { scroll: true, up: true })); await fill(4);
  seg(5); await cap('<b>즐거운 독서</b> 되세요', 'top'); await unhl(); await sleep(6000);
__END__  await sleep(5500);
""")
print("ok")
