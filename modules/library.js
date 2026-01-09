
const Library = {
  render(){
    render(`
      <div class=card>
        <h2>Importer øvelser (CSV) og økter (CSV)</h2>
        <div class=flex>
          <div style="flex:1">
            <input type=file id=excsv accept=.csv />
            <div class=small>Kolonner (øvelser): exercise_id,name,description,progression_tips,default_duration_sec,rpe,category,focus_area,equipment,noise_level</div>
          </div>
          <div style="flex:1">
            <input type=file id=wkcsv accept=.csv />
            <div class=small>Kolonner (økter): workout_id,name,category,focus_area,favorite,pause_between_items_sec,items</div>
          </div>
        </div>
        <div class=flex>
          <button class=button id=eximport>Importer øvelser</button>
          <button class=button id=wkimport>Importer økter</button>
          <button class="button secondary" id=exportEx>Eksporter øvelser (CSV)</button>
          <button class="button secondary" id=exportWk>Eksporter økter (CSV)</button>
        </div>
      </div>
      <div class=card>
        <h2>Filtrer og velg økter</h2>
        <div class=flex>
          <select id=filterFocus class=input>
            <option value="">Fokusområde (alle)</option>
            <option>Overkropp</option>
            <option>Underkropp</option>
            <option>Hele kroppen</option>
          </select>
          <select id=filterCat class=input>
            <option value="">Kategori (alle)</option>
            <option>Styrke/Spenst</option>
            <option>Balanse/Stabilisering</option>
            <option>Mobilitet/Tøying</option>
          </select>
        </div>
        <div id=wklist></div>
      </div>
    `);
    document.getElementById('eximport').onclick=()=>{
      const file=document.getElementById('excsv').files[0]; if(!file) return alert('Velg øvelses-CSV');
      const reader=new FileReader(); reader.onload=()=>{
        AppState.exercises = Util.parseCSV(reader.result).map(r=>({
          exercise_id:r.exercise_id, name:r.name, description:r.description, progression_tips:r.progression_tips,
          default_duration_sec:Number(r.default_duration_sec||60), rpe:Number(r.rpe||5), category:r.category,
          focus_area:r.focus_area, equipment:(r.equipment||'').split(';').join(',').split(',').map(x=>x.trim()).filter(Boolean), noise_level:r.noise_level||'Low'
        }));
        Store.save(Store.keys.exercises, AppState.exercises); alert(`Importert ${AppState.exercises.length} øvelser.`); Library.render();
      }; reader.readAsText(file);
    };
    document.getElementById('wkimport').onclick=()=>{
      const file=document.getElementById('wkcsv').files[0]; if(!file) return alert('Velg økt-CSV');
      const reader=new FileReader(); reader.onload=()=>{
        AppState.workouts = Util.parseCSV(reader.result).map(r=>({
          workout_id:r.workout_id, name:r.name, category:r.category, focus_area:r.focus_area,
          favorite:(r.favorite||'').toLowerCase()==='true', pause_between_items_sec:Number(r.pause_between_items_sec||10),
          items:(r.items||'').split(';').map(pair=>{ const [eid,dur]=pair.split(':'); return eid?{exercise_id:eid.trim(), duration_sec:Number(dur||60)}:null; }).filter(Boolean)
        }));
        Store.save(Store.keys.workouts, AppState.workouts); alert(`Importert ${AppState.workouts.length} økter.`); Library.render();
      }; reader.readAsText(file);
    };
    document.getElementById('exportEx').onclick=()=>{
      const headers=['exercise_id','name','description','progression_tips','default_duration_sec','rpe','category','focus_area','equipment','noise_level'];
      const rows=AppState.exercises.map(e=>[e.exercise_id,e.name,e.description,e.progression_tips,e.default_duration_sec,e.rpe,e.category,e.focus_area,(e.equipment||[]).join(','),e.noise_level]);
      const csv=[headers.join(','), ...rows.map(r=>r.map(v=>String(v).replace(/\n/g,' ').replace(/,/g,';')).join(','))].join('\n');
      Util.download('exercises.csv', csv);
    };
    document.getElementById('exportWk').onclick=()=>{
      const headers=['workout_id','name','category','focus_area','favorite','pause_between_items_sec','items'];
      const rows=AppState.workouts.map(w=>[w.workout_id,w.name,w.category,w.focus_area,w.favorite,w.pause_between_items_sec,(w.items||[]).map(i=>`${i.exercise_id}:${i.duration_sec}`).join(';')]);
      const csv=[headers.join(','), ...rows.map(r=>r.map(v=>String(v).replace(/\n/g,' ').replace(/,/g,';')).join(','))].join('\n');
      Util.download('workouts.csv', csv);
    };
    function renderList(){
      const focus=document.getElementById('filterFocus').value; const cat=document.getElementById('filterCat').value;
      let list=AppState.workouts.slice(); if(focus) list=list.filter(w=>w.focus_area===focus); if(cat) list=list.filter(w=>w.category===cat);
      const html=list.map(w=>`<div class=card><div><strong>${w.name}</strong> <span class=small>${w.category} • ${w.focus_area}</span></div><div class=flex><button class=button data-start=${w.workout_id}>Start</button><button class="button secondary" data-fav=${w.workout_id}>${w.favorite?'★ Favoritt':'☆ Merk favoritt'}</button><button class="button secondary" data-edit=${w.workout_id}>Rediger</button></div></div>`).join('');
      document.getElementById('wklist').innerHTML = html || '<div class=card small>Ingen økter. Importer eller lag i editor.</div>';
      document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{ const w=AppState.workouts.find(x=>x.workout_id===b.dataset.start); AppState.currentWorkout=w; Session.render(); setActive('none'); });
      document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{ const w=AppState.workouts.find(x=>x.workout_id===b.dataset.fav); if(w){ w.favorite=!w.favorite; Store.save(Store.keys.workouts, AppState.workouts); renderList(); } });
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{ const w=AppState.workouts.find(x=>x.workout_id===b.dataset.edit); Editor.render(w); setActive('editor'); });
    }
    renderList(); document.getElementById('filterFocus').onchange=renderList; document.getElementById('filterCat').onchange=renderList;
  }
};
window.Library=Library;
