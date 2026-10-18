// maps.js - loads map JSON and renders the Five Great Maps UI
const Maps = (function(){
  const mapNames = ['physics','compute','simulation','cognition','markets'];
  const storageKey = 'portal.maps.v1';
  let maps = {};

  async function loadAll(){
    // try load from localStorage
    const cached = localStorage.getItem(storageKey);
    if (cached) { maps = JSON.parse(cached); renderTabs(); renderList(); return; }

    // fetch default map files
    await Promise.all(mapNames.map(async name => {
      try{
        const res = await fetch('/maps/'+name+'.json');
        maps[name] = await res.json();
      } catch(e){ maps[name] = {name,description:'(missing)',widgets:[]}; }
    }));
    persist(); renderTabs(); renderList();
  }

  function persist(){ localStorage.setItem(storageKey, JSON.stringify(maps)); }

  function renderTabs(){
    const tabs = document.getElementById('mapTabs'); tabs.innerHTML='';
    Object.keys(maps).forEach(k=>{
      const btn = document.createElement('button'); btn.className='map-tab'; btn.innerText = maps[k].name.toUpperCase();
      btn.onclick = ()=> selectMap(k);
      tabs.appendChild(btn);
    });
    // mark simulation active by default
    selectMap('simulation');
  }

  function renderList(){
    const list = document.getElementById('maps-list'); if(!list) return; list.innerHTML='';
    Object.keys(maps).forEach(k=>{
      const m = maps[k];
      const el = document.createElement('div'); el.style.padding='6px'; el.style.borderBottom='1px solid rgba(255,255,255,0.02)'; el.innerHTML = `<strong>${m.name}</strong><div style="font-size:12px;color:#9ab">${m.description}</div>`;
      list.appendChild(el);
    });
  }

  function selectMap(name){
    const container = document.getElementById('maps-container');
    if (!container) return;
    // set active tab
    document.querySelectorAll('.map-tab').forEach(b=>b.classList.remove('active'));
    const btns = Array.from(document.querySelectorAll('.map-tab')).filter(b=>b.innerText.toLowerCase()===name);
    if(btns[0]) btns[0].classList.add('active');

    const m = maps[name];
    container.innerHTML = `<div><h3 style=\"margin:0 0 8px 0\">${m.name.toUpperCase()}</h3><div style=\"font-size:13px;color:#9ab;margin-bottom:10px\">${m.description}</div></div>`;
    const widgets = document.createElement('div'); widgets.style.display='grid'; widgets.style.gridTemplateColumns='repeat(auto-fit,minmax(140px,1fr))'; widgets.style.gap='8px';
    m.widgets.forEach(w=>{
      const wEl = document.createElement('div'); wEl.className='card'; wEl.style.padding='8px'; wEl.innerHTML = `<strong>${w.label}</strong><div style=\"font-size:12px;color:#9ab;margin-top:6px\">Placeholder widget for ${w.id}</div>`;
      widgets.appendChild(wEl);
    });
    container.appendChild(widgets);
  }

  function exportMaps(){ const data = JSON.stringify(maps,null,2); const blob = new Blob([data],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='portal-maps-export.json'; document.body.appendChild(a); a.click(); a.remove(); }
  function importMaps(){ const input = document.createElement('input'); input.type='file'; input.accept='application/json'; input.onchange = e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{ try{ maps = JSON.parse(ev.target.result); persist(); renderTabs(); renderList(); }catch(err){ alert('Invalid file'); } }; r.readAsText(f); }; input.click(); }

  return { init:loadAll, selectMap, exportMaps, importMaps };
})();
