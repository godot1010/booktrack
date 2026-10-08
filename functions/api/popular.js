// Book Track 인기 도서 서버: /api/popular?period=week|month
// 도서관 정보나루(국립중앙도서관)의 '인기대출도서'로 전국 공공도서관에서 많이 빌린 책 20권을 돌려준다.
// 키는 코드에 넣지 않고 Cloudflare 환경변수 LIBRARY_API_KEY에서 읽는다.
// 도서관 대출 자료는 며칠~몇 주 늦게 모이므로, 최근 기간에 자료가 없으면 한 칸씩 앞 기간으로 물러나며 찾는다.
// 결과는 6시간 저장해서 모든 사용자에게 나눠 준다 → 정보나루 호출은 하루 몇 번뿐(하루 500건 한도와 거리가 멀다).

const CACHE_HOURS = 6;
const TIMEOUT_MS = 10000;
const SIZE = 20;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") === "month" ? "month" : "week";
  if (!env.LIBRARY_API_KEY) return json({ error: "no_key" }, 500);

  const today = kstDate(new Date());
  const cacheKey = new Request(`https://booktrack-cache/popular/${period}/${today}?v=1`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

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

  const res = json({ period, ...found, source: "도서관 정보나루" }, 200, { "cache-control": `public, max-age=${CACHE_HOURS * 3600}` });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function fetchPopular(key, start, end) {
  const q = new URLSearchParams({ authKey: key, startDt: start, endDt: end, pageNo: "1", pageSize: String(SIZE), format: "json" });
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let r;
  try { r = await fetch(`http://data4library.kr/api/loanItemSrch?${q}`, { signal: ctl.signal }); }
  finally { clearTimeout(t); }
  if (!r.ok) throw new Error(`library ${r.status}`);
  const data = await r.json();
  if (data?.response?.error) throw new Error(`library ${data.response.error}`);
  const docs = data?.response?.docs || [];
  return docs.map(x => x.doc || x).filter(d => d && d.bookname).map((d, i) => ({
    rank: Number(d.ranking) || i + 1,
    title: clean(d.bookname),
    author: cleanAuthor(d.authors),
    publisher: clean(d.publisher),
    year: clean(d.publication_year),
    isbn: String(d.isbn13 || "").replace(/\D/g, ""),
    cover: d.bookImageURL ? String(d.bookImageURL).replace(/^http:/, "https:") : "",
    loans: Number(d.loan_count) || 0,
    genre: genreFrom(d.class_no, d.addition_symbol),
  }));
}

// '지은이: 한강 ; 옮긴이: 홍길동' → '한강'
function cleanAuthor(s) {
  return clean(String(s || "").split(/[;]/)[0]).replace(/^(지은이|글쓴이|글|저자|저|지음|엮은이|편저|글·그림|글\/그림)\s*:\s*/, "").trim();
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
