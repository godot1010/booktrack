  await p.evaluate(() => window.scrollTo(0, 0));
  seg(0); await cap('Book612 사용법 ①\n<b>첫 화면 둘러보기</b>', 'top'); await fill(0);
  seg(1); await cap('맨 위 <b>하늘</b>은 시간 따라 바뀌어요', 'top'); await fill(1);
  seg(2); await cap('오늘의 노을 문장 → <b>다른 문장</b>', 'top'); log.push(await hl('text:다른 문장', { scroll: false })); await sleep(4200);
  await tap('text:다른 문장'); await sleep(300); await fill(2);
  seg(3); await cap('지금 읽는 책 → <b>문장 길들이기</b>', 'top');
  await p.evaluate(() => document.querySelector('.now')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await sleep(900); log.push(await hl('text:문장 길들이기', { scroll: false, up: true })); await fill(3);
  seg(4); await cap('읽고 싶은 책은 <b>씨앗</b> → 읽으면 <b>새싹</b> → 다 읽으면 <b>꽃</b>', 'top');
  await unhl(); await p.evaluate(() => window.scrollBy({ top: 520, behavior: 'smooth' })); await fill(4);
  seg(5); await cap('아래 메뉴 <b>다섯 칸</b>', 'top');
  { const ids = ['nav-home', 'nav-shelf', 'nav-add', 'nav-quotes', 'nav-me']; const gap = (D[5] * 1000 - 600) / 5;
    for (const id of ids) { log.push(await hl('css:#' + id, { scroll: false, up: true })); await sleep(gap); } }
  await fill(5); await unhl();
  seg(6); await cap('', 'top'); await p.evaluate((NEXT) => { document.getElementById('__cap').remove(); const e = document.createElement('div'); e.id = '__end';
    e.innerHTML = '<div style="font-family:Jua,sans-serif;font-size:64px;color:#f6c453">B<span style="font-size:.56em;color:#fdf3dc">ook</span>612</div><div class="t">' + NEXT + '</div><div class="s">구독하고 다음 편도 보세요</div>'; document.documentElement.appendChild(e); }, NEXT);
  await fill(6);
