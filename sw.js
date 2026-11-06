const VERSION = '8628ee9c3dc8';
const PREFIX = 'haohaomai-shell-';
const CACHE = PREFIX + VERSION;
const ASSETS = [["app.js","2d99e58bb647420608fe2ff1d62b921f6968d9a16b11f914978dc61fc33af473"],["db.js","1b54cf6ca667bb9970c4e15a641ae17d2dccccf24ba3b228006d15ddf4f16c1d"],["index.html","d85fc34696f1e2475956f999c0586ce91dc5676ce471bde20da1d011229775af"],["manifest.webmanifest","3ced3abf02e82a0d7925e5a7dcb0a161148e56b8ec2a50ba888a465e133a5ed0"],["memo-ui.js","a883fd7a2de749f51b2a764accfbaafb6c922062a3d3034732fe7977a8c8b86b"],["memos.js","33710f368e929abf5fc71e611d4416024edfabf761ed0b6415bb4657ff47a4a1"],["purchases.js","707a4359745ae7b404cd976077e9db0deb1a72807c2cd1ef14d9413c120421ce"],["style.css","a2a855fb267766246984514181ff5900b9980e096c04cdee84a6b2fea347ad98"],["assets/Noto-Sans-TC-OFL.txt","1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9"],["assets/Zen-Maru-Gothic-OFL.txt","2a20cf7ce1909d8ee1e949095d340f7d7656705f7c810a2d6faf56800ad0cb3d"],["assets/basket.svg","b7ebc5ce2c3016811826f512a9faf11ec3ddda3f7363b18d5d4fdb91dc25b894"],["assets/favicon-v2.ico","1b66a148c82a7f2516c95a1e21536d06e78ada455fa8f2560b310d374a463d29"],["assets/icon-v2-180.png","4837d0ab34b6883e61b615f4e941f385f8cc24c98a8a32e85eb612f14af5cc20"],["assets/icon-v2-192.png","66aa8a5fea1556fc8d554fbd14ed4faa100107841226e6fae3048e4c3f711c9c"],["assets/icon-v2-32.png","3a77c89958997187e750aed2de521968080f9f43ab482ec2f02a2bea61a2221b"],["assets/icon-v2-512.png","73a1c1ac938888e1c82e36e6953b9094fdde9b91063d1925dcf711a49f2b2f84"],["assets/icon-v2-maskable-512.png","f9a8ee59fb8acf03ebc92da62e08b42cbe4598f717e55677b25f504050206388"],["assets/noto-sans-tc.ttf","619662a0583f38311e92666927e5edbfd30f2a1fbe8593685660bd11bdd46a10"],["assets/zen-maru.ttf","fea6d7937b375090353e9df58987b784bb807ca8aa2e28d9c0c018f13ee21221"],["apple-touch-icon.png","4837d0ab34b6883e61b615f4e941f385f8cc24c98a8a32e85eb612f14af5cc20"]];
const root = new URL('./', self.location.href);
self.addEventListener('install', event => {
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try {
   for(const [path,hash] of ASSETS){
    const url=new URL(path,root),res=await fetch(url,{cache:'reload',credentials:'same-origin'});
    if(!res.ok||res.redirected)throw Error('Incomplete shell');
    const mime=res.headers.get('Content-Type')||'';
    if(path.endsWith('.html')&&!mime.includes('text/html'))throw Error('Wrong HTML MIME');
    if(path.endsWith('.js')&&!/(javascript|ecmascript)/.test(mime))throw Error('Wrong JS MIME');
    const bytes=await res.clone().arrayBuffer();
    const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(actual!==hash)throw Error('Asset integrity mismatch');
    await cache.put(url,res);
   }
  } catch(e) {await caches.delete(CACHE);throw e;}
 })());
 // A waiting update activates only after all existing app windows are closed.
 // No skipWaiting, forced reload, or user-data deletion.
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;
 const path=url.pathname.slice(root.pathname.length);
 if(event.request.mode==='navigate'&&(path===''||path==='index.html')){
  event.respondWith(caches.open(CACHE).then(async c=>(await c.match(new URL('index.html',root)))||fetch(event.request)));return;
 }
 if(ASSETS.some(([p])=>p===path))event.respondWith(caches.open(CACHE).then(async c=>(await c.match(new URL(path,root)))||fetch(event.request)));
});
