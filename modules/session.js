
const Session = {
  timer:null, state:null,
  render(){
    const w=AppState.currentWorkout; if(!w){ alert('Ingen økt valgt'); return navigate('library'); }
    this.state={ idx:-1, elapsedInItem:0, elapsedTotal:0, running:false };
    render(`
      <div class=grid-2>
        <div>
          <div class=card>
            <div id=status style="font-weight:bold;">Gjør deg klar.</div>
            <div id=details class=small></div>
            <div class=card>
              <div class=small>Øvelse</div>
              <div class=progress><div id=barItem class=bar></div></div>
              <div id=timeItem class=small>00:00</div>
            </div>
            <div class=card>
              <div class=small>Hele økta</div>
              <div class=progress><div id=barTotal class=bar></div></div>
              <div id=timeTotal class=small>00:00</div>
            </div>
            <div class=flex>
              <button class=button id=start>Start/Pause</button>
              <button class="button secondary" id=save>Avslutt og lagre</button>
              <button class="button secondary" id=discard>Forkast</button>
            </div>
          </div>
        </div>
        <div>
          <div class=card id=list></div>
        </div>
      </div>
    `);
    document.getElementById('list').innerHTML=(w.items||[]).map((it,i)=>{ const e=AppState.exercises.find(x=>x.exercise_id===it.exercise_id); const name=e?e.name:it.exercise_id; const dur=Util.fmtMMSS(it.duration_sec); return `<div class=small ${i===this.state.idx?'active':''}>${name} • ${dur}</div>`; }).join('');
    const updateUI=()=>{ const totalTarget=w.items.reduce((a,b)=>a+b.duration_sec,0) + ((w.items.length-1)*w.pause_between_items_sec); document.getElementById('timeTotal').textContent=Util.fmtMMSS(this.state.elapsedTotal); document.getElementById('barTotal').style.width=`${Math.min(100, this.state.elapsedTotal/totalTarget*100)}%`; if(this.state.idx<0){ document.getElementById('status').textContent='Gjør deg klar.'; document.getElementById('details').textContent=''; document.getElementById('timeItem').textContent='00:00'; document.getElementById('barItem').style.width='0%'; } else { const it=w.items[this.state.idx]; const e=AppState.exercises.find(x=>x.exercise_id===it.exercise_id); document.getElementById('status').textContent='Kjør!'; document.getElementById('details').textContent=`${e?e.name:it.exercise_id} — ${e?e.description:''}`; document.getElementById('timeItem').textContent=Util.fmtMMSS(this.state.elapsedInItem); document.getElementById('barItem').style.width=`${Math.min(100, this.state.elapsedInItem/it.duration_sec*100)}%`; } };
    const step=()=>{ if(!this.state.running) return; if(this.state.idx<0){ this.state.elapsedTotal+=1; if(this.state.elapsedTotal>=10){ this.state.idx=0; this.state.elapsedInItem=0; } updateUI(); return; } const it=w.items[this.state.idx]; this.state.elapsedInItem+=1; this.state.elapsedTotal+=1; if(this.state.elapsedInItem>=it.duration_sec){ if(this.state.idx < w.items.length-1){ const pauseEnd=this.state.elapsedTotal + w.pause_between_items_sec; const pauseTick=()=>{ if(!this.state.running) return; this.state.elapsedTotal+=1; if(this.state.elapsedTotal>=pauseEnd){ this.state.idx+=1; this.state.elapsedInItem=0; clearInterval(pint); } updateUI(); }; var pint=setInterval(pauseTick,1000); } else { this.stop(); alert('Økt ferdig.'); } } updateUI(); };
    this.toggle=()=>{ this.state.running=!this.state.running; if(this.state.running){ this.timer=setInterval(step,1000); } else { clearInterval(this.timer); } };
    this.stop=()=>{ this.state.running=false; clearInterval(this.timer); };
    document.getElementById('start').onclick=()=>this.toggle();
    document.getElementById('save').onclick=()=>{ if(!confirm('Avslutte økta?')) return; this.stop(); const today=new Date(); const dateStr=today.toISOString().substring(0,10); const day=AppState.logs.find(d=>d.date===dateStr) || {date:dateStr, sessions:[]}; if(!AppState.logs.find(d=>d.date===dateStr)) AppState.logs.push(day); day.sessions.push({ workout_id:w.workout_id, name:w.name, start_time_local:today.toISOString(), duration_sec:this.state.elapsedTotal, computed_hr_bpm:90, events:[] }); Store.save(Store.keys.logs, AppState.logs); alert('Økt lagret i logg.'); navigate('log'); };
    document.getElementById('discard').onclick=()=>{ if(confirm('Forkaste økta?')){ this.stop(); navigate('dashboard'); } };
    window.onkeydown=(e)=>{ if(e.code==='Space'){ e.preventDefault(); this.toggle(); } else if(e.code==='ArrowRight'){ if(this.state.idx < w.items.length-1){ this.state.idx++; this.state.elapsedInItem=0; updateUI(); } } else if(e.code==='ArrowLeft'){ if(this.state.idx>0){ this.state.idx--; this.state.elapsedInItem=0; updateUI(); } } };
    updateUI();
  }
};
window.Session=Session;
