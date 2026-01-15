
// modules/dashboard.js

const Dashboard = {
  render() {
    // 3 siste unike
    const days = (AppState.logs || []).slice().reverse();
    const seen = new Set(), lastThree = [];
    for (const day of days) {
      for (const s of (day.sessions||[]).slice().reverse()) {
        if (!seen.has(s.workout_id)) { seen.add(s.workout_id); lastThree.push(s); }
        if (lastThree.length >= 3) break;
      }
      if (lastThree.length >= 3) break;
    }
    // Alle favoritter
    const favorites = (AppState.workouts || []).filter(w => w.favorite);

    render(
      '<div class="grid-2">' +
        '<div>' +
          '<h3>Siste økter</h3>' +
          (lastThree.length
            ? lastThree.map(s => (
                '<div class="card">' +
                  '<div><strong>'+s.name+'</strong> <span class="small">('+Util.fmtMMSS(s.duration_sec)+')</span></div>' +
                  '<button class="button" data-wid="'+s.workout_id+'">Start igjen</button>' +
                '</div>'
              )).join('')
            : '<div class="card small">Ingen loggede økter ennå.</div>') +
        '</div>' +
        '<div>' +
          '<h3>Favorittøkter</h3>' +
          (favorites.length
            ? favorites.map(w => (
                '<div class="card">' +
                  '<div><strong>'+w.name+'</strong> <span class="small">'+(w.category||'')+' • '+(w.focus_area||'')+'</span></div>' +
                  '<button class="button" data-wid="'+w.workout_id+'">Start</button>' +
                '</div>'
              )).join('')
            : '<div class="card small">Ingen favoritter. Merk i Øktvelger.</div>') +
        '</div>' +
      '</div>'
    );

    document.querySelectorAll('button[data-wid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wid = btn.getAttribute('data-wid');
        const workout = AppState.workouts.find(w => w.workout_id === wid);
        if (workout) {
          AppState.currentWorkout = workout;
          AppState.autostart = true;
          Session.render();
          setActive('none');
        }
      });
    });
  }
};

window.Dashboard = Dashboard;
