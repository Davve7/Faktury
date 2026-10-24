/* zaruky – offline cache. Pages: network first (updates arrive right away), files: cache first + refresh in background. */
const V="zaruky-20261024150000";
const CORE=["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "favicon-32.png", "favicon.ico"];
const EXT=/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/;
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(r.mode==="navigate"){
    /* GitHub Pages sends max-age=600; no-cache makes the browser revalidate so a new version shows up immediately */
    e.respondWith(fetch(r.url,{cache:"no-cache",credentials:"same-origin"}).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put("index.html",c))}return res}).catch(()=>caches.match("index.html",{ignoreSearch:true})));
    return;
  }
  if(u.origin!==location.origin&&!EXT.test(u.hostname))return;
  e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:u.origin===location.origin}).then(hit=>{
    const net=fetch(r).then(res=>{if(res.ok||res.type==="opaque")c.put(r,res.clone());return res}).catch(()=>hit||Response.error());
    return hit||net;
  })));
});
