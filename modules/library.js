
// modules/library.js

// Øktvelger:
// - "Tilgjengelig utstyr" flyttet inn i "Filtrer og velg økter" under Fokus/Kategori, som en dropdown med flervalg (checkbokser inni).
// - Søkefelt på navn i "Filtrer og velg økter".
// - Import/eksport-kort nederst.
// - Predefinert CSV-limes inn i PREDEF_* nedenfor; lastes kun hvis localStorage er tom.
// - Nye økter øverst (sortert på created_at desc).
// - Autostart: Start-knappen setter AppState.autostart = true.

// ============================ PREDEF CSV (LIM-INN-HER) ============================
// Bruk semikolon (;) som skilletegn. Disse lastes bare hvis localStorage er tom.
// Kolonner må samsvare med eksportformatet i appen.
//
// Eksempel (du kan slette disse og lime inn dine egne):
const PREDEF_EXERCISES_CSV = ``; // f.eks. "exercise_id;name;description;default_duration_sec;rpe;category;focus_area;equipment;noise_level\nEX001;Knebøy;...;60;6;Styrke/Spenst;Underkropp;nei;Low"
const PREDEF_WORKOUTS_CSV  = ``; // f.eks. "workout_id;name;category;focus_area;favorite;pause_between_items_sec;items;created_at\nWK001;Helkropp;Styrke/Spenst;Hele kroppen;true;10;EX001:60|EX002:60|EX003:60;"
// ================================================================================

function seedPredefinedIfEmpty() {
  const hasEx = (AppState.exercises || []).length > 0;
  const hasWk = (AppState.workouts  || []).length > 0;

  let didSeed = false;

  if (!hasEx && PREDEF_EXERCISES_CSV.trim()) {
    const rows = Util.parseCSV(PREDEF_EXERCISES_CSV, ';');
    AppState.exercises = rows.map(r => {
      const equipments = (r.equipment || '').replace(/;/g, ',').split(',').map(x=>x.trim()).filter(Boolean);
      const rpeNum = Number(r.rpe || 5);
      return {
        exercise_id:           r.exercise_id || `EX${Date.now()}`,
        name:                  r.name,
        description:           r.description || '',
        default_duration_sec:  Number(r.default_duration_sec || 60),
        rpe:                   Number.isFinite(rpeNum) ? rpeNum : 5,
        category:              r.category || '',
        focus_area:            r.focus_area || 'Hele kroppen',
        equipment:             equipments,
        noise_level:           r.noise_level || 'Medium',
        created_at:            Number(r.created_at || Date.now())
      };
    });
    Store.save(Store.keys.exercises, AppState.exercises);
    didSeed = true;
  }

  if (!hasWk && PREDEF_WORKOUTS_CSV.trim()) {
    const rows = Util.parseCSV(PREDEF_WORKOUTS_CSV, ';');
    AppState.workouts = rows.map(r => ({
      workout_id: r.workout_id || `WK${Date.now()}`,
      name:       r.name,
      category:   r.category || '',
      focus_area: r.focus_area || 'Hele kroppen',
      favorite:   (r.favorite||'').toLowerCase() === 'true',
      pause_between_items_sec: Number(r.pause_between_items_sec || 10),
      items: (r.items||'').split('|').map(pair => {
        const [eid, dur] = pair.split(':');
        return eid ? { exercise_id: eid.trim(), duration_sec: Number(dur||60) } : null;
      }).filter(Boolean),
      created_at: Number(r.created_at || Date.now())
    }));

    // Tynne ut ev. referanser til ikke-eksisterende exercise_id (implikasjon forklart i svaret)
    const exIds = new Set((AppState.exercises||[]).map(e=>e.exercise_id));
    AppState.workouts.forEach(w => {
      w.items = (w.items||[]).filter(it => exIds.has(it.exercise_id));
    });

    Store.save(Store.keys.workouts, AppState.workouts);
    didSeed = true;
  }

  if (didSeed) {
    console.log('Predefinerte øvelser/økter lastet inn (førstegangsseeding).');
  }
}

const Library = {
  render(){
    // 1) Førstegangs seeding (kun hvis localStorage tom og PREDEF_* ikke tomme)
    seedPredefinedIfEmpty();

    // Dynamisk utstyr fra øvelser (union, ekskluder 'nei' dersom du har fjernet det i biblioteket ditt)
    const equipmentSet = new Set();
    (AppState.exercises || []).forEach(e => (e.equipment || []).forEach(eq => { if (eq) equipmentSet.add(eq); }));
    const allEquipment = Array.from(equipmentSet).sort();

    // Dynamiske kategorier fra økter
    const categorySet = new Set((AppState.workouts || []).map(w => w.category).filter(Boolean));
    const allWorkoutCategories = Array.from(categorySet).sort((a,b)=>String(a).localeCompare(String(b)));

    render(`
      <div class="card">
        <h2>Filtrer og velg økter</h2>
        <div class="flex">
          <select id="filterFocus" class="input">
            <option value="">Fokusområde (alle)</option>
            <option>Overkropp</option>
            <option>Underkropp</option>
            <option>Hele kroppen</option>
          </select>
          <select id="filterCat" class="input">
            <option value="">Kategori (alle)</option>
            ${allWorkoutCategories.map(c => `<option>${c}</option>`).join('')}
          </select>
        </div>

        <!-- Tilgjengelig utstyr (dropdown multiselect under filterknappene) -->
        <div class="multiselect" style="margin-top:8px;">
          <button id="eqBtn" class="input">Tilgjengelig utstyr</button>
          <div id="eqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">
            <div class="flex" style="flex-wrap:wrap; gap:8px;">
              <label><input type="checkbox" id="eqAll"> Velg alle</label>
              ${allEquipment.map(eq => `
                <label><input type="checkbox" class="eq-opt" value="${eq}"> ${eq}</label>
              `).join(' ')}
            </div>
          </div>
          <div id="eqHint" class="small" style="margin-top:6px; color:#666;">kun kroppsvekt</div>
        </div>

        <!-- Søk på navn -->
        <div style="margin-top:8px;">
          <input id="filterName" class="input" placeholder="Søk (navn)" />
        </div>

        <div id="wklist" style="margin-top:8px;"></div>
      </div>

      <!-- Import/eksport NEDERST -->
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

    // Dropdown toggle for utstyr
    const eqBtn  = document.getElementById('eqBtn');
    const eqMenu = document.getElementById('eqMenu');
    const eqHint = document.getElementById('eqHint');
    eqBtn.onclick = () => { eqMenu.style.display = (eqMenu.style.display === 'none' ? 'block' : 'none'); };

    // Utstyr valgt
    let selectedEquip = new Set();

    // Hint
    const refreshHint = () => {
      const arr = Array.from(selectedEquip);
      eqHint.textContent = arr.length ? arr.join(', ') : 'kun kroppsvekt';
    };

    // "Velg alle"
    const eqAll = document.getElementById('eqAll');
    eqAll.onchange = () => {
      selectedEquip = new Set(eqAll.checked ? allEquipment : []);
      document.querySelectorAll('.eq-opt').forEach(cb => cb.checked = eqAll.checked);
      refreshList();
    };

    // Hver utstyrs-boks
    document.querySelectorAll('.eq-opt').forEach(cb => {
      cb.onchange = () => {
        if (cb.checked) selectedEquip.add(cb.value); else selectedEquip.delete(cb.value);
        eqAll.checked = (selectedEquip.size === allEquipment.length);
        refreshList();
      };
    });

    // Hjelper: utstyr pr. økt
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

      let list = AppState.workouts.slice();

      // Fokus/kategori
      if (focus) list = list.filter(w=>w.focus_area===focus);
      if (cat)   list = list.filter(w=>w.category  ===cat);

      // Navn-søk
      if (nameQ) list = list.filter(w => (w.name||'').toLowerCase().includes(nameQ));

      // Utstyrsfilter (alltid aktiv)
      const selected = Array.from(selectedEquip);
      list = list.filter(w => {
        const req = getEquipForWorkout(w).filter(eq => eq !== 'nei');
        if (!selected.length) return req.length === 0; // bare kroppsvekt
        return req.every(eq => selected.includes(eq));
      });

      // Nye økter øverst
      list.sort((a,b) => Number(b.created_at||0) - Number(a.created_at||0));

      const html = list.map(w => {
        const reqEquip = getEquipForWorkout(w);
        return `
          <div class="card">
            <div><strong>${w.name}</strong> <span class="small">${w.category} • ${w.focus_area}</span></div>
            <div class="small">Utstyr: ${reqEquip.length ? reqEquip.join(', ') : 'ingen'}</div>
            <div class="flex">
              <button class="button" data-start="${w.workout_id}">Start</button>
              <button class="button secondary" data-fav="${w.workout_id}">${w.favorite?'★ Favoritt':'☆ Merk favoritt'}</button>
              <button class="button secondary" data-edit="${w.workout_id}">Rediger</button>
              <button class="button secondary" data-del="${w.workout_id}">Slett</button>
            </div>
          </div>
        `;
      }).join('');

      document.getElementById('wklist').innerHTML = html || '<div class="card small">Ingen økter matcher filteret.</div>';

      // Handlers
      document.querySelectorAll('[data-start]').forEach(b => b.onclick = () => {
        const w = AppState.workouts.find(x=>x.workout_id===b.dataset.start);
        AppState.currentWorkout = w;
        AppState.autostart = true;                  // <-- for automatisk start
        Session.render();
        setActive('none');
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

    // Import økter
    document.getElementById('wkimport').onclick = () => {
      const file = document.getElementById('wkcsv').files[0];
      if (!file) return alert('Velg økt-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.workouts = rows.map(r => ({
          workout_id: r.workout_id || `WK${Date.now()}`,
          name:       r.name,
          category:   r.category || '',
          focus_area: r.focus_area || 'Hele kroppen',
          favorite:   (r.favorite||'').toLowerCase()==='true',
          pause_between_items_sec: Number(r.pause_between_items_sec || 10),
          items: (r.items||'').split('|').map(pair => {
            const [eid, dur] = pair.split(':');
            return eid ? { exercise_id: eid.trim(), duration_sec: Number(dur||60) } : null;
          }).filter(Boolean),
          created_at: Number(r.created_at || Date.now())
        }));
        // Fjern referanser til ikke-eksisterende øvelser
        const exIds = new Set((AppState.exercises||[]).map(e=>e.exercise_id));
        AppState.workouts.forEach(w => {
          w.items = (w.items||[]).filter(it => exIds.has(it.exercise_id));
        });
        Store.save(Store.keys.workouts, AppState.workouts);
        alert(`Importert ${AppState.workouts.length} økter.`);
        refreshList();
      };
      reader.readAsText(file);
    };

    // Eksport økter
    document.getElementById('exportWk').onclick = () => {
      const headers = ['workout_id','name','category','focus_area','favorite','pause_between_items_sec','items'];
      const rows = AppState.workouts.map(w => [
        w.workout_id, w.name, w.category, w.focus_area, w.favorite,
        w.pause_between_items_sec,
        (w.items||[]).map(i=>`${i.exercise_id}:${i.duration_sec}`).join('|')
      ]);
      const csv = Util.toCSV(headers, rows, ';');
      Util.download('workouts.csv', csv, 'text/csv');
    };

    // Init
    refreshList();
    document.getElementById('filterFocus').onchange = refreshList;
    document.getElementById('filterCat').onchange   = refreshList;
    document.getElementById('filterName').oninput   = refreshList;
  }
};

window.Library = Library;
