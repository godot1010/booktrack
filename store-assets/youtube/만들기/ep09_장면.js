  await p.evaluate(() => window.scrollTo(0, 0));
  seg(0); await cap('Book612 사용법 ⑨<br><b>사진에서 글자 가져오기</b>', 'top'); await fill(0);
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
  await p.evaluate((NEXT) => { document.getElementById('__cap')?.remove(); const e = document.createElement('div'); e.id = '__end';
    e.innerHTML = '<div style="font-family:Jua,sans-serif;font-size:64px;color:#f6c453">B<span style="font-size:.56em;color:#fdf3dc">ook</span>612</div><div class="t">' + NEXT + '</div><div class="s">구독하고 다음 편도 보세요</div>'; document.documentElement.appendChild(e); }, NEXT);
  await sleep(5500);
