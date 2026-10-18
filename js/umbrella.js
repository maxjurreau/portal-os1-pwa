// umbrella.js - simple draggable nodes representing Identity -> Simulation -> Narrative -> Output
const Umbrella = (function(){
  const nodes = ['IDENTITY','SIMULATION','NARRATIVE','OUTPUT'];
  function init(){ render(); }
  function render(){
    const el = document.getElementById('umbrella'); if(!el) return; el.innerHTML='';
    nodes.forEach(n=>{
      const d = document.createElement('div'); d.className='node'; d.innerText = n; d.draggable = true; d.ondragstart = e=>{ e.dataTransfer.setData('text/plain',n); };
      el.appendChild(d);
    });
    // allow simple drop ordering
    el.ondragover = e=>e.preventDefault(); el.ondrop = e=>{
      e.preventDefault(); const name = e.dataTransfer.getData('text/plain'); // move to end
      const idx = nodes.indexOf(name); if(idx>=0){ nodes.splice(idx,1); nodes.push(name); render(); }
    };
  }
  return { init };
})();
