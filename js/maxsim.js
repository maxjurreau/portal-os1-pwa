// maxsim.js - starter MAX-SIM engine and console command handling
const MAXSIM = (function(){
  function init(){ /* placeholder */ }
  function runSim(iterations){
    logEvent('[MAX-SIM] Running '+iterations+' iterations');
    // fake processing loop
    let progress = 0; const id = setInterval(()=>{
      progress += Math.min(10, iterations/20);
      logEvent('[MAX-SIM] progress '+Math.floor(progress)+'/'+iterations);
      if(progress>=iterations){ clearInterval(id); logEvent('[MAX-SIM] complete'); }
    },200);
  }
  function handleCommand(cmd){
    const c = cmd.trim().toLowerCase();
    if(c.startsWith('map ')){
      const name = c.split(' ')[1]; Maps.selectMap(name);
    } else if(c.startsWith('run sim')){
      const parts = c.split(' '); const it = parseInt(parts[2]||'1000',10); runSim(it);
    } else if(c==='status'){
      logEvent('[MAX-SIM] status nominal');
    } else if(c==='camera on'){
      Video.startCamera();
    } else if(c==='camera off'){
      Video.stopCamera();
    } else if(c==='risk audit'){
      logEvent('[RISK] Audit OK');
    } else {
      logEvent('[MAX-SIM] unknown command: '+cmd);
    }
  }
  function logEvent(txt){ const el = document.getElementById('event-log'); if(el){ el.innerText += txt+'\n'; el.scrollTop = el.scrollHeight; } document.getElementById('cli-output').innerText += txt+'\n'; }
  return { init, runSim, handleCommand };
})();
