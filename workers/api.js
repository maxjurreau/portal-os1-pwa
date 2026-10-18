addEventListener('fetch', event => {
  // Cloudflare Worker stub: proxy to SportsDataIO / Odds API
  event.respondWith(handle(event.request));
})

async function handle(request){
  const url = new URL(request.url);
  // example: /api/sportsdata/games
  if(url.pathname.startsWith('/api/sportsdata/')){
    // In production implement key storage and proxying
    return new Response(JSON.stringify({error:'stub - implement server-side proxy'}), {status:200, headers:{'Content-Type':'application/json'}});
  }
  return new Response('OK', {status:200});
}
