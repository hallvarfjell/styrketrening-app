
// Øktvelger:
// - Utstyrsfilter: dropdown med flervalg (checkbokser inni), dynamisk fra øvelsesbank, ekskluderer 'nei' helt.
//   Inkluderer "Velg alle". Hint under knappen: "kun kroppsvekt" når intet valgt, ellers valgte navn.
// - Filtrering: hvis ingenting valgt → vis kun økter uten utstyr; ellers → vis kun økter der alle krav er blant valgte.
// - Kategorifilter: verdier hentes dynamisk fra alle økter (inkl. nye som "Kontorstyrke").
// - Import/eksport-knapper ligger side-om-side under filvelgerknappen.
// - Nye økter vises øverst (sortering på created_at desc).
// - Sletting av økter støttes.
// - CSV semikolon + items separert med |; eksport med UTF‑8 BOM for Æ/Ø/Å.

const Library = {
  render(){
    // Dynamisk utstyrsliste fra alle øvelser (union), ekskluder 'nei'
    const equipmentSet = new Set();
    (AppState.exercises || []).forEach(e => (e.equipment || []).forEach(eq => {
      if (eq && eq !== 'nei') equipmentSet.add(eq);
    }));
    const allEquipment = Array.from(equipmentSet).sort();

    // Dynamiske kategorier fra alle økter
    const categorySet = new Set((AppState.workouts || []).map(w => w.category).filter(Boolean));
    const allWorkoutCategories = Array.from(categorySet).sort((a,b)=>String(a).localeCompare(String(b)));

    render(`
      <div class="card">
        <h2>Importer/eksporter økter (CSV)</h2>
        <div>
          <input type="file" id="wkcsv" accept=".csv" />
        </div>
        <div class="flex" style="margin-top:8px;">
          <button class="button" id="wkimport">Importer økter (CSV)</button>
          <button class="button secondary" id="exportWk">Eksporter økter (CSV)</button>
        </div>
        <div class="small">CSV er <strong>semikolondelt</strong>. Feltet <code>items</code> bruker <strong>|</strong> mellom øvelser (f.eks. <code>EX001:60|EX002:60</code>).</div>
      </div>

      <div class="card">
        <h2>Tilgjengelig utstyr</h2>
        <div class="multiselect">
          <button id="eqBtn" class="input">Tilgjengelig utstyr</button>
          <div id="eqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">
            <div class="flex" style="flex-wrap:wrap; gap:8px;">
              <label><input type="checkbox" id="eqAll"> Velg alle</label>
              ${
                allEquipment.map(eq => `
                  <label><input type="checkbox" class="eq-opt" value="${eq}"> ${eq}</label>
                `).join(' ')
              }
            </div>
          </div>
          <div id="eqHint" class="small" style="margin-top:6px; color:#666;">kun kroppsvekt</div>
        </div>
      </div>

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
        <div id="wklist" style="margin-top:8px;"></div>
      </div>
    `);

    // Dropdown toggle
    const eqBtn  = document.getElementById('eqBtn');
    const eqMenu = document.getElementById('eqMenu');
    const eqHint = document.getElementById('eqHint');
    eqBtn.onclick = () => { eqMenu.style.display = (eqMenu.style.display === 'none' ? 'block' : 'none'); };

    // Utstyr valgt (sett)
    let selectedEquip = new Set();

    // Oppdater hint under knappen
    const refreshHint = () => {
      const arr = Array.from(selectedEquip);
      eqHint.textContent = arr.length ? arr.join(', ') : 'kun kroppsvekt';
    };

    // "Velg alle" toggler alle
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
        // Synk "Velg alle"
        eqAll.checked = (selectedEquip.size === allEquipment.length);
        refreshList();
      };
    });

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

      let list = AppState.workouts.slice();

      // Fokus/kategori
      if (focus) list = list.filter(w=>w.focus_area===focus);
      if (cat)   list = list.filter(w=>w.category  ===cat);

      // Utstyrsfilter: alltid aktiv
      const selected = Array.from(selectedEquip);
      list = list.filter(w => {
        const req = getEquipForWorkout(w).filter(eq => eq !== 'nei'); // 'nei' brukes ikke lenger i filter, men behold defensiv sjekk
        if (!selected.length) return req.length === 0;                // kun kroppsvekt
        return req.every(eq => selected.includes(eq));
      });

      // Sorter nye økter øverst
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
        AppState.currentWorkout = w; Session.render(); setActive('none');
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

    // Import økter (CSV semikolon, items separert med | )
    document.getElementById('wkimport').onclick = () => {
      const file = document.getElementById('wkcsv').files[0];
      if (!file) return alert('Velg økt-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.workouts = rows.map(r => ({
          workout_id: r.workout_id,
          name:       r.name,
          category:   r.category,
          focus_area: r.focus_area,
          favorite:   (r.favorite||'').toLowerCase()==='true',
          pause_between_items_sec: Number(r.pause_between_items_sec||10),
          items: (r.items||'').split('|').map(pair => {
            const [eid, dur] = pair.split(':');
            return eid ? { exercise_id: eid.trim(), duration_sec: Number(dur||60) } : null;
          }).filter(Boolean),
          created_at: Number(r.created_at || Date.now())
        }));
        Store.save(Store.keys.workouts, AppState.workouts);
        alert(`Importert ${AppState.workouts.length} økter.`);
        refreshList();
      };
      reader.readAsText(file);
    };

    // Eksport økter (UTF-8 BOM + semikolon + | for items)
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
  }
};

window.Library = Library;
``
