
<script>
// Editor: filter øvelser, bygg økt, lagre; IMPORT/EXPORT av øvelser; Legg til ny øvelse

const Editor = {
  render(existing=null){
    const w = existing || { workout_id:`WK${Date.now()}`, name:'', category:'Styrke/Spenst', focus_area:'Hele kroppen', favorite:false, pause_between_items_sec:10, items:[] };

    render(`
      <!-- Øvelsesbibliotek: import, eksport, legg til ny øvelse -->
      <div class="card">
        <h2>Øvelsesbibliotek</h2>
        <div class="flex">
          <input type="file" id="excsv" accept=".csv" />
          <div style="margin-left:auto">
            <button class="button" id="eximport">Importer øvelser (CSV)</button>
            <button class="button secondary" id="exportEx">Eksporter øvelser (CSV)</button>
          </div>
        </div>
        <div class="small">CSV er <strong>semikolondelt</strong>. Ved import, hvis kolonnen <code>progression_tips</code> finnes, appendes den til <code>description</code> (ingen egen kolonne).</div>

        <h3 style="margin-top:12px;">Legg til ny øvelse</h3>
        <div class="grid-2">
          <div class="card">
            <input id="new_name"        class="input" placeholder="Navn" />
            <textarea id="new_desc"     class="input" placeholder="Beskrivelse (inkl. progresjonstips om ønsket)"></textarea>
            <div class="flex">
              <input id="new_duration"  class="input" placeholder="Default varighet (sek)" value="60" />
              <input id="new_rpe"       class="input" placeholder="RPE (1-9)" value="5" />
            </div>
            <div class="flex">
              <select id="new_cat"   class="input"><option>Styrke/Spenst</option><option>Balanse/Stabilisering</option><option>Mobilitet/Tøying</option></select>
              <select id="new_focus" class="input"><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div class="flex">
              <input id="new_equip" class="input" placeholder="Utstyr (kommaseparert: nei,boks,step,strikk,medisinball,hoppetau)" />
              <select id="new_noise" class="input"><option>Low</option><option>Medium</option><option>High</option></select>
            </div>
            <button class="button" id="addExercise">Legg til øvelse</button>
          </div>

          <!-- Filter & liste over øvelser -->
          <div class="card">
            <h3>Filter øvelser</h3>
            <div class="flex">
              <select id="fFocus" class="input"><option value="">Alle</option><option>Overkropp</option><option>Underkropp</option><option>Hele kroppen</option></select>
              <select id="fCat"   class="input"><option value="">Alle</option><option>Styrke/Spenst</option><option>Balanse/Stabilisering</option><option>Mobilitet/Tøying</option></select>
            </div>
            <div id="exlist"></div>
          </div>
        </div>
      </div>

      <!-- Bygg økt -->
      <div class="grid-2">
        <div></div>
        <div>
          <div class="card">
            <h3>Bygg økt</h3>
            <input id="name" class="input" placeholder="Øktnavn" value="${w.name}" />
            <div class="flex">
              <select id="cat"   class="input"><option>Styrke/Spenst</option><option>Balanse/Stabilisering</option><option>Mobilitet/Tøying</option></select>
              <select id="focus" class="input"><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div id="items"></div>
            <div class="flex">
              <button class="button" id="save">Lagre økt</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById('cat').value   = w.category;
    document.getElementById('focus').value = w.focus_area;

    // --- Import øvelser (CSV semikolon) ---
    document.getElementById('eximport').onclick = () => {
      const file = document.getElementById('excsv').files[0];
      if (!file) return alert('Velg øvelses-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.exercises = rows.map(r => {
          // progression_tips fjernet — append til description hvis finnes
          const desc = (r.description || '');
          const prog = (r.progression_tips || '').trim();
          const fullDesc = prog ? `${desc}\nProgresjon: ${prog}` : desc;

          // equipment kan være kommaseparert eller semikolon — normaliser til array
          const equipments = (r.equipment || '')
            .replace(/;/g, ',')
            .split(',')
            .map(x=>x.trim())
            .filter(Boolean);

          return {
            exercise_id:           r.exercise_id || `EX${Date.now()}`,
            name:                  r.name,
            description:           fullDesc,
            default_duration_sec:  Number(r.default_duration_sec || 60),
            rpe:                   Number(r.rpe || 5),
            category:              r.category,
            focus_area:            r.focus_area,
            equipment:             equipments,
            noise_level:           r.noise_level || 'Low'
          };
        });
        Store.save(Store.keys.exercises, AppState.exercises);
        alert(`Importert ${AppState.exercises.length} øvelser.`);
        renderExercises(); // oppdater liste
      };
      reader.readAsText(file);
    };

    // --- Eksport øvelser (CSV semikolon + BOM + sitering) ---
    document.getElementById('exportEx').onclick = () => {
      const headers = ['exercise_id','name','description','default_duration_sec','rpe','category','focus_area','equipment','noise_level'];
      const rows = AppState.exercises.map(e => [
        e.exercise_id, e.name, e.description, e.default_duration_sec, e.rpe, e.category, e.focus_area, (e.equipment||[]).join(','), e.noise_level
      ]);
      const csv = Util.toCSV(headers, rows, ';');
      Util.download('exercises.csv', csv, 'text/csv');
    };

    // --- Legg til ny øvelse ---
    document.getElementById('addExercise').onclick = () => {
      const name  = (document.getElementById('new_name').value || '').trim();
      const desc  = (document.getElementById('new_desc').value || '').trim();
      const dur   = Number(document.getElementById('new_duration').value || 60);
      const rpe   = Number(document.getElementById('new_rpe').value || 5);
      const cat   = document.getElementById('new_cat').value;
      const focus = document.getElementById('new_focus').value;
      const equip = (document.getElementById('new_equip').value || '')
                      .replace(/;/g, ',')
                      .split(',')
                      .map(x=>x.trim())
                      .filter(Boolean);
      const noise = document.getElementById('new_noise').value;

      if (!name) return alert('Navn mangler');
      const ex = {
        exercise_id: `EX${Date.now()}`,
        name, description: desc,
        default_duration_sec: dur, rpe, category: cat, focus_area: focus,
        equipment: equip.length? equip : ['nei'],
        noise_level: noise
      };
      AppState.exercises.push(ex);
      Store.save(Store.keys.exercises, AppState.exercises);
      alert('Øvelse lagt til');
      renderExercises();
    };

    // --- Filter & liste over øvelser ---
    function renderExercises(){
      const fFocus = document.getElementById('fFocus').value;
      const fCat   = document.getElementById('fCat').value;
      let list = AppState.exercises.slice();
      if (fFocus) list = list.filter(e=>e.focus_area===fFocus);
      if (fCat)   list = list.filter(e=>e.category===fCat);
      const html = list.map(e=>`
        <div class="card">
          <div><strong>${e.name}</strong> <span class="small">${e.category} • ${e.focus_area}</span></div>
          <div class="small">${(e.description||'').replace(/\n/g,'<br>')}</div>
          <button class="button" data-add="${e.exercise_id}">Legg til i økt (01:00)</button>
        </div>
      `).join('');
      document.getElementById('exlist').innerHTML = html || '<div class="card small">Ingen øvelser. Importer eller legg til nye.</div>';
      document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
        w.items.push({ exercise_id: b.dataset.add, duration_sec: 60 });
        renderItems();
      });
    }

    function renderItems(){
      const html = (w.items||[]).map((it, idx) => {
        const e = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        const name = e?e.name:it.exercise_id;
        return `
        <div class="card">
          <div><strong>${name}</strong></div>
          <div class="flex">
            <input class="input" value="${Util.fmtMMSS(it.duration_sec)}" data-dur="${idx}" />
            <button class="button secondary" data-up="${idx}">▲</button>
            <button class="button secondary" data-down="${idx}">▼</button>
            <button class="button secondary" data-del="${idx}">Fjern</button>
          </div>
        </div>`;
      }).join('');
      document.getElementById('items').innerHTML = html || '<div class="card small">Ingen øvelser i økta ennå.</div>';
      document.querySelectorAll('[data-dur]').forEach(inp => inp.onchange = () => {
        const i = Number(inp.dataset.dur);
        w.items[i].duration_sec = Util.parseMMSS(inp.value);
      });
      document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.up);
        if (i>0){ const t=w.items[i]; w.items.splice(i,1); w.items.splice(i-1,0,t); renderItems(); }
      });
      document.querySelectorAll('[data-down]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.down);
        if (i<w.items.length-1){ const t=w.items[i]; w.items.splice(i,1); w.items.splice(i+1,0,t); renderItems(); }
      });
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.del);
        w.items.splice(i,1); renderItems();
      });
    }

    renderExercises(); renderItems();

    document.getElementById('fFocus').onchange = renderExercises;
    document.getElementById('fCat').onchange   = renderExercises;

    // --- Lagre økt ---
    document.getElementById('save').onclick = () => {
      w.name       = document.getElementById('name').value || 'Ny økt';
      w.category   = document.getElementById('cat').value;
      w.focus_area = document.getElementById('focus').value;

      // Beregn (utstyr, lydnivå, RPE, total tid)
      const equipSet = new Set(); let rpeSum=0, rpeCount=0; const noiseLevels={Low:1,Medium:2,High:3}; let noiseMax=1;
      (w.items||[]).forEach(it => {
        const e = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        if (e){
          (e.equipment||[]).forEach(eq => equipSet.add(eq));
          rpeSum += (e.rpe||5); rpeCount++;
          noiseMax = Math.max(noiseMax, noiseLevels[e.noise_level||'Low']||1);
        }
      });
      w.computed = {
        total_time_sec: (w.items||[]).reduce((a,b)=>a+b.duration_sec,0) + ((w.items||[]).length-1)*w.pause_between_items_sec,
        equipment: Array.from(equipSet),
        noise_level: noiseMax===3?'High':(noiseMax===2?'Medium':'Low'),
        rpe_avg: rpeCount ? (rpeSum/rpeCount) : 5
      };

      const idx = AppState.workouts.findIndex(x=>x.workout_id===w.workout_id);
      if (idx>=0) AppState.workouts[idx] = w; else AppState.workouts.push(w);
      Store.save(Store.keys.workouts, AppState.workouts);
      alert('Økt lagret.');
      Library.render(); setActive('library');
    };
  }
};

window.Editor = Editor;
</script>
