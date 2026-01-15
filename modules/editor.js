
// modules/editor.js (oppdatert)

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

    // Oppslagslister
    const eqSet = new Set(), catSet = new Set(), focusSet = new Set(), noiseSet = new Set();
    (AppState.exercises || []).forEach(e => {
      (e.equipment || []).forEach(eq => { if (eq) eqSet.add(eq); });
      if (e.category) catSet.add(e.category);
      if (e.focus_area) focusSet.add(e.focus_area);
      if (e.noise_level) noiseSet.add(e.noise_level);
    });
    const allEquipment = Array.from(eqSet).sort();
    const allCategories = Array.from(catSet).sort((a,b)=>String(a).localeCompare(String(b)));
    const defaultFocus = ['Hele kroppen', 'Overkropp', 'Underkropp'];
    const allFocus = focusSet.size ? Array.from(focusSet).sort((a,b)=>String(a).localeCompare(String(b))) : defaultFocus;

    // Lydnivå sortert: Lavt–Medium–Høyt (dersom finnes andre, legg bak)
    const preferNoise = ['Lavt','Medium','Høyt'];
    const theRestNoise = Array.from(noiseSet).filter(n => !preferNoise.includes(n)).sort((a,b)=>String(a).localeCompare(String(b)));
    const allNoise = preferNoise.concat(theRestNoise.length ? theRestNoise : []);

    // helpers
    function optionsSimple(arr, selectedVal) {
      let s = '';
      for (const v of arr) s += '<option' + (selectedVal === v ? ' selected' : '') + '>' + v + '</option>';
      return s;
    }
    function dataListOptions(arr) {
      let s = ''; for (const v of arr) s += '<option value="' + v + '">'; return s;
    }

    const html =
      '<div class="grid-2">' +
        '<div>' +
          // BYGG ØKT
          '<div class="card">' +
            '<h3>Bygg økt</h3>' +
            '<input id="name" class="input" style="width:100%;" placeholder="Øktnavn" value="'+(w.name||'')+'" />' +
            '<div class="flex" style="margin-top:8px;">' +
              // Fokusområde til venstre (input + datalist)
              '<input id="cat" class="input" placeholder="Kategori" value="'+(w.category||'')+'" list="categoryList" />' +
              '<datalist id="categoryList">'+ dataListOptions(allCategories) +'</datalist>' +
              '<input id="focus" class="input" placeholder="Fokusområde" value="'+(w.focus_area||'Hele kroppen')+'" list="focusList" />' +
              '<datalist id="focusList">'+ dataListOptions(allFocus) +'</datalist>' +
            '</div>' +
            '<div id="items" style="margin-top:8px;"></div>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<button class="button" id="save">Lagre økt</button>' +
            '</div>' +
          '</div>' +

          // LEGG TIL ØVELSE (Intensitet + lydnivå osv.)
          '<div class="card">' +
            '<h3>Legg til øvelse</h3>' +
            '<input id="new_name" class="input" style="width:100%;" placeholder="Navn" />' +
            '<textarea id="new_desc" class="input" style="width:100%;" placeholder="Beskrivelse (inkl. progresjonstips om ønsket)"></textarea>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<input id="new_duration" class="input" placeholder="Varighet (s)" />' +
              '<input id="new_pause" class="input" placeholder="Varighet pause (s)" />' +
            '</div>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<input id="new_focus" class="input" placeholder="Fokusområde" list="focusList" />' +
              '<input id="new_cat" class="input" placeholder="Kategori" list="categoryList" />' +
            '</div>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<select id="new_intensity" class="input">' +
                '<option value="">Intensitet</option>' +
                '<option value="Lav">Lav</option>' +
                '<option value="Middels">Middels</option>' +
                '<option value="Høy">Høy</option>' +
              '</select>' +
              '<select id="new_noise" class="input">' +
                '<option value="">Lydnivå</option>' +
                (function(){ let s=''; for (const n of allNoise){ s += '<option value="'+n+'">'+n+'</option>'; } return s; })() +
              '</select>' +
            '</div>' +

            '<div class="multiselect" style="margin-top:8px;">' +
              '<button id="newEqBtn" class="input">Tilgjengelig utstyr</button>' +
              '<div id="newEqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">' +
                '<div class="flex" style="flex-wrap:wrap; gap:8px;">' +
                  '<label><input type="checkbox" id="newEqAll"> Velg alle</label>' +
                  (function(){ let s=''; for(const eq of allEquipment){ s+= '<label><input type="checkbox" class="new-eq" value="'+eq+'"> '+eq+'</label>'; } return s; })() +
                '</div>' +
                '<div style="margin-top:8px;"><input id="newEqAdd" class="input" placeholder="Legg til nytt utstyr og trykk Enter" /></div>' +
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
            '<div class="small">CSV er <strong>semikolondelt</strong>. Støtter <code>default_pause_sec</code>. "Intensitet" i CSV: kolonnene <code>intensitet</code> (Lav/Middels/Høy) og/eller <code>rpe</code> (for bakoverkomp.).</div>' +
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
              '<select id="fIntensity" class="input">' +
                '<option value="">Intensitet (alle)</option>' +
                '<option value="Lett">Lett</option>' +
                '<option value="Moderat">Moderat</option>' +
                '<option value="Hardt">Hardt</option>' +
              '</select>' +
              '<select id="fNoise" class="input">' +
                '<option value="">Lydnivå (alle)</option>' +
                (function(){let s=''; for(const n of allNoise){ s+='<option value="'+n+'">'+n+'</option>'; } return s; })() +
              '</select>' +
            '</div>' +
            '<div class="multiselect" style="margin-top:8px;">' +
              '<button id="fEqBtn" class="input">Tilgjengelig utstyr</button>' +
              '<div id="fEqMenu" class="card" style="display:none; position:relative; z-index:5; max-width:520px;">' +
                '<div class="flex" style="flex-wrap:wrap; gap:8px;">' +
                  '<label><input type="checkbox" id="fEqAll"> Velg alle</label>' +
                  (function(){ let s=''; for(const eq of allEquipment){ s+='<label><input type="checkbox" class="f-eq" value="'+eq+'"> '+eq+'</label>'; } return s; })() +
                '</div>' +
              '</div>' +
              '<div id="fEqHint" class="small" style="margin-top:6px; color:#666;">kun kroppsvekt</div>' +
            '</div>' +
            '<div style="margin-top:8px;"><input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" /></div>' +
            '<div id="exlist" style="margin-top:12px;"></div>' +
          '</div>' +
        '</div>' +
      '</div>`;

    render(html);

    // Ny øvelse → utstyr multiselect
    const newEqBtn = document.getElementById('newEqBtn');
    const newEqMenu = document.getElementById('newEqMenu');
    const newEqHint = document.getElementById('newEqHint');
    newEqBtn.onclick = () => { newEqMenu.style.display = (newEqMenu.style.display==='none' ? 'block' : 'none'); };
    let newSelectedEquip = new Set();
    function updateNewEquipHint(){ const arr=[...newSelectedEquip]; newEqHint.textContent = arr.length? arr.join(', ') : 'Kun kroppsvekt'; }
    const newEqAll = document.getElementById('newEqAll');
    newEqAll.onchange = () => {
      newSelectedEquip = new Set(newEqAll.checked ? allEquipment : []);
      document.querySelectorAll('.new-eq').forEach(cb => cb.checked = newEqAll.checked);
      updateNewEquipHint();
    };
    document.querySelectorAll('.new-eq').forEach(cb => cb.onchange = () => {
      if (cb.checked) newSelectedEquip.add(cb.value); else newSelectedEquip.delete(cb.value);
      newEqAll.checked = (newSelectedEquip.size === allEquipment.length); updateNewEquipHint();
    });
    document.getElementById('newEqAdd').onkeydown = (e) => {
      if (e.key === 'Enter'){
        const val = (e.target.value||'').trim(); if (!val) return;
        const wrap = newEqMenu.querySelector('.flex');
        const lbl = document.createElement('label');
        lbl.innerHTML = '<input type="checkbox" class="new-eq" value="'+val+'" checked> '+val;
        wrap.appendChild(lbl);
        newSelectedEquip.add(val); e.target.value=''; updateNewEquipHint();
        lbl.querySelector('input').onchange = () => {
          const v = lbl.querySelector('input').value;
          if (lbl.querySelector('input').checked) newSelectedEquip.add(v); else newSelectedEquip.delete(v);
          updateNewEquipHint();
        };
      }
    };

    // Import/eksport øvelser
    document.getElementById('eximport').onclick = () => {
      const f = document.getElementById('excsv').files[0];
      if (!f) return alert('Velg øvelses-CSV');
      const reader = new FileReader();
      reader.onload = () => {
        const rows = Util.parseCSV(reader.result, ';');
        AppState.exercises = rows.map(r => {
          const desc = (r.description || '');
          const prog = (r.progression_tips || '').trim();
          const fullDesc = prog ? (desc+'\nProgresjon: '+prog) : desc;
          const equipments = (r.equipment||'').replace(/;/g,',').split(',').map(x=>x.trim()).filter(Boolean);
          // Intensitet: støtt både "intensitet" (Lav/Middels/Høy) og gammel rpe/rpe_text
          const intensityIn = (r.intensitet || r.intensity || '').trim();
          const rpeNum = Number(r.rpe || NaN);
          const rpeText = intensityIn ? (intensityIn==='Lav'?'Lett': intensityIn==='Middels'?'Moderat': intensityIn==='Høy'?'Hardt':'')
                        : (Number.isFinite(rpeNum) ? (r.rpe<=3?'Lett': r.rpe<=6?'Moderat':'Hardt') : '');
          return {
            exercise_id:           r.exercise_id || ('EX' + Date.now()),
            name:                  r.name,
            description:           fullDesc,
            default_duration_sec:  Number(r.default_duration_sec || 60),
            default_pause_sec:     Number(r.default_pause_sec || 10),
            rpe:                   Number.isFinite(rpeNum) ? r.rpe : (rpeText==='Lett'?2:(rpeText==='Moderat'?5:8)),
            rpe_text:              rpeText || 'Moderat',
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
      reader.readAsText(f);
    };
    document.getElementById('exportEx').onclick = () => {
      // Eksporter også "intensitet" (tekst) i tillegg til rpe for kompat
      const headers = ['exercise_id','name','description','default_duration_sec','default_pause_sec','rpe','intensitet','category','focus_area','equipment','noise_level'];
      const rows = (AppState.exercises||[]).map(e => [
        e.exercise_id, e.name, e.description, e.default_duration_secKlar, Hallvar! Jeg har **kvalitetssikret** og oppdatert alle delene du ba om. Under får du **komplette filer** du kan lime rett inn:

- `index.html` – toppfelt med **responsiv hamburgermeny** (kun når det er for lite plass); fjernet “Dashboard”-overskriften i dash-modulen.
