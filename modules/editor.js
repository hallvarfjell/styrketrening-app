
// modules/editor.js

// Editor:
// - VENSTRE: Bygg økt (inkl pause-min felt), Legg til øvelse (RPE = Lav/Medium/Høy, "Varighet (s)", Lydnivå over utstyr), Øvelsesbibliotek.
// - HØYRE: Filter øvelser (dropdowns + flervalg for utstyr + søk).
// - Predef øvelser kan limes i library.js (og/eller her senere om ønskelig); seeding skjer i Library når localStorage er tom.
// - Slett øvelse-knapp fjerner øvelsen fra biblioteket og fra alle økter (samt pågående økt).

const Editor = {
  render(existing=null){
    const w = existing || { workout_id:`WK${Date.now()}`, name:'', category:'', focus_area:'Hele kroppen', favorite:false, pause_between_items_sec:10, items:[], created_at: Date.now() };

    // Samle dynamiske oppslagslister fra øvelsesbiblioteket
    const eqSet    = new Set();
    const catSet   = new Set();
    const focusSet = new Set();
    const noiseSet = new Set();
    (AppState.exercises || []).forEach(e => {
      (e.equipment || []).forEach(eq => { if (eq) eqSet.add(eq); });
      if (e.category)    catSet.add(e.category);
      if (e.focus_area)  focusSet.add(e.focus_area);
      if (e.noise_level) noiseSet.add(e.noise_level);
    });
    const allEquipment = Array.from(eqSet).sort();
    const allCategories= Array.from(catSet).sort((a,b)=>String(a).localeCompare(String(b)));
    const allFocus     = Array.from(focusSet).sort((a,b)=>String(a).localeCompare(String(b)));
    const allNoise     = Array.from(noiseSet).sort((a,b)=>String(a).localeCompare(String(b)));

    render(`
      <div class="grid-2">
        <!-- VENSTRE: BYGG ØKT, LEGG TIL ØVELSE, ØVELSESBIBLIOTEK -->
        <div>
          <!-- BYGG ØKT -->
          <div class="card">
            <h3>Bygg økt</h3>
            <input id="name" class="input" placeholder="Øktnavn" value="${w.name}" />
            <div class="flex">
              <input id="cat" class="input" placeholder="Kategori" value="${w.category || ''}" list="categoryList" />
              <datalist id="categoryList">
                ${allCategories.map(c=>`<option value="${c}">`).join('')}
              </datalist>
              <select id="focus" class="input">
                ${allFocus.length ? allFocus.map(v=>`<option ${w.focus_area===v?'selected':''}>${v}</option>`).join('') : `
                  <option ${w.focus_area==='Hele kroppen'?'selected':''}>Hele kroppen</option>
                  <option ${w.focus_area==='Overkropp'?'selected':''}>Overkropp</option>
                  <option ${w.focus_area==='Underkropp'?'selected':''}>Underkropp</option>`}
              </select>
            </div>
            <div class="flex">
              <input id="pauseSec" class="input" placeholder="Pause mellom øvelser (s)" value="${Number(w.pause_between_items_sec||10)}" />
            </div>
            <div id="items"></div>
            <div class="flex">
              <button class="button" id="save">Lagre økt</button>
            </div>
          </div>

          <!-- LEGG TIL ØVELSE -->
          <div class="card">
            <h3>Legg til øvelse</h3>
            <input id="new_name"        class="input" placeholder="Navn" />
            <textarea id="new_desc"     class="input" placeholder="Beskrivelse (inkl. progresjonstips om ønsket)"></textarea>
            <div class="flex">
              <input id="new_duration"  class="input" placeholder="Varighet (s)" />
              <select id="new_rpe"      class="input">
                <option value="">RPE</option>
                <option value="Lav">Lav</option>
                <option value="Medium">Medium</option>
                <option value="Høy">Høy</option>
              </select>
            </div>

            <div class="flex">
              <input id="new_noise" class="input" placeholder="Lydnivå" list="noiseList" />
              <datalist id="noiseList">
                ${allNoise.map(n=>`<option value="${n}">`).join('')}
              </datalist>
            </div>

            <div class="flex">
              <input id="new_cat"   class="input" placeholder="Kategori" list="categoryList" />
              <input id="new_focus" class="input" placeholder="Fokusområde" list="focusList" />
              <datalist id="focusList">
                ${allFocus.map(f=>`<option value="${f}">`).join('')}
              </datalist>
            </div>

            <!-- Utstyr (multiselect dropdown + fritekst for nytt utstyr via enter) -->
            <div class="multiselect" style="margin-top:8px;">
              <button id="newEqBtn" class="input">Tilgjengelig utstyr</button>
              <div id="newEqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">
                <div class="flex" style="flex-wrap:wrap; gap:8px;">
                  <label><input type="checkbox" id="newEqAll"> Velg alle</label>
                  ${allEquipment.map(eq => `<label><input type="checkbox" class="new-eq" value="${eq}"> ${eq}</label>`).join(' ')}
                </div>
                <div style="margin-top:8px;">
                  <input id="newEqAdd" class="input" placeholder="Legg til nytt utstyr og trykk Enter" />
                </div>
              </div>
              <div id="newEqHint" class="small" style="margin-top:6px; color:#666;">Kun kroppsvekt</div>
            </div>

            <button class="button" id="addExercise" style="margin-top:8px;">Legg til øvelse</button>
          </div>

          <!-- ØVELSESBIBLIOTEK -->
          <div class="card">
            <h3>Øvelsesbibliotek</h3>
            <div><input type="file" id="excsv" accept=".csv" /></div>
            <div class="flex" style="margin-top:8px;">
              <button class="button" id="eximport">Importer øvelser (CSV)</button>
              <button class="button secondary" id="exportEx">Eksporter øvelser (CSV)</button>
            </div>
            <div class="small">CSV er <strong>semikolondelt</strong>. Hvis kolonnen <code>progression_tips</code> finnes, appendes den til <code>description</code>.</div>
          </div>
        </div>

        <!-- HØYRE: FILTER ØVELSER -->
        <div>
          <div class="card">
            <h3>Filter øvelser</h3>

            <div class="flex">
              <select id="fFocus" class="input">
                <option value="">Fokus (alle)</option>
                ${allFocus.map(v=>`<option>${v}</option>`).join('')}
              </select>
              <select id="fCat" class="input">
                <option value="">Kategori (alle)</option>
                ${allCategories.map(v=>`<option>${v}</option>`).join('')}
              </select>
            </div>

            <div class="flex" style="margin-top:8px;">
              <select id="fRpe" class="input">
                <option value="">RPE (alle)</option>
                <option value="Lett">Lett</option>
                <option value="Moderat">Moderat</option>
                <option value="Hardt">Hardt</option>
              </select>
              <select id="fNoise" class="input">
                <option value="">Lydnivå (alle)</option>
                ${allNoise.map(v=>`<option value="${v}">${v}</option>`).join('')}
              </select>
            </div>

            <div class="multiselect" style="margin-top:8px;">
              <button id="fEqBtn" class="input">Tilgjengelig utstyr</button>
              <div id="fEqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">
                <div class="flex" style="flex-wrap:wrap; gap:8px;">
                  <label><input type="checkbox" id="fEqAll"> Velg alle</label>
                  ${allEquipment.map(eq => `<label><input type="checkbox" class="f-eq" value="${eq}"> ${eq}</label>`).join(' ')}
                </div>
              </div>
              <div id="fEqHint" class="small" style="margin-top:6px; color:#666;">kun kroppsvekt</div>
            </div>

            <div style="margin-top:8px;">
              <input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" />
            </div>

            <div id="exlist" style="margin-top:12px;"></div>
          </div>
        </div>
      </div>
    `);

    document.getElementById('focus').value = w.focus_area;

    // ---- Ny øvelse: utstyr dropdown m/ flervalg + nytt utstyr ----
    const newEqBtn  = document.getElementById('newEqBtn');
    const newEqMenu = document.getElementById('newEqMenu');
    const newEqHint = document.getElementById('newEqHint');
    newEqBtn.onclick = () => { newEqMenu.style.display = (newEqMenu.style.display==='none' ? 'block' : 'none'); };

    let newSelectedEquip = new Set();
    const updateNewEquipHint = () => {
      const arr = Array.from(newSelectedEquip);
      newEqHint.textContent = arr.length ? arr.join(', ') : 'Kun kroppsvekt';
    };
    const newEqAll = document.getElementById('newEqAll');
    newEqAll.onchange = () => {
      newSelectedEquip = new Set(newEqAll.checked ? allEquipment : []);
      document.querySelectorAll('.new-eq').forEach(cb => cb.checked = newEqAll.checked);
      updateNewEquipHint();
    };
    document.querySelectorAll('.new-eq').forEach(cb => cb.onchange = () => {
      if (cb.checked) newSelectedEquip.add(cb.value); else newSelectedEquip.delete(cb.value);
      newEqAll.checked = (newSelectedEquip.size === allEquipment.length);
      updateNewEquipHint();
    });
    document.getElementById('newEqAdd').onkeydown = (e) => {
      if (e.key === 'Enter'){
        const val = (e.target.value || '').trim();
        if (val){
          const lbl = document.createElement('label');
          lbl.innerHTML = `<input type="checkbox" class="new-eq" value="${val}" checked> ${val}`;
          document.querySelector('#newEqMenu .flex').appendChild(lbl);
          newSelectedEquip.add(val);
          e.target.value = '';
          updateNewEquipHint();
          lbl.querySelector('input').onchange = () => {
            const v = lbl.querySelector('input').value;
            if (lbl.querySelector('input').checked) newSelectedEquip.add(v); else newSelectedEquip.delete(v);
            updateNewEquipHint();
          };
        }
      }
    };

    // ---- Import/eksport av øvelser ----
    document.getElementById('eximport').onclick = () => {
      const file = document.getElementById('excsv').files[0];
      if (!file) return alert('Velg øvelses-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.exercises = rows.map(r => {
          const desc = (r.description || '');
          const prog = (r.progression_tips || '').trim();
          const fullDesc = prog ? `${desc}\nProgresjon: ${prog}` : desc;
          const equipments = (r.equipment || '').replace(/;/g, ',').split(',').map(x=>x.trim()).filter(Boolean);
          const rpeNum = Number(r.rpe || NaN);
          const rpeText = r.rpe_text ? r.rpe_text
                        : Number.isFinite(rpeNum) ? (rpeNum<=3?'Lett':rpeNum<=6?'Moderat':'Hardt')
                        : 'Moderat';
          return {
            exercise_id:           r.exercise_id || `EX${Date.now()}`,
            name:                  r.name,
            description:           fullDesc,
            default_duration_sec:  Number(r.default_duration_sec || 60),
            rpe:                   Number.isFinite(rpeNum) ? rpeNum : (rpeText==='Lett'?2:(rpeText==='Moderat'?5:8)),
            rpe_text:              rpeText,
            category:              r.category || '',
            focus_area:            r.focus_area || 'Hele kroppen',
            equipment:             equipments,
            noise_level:           r.noise_level || 'Medium',
            created_at:            Number(r.created_at || Date.now())
          };
        });
        Store.save(Store.keys.exercises, AppState.exercises);
        alert(`Importert ${AppState.exercises.length} øvelser.`);
        Editor.render(w);
      };
      reader.readAsText(file);
    };

    document.getElementById('exportEx').onclick = () => {
      const headers = ['exercise_id','name','description','default_duration_sec','rpe','category','focus_area','equipment','noise_level'];
      const rows = AppState.exercises.map(e => [
        e.exercise_id, e.name, e.description, e.default_duration_sec, e.rpe, e.category, e.focus_area, (e.equipment||[]).join(','), e.noise_level
      ]);
      const csv = Util.toCSV(headers, rows, ';');
      Util.download('exercises.csv', csv, 'text/csv');
    };

    // ---- Legg til øvelse ----
    document.getElementById('addExercise').onclick = () => {
      const name   = (document.getElementById('new_name').value || '').trim();
      const desc   = (document.getElementById('new_desc').value || '').trim();
      const durVal = document.getElementById('new_duration').value.trim();
      const rpeSel = document.getElementById('new_rpe').value; // Lav/Medium/Høy
      const noise  = (document.getElementById('new_noise').value || '').trim();
      const cat    = (document.getElementById('new_cat').value || '').trim();
      const focus  = (document.getElementById('new_focus').value || '').trim();
      if (!name) return alert('Navn mangler');

      const rpeTextMap = { 'Lav':'Lett', 'Medium':'Moderat', 'Høy':'Hardt' };
      const rpeText = rpeTextMap[rpeSel] || 'Moderat';
      const rpeNum  = rpeText==='Lett' ? 2 : rpeText==='Moderat' ? 5 : 8;

      const equipArr = Array.from(newSelectedEquip);

      const ex = {
        exercise_id: `EX${Date.now()}`,
        name,
        description: desc,
        default_duration_sec: /^\d+$/.test(durVal) ? Number(durVal) : 60,
        rpe: rpeNum,
        rpe_text: rpeText,
        category: cat,
        focus_area: focus || 'Hele kroppen',
        equipment: equipArr,
        noise_level: noise || 'Medium',
        created_at: Date.now()
      };

      AppState.exercises.unshift(ex);
      Store.save(Store.keys.exercises, AppState.exercises);
      alert('Øvelse lagt til');
      Editor.render(w);
    };

    // ---- Filter for øvelser (høyre kolonne) ----
    const fEqBtn  = document.getElementById('fEqBtn');
    const fEqMenu = document.getElementById('fEqMenu');
    const fEqHint = document.getElementById('fEqHint');
    fEqBtn.onclick = () => { fEqMenu.style.display = (fEqMenu.style.display==='none' ? 'block' : 'none'); };

    let fSelectedEquip = new Set();
    const updateFilterEquipHint = () => {
      const arr = Array.from(fSelectedEquip);
      fEqHint.textContent = arr.length ? arr.join(', ') : 'kun kroppsvekt';
    };
    const fEqAll = document.getElementById('fEqAll');
    fEqAll.onchange = () => {
      fSelectedEquip = new Set(fEqAll.checked ? allEquipment : []);
      document.querySelectorAll('.f-eq').forEach(cb => cb.checked = fEqAll.checked);
      renderExercises();
    };
    document.querySelectorAll('.f-eq').forEach(cb => cb.onchange = () => {
      if (cb.checked) fSelectedEquip.add(cb.value); else fSelectedEquip.delete(cb.value);
      fEqAll.checked = (fSelectedEquip.size === allEquipment.length);
      renderExercises();
    });

    function matchesFilters(e){
      const fFocus  = document.getElementById('fFocus').value;
      const fCat    = document.getElementById('fCat').value;
      const fRpe    = document.getElementById('fRpe').value;     // Lett/Moderat/Hardt
      const fNoise  = document.getElementById('fNoise').value;
      const fSearch = (document.getElementById('fSearch').value || '').trim().toLowerCase();

      if (fFocus && e.focus_area !== fFocus) return false;
      if (fCat   && e.category   !== fCat)   return false;

      const rpeBucket = (val) => (val <= 3 ? 'Lett' : val <= 6 ? 'Moderat' : 'Hardt');
      const eRpeText  = e.rpe_text || rpeBucket(Number(e.rpe||5));
      if (fRpe && eRpeText !== fRpe) return false;

      if (fNoise && (e.noise_level || 'Medium') !== fNoise) return false;

      const selected = Array.from(fSelectedEquip);
      const req = (e.equipment || []).filter(eq => eq !== 'nei');
      if (!selected.length && req.length) return false;
      if (selected.length && !req.every(eq => selected.includes(eq))) return false;

      const txt = `${e.name||''} ${e.description||''}`.toLowerCase();
      if (fSearch && !txt.includes(fSearch)) return false;

      return true;
    }

    function renderExercises(){
      const list = (AppState.exercises || []).filter(matchesFilters);
      list.sort((a,b) => Number(b.created_at||0) - Number(a.created_at||0));

      const html = list.map(e=>`
        <div class="card">
          <div><strong>${e.name}</strong> <span class="small">${e.category||'(ingen kategori)'} • ${e.focus_area}</span></div>
          <div class="small">${(e.description||'').replace(/\n/g,'<br>')}</div>
          <div class="flex">
            <button class="button" data-add="${e.exercise_id}">Legg til i økt (${Number(e.default_duration_sec||60)}s)</button>
            <button class="button secondary" data-edit="${e.exercise_id}">Rediger</button>
            <button class="button secondary" data-del="${e.exercise_id}">Slett øvelse</button>
          </div>
        </div>
      `).join('');
      document.getElementById('exlist').innerHTML = html || '<div class="card small">Ingen øvelser matcher filteret.</div>';

      document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
        const ex = AppState.exercises.find(x=>x.exercise_id===b.dataset.add);
        const dur = Number(ex?.default_duration_sec || 60);
        w.items.push({ exercise_id: ex.exercise_id, duration_sec: dur });
        renderItems();
      });

      document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
        const ex = AppState.exercises.find(x=>x.exercise_id===b.dataset.edit);
        if (!ex) return;
        document.getElementById('new_name').value    = ex.name || '';
        document.getElementById('new_desc').value    = ex.description || '';
        document.getElementById('new_duration').value= String(ex.default_duration_sec || 60);
        const bucket = ex.rpe_text || (ex.rpe<=3?'Lett':ex.rpe<=6?'Moderat':'Hardt');
        const revMap = { 'Lett':'Lav', 'Moderat':'Medium', 'Hardt':'Høy' };
        document.getElementById('new_rpe').value     = revMap[bucket] || 'Medium';
        document.getElementById('new_cat').value     = ex.category || '';
        document.getElementById('new_focus').value   = ex.focus_area || 'Hele kroppen';
        newSelectedEquip = new Set((ex.equipment||[]).filter(Boolean));
        document.querySelectorAll('.new-eq').forEach(cb => cb.checked = newSelectedEquip.has(cb.value));
        updateNewEquipHint();
        document.getElementById('new_noise').value   = ex.noise_level || 'Medium';
        newEqMenu.style.display = 'block';
      });

      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const eid = b.dataset.del;
        const idx = AppState.exercises.findIndex(x=>x.exercise_id===eid);
        if (idx>=0 && confirm('Slette øvelsen?')) {
          AppState.exercises.splice(idx,1);
          Store.save(Store.keys.exercises, AppState.exercises);
          AppState.workouts.forEach(W => {
            if (Array.isArray(W.items)) W.items = W.items.filter(it => it.exercise_id !== eid);
          });
          Store.save(Store.keys.workouts, AppState.workouts);
          w.items = (w.items||[]).filter(it => it.exercise_id !== eid);
          renderExercises();
          renderItems();
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
          </div>
        `;
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

    // Init/handlers
    renderExercises(); renderItems();

    document.getElementById('fFocus').onchange = renderExercises;
    document.getElementById('fCat').onchange   = renderExercises;
    document.getElementById('fRpe').onchange   = renderExercises;
    document.getElementById('fNoise').onchange = renderExercises;
    document.getElementById('fSearch').oninput = renderExercises;

    // Lagre økt (+ pause mellom øvelser fra feltet)
    document.getElementById('save').onclick = () => {
      w.name       = document.getElementById('name').value || 'Ny økt';
      w.category   = document.getElementById('cat').value || '';
      w.focus_area = document.getElementById('focus').value || 'Hele kroppen';
      const p = Number(document.getElementById('pauseSec').value || 10);
      w.pause_between_items_sec = Number.isFinite(p) ? p : 10;
      if (!w.created_at) w.created_at = Date.now();

      // Beregn (utstyr, lydnivå, RPE, total tid)
      const equipSet = new Set(); let rpeSum=0, rpeCount=0; const noiseLevels={Low:1,Medium:2,High:3}; let noiseMax=1;
      (w.items||[]).forEach(it => {
        const e = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        if (e){
          (e.equipment||[]).forEach(eq => equipSet.add(eq));
          rpeSum += (e.rpe||5); rpeCount++;
          noiseMax = Math.max(noiseMax, noiseLevels[e.noise_level||'Medium']||2);
        }
      });
      w.computed = {
        total_time_sec: (w.items||[]).reduce((a,b)=>a+b.duration_sec,0) + ((w.items||[]).length-1)*w.pause_between_items_sec,
        equipment: Array.from(equipSet),
        noise_level: noiseMax===3?'High':(noiseMax===2?'Medium':'Low'),
        rpe_avg: rpeCount ? (rpeSum/rpeCount) : 5
      };

      const idx = AppState.workouts.findIndex(x=>x.workout_id===w.workout_id);
      if (idx>=0) AppState.workouts[idx] = w; else AppState.workouts.unshift(w); // nye økter øverst
      Store.save(Store.keys.workouts, AppState.workouts);
      alert('Økt lagret.');
      Library.render(); setActive('library');
    };
  }
};

window.Editor = Editor;
