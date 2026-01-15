
// modules/library.js
//
// Endringer:
// - Favorittknapp rosa når valgt (.button.fav.active) og større stjerne .star.
// - Dynamisk fokusområde i filter fra øvelser (ikke hardkodet).
// - Navn-søkfelt i filter (beholdt).
// - Predefinert økt + øvelser (seed) – limes inn i PREDEF_*; lastes bare hvis tomt.
// - Start → autostart = true (session).
// - Utstyr dropdown multivalg er beholdt slik du ønsket tidligere.

//////////////////// PREDEF CSV (LIM INN HER om ønskelig) ////////////////////
const PREDEF_EXERCISES_CSV = `exercise_id;name;description;default_duration_sec;default_pause_sec;rpe;category;focus_area;equipment;noise_level;created_at
EXBW001;Knebøy (BW);"Knebøy uten vekter.";60;10;5;Styrke/Spenst;Underkropp;;Lavt;
EXBW002;Push-up;"Kroppshevning fra gulv.";45;10;6;Styrke/Spenst;Overkropp;;Lavt;
EXBW003;Planke;"Isometrisk kjerneøvelse.";40;10;4;Balanse/Stabilisering;Hele kroppen;;Lavt;`;

const PREDEF_WORKOUTS_CSV  = `workout_id;name;category;focus_area;favorite;pause_between_items_sec;items;created_at
WKBASIC01;Basiskropp (BW);Styrke/Spenst;Hele kroppen;true;10;EXBW001:60|EXBW002:45|EXBW003:40;`;
//////////////////////////////////////////////////////////////////////////////

function seedPredefinedIfEmpty() {
  const hasEx = (AppState.exercises || []).length > 0;
  const hasWk = (AppState.workouts  || []).length > 0;
  let did = false;

  if (!hasEx && PREDEF_EXERCISES_CSV.trim()){
    const rows = Util.parseCSV(PREDEF_EXERCISES_CSV, ';');
    AppState.exercises = rows.map(r => ({
      exercise_id: r.exercise_id || `EX${Date.now()}`,
      name: r.name, description: r.description || '',
      default_duration_sec: Number(r.default_duration_sec || 60),
      default_pause_sec:    Number(r.default_pause_sec || 10),
      rpe: Number(r.rpe || 5),
      category: r.category || '',
      focus_area: r.focus_area || 'Hele kroppen',
      equipment: (r.equipment||'').replace(/;/g,',').split(',').map(x=>x.trim()).filter(Boolean),
      noise_level: r.noise_level || 'Lavt',
      created_at: Number(r.created_at || Date.now())
    }));
    Store.save(Store.keys.exercises, AppState.exercises); did = true;
  }

  if (!hasWk && PREDEF_WORKOUTS_CSV.trim()){
    const rows = Util.parseCSV(PREDEF_WORKOUTS_CSV, ';');
    AppState.workouts = rows.map(r => ({
      workout_id: r.workout_id || `WK${Date.now()}`,
      name: r.name, category: r.category || '', focus_area: r.focus_area || 'Hele kroppen',
      favorite: (r.favorite||'').toLowerCase()==='true',
      pause_between_items_sec: Number(r.pause_between_items_sec || 10),
      items: (r.items||'').split('|').map(pair => {
        const [eid, dur] = pair.split(':');
        return eid ? { exercise_id: eid.trim(), duration_sec: Number(dur||60) } : null;
      }).filter(Boolean),
      created_at: Number(r.created_at || Date.now())
    }));
    // Filtrer bort referanser uten øvelse
    const exIds = new Set((AppState.exercises||[]).map(e=>e.exercise_id));
    AppState.workouts.forEach(w => { w.items = (w.items||[]).filter(it => exIds.has(it.exercise_id)); });
    Store.save(Store.keys.workouts, AppState.workouts); did = true;
  }

  if (did) console.log('Predef seed loaded.');
}

const Library = {
  render(){
    seedPredefinedIfEmpty();

    // Dynamisk utstyr (union)
    const equipmentSet = new Set();
    (AppState.exercises || []).forEach(e => (e.equipment || []).forEach(eq => { if (eq) equipmentSet.add(eq); }));
    const allEquipment = Array.from(equipmentSet).sort();

    // Dynamisk fokus fra øvelser (ikke hardkodet)
    const focusSet = new Set((AppState.exercises||[]).map(e=>e.focus_area).filter(Boolean));
    const allFocus = Array.from(focusSet).sort((a,b)=>String(a).localeCompare(String(b)));

    // Dynamiske kategorier fra økter
    const catSet = new Set((AppState.workouts||[]).map(w=>w.category).filter(Boolean));
    const allWorkoutCategories = Array.from(catSet).sort((a,b)=>String(a).localeCompare(String(b)));

    render(`
      <div class="card">
        <h2>Filtrer og velg økter</h2>
        <div class="flex">
          <select id="filterFocus" class="input">
            <option value="">Fokusområde (alle)</option>
            ${allFocus.map(f=>`<option>${f}</option>`).join('')}
          </select>
          <select id="filterCat" class="input">
            <option value="">Kategori (alle)</option>
            ${allWorkoutCategories.map(c => `<option>${c}</option>`).join('')}
          </select>
        </div>

        <!-- Utstyr: dropdown multivalg -->
        <div class="multiselect" style="margin-top:8px;">
          <button id="eqBtn" class="input">Tilgjengelig utstyr</button>
          <div id="eqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">
            <div class="flex" style="flex-wrap:wrap; gap:8px;">
              <label><input type="checkbox" id="eqAll"> Velg alle</label>
              ${allEquipment.map(eq => `<label><input type="checkbox" class="eq-opt" value="${eq}"> ${eq}</label>`).join(' ')}
            </div>
          </div>
          <div id="eqHint" class="small" style="margin-top:6px; color:#666;">kun kroppsvekt</div>
        </div>

        <!-- Søk navn -->
        <div style="margin-top:8px;">
          <input id="filterName" class="input" placeholder="Søk (navn)" />
        </div>

        <div id="wklist" style="margin-top:8px;"></div>
      </div>

      <div class="card">
        <h2>Importer/eksporter økter (CSV)</h2>
        <div><input type="file" id="wkcsv" accept=".csv" /></div>
        <div class="flex" style="margin-top:8px;">
          <button class="button" id="wkimport">Importer økter (CSV)</button>
          <button class="button secondary" id="exportWk">Eksporter økter (CSV)</button>
        </div>
        <div class="small">CSV er <strong>semikolondelt</strong>. Feltet <code>items</code> bruker <strong>|</strong> (f.eks. <code>EX001:60|EX002:60</code>).</div>
      </div>
    `);

    // Utstyr dropdown
    const eqBtn  = document.getElementById('eqBtn');
    const eqMenu = document.getElementById('eqMenu');
    const eqHint = document.getElementById('eqHint');
    eqBtn.onclick = () => { eqMenu.style.display = (eqMenu.style.display === 'none' ? 'block' : 'none'); };
    let selectedEquip = new Set();
    const eqAll = document.getElementById('eqAll');
    eqAll.onchange = () => {
      selectedEquip = new Set(eqAll.checked ? allEquipment : []);
      document.querySelectorAll('.eq-opt').forEach(cb => cb.checked = eqAll.checked);
      refreshList();
    };
    document.querySelectorAll('.eq-opt').forEach(cb => cb.onchange = () => {
      if (cb.checked) selectedEquip.add(cb.value); else selectedEquip.delete(cb.value);
      eqAll.checked = (selectedEquip.size === allEquipment.length);
      refreshList();
    });
    const refreshHint = () => {
      const arr = Array.from(selectedEquip);
      eqHint.textContent = arr.length ? arr.join(', ') : 'kun kroppsvekt';
    };

    const getEquipForWorkout = (w) => {
      const s = new Set();
      (w.items||[]).forEach(it => {
        const ex = AppState.exercises.find(e=>e.exercise_id===it.exercise_id);
        (ex?.equipment||[]).forEach(eq => { if (eq) s.add(eq); });
      });
      return Array.from(s);
    };

    function refreshList(){
      refreshHint();

      const focus = document.getElementById('filterFocus').value;
      const cat   = document.getElementById('filterCat').value;
      const nameQ = (document.getElementById('filterName').value || '').trim().toLowerCase();
      const selected = Array.from(selectedEquip);

      let list = AppState.workouts.slice();

      if (focus) list = list.filter(w=>w.focus_area===focus);
      if (cat)   list = list.filter(w=>w.category===cat);
      if (nameQ) list = list.filter(w => (w.name||'').toLowerCase().includes(nameQ));

      list = list.filter(w => {
        const req = getEquipForWorkout(w);
        if (!selected.length) return req.length === 0;
        return req.every(eq => selected.includes(eq));
      });

      list.sort((a,b) => Number(b.created_at||0) - Number(a.created_at||0));

      const html = list.map(w => {
        const reqEquip = getEquipForWorkout(w);
        return `
          <div class="card">
            <div><strong>${w.name}</strong> <span class="small">${w.category} • ${w.focus_area}</span></div>
            <div class="small">Utstyr: ${reqEquip.length ? reqEquip.join(', ') : 'ingen'}</div>
            <div class="row-actions">
              <button class="button" data-start="${w.workout_id}">Start</button>
              <button class="button fav ${w.favorite?'active':''}" data-fav="${w.workout_id}">
                <span class="star">${w.favorite?'★':'☆'}</span> Favoritt
              </button>
              <button class="button secondary" data-edit="${w.workout_id}">Rediger</button>
              <button class="button secondary" data-del="${w.workout_id}">Slett</button>
            </div>
          </div>`;
      }).join('');

      document.getElementById('wklist').innerHTML = html || '<div class="card small">Ingen økter matcher filteret.</div>';

      // Handlers
      document.querySelectorAll('[data-start]').forEach(b => b.onclick = () => {
        const w = AppState.workouts.find(x=>x.workout_id===b.dataset.start);
        AppState.currentWorkout = w; AppState.autostart = true; Session.render(); setActive('none');
      });
      document.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => {
        const w = AppState.workouts.find(x=>x.workout_id===b.dataset.fav);
        if (w){ w.favorite = !w.favorite; Store.save(Store.keys.workouts, AppState.workouts); refreshList(); }
      });
      document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
        const w = AppState.workouts.find(x=>x.workout_id===b.dataset.edit);
        Editor.render(w); setActive('editor');
      });
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const wid = b.dataset.del;
        const idx = AppState.workouts.findIndex(x=>x.workout_id===wid);
        if (idx>=0 && confirm('Slette økta?')) {
          AppState.workouts.splice(idx,1);
          Store.save(Store.keys.workouts, AppState.workouts);
          refreshList();
        }
      });
    }

    // Import/eksport økter
    document.getElementById('wkimport').onclick = () => {
      const file = document.getElementById('wkcsv').files[0];
      if (!file) return alert('Velg økt-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.workouts = rows.map(r => ({
          workout_id: r.workout_id || `WK${Date.now()}`,
          name: r.name, category: r.category || '', focus_area: r.focus_area || 'Hele kroppen',
          favorite: (r.favorite||'').toLowerCase()==='true',
          pause_between_items_sec: Number(r.pause_between_items_sec || 10),
          items: (r.items||'').split('|').map(pair => { const [eid, dur] = pair.split(':'); return eid?{exercise_id:eid.trim(), duration_sec:Number(dur||60)}:null; }).filter(Boolean),
          created_at: Number(r.created_at || Date.now())
        }));
        const exIds = new Set((AppState.exercises||[]).map(e=>e.exercise_id));
        AppState.workouts.forEach(w => { w.items = (w.items||[]).filter(it => exIds.has(it.exercise_id)); });
        Store.save(Store.keys.workouts, AppState.workouts);
        alert(`Importert ${AppState.workouts.length} økter.`);
        refreshList();
      };
      reader.readAsText(file);
    };
    document.getElementById('exportWk').onclick = () => {
      const headers = ['workout_id','name','category','focus_area','favorite','pause_between_items_sec','items'];
      const rows = (AppState.workouts||[]).map(w => [
        w.workout_id, w.name, w.category, w.focus_area, w.favorite,
        w.pause_between_items_sec,
        (w.items||[]).map(i=>`${i.exercise_id}:${i.duration_sec}`).join('|')
      ]);
      const csv = Util.toCSV(headers, rows, ';');
      Util.download('workouts.csv', csv, 'text/csv');
    };

    refreshList();
    document.getElementById('filterFocus').onchange = refreshList;
    document.getElementById('filterCat').onchange   = refreshList;
    document.getElementById('filterName').oninput   = refreshList;
  }
};

window.Library = Library;
``
