
const Dashboard = {
  render(){
    const days = AppState.logs.slice().reverse(); const seen=new Set(); const lastFive=[];
    for(const day of days){ for(const s of day.sessions.slice().reverse()){ if(!seen.has(s.workout_id)){ seen.add(s.workout_id); lastFive.push(s); } if(lastFive.length>=5) break; } if(lastFive.length>=5) break; }
    const favorites = AppState.workouts.filter(w=>w.favorite).slice(0,5);
    render(`
      <div class="grid-2">
        <div>
          <h2>Siste økter</h2>
          ${ lastFive.length ? lastFive.map(s=>`<div class=card><div><strong>${s.name}</strong> <span class=small>(${Util.fmtMMSS(s.duration_sec)})</span></div><button class=button data-wid=${s.workout_id}>Start igjen</button></div>`).join('') : '<div class=card small>Ingen loggede økter ennå.</div>' }
        </div>
        <div>
          <h2>Favorittøkter</h2>
          ${ favorites.length ? favorites.map(w=>`<div class=card><div><strong>${w.name}</strong> <span class=small>${w.category}</span></div><button class=button data-wid=${w.workout_id}>Start</button></div>`).join('') : '<div class=card small>Ingen favoritter. Merk favoritter i Øktvelger.</div>' }
        </div>
      </div>
    `);
    document.querySelectorAll('button[data-wid]').forEach(btn=>btn.onclick=()=>{ const wid=btn.getAttribute('data-wid'); const workout=AppState.workouts.find(w=>w.workout_id===wid); if(workout){ AppState.currentWorkout=workout; Session.render(); setActive('none'); } });
  }
};
window.Dashboard=Dashboard;
