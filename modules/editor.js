
// Editor: venstre = Filter øvelser. Høyre (øverst→nederst) = Bygg økt, Legg til øvelse, Øvelsesbibliotek (import/eksport).
// Filter inkluderer: utstyr (dynamisk), RPE, støy (noise), kategori, fokus, søk.
// Legg til øvelse: kun placeholders, utstyr med autocomplete (datalist) + mulighet for nye.
// Når øvelse legges i økt → bruk default_duration_sec fra øvelsesbiblioteket (ellers 60).
// Slett øvelse fra bibliotek støttes.

const Editor = {
  render(existing=null){
    const w = existing || { workout_id:`WK${Date.now()}`, name:'', category:'Styrke/Spenst', focus_area:'Hele kroppen', favorite:false, pause_between_items_sec:10, items:[] };

    // Dynamisk utstyrs-union (for filter og autocomplete)
    const equipmentSet = new Set();
    (AppState.exercises || []).forEach(e => (e.equipment || []).forEach(eq => { if (eq) equipmentSet.add(eq); }));
    const allEquipment = Array.from(equipmentSet).sort(); // inkl. 'nei'

    render(`
      <div class="grid-2">
        <!-- VENSTRE KOLONNE: FILTER ØVELSER -->
        <div>
          <div class="card">
            <h3>Filter øvelser</h3>
            <div class="flex">
              <select id="fFocus" class="input"><option value="">Fokus (alle)</option><option>Overkropp</option><option>Underkropp</option><option>Hele kroppen</option></select>
              <input id="fCat" class="input" placeholder="Kategori (f.eks. Styrke/Spenst)" />
            </div>
            <div class="flex">
              <input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" />
            </div>
            <div>
              <div class="small" style="margin-top:8px;">Utstyr (velg alle som er relevante):</div>
              <div class="flex" id="fEquip">
                ${allEquipment.map(eq => `
                  <label><input type="checkbox" class="f-eq" value="${eq}"> ${eq}</label>
                `).join(' ')}
              </div>
            </div>
            <div class="flex" style="margin-top:8px;">
              <input id="fRpeMin" type="number" min="1" max="9" class="input" placeholder="RPE min (1-9)" />
              <input id="fRpeMax" type="number" min="1" max="9" class="input" placeholder="RPE max (1-9)" />
            </div>
            <div class="flex">
              <label><input type="checkbox" class="f-noise" value="Low"> Low</label>
              <label><input type="checkbox" class="f-noise" value="Medium"> Medium</label>
              <label><input type="checkbox" class="f-noise" value="High"> High</label>
            </div>
            <div id="exlist" style="margin-top:12px;"></div>
          </div>
        </div>

        <!-- HØYRE KOLONNE -->
        <div>
          <!-- Øverst: BYGG ØKT -->
          <div class="card">
            <h3>Bygg økt</h3>
            <input id="name" class="input" placeholder="Øktnavn" value="${w.name}" />
            <div class="flex">
              <input id="cat"   class="input" placeholder="Kategori" value="${w.category}" />
              <select id="focus" class="input"><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div id="items"></div>
            <div class="flex">
              <button class="button" id="save">Lagre økt</button>
            </div>
          </div>

          <!-- Under: LEGG TIL ØVELSE (kun placeholders + autocomplete for utstyr) -->
          <div class="card">
            <h3>Legg til øvelse</h3>
            <input id="new_name"        class="input" placeholder="Navn" />
            <textarea id="new_desc"     class="input" placeholder="Beskrivelse (inkl. progresjonstips om ønsket)"></textarea>
            <div class="flex">
              <input id="new_duration"  class="input" placeholder="Default varighet (sek)" />
              <input id="new_rpe"       class="input" placeholder="RPE (1-9)" />
            </div>
            <div class="flex">
              <input id="new_cat"   class="input" placeholder="Kategori" />
              <select id="new_focus" class="input"><option>Hele kroppen</option><option>Overkropp</option><option>Underkropp</option></select>
            </div>
            <div class="flex">
              <input id="new_equip" class="input" placeholder="Utstyr (kommaseparert)" list="equipmentList" />
              <datalist id="equipmentList">
                ${allEquipment.map(eq => `<option value="${eq}">`).join('')}
              </datalist>
              <select id="new_noise" class="input"><option>Low</option><option>Medium</option><option>High</option></select>
            </div>
            <button class="button" id="addExercise">Legg til øvelse</button>
          </div>

          <!-- Nederst: ØVELSESBIBLIOTEK IMPORT/EKSPORT -->
          <div class="card">
            <h3>Øvelsesbibliotek</h3>
            <div class="flex">
              <input type="file" id="excsv" accept=".csv" />
              <div style="margin-left:auto">
                <button class="button" id="eximport">Importer øvelser (CSV)</button>
                <button class="button secondary" id="exportEx">Eksporter øvelser (CSV)</button>
              </div>
            </div>
            <div class="small">CSV er <strong>semikolondelt</strong>. Hvis kolonnen <code>progression_tips</code> finnes, appendes den til <code>description</code>.</div>
          </div>
        </div>
      </div>
    `);

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

          // equipment: normaliser til array (kommaseparert / semikolon)
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
            equipment:             equipments.length ? equipments : ['nei'],
            noise_level:           r.noise_level || 'Low'
          };
        });
        Store.save(Store.keys.exercises, AppState.exercises);
        alert(`Importert ${AppState.exercises.length} øvelser.`);
        Editor.render(w); // re-render for å oppdatere utstyrslister/filter dynamisk
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

    // --- Legg til ny øvelse (placeholders; utstyr via datalist + fritekst) ---
    document.getElementById('addExercise').onclick = () => {
      const name  = (document.getElementById('new_name').value || '').trim();
      const desc  = (document.getElementById('new_desc').value || '').trim();
      const dur   = Number(document.getElementById('new_duration').value || NaN);
      const rpe   = Number(document.getElementById('new_rpe').value || NaN);
      const cat   = (document.getElementById('new_cat').value || '').trim();
      const focus = document.getElementById('new_focus').value;
      const equipStr = (document.getElementById('new_equip').value || '').trim();
      const noise = document.getElementById('new_noise').value;

      if (!name) return alert('Navn mangler');
      const equip = equipStr
        .replace(/;/g, ',')
        .split(',')
        .map(x=>x.trim())
        .filter(Boolean);

      const ex = {
        exercise_id: `EX${Date.now()}`,
        name,
        description: desc,
        default_duration_sec: Number.isFinite(dur) ? dur : 60,
        rpe: Number.isFinite(rpe) ? rpe : 5,
        category: cat || 'Styrke/Spenst',
        focus_area: focus,
        equipment: equip.length ? equip : ['nei'],
        noise_level: noise
      };
      AppState.exercises.push(ex);
      Store.save(Store.keys.exercises, AppState.exercises);
      alert('Øvelse lagt til');
      Editor.render(w); // re-render for å oppdatere filter og utstyrs-autocomplete
    };

    // --- Filter & liste over øvelser ---
    function matchesFilters(e){
      const fFocus = document.getElementById('fFocus').value;
      const fCat   = (document.getElementById('fCat').value || '').trim().toLowerCase();
      const fSearch= (document.getElementById('fSearch').value || '').trim().toLowerCase();

      const selectedEq = Array.from(document.querySelectorAll('.f-eq:checked')).map(c=>c.value);
      const rpeMinVal = Number(document.getElementById('fRpeMin').value || NaN);
      const rpeMaxVal = Number(document.getElementById('fRpeMax').value || NaN);
      const selectedNoise = Array.from(document.querySelectorAll('.f-noise:checked')).map(c=>c.value);

      // Fokus
      if (fFocus && e.focus_area !== fFocus) return false;
      // Kategori (delstreng)
      if (fCat && !(e.category || '').toLowerCase().includes(fCat)) return false;
      // Søk (navn + beskrivelse)
      const text = `${e.name || ''} ${e.description || ''}`.toLowerCase();
      if (fSearch && !text.includes(fSearch)) return false;
      // Utstyr: hvis ingenting valgt, ingen begrensning; ellers må alle e.equipment (unntatt 'nei') være subset av valgt
      const req = (e.equipment || []).filter(eq => eq !== 'nei');
      if (selectedEq.length && !req.every(eq => selectedEq.includes(eq))) return false;
      // RPE
      if (Number.isFinite(rpeMinVal) && (e.rpe || 0) < rpeMinVal) return false;
      if (Number.isFinite(rpeMaxVal) && (e.rpe || 0) > rpeMaxVal) return false;
      // Noise
      if (selectedNoise.length && !selectedNoise.includes(e.noise_level || 'Low')) return false;

      return true;
    }

    function renderExercises(){
      const list = (AppState.exercises || []).filter(matchesFilters);
      const html = list.map(e=>`
        <div class="card">
          <div><strong>${e.name}</strong> <span class="small">${e.category} • ${e.focus_area}</span></div>
          <div class="small">${(e.description||'').replace(/\n/g,'<br>')}</div>
          <div class="flex">
            <button class="button" data-add="${e.exercise_id}">Legg til i økt (${Number(e.default_duration_sec||60)}s)</button>
            <button class="button secondary" data-del="${e.exercise_id}">Slett øvelse</button>
          </div>
        </div>
      `).join('');
      document.getElementById('exlist').innerHTML = html || '<div class="card small">Ingen øvelser matcher filteret.</div>';

      // Legg til øvelsen i økt – bruker spesifikk varighet hvis finnes
      document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
        const ex = AppState.exercises.find(x=>x.exercise_id===b.dataset.add);
        const dur = Number(ex?.default_duration_sec || 60);
        w.items.push({ exercise_id: ex.exercise_id, duration_sec: dur });
        renderItems();
      });

      // Slett øvelse
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const eid = b.dataset.del;
        const idx = AppState.exercises.findIndex(x=>x.exercise_id===eid);
        if (idx>=0 && confirm('Slette øvelsen?')) {
          AppState.exercises.splice(idx,1);
          Store.save(Store.keys.exercises, AppState.exercises);
          // Fjern øvelsen fra pågående økt hvis den var med
          w.items = (w.items||[]).filter(it => it.exercise_id !== eid);
          Store.save(Store.keys.workouts, AppState.workouts);
          Editor.render(w); // re-render for å oppdatere filter/utstyrs-autocomplete og items
        }
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

    // Init
    renderExercises(); renderItems();

    // Filter-hendelser
    document.getElementById('fFocus').onchange = renderExercises;
    document.getElementById('fCat').oninput    = renderExercises;
    document.getElementById('fSearch').oninput = renderExercises;
    document.querySelectorAll('.f-eq').forEach(c => c.onchange = renderExercises);
    document.getElementById('fRpeMin').oninput = renderExercises;
    document.getElementById('fRpeMax').oninput = renderExercises;
    document.querySelectorAll('.f-noise').forEach(c => c.onchange = renderExercises);

    // Lagre økt
    document.getElementById('save').onclick = () => {
      w.name       = document.getElementById('name').value || 'Ny økt';
      w.category   = document.getElementById('cat').value || 'Styrke/Spenst';
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
