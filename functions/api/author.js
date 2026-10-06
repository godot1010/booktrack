// 북트랙 작가 소개 서버: /api/author?name=한강
// 한국어 위키백과에서 작가 문서를 찾아 첫 부분 요약을 돌려준다. 키가 필요 없다.
// 같은 이름이 강·지명·다른 사람일 수 있어서(예: '한강'), 요약에 작가·시인 같은 말이 있는 문서만 쓴다.
// 동명이인(예: 시인 유홍준 / 미술사학자 유홍준)을 가리려고 책 제목(title)이 문서 본문에 나오는 사람을 먼저 고른다.
// 제목으로 못 가리면, 작가로 보이는 사람이 딱 한 명일 때만 쓴다.
// 못 찾으면 404 → 앱은 작가 소개 칸을 숨기고, 형이 직접 쓸 수 있게 둔다. AI가 소개를 지어내지 않는다.

const UA = "BookTrack/1.0 (https://booktrack.pages.dev; personal reading log)";
const WRITER = /(작가|소설가|시인|수필가|저술가|문인|번역가|극작가|아동문학가|동화|평론가|칼럼니스트|저자|철학자|학자|교수|기자|만화가|일러스트레이터|에세이스트)/;
const TIMEOUT_MS = 8000;

export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  // 여러 명이면 첫 번째 사람만, 괄호 속 역할 표시는 지운다
  const name = String(url.searchParams.get("name") || "").split(/[,·]/)[0].replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  if (!name || name.length > 40) return json({ error: "bad_name" }, 400);
  // 부제목과 끝의 권 번호('… 1', '… 2권')는 빼고 비교한다
  const book = squash(String(url.searchParams.get("title") || "").split(/[:(\-–—]/)[0].replace(/\s+\d+\s*권?\s*$/, ""));

  const cacheKey = new Request(`https://booktrack-cache/author/${encodeURIComponent(name)}/${encodeURIComponent(book)}?v=2`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let found = null;
  try { found = await findWriter(name, book); }
  catch (e) { return json({ error: "upstream", detail: e.name }, 502); }

  const res = found
    ? json({ name, ...found, source: "위키백과" }, 200, { "cache-control": "public, max-age=2592000" })
    : json({ error: "not_found" }, 404, { "cache-control": "public, max-age=604800" });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function findWriter(name, book) {
  const q = new URLSearchParams({ action: "query", list: "search", srsearch: name, srlimit: "10", format: "json", origin: "*" });
  const r = await get(`https://ko.wikipedia.org/w/api.php?${q}`);
  const titles = ((await r.json()).query?.search || []).map(s => s.title)
    .filter(t => t === name || t.startsWith(`${name} (`));
  // '이름 (작가)'처럼 괄호에 직업이 붙은 문서를 먼저 본다
  titles.sort((a, b) => score(b) - score(a));

  // 1) 작가로 보이는 문서만 모은다
  const writers = [];
  for (const title of titles.slice(0, 5)) {
    const s = await get(`https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!s.ok) continue;
    const d = await s.json();
    if (d.type === "disambiguation" || !d.extract) continue;
    if (!WRITER.test(`${d.description || ""} ${d.extract.slice(0, 200)}`)) continue;
    writers.push({ title, bio: shorten(d.extract), url: d.content_urls?.mobile?.page || d.content_urls?.desktop?.page || "" });
  }
  if (!writers.length) return null;

  // 2) 책 제목이 본문에 나오는 사람
  if (book.length >= 2) {
    for (const w of writers) {
      const q2 = new URLSearchParams({ action: "query", prop: "extracts", explaintext: "1", titles: w.title, format: "json", origin: "*" });
      const pages = (await (await get(`https://ko.wikipedia.org/w/api.php?${q2}`)).json()).query?.pages || {};
      const text = squash(Object.values(pages)[0]?.extract || "");
      if (text.includes(book)) return { bio: w.bio, url: w.url, match: "title" };
    }
  }
  // 3) 제목으로 못 가렸으면, 작가가 한 명뿐일 때만
  return writers.length === 1 ? { bio: writers[0].bio, url: writers[0].url, match: "only" } : null;
}

// 띄어쓰기·문장부호를 빼고 비교한다
function squash(s) { return String(s || "").replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase(); }

const score = t => (WRITER.test(t) ? 2 : 0) + (t.includes("(") ? 0 : 1);

// 앞에서부터 문장 단위로 300자 안쪽까지만
function shorten(text) {
  const sentences = String(text).replace(/\s+/g, " ").trim().match(/[^.!?。]+[.!?。]?/g) || [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 300) break;
    out += s;
  }
  return (out || String(text).slice(0, 300)).trim();
}

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, signal: ctl.signal });
    if (r.status >= 500) throw new Error("wiki " + r.status);
    return r;
  } finally { clearTimeout(t); }
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
