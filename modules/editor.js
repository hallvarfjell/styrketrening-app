
// Editor:
// - Venstre: "Filter øvelser" (utstyr, RPE i dropdown, Lydnivå i dropdown, kategori (tekst), fokus (dropdown), søk).
// - Høyre: "Bygg økt" (øverst), "Legg til øvelse" (midten), "Øvelsesbibliotek import/eksport" (nederst).
// - Legg ny øvelse øverst i lista (sortering på created_at desc).
// - Slett øvelse-knapp i øvelsesoversikten sletter fra biblioteket (og fjerner fra ALLE økter).
// - Når øvelse legges i økt → bruk e.default_duration_sec hvis satt, ellers 60.
// - Nye økter får created_at ved lagring (slik at Øktvelger kan sortere nye økter øverst).

const Editor = {
  render(existing=null){
    const w = existing || { workout_id:`WK${Date.now()}`, name:'', category:'Styrke/Spenst', focus_area:'Hele kroppen', favorite:false, pause_between_items_sec:10, items:[], created_at: Date.now() };

    // Dynamiske oppslagslister
    const eqSet = new Set();
    const rpeSet = new Set();
    const noiseSet = new Set();
    (AppState.exercises || []).forEach(e => {
      (e.equipment || []).forEach(eq => { if (eq && eq !== 'nei') eqSet.add(eq); });
      if (typeof e.rpe === 'number' && !Number.isNaN(e.rpe)) rpeSet.add(e.rpe);
      if (e.noise_level) noiseSet.add(e.noise_level);
    });
    const allEquipment = Array.from(eqSet).sort();           // uten 'nei'
    const allRpe       = Array.from(rpeSet).sort((a,b)=>a-b);
    const allNoise     = Array.from(noiseSet).sort((a,b)=>String(a).localeCompare(String(b)));

    render(`
      <div class="grid-2">
        <!-- VENSTRE KOLONNE: FILTER ØVELSER -->
        <div>
          <div class="card">
            <h3>Filter øvelser</h3>

            <div class="flex">
              <select id="fFocus" class="input">
                <option value="">Fokus (alle)</option>
                <option>Overkropp</option>
                <option>Underkropp</option>
                <option>Hele kroppen</option>
              </select>
              <input id="fCat" class="input" placeholder="Kategori" />
            </div>

            <div class="flex">
              <input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" />
            </div>

            <div class="small" style="margin-top:8px;">Utstyr:</div>
            <div class="flex" id="fEquip">
              ${allEquipment.map(eq => `
                <label><input type="checkbox" class="f-eq" value="${eq}"> ${eq}</label>
              `).join(' ')}
            </div>

            <div class="flex" style="margin-top:8px;">
              <select id="fRpe" class="input">
                <option value="">RPE</option>
                ${allRpe.map(v => `<option value="${v}">${v}</option>`).join('')}
              </select>
              <select id="fNoise" class="input">
                <option value="">Lydnivå</option>
                ${allNoise.map(v => `<option value="${v}">${v}</option>`).join('')}
              </select>
            </div>

            <div id="exlist" style="margin-top:12px;"></div>
          </div>
        </div>

        <!-- HØYRE KOLONNE -->
        <div>
          <!-- BYGG ØKT (øverst) -->
          <div class="card">
            <h3>Bygg økt</h3>
            <input id="name" class="input" placeholder="Øktnavn" value="${w.name}" />
            <div class="flex">
              <input id="cat"   class="input" placeholder="Kategori" value="${w.category}" />
              <select id="focus" class="input">
                <option>Hele kroppen</option>
                <option>Overkropp</option>
                <option>Underkropp</option>
              </select>
            </div>
            <div id="items"></div>
            <div class="flex">
              <button class="button" id="save">Lagre økt</button>
            </div>
          </div>

          <!-- LEGG TIL ØVELSE (midten) -->
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
              <select id="new_focus" class="input">
                <option>Hele kroppen</option>
                <option>Overkropp</option>
                <option>Underkropp</option>
              </select>
            </div>
            <div class="flex">
              <input id="new_equip" class="input" placeholder="Utstyr (kommaseparert)" list="equipmentList" />
              <datalist id="equipmentList">
                ${allEquipment.map(eq => `<option value="${eq}">`).join('')}
              </datalist>
              <select id="new_noise" class="input">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <button class="button" id="addExercise">Legg til øvelse</button>
          </div>

          <!-- ØVELSESBIBLIOTEK (nederst) -->
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
          // progression_tips inn i description (ikke egen kolonne)
          const desc = (r.description || '');
          const prog = (r.progression_tips || '').trim();
          const fullDesc = prog ? `${desc}\nProgresjon: ${prog}` : desc;
          // equipment normaliseres (uten 'nei')
          const equipments = (r.equipment || '')
            .replace(/;/g, ',')
            .split(',')
            .map(x=>x.trim())
            .filter(Boolean)
            .filter(x => x !== 'nei');

          return {
            exercise_id:           r.exercise_id || `EX${Date.now()}`,
            name:                  r.name,
            description:           fullDesc,
            default_duration_sec:  Number(r.default_duration_sec || 60),
            rpe:                   Number(r.rpe || 5),
            category:              r.category,
            focus_area:            r.focus_area,
            equipment:             equipments,            // tom array = ingen utstyr
            noise_level:           r.noise_level || 'Low',
            created_at:            Number(r.created_at || Date.now())
          };
        });
        Store.save(Store.keys.exercises, AppState.exercises);
        alert(`Importert ${AppState.exercises.length} øvelser.`);
        Editor.render(w); // re-render: filter, datalist og rekkefølge oppdateres
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

    // --- Legg til ny øvelse: nye øvelser øverst (created_at nå) ---
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
        .filter(Boolean)
        .filter(x => x !== 'nei');

      const ex = {
        exercise_id: `EX${Date.now()}`,
        name,
        description: desc,
        default_duration_sec: Number.isFinite(dur) ? dur : 60,
        rpe: Number.isFinite(rpe) ? rpe : 5,
        category: cat || 'Styrke/Spenst',
        focus_area: focus,
        equipment: equip, // tom array = ingen utstyr
        noise_level: noise,
        created_at: Date.now()
      };

      // Legg øverst: enten unshift, eller push + sort ved rendering — vi velger unshift for rask respons.
      AppState.exercises.unshift(ex);
      Store.save(Store.keys.exercises, AppState.exercises);
      alert('Øvelse lagt til');
      Editor.render(w); // re-render for å oppdatere filter/datalist og sortering
    };

    // --- Filter & liste over øvelser ---
    function matchesFilters(e){
      const fFocus  = document.getElementById('fFocus').value;
      const fCat    = (document.getElementById('fCat').value || '').trim().toLowerCase();
      const fSearch = (document.getElementById('fSearch').value || '').trim().toLowerCase();

      const selectedEq   = Array.from(document.querySelectorAll('.f-eq:checked')).map(c=>c.value);
      const selectedRpe  = document.getElementById('fRpe').value;
      const selectedNoise= document.getElementById('fNoise').value;

      if (fFocus && e.focus_area !== fFocus) return false;
      if (fCat && !(e.category || '').toLowerCase().includes(fCat)) return false;

      const text = `${e.name || ''} ${e.description || ''}`.toLowerCase();
      if (fSearch && !text.includes(fSearch)) return false;

      // Utstyr: hvis ingen valgt → ingen begrensning; ellers må alle krav (unntatt 'nei') være subset
      const req = (e.equipment || []).filter(eq => eq !== 'nei');
      if (selectedEq.length && !req.every(eq => selectedEq.includes(eq))) return false;

      // RPE dropdown: eksakt lik valgt verdi
      if (selectedRpe && String(e.rpe) !== selectedRpe) return false;

      // Noise dropdown
      if (selectedNoise && (e.noise_level || 'Low') !== selectedNoise) return false;

      return true;
    }

    function renderExercises(){
      const list = (AppState.exercises || []).filter(matchesFilters);

      // Nye øvelser øverst: sorter på created_at desc
      list.sort((a,b) => Number(b.created_at||0) - Number(a.created_at||0));

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

      // Legg til øvelse i økt – bruk spesifikk varighet
      document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
        const ex = AppState.exercises.find(x=>x.exercise_id===b.dataset.add);
        const dur = Number(ex?.default_duration_sec || 60);
        w.items.push({ exercise_id: ex.exercise_id, duration_sec: dur });
        renderItems();
      });

      // Slett øvelse fra biblioteket (og fjern fra ALLE økter)
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const eid = b.dataset.del;
        const idx = AppState.exercises.findIndex(x=>x.exercise_id===eid);
        if (idx>=0 && confirm('Slette øvelsen?')) {
          AppState.exercises.splice(idx,1);
          Store.save(Store.keys.exercises, AppState.exercises);
          // Fjern fra ALLE økter
          AppState.workouts.forEach(W => {
            if (Array.isArray(W.items)) {
              W.items = W.items.filter(it => it.exercise_id !== eid);
            }
          });
          Store.save(Store.keys.workouts, AppState.workouts);
          // Også fra pågående økt i editor
          w.items = (w.items||[]).filter(it => it.exercise_id !== eid);
          Editor.render(w);
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

    // Init listene
    renderExercises(); renderItems();

    // Filter-hendelser
    document.getElementById('fFocus').onchange = renderExercises;
    document.getElementById('fCat').oninput    = renderExercises;
    document.getElementById('fSearch').oninput = renderExercises;
    document.querySelectorAll('.f-eq').forEach(c => c.onchange = renderExercises);
    document.getElementById('fRpe').onchange   = renderExercises;
    document.getElementById('fNoise').onchange = renderExercises;

    // Lagre økt (sett created_at hvis ny)
    document.getElementById('save').onclick = () => {
      w.name       = document.getElementById('name').value || 'Ny økt';
      w.category   = document.getElementById('cat').value || 'Styrke/Spenst';
      w.focus_area = document.getElementById('focus').value;
      if (!w.created_at) w.created_at = Date.now();

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
      if (idx>=0) AppState.workouts[idx] = w; else AppState.workouts.unshift(w); // nye økter legges øverst
      Store.save(Store.keys.workouts, AppState.workouts);
      alert('Økt lagret.');
      Library.render(); setActive('library');
    };
  }
};

window.Editor = Editor;
``
