
// Øktvelger:
// - Utstyrsfilteret: dynamisk fra øvelser, ekskluderer 'nei' helt.
// - Vis ALDRI økter som krever annet utstyr enn det som er avkrysset.
//   (Hvis ingen utstyr er avkrysset → vis kun økter som ikke krever utstyr.)
// - Nye økter øverst i lista (sortert på created_at desc; fallback på rekkefølge).
// - Sletting av økter støttes.
// - CSV (semikolon) med items separert av |. Eksport med UTF-8 BOM.

const Library = {
  render(){
    // Bygg dynamisk utstyrsliste fra øvelsesbiblioteket (union), ekskluder 'nei'
    const equipmentSet = new Set();
    (AppState.exercises || []).forEach(e => (e.equipment || []).forEach(eq => {
      if (eq && eq !== 'nei') equipmentSet.add(eq);
    }));
    const allEquipment = Array.from(equipmentSet).sort();

    render(`
      <div class="card">
        <h2>Importer/eksporter økter (CSV)</h2>
        <div class="flex">
          <div style="flex:1"><input type="file" id="wkcsv" accept=".csv" /></div>
          <div style="flex:1; text-align:right">
            <button class="button" id="wkimport">Importer økter (CSV)</button>
            <button class="button secondary" id="exportWk">Eksporter økter (CSV)</button>
          </div>
        </div>
        <div class="small">CSV er <strong>semikolondelt</strong>. Feltet <code>items</code> bruker <strong>|</strong> mellom øvelser (f.eks. <code>EX001:60|EX002:60</code>).</div>
      </div>

      <div class="card">
        <h2>Utstyr jeg har tilgjengelig</h2>
        <div class="flex" id="eqPanel">
          ${allEquipment.map(eq => `
            <label><input type="checkbox" class="eq-have" value="${eq}"> ${eq.charAt(0).toUpperCase()}${eq.slice(1)}</label>
          `).join(' ')}
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
            <option>Styrke/Spenst</option>
            <option>Balanse/Stabilisering</option>
            <option>Mobilitet/Tøying</option>
          </select>
        </div>
        <div id="wklist"></div>
      </div>
    `);

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
          // Sett created_at hvis finnes i CSV, ellers nå
          created_at: Number(r.created_at || Date.now())
        }));
        Store.save(Store.keys.workouts, AppState.workouts);
        alert(`Importert ${AppState.workouts.length} økter.`);
        renderList(); // oppdater visning
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

    // Hent utstyr for en økt (union av øvelsers utstyr)
    const getEquipForWorkout = (w) => {
      const s = new Set();
      (w.items||[]).forEach(it => {
        const ex = AppState.exercises.find(e=>e.exercise_id===it.exercise_id);
        (ex?.equipment||[]).forEach(eq => { if (eq) s.add(eq); });
      });
      return Array.from(s);
    };

    // Render liste med utstyrsfilter alltid aktivt + nye økter øverst
    function renderList(){
      const focus = document.getElementById('filterFocus').value;
      const cat   = document.getElementById('filterCat').value;
      const selected = Array.from(document.querySelectorAll('.eq-have:checked')).map(c=>c.value);

      let list = AppState.workouts.slice();

      // Fokus/kategori
      if (focus) list = list.filter(w=>w.focus_area===focus);
      if (cat)   list = list.filter(w=>w.category  ===cat);

      // Utstyrsfilter: alltid aktiv
      // - Ingen avkrysset → vis økter som ikke krever utstyr (req==[])
      // - Ellers → vis økter der alle req er subset av selected
      list = list.filter(w => {
        const req = getEquipForWorkout(w).filter(eq => eq !== 'nei'); // 'nei' finnes ikke lenger, men filtrer likevel
        if (selected.length === 0) return req.length === 0;
        return req.every(eq => selected.includes(eq));
      });

      // Nye økter øverst: sortér på created_at desc (mangler -> 0)
      list.sort((a,b) => (Number(b.created_at||0) - Number(a.created_at||0)));

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
        </div>`;
      }).join('');

      document.getElementById('wklist').innerHTML = html || '<div class="card small">Ingen økter matcher filteret. Juster utstyr/kategori/fokus.</div>';

      // Handlers
      document.querySelectorAll('[data-start]').forEach(b => b.onclick = () => {
        const w = AppState.workouts.find(x=>x.workout_id===b.dataset.start);
        AppState.currentWorkout = w; Session.render(); setActive('none');
      });
      document.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => {
        const w = AppState.workouts.find(x=>x.workout_id===b.dataset.fav);
        if (w){ w.favorite = !w.favorite; Store.save(Store.keys.workouts, AppState.workouts); renderList(); }
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
          renderList();
        }
      });
    }

    // Init
    renderList();
    document.getElementById('filterFocus').onchange = renderList;
    document.getElementById('filterCat').onchange   = renderList;
    document.querySelectorAll('.eq-have').forEach(c => c.onchange = renderList);
  }
};

window.Library = Library;
