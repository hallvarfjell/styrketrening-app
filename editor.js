
const Editor = {
  render(existing=null){
    const w = existing || { workout_id:`WK${Date.now()}`, name:'', category:'Styrke/Spenst', focus_area:'Hele kroppen', favorite:false, pause_between_items_sec:10, items:[] };
    render(`
      <div class=grid-2>
        <div>
          <div class=card>
            <h3>Filter øvelser</h3>
            <div class=flex>
              <select id=fFocus class=input><option value="">Alle</option><option>Overkropp</option><option>Underkropp</option><option>Hele kroppen</option></select>
              <select id=fCat class=input><option value="">Alle</option><option>Styrke/Spenst</option><option>Balanse/Stabilisering</option><option>Mobilitet/Tøying</option></select>
            </div>
            <div id=exlist></div>
          </div>
        </div>
        <div>
          <div class=card>
            <h3>Bygg økt</h3>
            <input id=name class=input placeholder="Øktnavn" value="${w.name}" />
            <div class=flex>
              <select id=cat class=input><option>Styrke/Spenst</option><option>Balanse/Stabilisering</option><option>Mobilitet/Tøying</option></select>
              <select id=focus class=input><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div id=items></div>
            <div class=flex><button class=button id=save>Lagre økt</button></div>
          </div>
        </div>
      </div>
    `);
    document.getElementById('cat').value=w.category; document.getElementById('focus').value=w.focus_area;
    function renderExercises(){
      const fFocus=document.getElementById('fFocus').value; const fCat=document.getElementById('fCat').value; let list=AppState.exercises.slice(); if(fFocus) list=list.filter(e=>e.focus_area===fFocus); if(fCat) list=list.filter(e=>e.category===fCat);
      const html=list.map(e=>`<div class=card><div><strong>${e.name}</strong> <span class=small>${e.category} • ${e.focus_area}</span></div><div class=small>${e.description}</div><button class=button data-add=${e.exercise_id}>Legg til (01:00)</button></div>`).join('');
      document.getElementById('exlist').innerHTML= html || '<div class=card small>Ingen øvelser. Importer i Øktvelger.</div>';
      document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{ w.items.push({exercise_id:b.dataset.add, duration_sec:60}); renderItems(); });
    }
    function renderItems(){
      const html=(w.items||[]).map((it,idx)=>{ const e=AppState.exercises.find(x=>x.exercise_id===it.exercise_id); const name=e?e.name:it.exercise_id; return `<div class=card><div><strong>${name}</strong></div><div class=flex><input class=input value=${Util.fmtMMSS(it.duration_sec)} data-dur=${idx} /><button class="button secondary" data-up=${idx}>▲</button><button class="button secondary" data-down=${idx}>▼</button><button class="button secondary" data-del=${idx}>Fjern</button></div></div>`; }).join('');
      document.getElementById('items').innerHTML = html || '<div class=card small>Ingen øvelser i økta ennå.</div>';
      document.querySelectorAll('[data-dur]').forEach(inp=>inp.onchange=()=>{ const i=Number(inp.dataset.dur); w.items[i].duration_sec = Util.parseMMSS(inp.value); });
      document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{ const i=Number(b.dataset.up); if(i>0){ const t=w.items[i]; w.items.splice(i,1); w.items.splice(i-1,0,t); renderItems(); }});
      document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{ const i=Number(b.dataset.down); if(i<w.items.length-1){ const t=w.items[i]; w.items.splice(i,1); w.items.splice(i+1,0,t); renderItems(); }});
      document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const i=Number(b.dataset.del); w.items.splice(i,1); renderItems(); });
    }
    renderExercises(); renderItems(); document.getElementById('fFocus').onchange=renderExercises; document.getElementById('fCat').onchange=renderExercises;
    document.getElementById('save').onclick=()=>{
      w.name=document.getElementById('name').value||'Ny økt'; w.category=document.getElementById('cat').value; w.focus_area=document.getElementById('focus').value;
      const equipSet=new Set(); let rpeSum=0, rpeCount=0; const noiseLevels={Low:1,Medium:2,High:3}; let noiseMax=1;
      (w.items||[]).forEach(it=>{ const e=AppState.exercises.find(x=>x.exercise_id===it.exercise_id); if(e){ (e.equipment||[]).forEach(eq=>equipSet.add(eq)); rpeSum+= (e.rpe||5); rpeCount++; noiseMax=Math.max(noiseMax, noiseLevels[e.noise_level||'Low']||1); }});
      w.computed = { total_time_sec:(w.items||[]).reduce((a,b)=>a+b.duration_sec,0)+((w.items||[]).length-1)*w.pause_between_items_sec, equipment:Array.from(equipSet), noise_level: noiseMax===3?'High':(noiseMax===2?'Medium':'Low'), rpe_avg: rpeCount? (rpeSum/rpeCount):5 };
      const idx=AppState.workouts.findIndex(x=>x.workout_id===w.workout_id); if(idx>=0) AppState.workouts[idx]=w; else AppState.workouts.push(w);
      Store.save(Store.keys.workouts, AppState.workouts); alert('Økt lagret.'); Library.render(); setActive('library');
    };
  }
};
window.Editor=Editor;
