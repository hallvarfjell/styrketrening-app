
// modules/editor.js
//
// Robust og ryddig versjon uten «nested templates».
// Oppfyller kravene dine for layout, per‑øvelse pause, validering,
// dropdown‑filtre, korrekt hint‑tekst for utstyr, osv.

const Editor = {
  render(existing = null) {
    const w = existing || {
      workout_id: `WK${Date.now()}`,
      name: '',
      category: '',
      focus_area: 'Hele kroppen',
      favorite: false,
      items: [],
      created_at: Date.now()
    };

    // --- Hent dynamiske oppslagslister ---
    const eqSet = new Set();
    const catSet = new Set();
    const focusSet = new Set();
    const noiseSet = new Set();

    (AppState.exercises || []).forEach(e => {
      (e.equipment || []).forEach(eq => { if (eq) eqSet.add(eq); });
      if (e.category) catSet.add(e.category);
      if (e.focus_area) focusSet.add(e.focus_area);
      if (e.noise_level) noiseSet.add(e.noise_level);
    });

    const allEquipment = Array.from(eqSet).sort();
    const allCategories = Array.from(catSet).sort((a,b)=>String(a).localeCompare(String(b)));
    const defaultFocus = ['Hele kroppen', 'Overkropp', 'Underkropp'];
    const allFocus = Array.from(focusSet).length ? Array.from(focusSet).sort((a,b)=>String(a).localeCompare(String(b))) : defaultFocus;
    const allNoise = Array.from(noiseSet).length ? Array.from(noiseSet).sort((a,b)=>String(a).localeCompare(String(b))) : ['Lavt','Medium','Høyt'];

    // --- Små hjelpefunksjoner for HTML‑bygging (unngå nested backticks) ---
    function optionsSimple(arr, selectedVal) {
      let s = '';
      for (const v of arr) {
        s += '<option' + (selectedVal === v ? ' selected' : '') + '>' + v + '</option>';
      }
      return s;
    }
    function dataListOptions(arr) {
      let s = '';
      for (const v of arr) s += '<option value="' + v + '">';
      return s;
    }

    // --- Hoved‑markup ---
    const html =
      '<div class="grid-2">' +
        // VENSTRE: BYGG ØKT, LEGG TIL ØVELSE, ØVELSESBIBLIOTEK
        '<div>' +

          // BYGG ØKT
          '<div class="card">' +
            '<h3>Bygg økt</h3>' +
            '<input id="name" class="input" style="width:100%;" placeholder="Øktnavn" value="' + (w.name || '') + '" />' +
            '<div class="flex" style="margin-top:8px;">' +
              '<input id="cat" class="input" placeholder="Kategori" value="' + (w.category || '') + '" list="categoryList" />' +
              '<datalist id="categoryList">' + dataListOptions(allCategories) + '</datalist>' +
              '<select id="focus" class="input">' + optionsSimple(allFocus, w.focus_area) + '</select>' +
            '</div>' +

            '<div id="items" style="margin-top:8px;"></div>' +

            '<div class="flex" style="margin-top:8px;">' +
              '<button class="button" id="save">Lagre økt</button>' +
            '</div>' +
          '</div>' +

          // LEGG TIL ØVELSE
          '<div class="card">' +
            '<h3>Legg til øvelse</h3>' +
            '<input id="new_name" class="input" style="width:100%;" placeholder="Navn" />' +
            '<textarea id="new_desc" class="input" placeholder="Beskrivelse (inkl. progresjonstips om ønsket)"></textarea>' +

            '<div class="flex" style="margin-top:8px;">' +
              '<input id="new_duration" class="input" placeholder="Varighet (s)" />' +
              '<input id="new_pause" class="input" placeholder="Varighet pause (s)" />' +
            '</div>' +

            '<div class="flex" style="margin-top:8px;">' +
              '<input id="new_focus" class="input" placeholder="Fokusområde" list="focusList" />' +
              '<datalist id="focusList">' + dataListOptions(allFocus) + '</datalist>' +
              '<input id="new_cat" class="input" placeholder="Kategori" list="categoryList" />' +
            '</div>' +

            '<div class="flex" style="margin-top:8px;">' +
              '<select id="new_rpe" class="input">' +
                '<option value="">RPE</option>' +
                '<option value="Lav">Lav</option>' +
                '<option value="Medium">Medium</option>' +
                '<option value="Høy">Høy</option>' +
              '</select>' +
              '<select id="new_noise" class="input">' +
                '<option value="">Lydnivå</option>' +
                (function(){ let s=''; for(const n of allNoise){ s+='<option value="'+n+'">'+n+'</option>'; } return s; })() +
              '</select>' +
            '</div>' +

            '<div class="multiselect" style="margin-top:8px;">' +
              '<button id="newEqBtn" class="input">Tilgjengelig utstyr</button>' +
              '<div id="newEqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">' +
                '<div class="flex" style="flex-wrap:wrap; gap:8px;">' +
                  '<label><input type="checkbox" id="newEqAll"> Velg alle</label>' +
                  (function(){ let s=''; for(const eq of allEquipment){ s+= '<label><input type="checkbox" class="new-eq" value="'+eq+'"> '+eq+'</label>'; } return s; })() +
                '</div>' +
                '<div style="margin-top:8px;">' +
                  '<input id="newEqAdd" class="input" placeholder="Legg til nytt utstyr og trykk Enter" />' +
                '</div>' +
              '</div>' +
              '<div id="newEqHint" class="small" style="margin-top:6px; color:#666;">Kun kroppsvekt</div>' +
            '</div>' +

            '<button class="button" id="addExercise" style="margin-top:8px;">Legg til øvelse</button>' +
          '</div>' +

          // ØVELSESBIBLIOTEK
          '<div class="card">' +
            '<h3>Øvelsesbibliotek</h3>' +
            '<div><input type="file" id="excsv" accept=".csv" /></div>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<button class="button" id="eximport">Importer øvelser (CSV)</button>' +
              '<button class="button secondary" id="exportEx">Eksporter øvelser (CSV)</button>' +
            '</div>' +
            '<div class="small">CSV er <strong>semikolondelt</strong>. Hvis kolonnen <code>progression_tips</code> finnes, appendes den til <code>description</code>. Valgfri kolonne: <code>default_pause_sec</code>.</div>' +
          '</div>' +

        '</div>' +

        // HØYRE: FILTER ØVELSER
        '<div>' +
          '<div class="card">' +
            '<h3>Filter øvelser</h3>' +

            '<div class="flex">' +
              '<select id="fFocus" class="input">' +
                '<option value="">Fokus (alle)</option>' + optionsSimple(allFocus, '') +
              '</select>' +
              '<select id="fCat" class="input">' +
                '<option value="">Kategori (alle)</option>' +
                (function(){let s=''; for(const c of allCategories){ s+= '<option>'+c+'</option>'; } return s; })() +
              '</select>' +
            '</div>' +

            '<div class="flex" style="margin-top:8px;">' +
              '<select id="fRpe" class="input">' +
                '<option value="">RPE (alle)</option>' +
                '<option value="Lett">Lett</option>' +
                '<option value="Moderat">Moderat</option>' +
                '<option value="Hardt">Hardt</option>' +
              '</select>' +
              '<select id="fNoise" class="input">' +
                '<option value="">Lydnivå (alle)</option>' +
                (function(){ let s=''; for(const n of allNoise){ s+='<option value="'+n+'">'+n+'</option>'; } return s; })() +
              '</select>' +
            '</div>' +

            '<div class="multiselect" style="margin-top:8px;">' +
              '<button id="fEqBtn" class="input">Tilgjengelig utstyr</button>' +
              '<div id="fEqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">' +
                '<div class="flex" style="flex-wrap:wrap; gap:8px;">' +
                  '<label><input type="checkbox" id="fEqAll"> Velg alle</label>' +
                  (function(){ let s=''; for(const eq of allEquipment){ s+= '<label><input type="checkbox" class="f-eq" value="'+eq+'"> '+eq+'</label>'; } return s; })() +
                '</div>' +
              '</div>' +
              '<div id="fEqHint" class="small" style="margin-top:6px; color:#666;">kun kroppsvekt</div>' +
            '</div>' +

            '<div style="margin-top:8px;">' +
              '<input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" />' +
            '</div>' +

            '<div id="exlist" style="margin-top:12px;"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    render(html);

    // Sett fokus‑verdi
    document.getElementById('focus').value = w.focus_area;

    // ---------- Utstyr multiselect (Ny Øvelse) ----------
    const newEqBtn  = document.getElementById('newEqBtn');
    const newEqMenu = document.getElementById('newEqMenu');
    const newEqHint = document.getElementById('newEqHint');
    let newSelectedEquip = new Set();

    function updateNewEquipHint(){
      const arr = Array.from(newSelectedEquip);
      newEqHint.textContent = arr.length ? arr.join(', ') : 'Kun kroppsvekt';
    }
    newEqBtn.onclick = () => { newEqMenu.style.display = (newEqMenu.style.display==='none' ? 'block' : 'none'); };
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
    const newEqAdd = document.getElementById('newEqAdd');
    newEqAdd.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const val = (e.target.value || '').trim();
        if (val){
          const wrap = newEqMenu.querySelector('.flex');
          const lbl = document.createElement('label');
          lbl.innerHTML = '<input type="checkbox" class="new-eq" value="'+val+'" checked> '+val;
          wrap.appendChild(lbl);
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

    // ---------- Import/Eksport øvelser ----------
    document.getElementById('eximport').onclick = () => {
      const file = document.getElementById('excsv').files[0];
      if (!file) return alert('Velg øvelses-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.exercises = rows.map(r => {
          const desc = (r.description || '');
          const prog = (r.progression_tips || '').trim();
          const fullDesc = prog ? (desc + '\nProgresjon: ' + prog) : desc;
          const equipments = (r.equipment || '').replace(/;/g, ',').split(',').map(x=>x.trim()).filter(Boolean);
          const rpeNum = Number(r.rpe || NaN);
          const rpeText = r.rpe_text ? r.rpe_text : (Number.isFinite(rpeNum) ? (rpeNum<=3?'Lett':rpeNum<=6?'Moderat':'Hardt') : '');
          return {
            exercise_id:           r.exercise_id || ('EX' + Date.now()),
            name:                  r.name,
            description:           fullDesc,
            default_duration_sec:  Number(r.default_duration_sec || 60),
            default_pause_sec:     Number(r.default_pause_sec || 10),
            rpe:                   Number.isFinite(rpeNum) ? rpeNum : (rpeText==='Lett'?2:(rpeText==='Moderat'?5:(rpeText==='Hardt'?8:5))),
            rpe_text:              r.rpe_text || rpeText || 'Moderat',
            category:              r.category || '',
            focus_area:            r.focus_area || 'Hele kroppen',
            equipment:             equipments,
            noise_level:           r.noise_level || 'Medium',
            created_at:            Number(r.created_at || Date.now())
          };
        });
        Store.save(Store.keys.exercises, AppState.exercises);
        alert('Importert ' + AppState.exercises.length + ' øvelser.');
        Editor.render(w);
      };
      reader.readAsText(file);
    };
    document.getElementById('exportEx').onclick = () => {
      const headers = ['exercise_id','name','description','default_duration_sec','default_pause_sec','rpe','category','focus_area','equipment','noise_level'];
      const rows = (AppState.exercises||[]).map(e => [
        e.exercise_id, e.name, e.description, e.default_duration_sec, (e.default_pause_sec ?? 10), e.rpe, e.category, e.focus_area, (e.equipment||[]).join(','), e.noise_level
      ]);
      const csv = Util.toCSV(headers, rows, ';');
      Util.download('exercises.csv', csv, 'text/csv');
    };

    // ---------- Legg til øvelse (med validering) ----------
    document.getElementById('addExercise').onclick = () => {
      const name   = (document.getElementById('new_name').value || '').trim();
      const desc   = (document.getElementById('new_desc').value || '').trim();
      const durVal = (document.getElementById('new_duration').value || '').trim();
      const pauseV = (document.getElementById('new_pause').value || '').trim();
      const rpeSel = document.getElementById('new_rpe').value;     // Lav/Medium/Høy
      const noise  = (document.getElementById('new_noise').value || '').trim();
      const cat    = (document.getElementById('new_cat').value || '').trim();
      const focus  = (document.getElementById('new_focus').value || '').trim();

      const missing = [];
      if (!name)  missing.push('Navn');
      if (!desc)  missing.push('Beskrivelse');
      if (!rpeSel) missing.push('RPE');
      if (!cat)   missing.push('Kategori');
      if (!focus) missing.push('Fokusområde');
      if (!noise) missing.push('Lydnivå');

      if (missing.length) { alert('Følgende mangler: ' + missing.join(', ')); return; }

      const rpeTextMap = { 'Lav':'Lett', 'Medium':'Moderat', 'Høy':'Hardt' };
      const rpeText = rpeTextMap[rpeSel];
      const rpeNum  = rpeText==='Lett' ? 2 : (rpeText==='Moderat' ? 5 : 8);

      const equipArr = Array.from(newSelectedEquip);

      const ex = {
        exercise_id: 'EX' + Date.now(),
        name,
        description: desc,
        default_duration_sec: /^\d+$/.test(durVal) ? Number(durVal) : 60,
        default_pause_sec:    /^\d+$/.test(pauseV) ? Number(pauseV) : 10,
        rpe: rpeNum,
        rpe_text: rpeText,
        category: cat,
        focus_area: focus,
        equipment: equipArr,
        noise_level: noise,
        created_at: Date.now()
      };

      AppState.exercises.unshift(ex);
      Store.save(Store.keys.exercises, AppState.exercises);
      alert('Øvelse lagt til');
      Editor.render(w);
    };

    // ---------- Filter (utstyr) i høyre kolonne ----------
    const fEqBtn  = document.getElementById('fEqBtn');
    const fEqMenu = document.getElementById('fEqMenu');
    const fEqHint = document.getElementById('fEqHint');
    let fSelectedEquip = new Set();

    function updateFilterEquipHint(){
      const arr = Array.from(fSelectedEquip);
      fEqHint.textContent = arr.length ? arr.join(', ') : 'kun kroppsvekt';
    }

    fEqBtn.onclick = () => { fEqMenu.style.display = (fEqMenu.style.display==='none' ? 'block' : 'none'); };
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

    // ---------- Filter‑matcher ----------
    function matchesFilters(e){
      const fFocus  = document.getElementById('fFocus').value;
      const fCat    = document.getElementById('fCat').value;
      const fRpe    = document.getElementById('fRpe').value; // Lett/Moderat/Hardt
      const fNoise  = document.getElementById('fNoise').value;
      const fSearch = (document.getElementById('fSearch').value || '').trim().toLowerCase();

      if (fFocus && e.focus_area !== fFocus) return false;
      if (fCat   && e.category   !== fCat)   return false;

      const rpeBucket = (val) => (val <= 3 ? 'Lett' : (val <= 6 ? 'Moderat' : 'Hardt'));
      const eRpeText  = e.rpe_text || rpeBucket(Number(e.rpe || 5));
      if (fRpe && eRpeText !== fRpe) return false;

      if (fNoise && (e.noise_level || 'Medium') !== fNoise) return false;

      const selected = Array.from(fSelectedEquip);
      const req = (e.equipment || []).filter(eq => eq !== 'nei');
      if (!selected.length && req.length) return false; // kun kroppsvekt når ingen valgt
      if (selected.length && !req.every(eq => selected.includes(eq))) return false;

      const txt = (String(e.name||'') + ' ' + String(e.description||'')).toLowerCase();
      if (fSearch && !txt.includes(fSearch)) return false;

      return true;
    }

    // ---------- Liste over øvelser (høyre) ----------
    function renderExercises(){
      const list = (AppState.exercises || []).filter(matchesFilters);
      list.sort((a,b)=>Number(b.created_at||0)-Number(a.created_at||0));

      let html = '';
      for (const e of list){
        const name = e.name || '';
        const cat  = e.category || '(ingen kategori)';
        const foc  = e.focus_area || '';
        const desc = (e.description||'').replace(/\n/g,'<br>');
        const durS = Number(e.default_duration_sec || 60);

        html += '<div class="card">';
        html += '<div><strong>'+name+'</strong> <span class="small">'+cat+' • '+foc+'</span></div>';
        html += '<div class="small">'+desc+'</div>';
        html += '<div class="flex" style="margin-top:6px;">';
        html +=   '<button class="button" data-add="'+e.exercise_id+'">Legg til i økt ('+durS+'s)</button>';
        html +=   '<button class="button secondary" data-edit="'+e.exercise_id+'">Rediger</button>';
        html +=   '<button class="button secondary" data-del="'+e.exercise_id+'">Slett øvelse</button>';
        html += '</div>';
        html += '</div>';
      }
      document.getElementById('exlist').innerHTML = html || '<div class="card small">Ingen øvelser matcher filteret.</div>';

      // Legg til i økt
      document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
        const ex = AppState.exercises.find(x=>x.exercise_id===b.dataset.add);
        const dur   = Number(ex?.default_duration_sec || 60);
        const pause = Number(ex?.default_pause_sec   || 10);
        (w.items || (w.items=[])).push({ exercise_id: ex.exercise_id, duration_sec: dur, pause_after_sec: pause });
        renderItems();
      });

      // Rediger -> fyll "Legg til øvelse"
      document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
        const ex = AppState.exercises.find(x=>x.exercise_id===b.dataset.edit);
        if (!ex) return;
        document.getElementById('new_name').value     = ex.name || '';
        document.getElementById('new_desc').value     = ex.description || '';
        document.getElementById('new_duration').value = String(ex.default_duration_sec || 60);
        document.getElementById('new_pause').value    = String((ex.default_pause_sec != null ? ex.default_pause_sec : 10));
        document.getElementById('new_cat').value      = ex.category || '';
        document.getElementById('new_focus').value    = ex.focus_area || '';
        document.getElementById('new_rpe').value      = (ex.rpe_text==='Lett' ? 'Lav' : (ex.rpe_text==='Moderat' ? 'Medium' : (ex.rpe_text==='Hardt' ? 'Høy' : '')));
        document.getElementById('new_noise').value    = ex.noise_level || '';
        newSelectedEquip = new Set((ex.equipment||[]).filter(Boolean));
        document.querySelectorAll('.new-eq').forEach(cb => cb.checked = newSelectedEquip.has(cb.value));
        updateNewEquipHint();
        newEqMenu.style.display = 'block';
      });

      // Slett øvelse
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const eid = b.dataset.del;
        const idx = (AppState.exercises||[]).findIndex(x=>x.exercise_id===eid);
        if (idx >= 0 && confirm('Slette øvelsen?')) {
          AppState.exercises.splice(idx,1);
          Store.save(Store.keys.exercises, AppState.exercises);
          (AppState.workouts||[]).forEach(W => {
            if (Array.isArray(W.items)) W.items = W.items.filter(it => it.exercise_id !== eid);
          });
          Store.save(Store.keys.workouts, AppState.workouts);
          w.items = (w.items||[]).filter(it => it.exercise_id !== eid);
          renderExercises();
          renderItems();
        }
      });

      // Oppdater hint for filter‑utstyr (viktig)
      updateFilterEquipHint();
    }

    // ---------- Bygg økt: items‑liste ----------
    function renderItems(){
      const container = document.getElementById('items');
      if (!container) return;

      if (!w.items || !w.items.length) {
        container.innerHTML = '<div class="card small">Ingen øvelser i økta ennå.</div>';
        return;
      }

      let html = '';
      w.items.forEach((it, idx) => {
        const ex = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        const name = ex ? ex.name : it.exercise_id;
        const dur  = Number(it.duration_sec || ex?.default_duration_sec || 60);
        const pause= Number((it.pause_after_sec != null ? it.pause_after_sec : (ex?.default_pause_sec != null ? ex.default_pause_sec : 10)));

        html += '<div class="card">';
        html +=   '<div><strong>'+name+'</strong></div>';
        html +=   '<div class="flex">';
        html +=     '<div style="flex:1;">';
        html +=       '<div class="small" style="color:#666; margin-bottom:4px;">Varighet (mm:ss)</div>';
        html +=       '<input class="input" value="'+ Util.fmtMMSS(dur) +'" data-dur="'+idx+'" />';
        html +=     '</div>';
        html +=     '<div style="flex:1;">';
        html +=       '<div class="small" style="color:#666; margin-bottom:4px;">Pause (s)</div>';
        html +=       '<input class="input" value="'+ pause +'" data-pause="'+idx+'" />';
        html +=     '</div>';
        html +=   '</div>';
        html +=   '<div class="flex" style="margin-top:8px;">';
        html +=     '<button class="button secondary" data-up="'+idx+'">▲</button>';
        html +=     '<button class="button secondary" data-down="'+idx+'">▼</button>';
        html +=     '<button class="button secondary" data-del="'+idx+'">Fjern</button>';
        html +=   '</div>';
        html += '</div>';
      });

      container.innerHTML = html;

      container.querySelectorAll('[data-dur]').forEach(inp => inp.onchange = () => {
        const i = Number(inp.dataset.dur);
        w.items[i].duration_sec = Util.parseMMSS(inp.value);
      });
      container.querySelectorAll('[data-pause]').forEach(inp => inp.onchange = () => {
        const i = Number(inp.dataset.pause);
        const v = Number(inp.value);
        w.items[i].pause_after_sec = Number.isFinite(v) ? v : 10;
      });
      container.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.up);
        if (i > 0){ const t = w.items[i]; w.items.splice(i,1); w.items.splice(i-1,0,t); renderItems(); }
      });
      container.querySelectorAll('[data-down]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.down);
        if (i < w.items.length - 1){ const t = w.items[i]; w.items.splice(i,1); w.items.splice(i+1,0,t); renderItems(); }
      });
      container.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.del);
        w.items.splice(i,1); renderItems();
      });
    }

    // ---------- Init av liste og filter ----------
    renderExercises();
    renderItems();

    document.getElementById('fFocus').onchange = renderExercises;
    document.getElementById('fCat').onchange   = renderExercises;
    document.getElementById('fRpe').onchange   = renderExercises;
    document.getElementById('fNoise').onchange = renderExercises;
    document.getElementById('fSearch').oninput = renderExercises;

    // ---------- Lagre økt (beregner total osv.) ----------
    document.getElementById('save').onclick = () => {
      w.name       = document.getElementById('name').value || 'Ny økt';
      w.category   = document.getElementById('cat').value || '';
      w.focus_area = document.getElementById('focus').value || 'Hele kroppen';
      if (!w.created_at) w.created_at = Date.now();

      const equipSet = new Set(); let rpeSum=0, rpeCount=0;
      const noiseLevels = { Low:1, Medium:2, High:3 }; // intern mapping for computed
      let noiseMax = 1;

      (w.items||[]).forEach(it => {
        const e = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        if (e){
          (e.equipment||[]).forEach(eq => equipSet.add(eq));
          rpeSum += (e.rpe||5); rpeCount++;
          noiseMax = Math.max(noiseMax, noiseLevels[e.noise_level] || 2);
        }
      });

      const totalWork = (w.items||[]).reduce((a,b)=>a+(Number(b.duration_sec)||0),0);
      const totalPause= (w.items||[]).reduce((a,b,i)=>a+(i<w.items.length-1 ? Number(b.pause_after_sec ?? 10) : 0),0);
      const preStart  = (w.items && w.items.length) ? (w.items[0].pause_after_sec ?? 10) : 0;

      w.computed = {
        total_time_sec: totalWork + totalPause + preStart,
        equipment: Array.from(equipSet),
        noise_level: noiseMax===3?'High':(noiseMax===2?'Medium':'Low'),
        rpe_avg: rpeCount ? (rpeSum/rpeCount) : 5
      };

      const idx = AppState.workouts.findIndex(x=>x.workout_id===w.workout_id);
      if (idx>=0) AppState.workouts[idx] = w; else AppState.workouts.unshift(w);
      Store.save(Store.keys.workouts, AppState.workouts);
      alert('Økt lagret.');
      Library.render(); setActive('library');
    };
  }
};

window.Editor = Editor;
``
