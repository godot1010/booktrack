// Book Track 책 찾기 서버: /api/search?q=소년이 온다
// 바코드가 없는 전자책·오디오북(그리고 바코드가 안 찍히는 종이책)을 제목·지은이로 찾아 등록하게 한다.
// 카카오 책 검색(KAKAO_REST_API_KEY, book.js와 같은 키)으로 최대 15권. 같은 검색어는 하루 저장.

const TIMEOUT_MS = 8000;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (q.length < 2) return json({ error: "short_query" }, 400);
  if (!env.KAKAO_REST_API_KEY) return json({ error: "no_key" }, 500);

  const cacheKey = new Request(`https://booktrack-cache/search/${encodeURIComponent(q.toLowerCase())}?v=1`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let docs;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const r = await fetch(`https://dapi.kakao.com/v3/search/book?size=15&query=${encodeURIComponent(q)}`, {
      headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` }, signal: ctl.signal,
    }).finally(() => clearTimeout(t));
    if (!r.ok) return json({ error: "upstream", detail: `kakao ${r.status}` }, 502);
    docs = (await r.json()).documents || [];
  } catch (e) {
    return json({ error: "upstream", detail: e.name }, 502);
  }

  const items = docs.filter(d => d.title).map(d => {
    const isbns = String(d.isbn || "").split(/\s+/);
    return {
      title: clean(d.title),
      author: (d.authors || []).map(clean).filter(Boolean).join(", "),
      publisher: clean(d.publisher),
      year: String(d.datetime || "").slice(0, 4),
      isbn: isbns.find(x => /^\d{13}$/.test(x)) || "",
      cover: d.thumbnail ? d.thumbnail.replace(/^http:/, "https:") : "",
      summary: trimmed(clean(d.contents)),
    };
  });

  const res = json({ q, items }, 200, { "cache-control": "public, max-age=86400" });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

// 카카오 책 소개는 중간에 잘려서 오므로, 문장이 안 끝났으면 말줄임표를 붙인다
function trimmed(s) {
  return s && !/[.!?。"'”’」』)]$/.test(s) ? s + "…" : s;
}
function clean(s) {
  return String(s || "").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });
}
