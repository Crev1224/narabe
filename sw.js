// 保存しておくファイルの名札(アプリを更新したら、この番号を増やします)
const CACHE_NAME = "nanarabe-counter-v4";

// iPhoneに保存しておくファイルの一覧
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// インストール時:ファイルをまとめて保存する
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // cache: "reload" は「手元に古い写しがあっても使わず、ネットから最新を取る」という指定
      return cache.addAll(
        FILES.map(function (url) {
          return new Request(url, { cache: "reload" });
        })
      );
    })
  );
  self.skipWaiting(); // 待たずにすぐ新しい版に切り替える
});

// 有効になったとき:古い版の保存ファイルを消す
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ファイルが必要になったとき:まず保存済みのものを探し、無ければネットから取る
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (saved) {
      return saved || fetch(event.request);
    })
  );
});