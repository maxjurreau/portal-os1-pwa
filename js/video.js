// video.js - camera + HUD starter (updated to read window.SIM_STATE)
const Video = (function(){
  let liveStream = null; let hudEnabled = true; let usingCamera = false;
  function init(){ const sim = document.getElementById('simVideo'); if(sim) sim.src = '/videos/maxsim-demo.mp4'; resizeHud(); drawHud(); }

  async function startCamera(){ try{ const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false}); const v = document.getElementById('liveVideo'); v.srcObject = stream; v.style.display='block'; document.getElementById('simVideo').style.display='none'; liveStream = stream; usingCamera = true; logCli('Camera started'); resizeHud(); }catch(e){ alert('Camera access denied'); logCli('Camera start failed'); }}
  function stopCamera(){ if(liveStream){ liveStream.getTracks().forEach(t=>t.stop()); liveStream=null; } const video = document.getElementById('liveVideo'); if(video){ video.srcObject=null; video.style.display='none'; } const sim = document.getElementById('simVideo'); if(sim) sim.style.display='block'; usingCamera=false; logCli('Camera stopped'); }
  function toggleCameraView(){ if(usingCamera) stopCamera(); else startCamera(); }

  function resizeHud(){ const c = document.getElementById('hudCanvas'); if(!c) return; const ratio = window.devicePixelRatio||1; c.width = Math.floor(c.offsetWidth*ratio); c.height = Math.floor(c.offsetHeight*ratio); c.style.width='100%'; c.style.height='100%'; const ctx = c.getContext('2d'); ctx.setTransform(ratio,0,0,ratio,0,0); }
  window.addEventListener('resize', resizeHud);

  function drawHud(){ const canvas = document.getElementById('hudCanvas'); if(!canvas) return; const ctx = canvas.getContext('2d'); if(!ctx) return; if(!hudEnabled){ ctx.clearRect(0,0,canvas.width,canvas.height); requestAnimationFrame(drawHud); return; } ctx.clearRect(0,0,canvas.width,canvas.height); ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.strokeRect(40,30,160,120); ctx.fillStyle = '#00ff88'; ctx.font = '16px monospace'; ctx.fillText('MAX-SIM ACTIVE',60,20); // read dynamic winProbability
    const wp = (window.SIM_STATE && window.SIM_STATE.winProbability) ? window.SIM_STATE.winProbability.toFixed(1) : '68.2';
    ctx.fillText('WIN PROB: '+wp+'%',60,40);
    requestAnimationFrame(drawHud);
  }

  function toggleHud(){ hudEnabled = !hudEnabled; logCli('HUD '+(hudEnabled?'on':'off')); }
  function loadView(view){ const sim = document.getElementById('simVideo'); if(!sim) return; const map = { qb:'/videos/qb.mp4', coverage:'/videos/coverage.mp4', trench:'/videos/trench.mp4' }; if(map[view]) sim.src = map[view]; sim.play(); logCli('Loaded view '+view); }
  function focusVideo(){ const el = document.getElementById('simVideo'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); }
  function logCli(t){ const out = document.getElementById('cli-output'); if(out){ out.innerText += t+'\n'; out.scrollTop = out.scrollHeight; } }
  return { init, startCamera, stopCamera, toggleCameraView, toggleHud, loadView, focusVideo };
})();
