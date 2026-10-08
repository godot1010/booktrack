// 북트랙 책 정보 서버: /api/book?isbn=9788936434120
// 서비스 키는 코드에 넣지 않고 Cloudflare 환경변수에서 읽는다.
//   KAKAO_REST_API_KEY : 카카오 책 검색 (제목, 지은이, 표지, 소개)
//   NL_CERT_KEY        : 국립중앙도서관 ISBN 서지정보 (책 종류 = 도서관 분류 번호 KDC). 없으면 건너뛴다.
// 같은 ISBN은 30일 동안 저장해 두고 다시 쓴다(성공한 결과만).

const CACHE_DAYS = 30;
const TIMEOUT_MS = 8000;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const isbn = String(url.searchParams.get("isbn") || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (!/^(\d{13}|\d{9}[\dX])$/.test(isbn)) return json({ error: "bad_isbn" }, 400);
  if (!env.KAKAO_REST_API_KEY && !env.NL_CERT_KEY) return json({ error: "no_key" }, 500);

  // ?check=1 : 저장본을 건너뛰고 국립중앙도서관 연결 상태도 함께 알려 준다(점검용)
  const check = url.searchParams.get("check") === "1";
  const cacheKey = new Request(`https://booktrack-cache/book/${isbn}?v=3`);
  const cache = caches.default;
  const hit = check ? null : await cache.match(cacheKey);
  if (hit) return withHeader(hit, "x-booktrack-cache", "HIT");

  const [kakao, nl] = await Promise.all([
    env.KAKAO_REST_API_KEY ? fromKakao(isbn, env.KAKAO_REST_API_KEY) : null,
    env.NL_CERT_KEY ? fromNL(isbn, env.NL_CERT_KEY) : null,
  ]);
  if (kakao?.failed && (!env.NL_CERT_KEY || nl?.failed)) return json({ error: "upstream", detail: kakao.failed }, 502);

  const k = kakao && !kakao.failed ? kakao : null;
  const n = nl && !nl.failed && !nl.empty ? nl : null;
  if (!k && !n) return json({ error: "not_found" }, 404);

  const book = {
    isbn,
    title: k?.title || n?.title || "",
    author: k?.author || n?.author || "",
    publisher: k?.publisher || n?.publisher || "",
    cover: k?.cover || n?.cover || "",
    summary: k?.summary || "",
    genre: n?.genre || "",
    sources: [k && "kakao", n && "nl"].filter(Boolean),
  };
  if (!book.title) return json({ error: "not_found" }, 404);
  if (check && env.NL_CERT_KEY) {
    // 점검: 빠른 소장자료 검색 주소가 어떤 항목을 주는지 본다 (항목 이름과 앞부분 값만)
    try {
      const q = new URLSearchParams({ key: env.NL_CERT_KEY, apiType: "json", srchTarget: "total", kwd: isbn, pageNum: "1", pageSize: "1" });
      const t0 = Date.now();
      const r = await fetchWithTimeout(`https://www.nl.go.kr/NL/search/openApi/search.do?${q}`);
      const text = (await r.text()).replaceAll(env.NL_CERT_KEY, "***");
      let first = null;
      try { const j = JSON.parse(text); first = (j.result || j.docs || [])[0] || j; } catch {}
      book.nlSearch = { ms: Date.now() - t0, status: r.status, first: first ? Object.fromEntries(Object.entries(first).map(([k, v]) => [k, String(v).slice(0, 40)])) : text.slice(0, 300) };
    } catch (e) { book.nlSearch = { failed: e.name }; }
  }
  if (check) return json({ ...book, nl:!env.NL_CERT_KEY ? "no key" : nl?.failed || (nl?.empty ? `empty (total ${nl.total})` : nl ? "ok" : "null") });

  const res = json(book, 200, { "cache-control": `public, max-age=${CACHE_DAYS * 86400}` });
  waitUntil(cache.put(cacheKey, res.clone()));
  return withHeader(res, "x-booktrack-cache", "MISS");
}

// ── 카카오 책 검색
async function fromKakao(isbn, key) {
  try {
    const r = await fetchWithTimeout(`https://dapi.kakao.com/v3/search/book?target=isbn&size=1&query=${isbn}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!r.ok) return { failed: `kakao ${r.status}` };
    const d = (await r.json()).documents?.[0];
    if (!d) return null;
    return {
      title: clean(d.title),
      author: (d.authors || []).map(clean).filter(Boolean).join(", "),
      publisher: clean(d.publisher),
      cover: d.thumbnail ? d.thumbnail.replace(/^http:/, "https:") : "",
      summary: trimmed(clean(d.contents)),
    };
  } catch (e) {
    return { failed: `kakao ${e.name}` };
  }
}

// ── 국립중앙도서관 ISBN 서지정보
async function fromNL(isbn, key) {
  try {
    const q = new URLSearchParams({ cert_key: key, result_style: "json", page_no: "1", page_size: "1", isbn });
    const r = await fetchWithTimeout(`https://www.nl.go.kr/seoji/SearchApi.do?${q}`);
    if (!r.ok) return { failed: `nl ${r.status}` };
    const text = await r.text();
    let data;
    // 키가 잘못됐거나 승인 전이면 JSON 대신 안내 글이 온다 → 원인을 알 수 있게 앞부분만 남긴다(키는 가림)
    try { data = JSON.parse(text); } catch { return { failed: "nl not json: " + text.replaceAll(key, "***").replace(/\s+/g, " ").slice(0, 160) }; }
    const d = data.docs?.[0];
    if (!d) return { empty: true, total: data.TOTAL_COUNT ?? data.total_count ?? null };
    return {
      title: clean(d.TITLE),
      author: clean(d.AUTHOR),
      publisher: clean(d.PUBLISHER),
      cover: d.TITLE_URL ? String(d.TITLE_URL).replace(/^http:/, "https:") : "",
      genre: genreFrom(d.KDC, d.EA_ADD_CODE),
    };
  } catch (e) {
    return { failed: `nl ${e.name}` };
  }
}

// 책 종류 정하기
// 1) KDC(도서관 분류 번호, 예: "813.7")가 있으면 그걸 쓴다.
// 2) 없으면 ISBN 부가기호(5자리)의 뒤 세 자리를 쓴다. 첫 자리 7 = 아동.
// 문학(8xx)은 셋째 자리가 형식: 1 시, 3 소설, 4·6 수필.
// 부가기호는 소설·시 모두 "810"처럼 뭉뚱그린 경우가 많아서, 구분이 안 되면 빈칸(사용자가 고름)으로 둔다.
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

// 카카오 책 소개는 중간에 잘려서 오므로, 문장이 안 끝났으면 말줄임표를 붙인다
function trimmed(s) {
  return s && !/[.!?。"'”’」』)]$/.test(s) ? s + "…" : s;
}

function clean(s) {
  return String(s || "").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithTimeout(url, init = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: ctl.signal }); }
  finally { clearTimeout(t); }
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function withHeader(res, k, v) {
  const r = new Response(res.body, res);
  r.headers.set(k, v);
  return r;
}
