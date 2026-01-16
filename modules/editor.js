
// modules/editor.js
//
// Beholder baseline-stil (kort/rammer). Ikonknapper i øvelseslista (pluss, blyant, søppelspann).
// Import/eksport øvelser inkluderer default_pause_sec og intensitet (Lav/Middels/Høy).

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
    const eqSet=new Set(), catSet=new Set(), focusSet=new Set(), noiseSet=new Set();
    (AppState.exercises||[]).forEach(e=>{
      (e.equipment||[]).forEach(eq=>{ if (eq) eqSet.add(eq); });
      if (e.category) catSet.add(e.category);
      if (e.focus_area) focusSet.add(e.focus_area);
      if (e.noise_level) noiseSet.add(e.noise_level);
    });
    const allEquipment=Array.from(eqSet).sort();
    const allCategories=Array.from(catSet).sort((a,b)=>String(a).localeCompare(String(b)));
    const defaultFocus=['Hele kroppen','Overkropp','Underkropp'];
    const allFocus=focusSet.size?Array.from(focusSet).sort((a,b)=>String(a).localeCompare(String(b))):defaultFocus;
    const preferNoise=['Lavt','Medium','Høyt'];
    const rest=Array.from(noiseSet).filter(n=>!preferNoise.includes(n)).sort((a,b)=>String(a).localeCompare(String(b)));
    const allNoise=preferNoise.concat(rest);

    function optionsSimple(arr, selectedVal){ let s=''; for(const v of arr) s+='<option'+(selectedVal===v?' selected':'')+'>'+v+'</option>'; return s; }
    function dataListOptions(arr){ let s=''; for(const v of arr) s+='<option value="'+v+'">'; return s; }

    const html =
      '<div class="grid-2">' +
        '<div>' +
          // BYGG ØKT
          '<div class="card">' +
            '<h3>Bygg økt</h3>' +
            '<input id="name" class="input" style="width:100%;" placeholder="Øktnavn" value="'+(w.name||'')+'" />' +
            '<div class="flex" style="margin-top:8px;">' +
              '<input id="focus" class="input" placeholder="Fokusområde" list="focusList" value="'+(w.focus_area||'Hele kroppen')+'" />' +
              '<datalist id="focusList">'+dataListOptions(allFocus)+'</datalist>' +
              '<input id="cat" class="input" placeholder="Kategori" value="'+(w.category||'')+'" list="categoryList" />' +
              '<datalist id="categoryList">'+dataListOptions(allCategories)+'</datalist>' +
            '</div>' +
            '<div id="items" style="margin-top:8px;"></div>' +
            '<div class="flex" style="margin-top:8px;"><button class="button" id="save">Lagre økt</button></div>' +
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
              '<input id="new_cat" class="input" placeholder="Kategori" list="categoryList" />' +
            '</div>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<select id="new_intensity" class="input"><option value="">Intensitet</option><option value="Lav">Lav</option><option value="Middels">Middels</option><option value="Høy">Høy</option></select>' +
              '<select id="new_noise" class="input"><option value="">Lydnivå</option>'+ (function(){let s=''; for(const n of allNoise){ s+='<option value="'+n+'">'+n+'</option>'; } return s; })() +'</select>' +
            '</div>' +

            '<div class="flex" style="margin-top:8px;">' +
              '<div class="small" style="flex:1;">Tilgjengelig utstyr: <span id="newEqHint" class="small">Kun kroppsvekt</span></div>' +
            '</div>' +
            '<div class="flex">' +
              (function(){ let s=''; for(const eq of allEquipment){ s+='<label class="small"><input type="checkbox" class="new-eq" value="'+eq+'"> '+eq+'</label>'; } return s; })() +
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
            '<div class="small">CSV: exercise_id;name;description;default_duration_sec;default_pause_sec;intensitet;category;focus_area;equipment;noise_level</div>' +
          '</div>' +
        '</div>' +

        // HØYRE: ØVELSER + FILTER
        '<div>' +
          '<div class="card">' +
            '<h3>Filter øvelser</h3>' +
            '<div class="flex">' +
              '<select id="fFocus" class="input"><option value="">Fokus (alle)</option>'+ optionsSimple(allFocus,'') +'</select>' +
              '<select id="fCat" class="input"><option value="">Kategori (alle)</option>'+ (function(){let s=''; for(const c of allCategories){ s+='<option>'+c+'</option>'; } return s; })() +'</select>' +
            '</div>' +
            '<div class="flex" style="margin-top:8px;">' +
              '<select id="fIntensity" class="input"><option value="">Intensitet (alle)</option><option value="Lav">Lav</option><option value="Middels">Middels</option><option value="Høy">Høy</option></select>' +
              '<select id="fNoise" class="input"><option value="">Lydnivå (alle)</option>'+ (function(){let s=''; for(const n of allNoise){ s+='<option value="'+n+'">'+n+'</option>'; } return s; })() +'</select>' +
            '</div>' +
            '<div style="margin-top:8px;"><input id="fSearch" class="input" placeholder="Søk (navn/beskrivelse)" /></div>' +
            '<div id="exlist" style="margin-top:12px;"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    render(html);

    // Utstyr (ny øvelse)
    let newSelectedEquip=new Set();
    function updateNewEquipHint(){ const arr=[...newSelectedEquip]; document.getElementById('newEqHint').textContent = arr.length ? arr.join(', ') : 'Kun kroppsvekt'; }
    document.querySelectorAll('.new-eq').forEach(cb=>{
      cb.onchange=()=>{ if(cb.checked)newSelectedEquip.add(cb.value); else newSelectedEquip.delete(cb.value); updateNewEquipHint(); };
    });

    // Import/eksport øvelser
    document.getElementById('eximport').onclick=()=>{
      const f=document.getElementById('excsv').files[0]; if(!f) return alert('Velg øvelses-CSV');
      const r=new FileReader(); r.onload=()=>{
        const rows=Util.parseCSV(r.result,';');
        AppState.exercises=rows.map(x=>{
          const eq=(x.equipment||'').replace(/;/g,',').split(',').map(s=>s.trim()).filter(Boolean);
          const intens=(x.intensitet||'').trim();
          let rpeText = intens ? (intens==='Lav'?'Lett': intens==='Middels'?'Moderat':'Hardt')
                               : (x.rpe_text || (Number(x.rpe)<=3?'Lett':Number(x.rpe)<=6?'Moderat':'Hardt'));
          const rpeNum = rpeText==='Lett'?2:(rpeText==='Moderat'?5:8);
          const desc=(x.description||''), prog=(x.progression_tips||'').trim();
          return {
            exercise_id:x.exercise_id||('EX'+Date.now()),
            name:x.name, description: prog ? (desc+'\nProgresjon: '+prog) : desc,
            default_duration_sec:Number(x.default_duration_sec||60),
            default_pause_sec:Number(x.default_pause_sec||10),
            rpe:rpeNum, rpe_text:rpeText,
            category:x.category||'', focus_area:x.focus_area||'Hele kroppen',
            equipment:eq, noise_level:x.noise_level||'Medium',
            created_at:Number(x.created_at||Date.now())
          };
        });
        Store.save(Store.keys.exercises,AppState.exercises);
        alert('Importert '+AppState.exercises.length+' øvelser.'); Editor.render(w);
      }; r.readAsText(f);
    };
    document.getElementById('exportEx').onclick=()=>{
      const headers=['exercise_id','name','description','default_duration_sec','default_pause_sec','intensitet','category','focus_area','equipment','noise_level'];
      const rows=(AppState.exercises||[]).map(e=>{
        const intens=(e.rpe_text==='Lett'?'Lav':e.rpe_text==='Moderat'?'Middels':'Høy');
        return [e.exercise_id,e.name,e.description,e.default_duration_sec,(e.default_pause_sec??10),intens,e.category,e.focus_area,(e.equipment||[]).join(','),e.noise_level];
      });
      const csv=Util.toCSV(headers,rows,';');
      Util.download('exercises.csv', csv, 'text/csv;charset=utf-8');
    };

    // Legg til øvelse
    document.getElementById('addExercise').onclick=()=>{
      const name=(document.getElementById('new_name').value||'').trim();
      const desc=(document.getElementById('new_desc').value||'').trim();
      const dur =(document.getElementById('new_duration').value||'').trim();
      const pause=(document.getElementById('new_pause').value||'').trim();
      const focus=(document.getElementById('new_focus').value||'').trim();
      const cat  =(document.getElementById('new_cat').value  ||'').trim();
      const intens=document.getElementById('new_intensity').value;
      const noise=(document.getElementById('new_noise').value||'').trim();

      const missing=[]; if(!name)missing.push('Navn'); if(!desc)missing.push('Beskrivelse'); if(!intens)missing.push('Intensitet'); if(!cat)missing.push('Kategori'); if(!focus)missing.push('Fokusområde'); if(!noise)missing.push('Lydnivå');
      if(missing.length) return alert('Følgende mangler: '+missing.join(', '));

      const rpeText=intens==='Lav'?'Lett':intens==='Middels'?'Moderat':'Hardt';
      const rpeNum =rpeText==='Lett'?2:(rpeText==='Moderat'?5:8);
      const equipment=Array.from(newSelectedEquip);

      const ex={ exercise_id:'EX'+Date.now(), name, description:desc,
        default_duration_sec:/^\d+$/.test(dur)?Number(dur):60, default_pause_sec:/^\d+$/.test(pause)?Number(pause):10,
        rpe:rpeNum, rpe_text:rpeText, category:cat, focus_area:focus, equipment, noise_level:noise, created_at:Date.now()
      };
      AppState.exercises.unshift(ex); Store.save(Store.keys.exercises,AppState.exercises);
      alert('Øvelse lagt til'); Editor.render(w);
    };

    // Filter
    const fEqBtn=document.getElementById('fEqBtn'), fEqMenu=document.getElementById('fEqMenu'), fEqHint=document.getElementById('fEqHint');
    let fSelectedEquip=new Set(); function updateFilterEquipHint(){ const a=[...fSelectedEquip]; fEqHint.textContent=a.length?a.join(', '):'kun kroppsvekt'; }
    fEqBtn && (fEqBtn.onclick=()=>{ fEqMenu.style.display=(fEqMenu.style.display==='none'?'block':'none'); });
    const fEqAll=document.getElementById('fEqAll'); if (fEqAll){
      fEqAll.onchange=()=>{ fSelectedEquip=new Set(fEqAll.checked?allEquipment:[]); document.querySelectorAll('.f-eq').forEach(cb=>cb.checked=fEqAll.checked); renderExercises(); };
      document.querySelectorAll('.f-eq').forEach(cb=>cb.onchange=()=>{ if(cb.checked)fSelectedEquip.add(cb.value); else fSelectedEquip.delete(cb.value); fEqAll.checked=(fSelectedEquip.size===allEquipment.length); renderExercises(); });
    }

    function matchesFilters(e){
      const fFocus=document.getElementById('fFocus').value;
      const fCat  =document.getElementById('fCat').value;
      const fInt  =document.getElementById('fIntensity').value;
      const fNoise=document.getElementById('fNoise').value;
      const fSearch=(document.getElementById('fSearch').value||'').trim().toLowerCase();

      if(fFocus&&e.focus_area!==fFocus) return false;
      if(fCat&&e.category!==fCat) return false;

      const eInt=(e.rpe_text==='Lett'?'Lav':e.rpe_text==='Moderat'?'Middels':'Høy');
      if(fInt&&eInt!==fInt) return false;

      if(fNoise&&(e.noise_level||'Medium')!==fNoise) return false;

      const sel=[...fSelectedEquip]; const req=(e.equipment||[]).filter(x=>x!=='nei');
      if(!sel.length&&req.length) return false;
      if(sel.length&&!req.every(x=>sel.includes(x))) return false;

      const text=(String(e.name||'')+' '+String(e.description||'')).toLowerCase();
      if(fSearch&&!text.includes(fSearch)) return false;
      return true;
    }

    function renderExercises(){
      const list=(AppState.exercises||[]).filter(matchesFilters);
      list.sort((a,b)=>Number(b.created_at||0)-Number(a.created_at||0));
      let html='';
      for(const e of list){
        const dur=Number(e.default_duration_sec||60);
        html+='<div class="card">' +
                '<div class="row">' +
                  '<div class="title"><strong>'+e.name+'</strong> <span class="small">'+(e.category||'(ingen kategori)')+' • '+(e.focus_area||'')+'</span><div class="small">'+(String(e.description||'').replace(/\n/g,'<br>'))+'</div></div>' +
                  '<div class="actions" style="display:flex;gap:8px;">' +
                    '<button class="icon-btn" aria-label="Legg til i økt" data-add="'+e.exercise_id+'"><svg class="icon"><use href="#ph-plus"/></svg></button>' +
                    '<button class="icon-btn" aria-label="Rediger" data-edit="'+e.exercise_id+'"><svg class="icon"><use href="#ph-pencil-fill"/></svg></button>' +
                    '<button class="icon-btn" aria-label="Slett" data-del="'+e.exercise_id+'"><svg class="icon"><use href="#ph-trash-fill"/></svg></button>' +
                  '</div>' +
                '</div>' +
              '</div>';
      }
      document.getElementById('exlist').innerHTML=html||'<div class="card small">Ingen øvelser matcher filteret.</div>';

      document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{ const ex=AppState.exercises.find(x=>x.exercise_id===b.dataset.add); const d=Number(ex?.default_duration_sec||60), p=Number(ex?.default_pause_sec||10); (w.items||(w.items=[])).push({ exercise_id: ex.exercise_id, duration_sec: d, pause_after_sec: p }); renderItems(); });
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{ const ex=AppState.exercises.find(x=>x.exercise_id===b.dataset.edit); if(!ex)return; document.getElementById('new_name').value=ex.name||''; document.getElementById('new_desc').value=ex.description||''; document.getElementById('new_duration').value=String(ex.default_duration_sec||60); document.getElementById('new_pause').value=String((ex.default_pause_sec!=null?ex.default_pause_sec:10)); document.getElementById('new_focus').value=ex.focus_area||''; document.getElementById('new_cat').value=ex.category||''; document.getElementById('new_intensity').value=(ex.rpe_text==='Lett'?'Lav':ex.rpe_text==='Moderat'?'Middels':'Høy'); document.getElementById('new_noise').value=ex.noise_level||''; newSelectedEquip=new Set((ex.equipment||[]).filter(Boolean)); document.querySelectorAll('.new-eq').forEach(cb=>cb.checked=newSelectedEquip.has(cb.value)); updateNewEquipHint(); alert('Feltene er fylt – rediger og trykk "Legg til øvelse" for å lagre som ny øvelse.'); });
      document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const eid=b.dataset.del; const idx=AppState.exercises.findIndex(x=>x.exercise_id===eid); if(idx>=0&&confirm('Slette øvelsen?')){ AppState.exercises.splice(idx,1); Store.save(Store.keys.exercises,AppState.exercises); (AppState.workouts||[]).forEach(W=>{ if(Array.isArray(W.items)) W.items=W.items.filter(it=>it.exercise_id!==eid); }); Store.save(Store.keys.workouts,AppState.workouts); w.items=(w.items||[]).filter(it=>it.exercise_id!==eid); renderExercises(); renderItems(); } });
    }

    function addDragHandlers(card, idx){
      card.setAttribute('draggable','true'); card.classList.add('item-card');
      card.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', String(idx)); });
      card.addEventListener('dragover', (e)=>{ e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', ()=> card.classList.remove('drag-over'));
      card.addEventListener('drop', (e)=>{ e.preventDefault(); card.classList.remove('drag-over'); const from=Number(e.dataTransfer.getData('text/plain')); const to=idx; if(Number.isFinite(from) && from!==to){ const [m]=w.items.splice(from,1); w.items.splice(to,0,m); renderItems(); } });
    }

    function renderItems(){
      const container=document.getElementById('items'); if(!container) return;
      if (!w.items || !w.items.length) { container.innerHTML = '<div class="card small">Ingen øvelser i økta ennå.</div>'; return; }
      let html='';
      w.items.forEach((it, idx) => {
        const ex=AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        const name=ex?ex.name:it.exercise_id;
        const d=Number(it.duration_sec||ex?.default_duration_sec||60);
        const p=Number((it.pause_after_sec!=null?it.pause_after_sec:(ex?.default_pause_sec!=null?ex.default_pause_sec:10)));
        html+='<div class="card item-card" data-idx="'+idx+'">'+
                '<div><strong>'+name+'</strong></div>'+
                '<div class="flex"><div style="flex:1;"><div class="small" style="color:#666;margin-bottom:4px;">Varighet (mm:ss)</div><input class="input" value="'+Util.fmtMMSS(d)+'" data-dur="'+idx+'"/></div><div style="flex:1;"><div class="small" style="color:#666;margin-bottom:4px;">Pause (s)</div><input class="input" value="'+p+'" data-pause="'+idx+'"/></div></div>'+
                '<div class="flex" style="margin-top:8px;"><button class="button secondary" data-del="'+idx+'">Fjern</button></div>'+
              '</div>';
      });
      container.innerHTML=html;
      container.querySelectorAll('.item-card').forEach(el=>addDragHandlers(el, Number(el.getAttribute('data-idx'))));
      container.querySelectorAll('[data-dur]').forEach(inp=>inp.onchange=()=>{ const i=Number(inp.dataset.dur); w.items[i].duration_sec=Util.parseMMSS(inp.value); });
      container.querySelectorAll('[data-pause]').forEach(inp=>inp.onchange=()=>{ const i=Number(inp.dataset.pause); const v=Number(inp.value); w.items[i].pause_after_sec=Number.isFinite(v)?v:10; });
      container.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const i=Number(b.dataset.del); w.items.splice(i,1); renderItems(); });
    }

    // Init
    renderExercises(); renderItems();

    document.getElementById('fFocus').onchange=renderExercises;
    document.getElementById('fCat').onchange=renderExercises;
    document.getElementById('fIntensity').onchange=renderExercises;
    document.getElementById('fNoise').onchange=renderExercises;
    document.getElementById('fSearch').oninput=renderExercises;

    // Lagre (enkel validering: min. ett navn/fokus/kategori/øvelse)
    document.getElementById('save').onclick=()=>{
      const name=(document.getElementById('name').value||'').trim();
      const focus=(document.getElementById('focus').value||'').trim();
      const cat=(document.getElementById('cat').value||'').trim();
      const missing=[]; if(!name)missing.push('Øktnavn'); if(!focus)missing.push('Fokusområde'); if(!cat)missing.push('Kategori'); if(!w.items||!w.items.length)missing.push('Minst én øvelse');
      if (missing.length) return alert('Kan ikke lagre. Mangler: '+missing.join(', '));
      w.name=name; w.focus_area=focus; w.category=cat;
      if(!w.created_at) w.created_at=Date.now();

      const equipSet=new Set(); let rpeSum=0, rpeCount=0; const noiseLevels={ Low:1, Medium:2, High:3 }; let noiseMax=1;
      (w.items||[]).forEach(it=>{ const e=AppState.exercises.find(x=>x.exercise_id===it.exercise_id); if(e){ (e.equipment||[]).forEach(eq=>equipSet.add(eq)); rpeSum+=(e.rpe||5); rpeCount++; noiseMax=Math.max(noiseMax, noiseLevels[e.noise_level]||2); }});
      const totalWork=(w.items||[]).reduce((a,b)=>a+(Number(b.duration_sec)||0),0);
      const totalPause=(w.items||[]).reduce((a,b,i)=>a+(i<w.items.length-1?Number(b.pause_after_sec??10):0),0);
      const preStart=(w.items&&w.items.length)?(w.items[0].pause_after_sec??10):0;
      w.computed={ total_time_sec: totalWork+totalPause+preStart, equipment:[...equipSet], noise_level: noiseMax===3?'High':(noiseMax===2?'Medium':'Low'), rpe_avg: rpeCount?(rpeSum/rpeCount):5 };

      const idx=AppState.workouts.findIndex(x=>x.workout_id===w.workout_id);
      if (idx>=0) AppState.workouts[idx]=w; else AppState.workouts.unshift(w);
      Store.save(Store.keys.workouts,AppState.workouts);
      alert('Økt lagret.'); Library.render(); setActive('library');
    };
  }
};
window.Editor = Editor;
``
