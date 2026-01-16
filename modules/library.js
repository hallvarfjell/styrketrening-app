
// modules/library.js
//
// Ikonknapper (Phosphor) i aksjonsraden: Start (play), Rediger (pencil), Slett (trash), Favoritt (stjerne) – stjernen etter Slett.
// Eksporter/Importer er robuste.
// Fokusområde-dropdown hentes fra øvelser.

const PREDEF_EXERCISES_CSV = `exercise_id;name;description;default_duration_sec;default_pause_sec;intensitet;category;focus_area;equipment;noise_level
EX100;Knebøy;Stå støtt, senk hoftene og press opp.;60;10;Middels;Styrke/Spenst;Underkropp;;Medium
EX101;Push-up;Stram kjernen og hold linje gjennom kroppen.;45;10;Middels;Styrke/Spenst;Overkropp;;Medium
EX102;Planke;Hold kroppen strak, trekk navlen inn.;60;10;Lav;Balanse/Stabilisering;Hele kroppen;;Lavt`;

const PREDEF_WORKOUTS_CSV = `workout_id;name;category;focus_area;favorite;pause_between_items_sec;items;created_at
WK100;Rask helkropp;Styrke/Spenst;Hele kroppen;true;10;EX100:60|EX101:45|EX102:60;`;

function seedPredefinedIfEmpty() {
  const hasEx = (AppState.exercises || []).length > 0;
  const hasWk = (AppState.workouts  || []).length > 0;
  if (!hasEx && PREDEF_EXERCISES_CSV.trim()) {
    const rows = Util.parseCSV(PREDEF_EXERCISES_CSV, ';');
    AppState.exercises = rows.map(r => {
      const eq = (r.equipment||'').replace(/;/g,',').split(',').map(x=>x.trim()).filter(Boolean);
      const intens = (r.intensitet||'').trim();
      const rpeText = intens==='Lav'?'Lett': intens==='Middels'?'Moderat':'Hardt';
      const rpeNum  = rpeText==='Lett'?2:(rpeText==='Moderat'?5:8);
      return {
        exercise_id: r.exercise_id||('EX'+Date.now()),
        name: r.name, description: r.description||'',
        default_duration_sec: Number(r.default_duration_sec||60),
        default_pause_sec:    Number(r.default_pause_sec||10),
        rpe: rpeNum, rpe_text: rpeText,
        category: r.category||'', focus_area: r.focus_area||'Hele kroppen',
        equipment: eq, noise_level: r.noise_level||'Medium', created_at: Date.now()
      };
    });
    Store.save(Store.keys.exercises, AppState.exercises);
  }
  if (!hasWk && PREDEF_WORKOUTS_CSV.trim()) {
    const rows = Util.parseCSV(PREDEF_WORKOUTS_CSV, ';');
    AppState.workouts = rows.map(r => ({
      workout_id: r.workout_id||('WK'+Date.now()),
      name:r.name, category:r.category||'', focus_area:r.focus_area||'Hele kroppen',
      favorite:(r.favorite||'').toLowerCase()==='true',
      pause_between_items_sec: Number(r.pause_between_items_sec||10),
      items:(r.items||'').split('|').map(p=>{ const [eid,dur]=p.split(':'); return eid?{exercise_id:eid.trim(), duration_sec:Number(dur||60)}:null; }).filter(Boolean),
      created_at: Number(r.created_at||Date.now())
    }));
    const exIds = new Set((AppState.exercises||[]).map(e=>e.exercise_id));
    AppState.workouts.forEach(w => { w.items = (w.items||[]).filter(it => exIds.has(it.exercise_id)); });
    Store.save(Store.keys.workouts, AppState.workouts);
  }
}

const Library = {
  render(){
    seedPredefinedIfEmpty();

    // Fokus fra øvelser
    const focusSet = new Set((AppState.exercises||[]).map(e=>e.focus_area).filter(Boolean));
    const allFocus = Array.from(focusSet).sort((a,b)=>String(a).localeCompare(String(b)));

    // Kategorier fra økter
    const catSet = new Set((AppState.workouts||[]).map(w=>w.category).filter(Boolean));
    const allCats = Array.from(catSet).sort((a,b)=>String(a).localeCompare(String(b)));

    // Utstyr fra øvelser
    const eqSet = new Set();
    (AppState.exercises||[]).forEach(e => (e.equipment||[]).forEach(x=>{ if(x) eqSet.add(x); }));
    const allEquipment = Array.from(eqSet).sort();

    render(
      '<div class="card">' +
        '<h2>Filtrer og velg økter</h2>' +
        '<div class="flex">' +
          '<select id="filterFocus" class="input"><option value="">Fokusområde (alle)</option>' + allFocus.map(f=>'<option>'+f+'</option>').join('') + '</select>' +
          '<select id="filterCat" class="input"><option value="">Kategori (alle)</option>' + allCats.map(c=>'<option>'+c+'</option>').join('') + '</select>' +
        '</div>' +
        '<div class="small" style="margin-top:6px;">Tilgjengelig utstyr (informasjonsvisning): '+(allEquipment.length? allEquipment.join(', ') : '—')+'</div>' +
        '<div style="margin-top:8px;"><input id="filterName" class="input" placeholder="Søk (navn)" /></div>' +
        '<div id="wklist" style="margin-top:8px;"></div>' +
      '</div>' +

      '<div class="card">' +
        '<h2>Importer/eksporter økter (CSV)</h2>' +
        '<div><input type="file" id="wkcsv" accept=".csv" /></div>' +
        '<div class="flex" style="margin-top:8px;">' +
          '<button class="button" id="wkimport">Importer økter (CSV)</button>' +
          '<button class="button secondary" id="exportWk">Eksporter økter (CSV)</button>' +
        '</div>' +
        '<div class="small">Semikolondelt CSV. <code>items</code> bruker <strong>|</strong> (f.eks. <code>EX100:60|EX101:45</code>).</div>' +
      '</div>'
    );

    const getEquipForWorkout = (w) => {
      const s=new Set(); (w.items||[]).forEach(it=>{ const ex=AppState.exercises.find(e=>e.exercise_id===it.exercise_id); (ex?.equipment||[]).forEach(eq=>{ if(eq)s.add(eq); }); }); return Array.from(s);
    };

    function refreshList(){
      const focus=document.getElementById('filterFocus').value;
      const cat=document.getElementById('filterCat').value;
      const nameQ=(document.getElementById('filterName').value||'').trim().toLowerCase();

      let list=AppState.workouts.slice();
      if (focus) list=list.filter(w=>w.focus_area===focus);
      if (cat)   list=list.filter(w=>w.category  ===cat);
      if (nameQ) list=list.filter(w=>(w.name||'').toLowerCase().includes(nameQ));

      list.sort((a,b)=>Number(b.created_at||0)-Number(a.created_at||0));

      const html=list.map(w=>{
        const req = getEquipForWorkout(w);
        return (
          '<div class="card">' +
            '<div class="row">' +
              '<div class="title"><strong>'+w.name+'</strong> <span class="small">'+(w.category||'')+' • '+(w.focus_area||'')+'</span><div class="small">Utstyr: '+(req.length?req.join(', '):'ingen')+'</div></div>' +
              '<div class="actions" style="display:flex;gap:8px;">' +
                '<button class="icon-btn play" aria-label="Start" data-start="'+w.workout_id+'"><svg class="icon"><use href="#ph-play-fill"/></svg></button>' +
                '<button class="icon-btn" aria-label="Rediger" data-edit="'+w.workout_id+'"><svg class="icon"><use href="#ph-pencil-fill"/></svg></button>' +
                '<button class="icon-btn" aria-label="Slett" data-del="'+w.workout_id+'"><svg class="icon"><use href="#ph-trash-fill"/></svg></button>' +
                '<button class="icon-btn fav '+(w.favorite?'active':'')+'" aria-label="Favoritt" data-fav="'+w.workout_id+'">' +
                  (w.favorite
                    ? '<svg class="icon"><use href="#ph-star-fill"/></svg>'
                    : '<svg class="icon"><use href="#ph-star"/></svg>') +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      document.getElementById('wklist').innerHTML = html || '<div class="card small">Ingen økter matcher filteret.</div>';

      document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{
        const w=AppState.workouts.find(x=>x.workout_id===b.dataset.start);
        AppState.currentWorkout=w; AppState.autostart=true; Session.render(); setActive('none');
      });
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
        const w=AppState.workouts.find(x=>x.workout_id===b.dataset.edit);
        Editor.render(w); setActive('editor');
      });
      document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
        const wid=b.dataset.del; const idx=AppState.workouts.findIndex(x=>x.workout_id===wid);
        if(idx>=0 && confirm('Slette økta?')){ AppState.workouts.splice(idx,1); Store.save(Store.keys.workouts,AppState.workouts); refreshList(); }
      });
      document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{
        const w=AppState.workouts.find(x=>x.workout_id===b.dataset.fav);
        if (w){ w.favorite=!w.favorite; Store.save(Store.keys.workouts,AppState.workouts); refreshList(); }
      });
    }

    // Import/eksport
    document.getElementById('wkimport').onclick=()=>{
      const file=document.getElementById('wkcsv').files[0]; if(!file) return alert('Velg økt-CSV');
      const r=new FileReader(); r.onload=()=>{
        const rows=Util.parseCSV(r.result,';');
        AppState.workouts=rows.map(v=>({
          workout_id:v.workout_id||('WK'+Date.now()),
          name:v.name, category:v.category||'', focus_area:v.focus_area||'Hele kroppen',
          favorite:(v.favorite||'').toLowerCase()==='true',
          pause_between_items_sec:Number(v.pause_between_items_sec||10),
          items:(v.items||'').split('|').map(p=>{ const[a,b]=p.split(':'); return a?{exercise_id:a.trim(), duration_sec:Number(b||60)}:null; }).filter(Boolean),
          created_at:Number(v.created_at||Date.now())
        }));
        const exIds=new Set((AppState.exercises||[]).map(e=>e.exercise_id));
        AppState.workouts.forEach(w=>{ w.items=(w.items||[]).filter(it=>exIds.has(it.exercise_id)); });
        Store.save(Store.keys.workouts,AppState.workouts);
        alert('Importert '+AppState.workouts.length+' økter.'); refreshList();
      }; r.readAsText(file);
    };

    document.getElementById('exportWk').onclick=()=>{
      const headers=['workout_id','name','category','focus_area','favorite','pause_between_items_sec','items'];
      const rows=(AppState.workouts||[]).map(w=>[
        w.workout_id,w.name,w.category,w.focus_area,w.favorite,
        w.pause_between_items_sec,
        (w.items||[]).map(i=>i.exercise_id+':'+i.duration_sec).join('|')
      ]);
      const csv=Util.toCSV(headers,rows,';');
      Util.download('workouts.csv', csv, 'text/csv;charset=utf-8');
    };

    refreshList();
    document.getElementById('filterFocus').onchange=refreshList;
    document.getElementById('filterCat').onchange=refreshList;
    document.getElementById('filterName').oninput=refreshList;
  }
};
window.Library = Library;
