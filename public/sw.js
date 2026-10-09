// Book612(옛 이름 서고·북트랙) 서비스 워커: 인터넷이 없어도 앱이 열리게 한다.
// HTML은 인터넷 우선(새 버전을 바로 받음), 나머지는 저장본 우선.
const CACHE = "booktrack-v7";
const CORE = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put("index.html", copy));
      return res;
    }).catch(() => caches.match("index.html")));
    return;
  }

  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    // 표지 사진(카카오, 국립중앙도서관, 순위의 알라딘 이미지)은 다른 사이트 그림이라 내용을 볼 수 없는(opaque) 응답도 저장한다
    const isCover = url.hostname.endsWith("kakaocdn.net") || url.hostname.endsWith("nl.go.kr") || url.hostname === "image.aladin.co.kr";
    if ((res.ok || (isCover && res.type === "opaque")) && (url.origin === location.origin || isCover || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com"))) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  })));
});
