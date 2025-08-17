const CACHE='kids-pro-prod-v1';
const ASSETS=['./','./index.html','./styles.css','./game.js','./manifest.webmanifest','./icons/logo.png',
'./audio/bg_menu.wav','./audio/bg_game.wav','./audio/click.wav','./audio/coin.wav','./audio/yay.wav','./audio/error.wav','./audio/switch.wav'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k))))) });
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))) });
