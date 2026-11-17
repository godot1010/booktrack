  await p.evaluate(() => window.scrollTo(0, 0));
  seg(0); await cap('Book612 사용법 ⑤\n<b>그림 상자</b>', 'top'); await fill(0);
  seg(1); await cap('길들인 문장 → <b>그림 상자</b> 칸', 'top');
  await tap('css:#nav-quotes'); await sleep(1300);
  log.push(await hl('css:.box-seg button:nth-child(2)', { scroll: false, up: false })); await sleep(2600);
  await tap('css:.box-seg button:nth-child(2)'); await sleep(1200); await fill(1);
  seg(2); await cap('<b>그리기</b> 누르기', 'top'); log.push(await hl('css:[data-draw]', { scroll: true, up: false })); await sleep(2500);
  await tap('css:[data-draw]'); await sleep(1200); await fill(2);
  seg(3); await cap('손가락으로 <b>그려요</b>', 'top'); await unhl();
  { const bb = await p.locator('canvas.draw-canvas').boundingBox(); const X = bb.x, Y = bb.y, W = bb.width, H = bb.height;
    const stroke = async (pts, d = 14) => { await p.mouse.move(X + pts[0][0] * W, Y + pts[0][1] * H); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { await p.mouse.move(X + x * W, Y + y * H, { steps: d }); } await p.mouse.up(); };
    await stroke([[.18, .45], [.82, .45], [.82, .78], [.18, .78], [.18, .45]]);               // 상자
    await stroke([[.18, .45], [.28, .38], [.72, .38], [.82, .45]]);
    await p.locator('[data-dcolor]').nth(1).click();
    await stroke([[.38, .3], [.34, .22], [.4, .16], [.5, .14], [.62, .17], [.66, .25], [.6, .31], [.5, .33], [.38, .3]], 10);   // 양
    await p.locator('[data-dcolor]').nth(0).click(); await p.locator('[data-dsize="16"]').click();
    await stroke([[.43, .22], [.43, .23]], 2); await stroke([[.57, .22], [.57, .23]], 2);
    await sleep(700); }
  await fill(3);
  seg(4); await cap('<b>상자에 담기</b> → 이름 → 담기', 'top'); log.push(await hl('css:[data-dsave]', { scroll: true, up: true })); await sleep(1800);
  await tap('css:[data-dsave]'); await sleep(900); await p.locator('#pic-title').pressSequentially('상자 속의 양', { delay: 200 }); await sleep(500);
  log.push(await hl('css:#pic-save', { scroll: false, up: true })); await sleep(1500); await tap('css:#pic-save'); await sleep(1000); await fill(4);
  seg(5); await cap('<b>사진 찍어 담기</b>도 있어요', 'top'); await sleep(3200); log.push(await hl('css:[data-picadd]', { scroll: true, up: false })); await fill(5);
  await p.evaluate((NEXT) => { document.getElementById('__cap')?.remove(); const e = document.createElement('div'); e.id = '__end';
    e.innerHTML = '<div style="font-family:Jua,sans-serif;font-size:64px;color:#f6c453">B<span style="font-size:.56em;color:#fdf3dc">ook</span>612</div><div class="t">' + NEXT + '</div><div class="s">구독하고 다음 편도 보세요</div>'; document.documentElement.appendChild(e); }, NEXT);
  await sleep(5500);
