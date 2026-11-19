// Book Track 인기 도서 서버: /api/popular?period=week|month
// 1순위: 예스24 베스트셀러(국내도서 종합, 주간/월간) 20권 — 공식 열쇠(API)가 없어서 순위 페이지를 읽어 온다(robots.txt는 허용).
//        수험서·문제집·세트는 거르고, ISBN은 카카오 책 검색으로 채운다. 하루 몇 번만 읽도록 6시간 저장.
// 2순위(예스24가 막히거나 모양이 바뀌어 실패하면): 도서관 정보나루(국립중앙도서관)의 '인기대출도서' 20권.
// 키는 코드에 넣지 않고 Cloudflare 환경변수 LIBRARY_API_KEY에서 읽는다.
// 도서관 대출 자료는 며칠~몇 주 늦게 모이므로, 최근 기간에 자료가 없으면 한 칸씩 앞 기간으로 물러나며 찾는다.
// 결과는 6시간 저장해서 모든 사용자에게 나눠 준다 → 정보나루 호출은 하루 몇 번뿐(하루 500건 한도와 거리가 멀다).

const CACHE_HOURS = 6;
const TIMEOUT_MS = 10000;
const SIZE = 20;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") === "month" ? "month" : "week";
  const today = kstDate(new Date());
  const cacheKey = new Request(`https://booktrack-cache/popular/${period}/${today}?v=3`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  // 예스24 베스트셀러 먼저 (check=1 이면 저장본을 건너뛰고 원인도 알려 줌)
  let yesErr = "";
  try {
    const items = await fetchYes24(period, env);
    if (items.length >= 10) {
      const res = json({ period, items, source: "예스24 베스트셀러", kind: "bestseller", start: "", end: today }, 200, { "cache-control": `public, max-age=${CACHE_HOURS * 3600}` });
      waitUntil(cache.put(cacheKey, res.clone()));
      return res;
    }
    yesErr = "too_few:" + items.length;
  } catch (e) { yesErr = String(e.message || e.name); }
  if (url.searchParams.get("check")) console.log("yes24 fail", yesErr);

  if (!env.LIBRARY_API_KEY) return json({ error: "no_key", yes24: yesErr }, 500);
  const days = period === "month" ? 30 : 7;
  let found = null, last = null;
  try {
    // 어제까지 기간부터 시작해서, 비어 있으면 최대 6번 앞 기간으로
    for (let step = 0; step < 6 && !found; step++) {
      const end = addDays(today, -1 - step * days);
      const start = addDays(end, -(days - 1));
      const items = await fetchPopular(env.LIBRARY_API_KEY, start, end);
      last = { start, end };
      if (items.length >= 5) found = { start, end, items };
    }
  } catch (e) {
    return json({ error: "upstream", detail: String(e.message || e.name) }, 502);
  }
  if (!found) return json({ error: "not_found", tried: last }, 404);

  const res = json({ period, ...found, source: "도서관 정보나루", kind: "loan" }, 200, { "cache-control": `public, max-age=${CACHE_HOURS * 3600}` });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

// ── 예스24 베스트셀러 ──
const YES_PATH = { week: "weekbestseller", month: "monthbestseller" };
const NOT_BOOKS = /모의고사|기출|능력검정|검정시험|수능|문제집|자격증|공무원|기본서|세트|대본집|굿즈|\[세트\]|워크북|학습만화|특전|핸드북|NCS|토익|TOEIC/i;

async function fetchYes24(period, env) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let html;
  try {
    const r = await fetch(`https://www.yes24.com/product/category/${YES_PATH[period]}?categoryNumber=001&pageNumber=1&pageSize=40`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; Book612/1.0; +https://booktrack.pages.dev)", "accept-language": "ko-KR,ko;q=0.9" },
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`yes24 ${r.status}`);
    html = await r.text();
  } finally { clearTimeout(t); }

  const blocks = html.split('data-goods-no="').slice(1);
  const seen = new Set();
  const items = [];
  for (const b of blocks) {
    const id = b.slice(0, b.indexOf('"'));
    const name = (b.match(/class="gd_name"[^>]*>([\s\S]*?)<\/a>/) || [])[1];
    if (!/^\d+$/.test(id) || !name) continue;
    const rawTitle = decodeEntities(clean(name));
    if (NOT_BOOKS.test(rawTitle)) continue;
    const title = cleanTitle(rawTitle.replace(/\s*\([^)]*\)\s*$/, ""));
    const key = title.replace(/\s/g, "");
    if (!title || seen.has(key)) continue;
    seen.add(key);
    const authBlock = (b.match(/class="authPub info_auth"[\s\S]*?<\/span>/) || [""])[0];
    const firstAuthor = (authBlock.match(/<a [^>]*>([^<]+)<\/a>/) || [])[1] || "";
    const pub = (b.match(/info_pub"[^>]*>\s*<a[^>]*>([^<]*)<\/a>/) || [])[1] || "";
    const date = (b.match(/info_date">(\d{4})년/) || [])[1] || "";
    items.push({
      title, author: decodeEntities(clean(firstAuthor)), publisher: decodeEntities(clean(pub)), year: date,
      isbn: "", cover: `https://image.yes24.com/goods/${id}/L`, genre: "",
    });
    if (items.length >= SIZE) break;
  }
  // 카카오 책 검색으로 ISBN·종류 힌트를 채운다(못 찾으면 비워 둠 → 담을 때 제목으로 처리)
  if (env.KAKAO_REST_API_KEY) await Promise.all(items.map(it => fillIsbn(it, env.KAKAO_REST_API_KEY).catch(() => {})));
  return items.map((it, i) => ({ rank: i + 1, ...it }));
}

async function fillIsbn(it, key) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 5000);
  try {
    const q = encodeURIComponent(`${it.title} ${it.author}`.trim());
    const r = await fetch(`https://dapi.kakao.com/v3/search/book?size=5&query=${q}`, { headers: { Authorization: `KakaoAK ${key}` }, signal: ctl.signal });
    if (!r.ok) return;
    const norm = s => String(s || "").replace(/[\s:·,.\-!?'"()\[\]~]/g, "");
    const want = norm(it.title);
    const docs = (await r.json()).documents || [];
    const d = docs.find(x => { const n = norm(clean(x.title)); return n && (n.startsWith(want) || want.startsWith(n)); });
    if (!d) return;
    const isbn = String(d.isbn || "").split(/\s+/).find(x => /^\d{13}$/.test(x));
    if (isbn) it.isbn = isbn;
  } finally { clearTimeout(t); }
}

function decodeEntities(s) {
  return String(s || "").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");
}

async function fetchPopular(key, start, end) {
  const q = new URLSearchParams({ authKey: key, startDt: start, endDt: end, pageNo: "1", pageSize: "50", format: "json" });
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let r;
  try { r = await fetch(`http://data4library.kr/api/loanItemSrch?${q}`, { signal: ctl.signal }); }
  finally { clearTimeout(t); }
  if (!r.ok) throw new Error(`library ${r.status}`);
  const data = await r.json();
  if (data?.response?.error) throw new Error(`library ${data.response.error}`);
  const docs = data?.response?.docs || [];
  const seen = new Set();
  return docs.map(x => x.doc || x).filter(d => d && d.bookname).map(d => ({
    title: cleanTitle(d.bookname),
    author: cleanAuthor(d.authors),
    publisher: clean(d.publisher),
    year: clean(d.publication_year),
    isbn: String(d.isbn13 || "").replace(/\D/g, ""),
    cover: d.bookImageURL ? String(d.bookImageURL).replace(/^http:/, "https:") : "",
    loans: Number(d.loan_count) || 0,
    genre: genreFrom(d.class_no, d.addition_symbol),
  }))
  // 같은 책의 여러 권(예: 『흔한남매』 1~20권)이 순위를 다 차지하지 않게, 제목이 같으면 한 번만 둔다
  .filter(it => { const k = it.title.replace(/\s/g, ""); if (seen.has(k)) return false; seen.add(k); return true; })
  .slice(0, SIZE)
  .map((it, i) => ({ rank: i + 1, ...it }));
}

// '안녕이라 그랬어 :김애란 소설' → '안녕이라 그랬어'
function cleanTitle(s) {
  return clean(String(s || "").split(/\s*[:=]\s*/)[0]) || clean(s);
}

// '지은이: 한강 ; 옮긴이: 홍길동' → '한강', '앤디 위어 지음' → '앤디 위어', '한로로 (HANRORO) (지은이)' → '한로로'
function cleanAuthor(s) {
  return clean(String(s || "").split(/[;,]/)[0])
    .replace(/^(지은이|글쓴이|글|저자|저|지음|엮은이|편저|원작|글·그림|글\/그림)\s*:\s*/, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+(지음|저|글|엮음|편저|글·그림|원작)$/, "")
    .trim();
}

function clean(s) {
  return String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// 책 종류: KDC(예 813.7) → 소설/시/수필 등. book.js와 같은 규칙.
function genreFrom(kdcRaw, addCode) {
  const add = String(addCode || "").replace(/\D/g, "");
  if (add.length === 5 && add[0] === "7") return "어린이";
  const kdc = String(kdcRaw || "").replace(/[^0-9]/g, "").slice(0, 3) || (add.length === 5 ? add.slice(2) : "");
  if (kdc.length < 3) return "";
  if (kdc.startsWith("657")) return "만화";
  if (kdc[0] === "8") return { "1": "시", "3": "소설", "4": "수필", "6": "수필" }[kdc[2]] || "";
  if (kdc.startsWith("199") || kdc.startsWith("325")) return "자기계발";
  if ("0129".includes(kdc[0]) || kdc[0] === "3") return "인문";
  return "";
}

// 한국 날짜(YYYY-MM-DD)
function kstDate(d) { return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); }
function addDays(ymd, n) { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
