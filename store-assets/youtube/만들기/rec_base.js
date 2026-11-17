async (page) => {
__LIB__
  // ---- 녹화 공통 ----
  const OUT = '__OUT__';
  const D = __DURS__;           // 줄별 목소리 길이(초)
  const SITE = '__SITE__';
  const NEXT = '__NEXT__';
  const browser = page.context().browser();
  const Z = 1080 / 390;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR',
    recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } } });
  await ctx.addInitScript((Z) => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.zoom = String(Z);
      const st = document.createElement('style');
      st.textContent = `
      #modal .sheet{max-height:calc(6.93px*88)!important;overflow-y:auto!important}
      #__cap{pointer-events:none;position:fixed;left:10px;right:10px;z-index:99999;background:rgba(20,26,51,.9);color:#fdf3dc;font-weight:800;font-size:21px;line-height:1.35;text-align:center;padding:10px 10px;border-radius:14px;white-space:pre-line;font-family:inherit;box-shadow:0 4px 14px rgba(0,0,0,.25)}
      #__cap b{color:#f6c453}
      [data-hl]{animation:__pulse 1s ease-in-out infinite;overflow:visible!important;position:relative}
      @keyframes __pulse{0%,100%{box-shadow:0 0 0 3px #fff,0 0 0 7px #e4574f}50%{box-shadow:0 0 0 3px #fff,0 0 0 12px rgba(228,87,79,.55)}}
      .__finger{position:absolute;left:50%;top:100%;margin-left:-20px;margin-top:2px;font-size:40px;line-height:1;pointer-events:none;animation:__tap .9s ease-in-out infinite;z-index:50;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
      .__finger.__up{top:auto;bottom:100%;margin-top:0;margin-bottom:2px}
      @keyframes __tap{0%,100%{transform:translateY(8px)}50%{transform:translateY(-4px)}}
      #__end{position:fixed;inset:0;z-index:100000;background:#141a33;color:#fdf3dc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:inherit;text-align:center}
      #__end .t{font-size:30px;font-weight:800;color:#f6c453}#__end .s{font-size:22px;opacity:.9}
      `;
      document.head.appendChild(st);
      window.__find = (spec) => {
        if (spec.startsWith('css:')) return document.querySelector(spec.slice(4));
        const t = spec.slice(5);
        const c = [...document.querySelectorAll('button,a,[data-go],.btn,[role=tab],label,li,h2,h3')].filter(e => e.offsetParent && e.textContent.replace(/\s+/g, ' ').trim().includes(t));
        return c.sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
      };
    });
  }, Z);
  const p = await ctx.newPage();
  const tv0 = Date.now();
  const now = () => (Date.now() - tv0) / 1000;
  await p.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(1200);
  await p.evaluate(async (SEED) => {
    localStorage.setItem('bt_story_seen', '1');
    const db = await new Promise((res, rej) => { const r = indexedDB.open('booktrack'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    await new Promise((res, rej) => { const tx = db.transaction('books', 'readwrite'); const st = tx.objectStore('books'); SEED.forEach(b => st.put(b)); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  }, __SEEDFLAG__ ? SEED : []);
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(2000);
  const log = [];
  const cap = (html, pos) => p.evaluate(([html, pos]) => {
    let c = document.getElementById('__cap'); if (!c) { c = document.createElement('div'); c.id = '__cap'; document.documentElement.appendChild(c); }
    c.innerHTML = html; c.style.top = pos === 'top' ? '8px' : 'auto'; c.style.bottom = pos === 'top' ? 'auto' : '86px'; }, [html, pos || 'top']);
  const unhl = () => p.evaluate(() => { document.querySelectorAll('[data-hl]').forEach(e => e.removeAttribute('data-hl')); document.querySelectorAll('.__finger').forEach(f => f.remove()); });
  const hl = (spec, o = {}) => p.evaluate(([spec, o]) => {
    document.querySelectorAll('[data-hl]').forEach(e => e.removeAttribute('data-hl')); document.querySelectorAll('.__finger').forEach(f => f.remove());
    let el = window.__find(spec); if (!el) return 'hl 없음: ' + spec; if (o.parent) el = el.parentElement;
    if (o.scroll !== false) el.scrollIntoView({ behavior: 'smooth', block: o.block || 'center' });
    el.setAttribute('data-hl', '1');
    if (o.finger !== false) { const f = document.createElement('span'); f.className = '__finger' + (o.up ? ' __up' : ''); f.textContent = '👆'; el.appendChild(f); }
    return 'hl:' + spec; }, [spec, o]);
  const tap = async (spec) => { const ok = await p.evaluate((spec) => { const el = window.__find(spec); if (!el) return false; el.setAttribute('data-pw', 'x'); return true; }, spec);
    if (!ok) { log.push('tap 없음: ' + spec); return; } await unhl(); await p.locator('[data-pw=x]').first().click({ timeout: 8000 }); await p.evaluate(() => document.querySelectorAll('[data-pw]').forEach(e => e.removeAttribute('data-pw'))); };
  const T = []; let sceneStart = 0;
  const seg = async (i) => { T[i] = now(); sceneStart = Date.now(); };
  const fill = async (i) => { const need = (D[i] + 0.85) * 1000 - (Date.now() - sceneStart); if (need > 0) await sleep(need); else log.push('장면 ' + i + ' 동작이 ' + Math.round(-need) + 'ms 길어짐'); };
  // ---- 장면 ----
__BODY__
  // ---- 끝 ----
  const Tend = now() + 0.2;
  await sleep(300);
  const vpath = await p.video().path();
  await ctx.close();
  return { T: T.map(x => +x.toFixed(2)).join(','), Tend: +Tend.toFixed(2), vpath, log };
}
