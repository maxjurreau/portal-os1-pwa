// simdata.js - local simulated telemetry & market data for Portal-OS-1
// Exposes: window.SIM_STATE, fetchLiveData(), startSimBus(), stopSimBus()
(function(){
  window.SIM_STATE = window.SIM_STATE || {
    winProbability: 68.2,
    marketSignals: {
      quantum: 94,
      simulation: 87,
      agents: 92
    },
    lastUpdated: Date.now()
  };

  function randomJitter(v, spread){
    return Math.max(0, Math.min(100, v + (Math.random() - 0.5) * spread));
  }

  async function fetchLiveData(){
    // Try local JSON first (maps/data) as a seed, then return simulated values
    try{
      const res = await fetch('/data/markets.json');
      if (res.ok){
        const j = await res.json();
        // merge signals
        if (j.signals) {
          window.SIM_STATE.marketSignals = j.signals;
        }
      }
    }catch(e){ /* ignore */ }

    // jitter the win probability and signals
    window.SIM_STATE.winProbability = randomJitter(window.SIM_STATE.winProbability, 3.5);
    Object.keys(window.SIM_STATE.marketSignals).forEach(k=>{
      window.SIM_STATE.marketSignals[k] = randomJitter(window.SIM_STATE.marketSignals[k], 4.0);
    });
    window.SIM_STATE.lastUpdated = Date.now();
    return { winProbability: window.SIM_STATE.winProbability, signals: window.SIM_STATE.marketSignals };
  }

  let _busId = null;
  function startSimBus(intervalMs = 2000){
    if(_busId) return;
    _busId = setInterval(async ()=>{
      const data = await fetchLiveData();
      // update HUD-consumers by dispatching a window event
      const ev = new CustomEvent('portal.simdata', { detail: data });
      window.dispatchEvent(ev);
      // also append to event-log if present
      const bus = document.getElementById('event-log');
      if(bus){ bus.innerText += `SIMBUS ${new Date().toLocaleTimeString()}: WP=${data.winProbability.toFixed(1)}\n`; bus.scrollTop = bus.scrollHeight; }
      // and to CLI output
      const cli = document.getElementById('cli-output');
      if(cli){ cli.innerText += `SIMBUS: WP=${data.winProbability.toFixed(1)}\n`; cli.scrollTop = cli.scrollHeight; }
    }, intervalMs);
  }

  function stopSimBus(){ if(_busId){ clearInterval(_busId); _busId = null; } }

  // Expose to global
  window.fetchLiveData = fetchLiveData;
  window.startSimBus = startSimBus;
  window.stopSimBus = stopSimBus;

  // Start bus by default in dev
  if(typeof window !== 'undefined') startSimBus(3000);
})();
