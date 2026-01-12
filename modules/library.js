
// Øktvelger: importer/eksporter økter (CSV, semikolon), favoritter, filtrering/sortering etter utstyr

const Library = {
  render(){
    render(`
      <div class="card">
        <h2>Importer/eksporter økter (CSV)</h2>
        <div class="flex">
          <div style="flex:1">
            <input type="file" id="wkcsv" accept=".csv" />
          </div>
          <div style="flex:1; text-align:right">
            <button class="button" id="wkimport">Importer økter (CSV)</button>
            <button class="button secondary" id="exportWk">Eksporter økter (CSV)</button>
          </div>
        </div>
        <div class="small">CSV er <strong>semikolondelt</strong>. Feltet <code>items</code> bruker <strong>|</strong> mellom øvelser (f.eks. <code>EX001:60|EX002:60</code>).</div>
      </div>

      <div class="card">
        <h2>Utstyr jeg har tilgjengelig</h2>
        <div class="flex">
          ${['nei','boks','step','strikk','medisinball','hoppetau'].map(eq=>`
            <label><input type="checkbox" class="eq-have" value="${eq}"> ${eq.charAt(0).toUpperCase()}${eq.slice(1)}</label>
          `).join(' ')}
        </div>
        <label class="small"><input type="checkbox" id="onlyCompatible"> Vis kun økter som passer valgt utstyr</label>
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
          }).filter(Boolean)
        }));
        Store.save(Store.keys.workouts, AppState.workouts);
        alert(`Importert ${AppState.workouts.length} økter.`);
        renderList(); // oppdater visningen umiddelbart
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

    // Render listen (med filter/sortering etter utstyr)
    function renderList(){
      const focus = document.getElementById('filterFocus').value;
      const cat   = document.getElementById('filterCat').value;
      const have  = Array.from(document.querySelectorAll('.eq-have:checked')).map(c=>c.value);
      const only  = document.getElementById('onlyCompatible').checked;

      // Avled utstyr pr. økt (fra øvelser)
      const getEquipForWorkout = (w) => {
        const s = new Set();
        (w.items||[]).forEach(it => {
          const ex = AppState.exercises.find(e=>e.exercise_id===it.exercise_id);
          (ex?.equipment||[]).forEach(eq => s.add(eq));
        });
        return Array.from(s);
      };

      // Filtrer på fokus/kategori
      let list = AppState.workouts.slice();
      if (focus) list = list.filter(w=>w.focus_area===focus);
      if (cat)   list = list.filter(w=>w.category  ===cat);

      // Filtrer på utstyr (valgfritt)
      if (only && have.length){
        list = list.filter(w => {
          const req = getEquipForWorkout(w);
          return req.every(eq => have.includes(eq) || eq==='nei'); // krever ikke annet enn tilgjengelig
        });
      }

      // Sorter: økter som passer valgt utstyr først
      if (have.length){
        list.sort((a,b) => {
          const reqA = getEquipForWorkout(a);
          const reqB = getEquipForWorkout(b);
          const compA = reqA.every(eq => have.includes(eq) || eq==='nei');
          const compB = reqB.every(eq => have.includes(eq) || eq==='nei');
          if (compA && !compB) return -1;
          if (!compA && compB) return  1;
          // sekundærsortering: færrest krav først
          return reqA.length - reqB.length;
        });
      }

      const html = list.map(w => `
        <div class="card">
          <div><strong>${w.name}</strong> <span class="small">${w.category} • ${w.focus_area}</span></div>
          <div class="small">Utstyr: ${(getEquipForWorkout(w).join(', ') || 'nei')}</div>
          <div class="flex">
            <button class="button" data-start="${w.workout_id}">Start</button>
            <button class="button secondary" data-fav="${w.workout_id}">${w.favorite?'★ Favoritt':'☆ Merk favoritt'}</button>
            <button class="button secondary" data-edit="${w.workout_id}">Rediger</button>
          </div>
        </div>
      `).join('');

      document.getElementById('wklist').innerHTML = html || '<div class="card small">Ingen økter. Importer eller lag i editor.</div>';

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
    }

    // Init
    renderList();
    document.getElementById('filterFocus').onchange = renderList;
    document.getElementById('filterCat').onchange   = renderList;
    document.querySelectorAll('.eq-have').forEach(c => c.onchange = renderList);
    document.getElementById('onlyCompatible').onchange = renderList;
  }
};

window.Library = Library;
