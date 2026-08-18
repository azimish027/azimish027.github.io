/* =====================================================================
   Service Worker — PWA 离线缓存
   仅在 https 环境由 index.html 注册，负责缓存站点静态资源，实现离线访问
   ===================================================================== */
const CACHE_NAME = 'portfolio-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

/* 安装：预缓存核心资源 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 请求拦截：优先用缓存，未命中则走网络并写入缓存 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 只处理同源 GET 请求，跨域资源（如字体、B站接口）不缓存
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        // 只缓存成功响应
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      }).catch(() => {
        // 离线且无缓存时，对导航请求回退到首页
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
