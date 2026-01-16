
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
    const favorites = (AppState.workouts || []).filter(w => w.favorite);

    const section = (title, itemsHtml) => (
      '<div>' +
        (title ? '<h3>'+title+'</h3>' : '') +
        itemsHtml +
      '</div>'
    );

    const recentHtml = lastThree.length
      ? lastThree.map(s =>
          '<div class="card">' +
            '<div class="row">' +
              '<div class="title"><strong>'+s.name+'</strong> <span class="small">('+Util.fmtMMSS(s.duration_sec)+')</span></div>' +
              '<div class="actions">' +
                '<button class="icon-btn play" aria-label="Start igjen" data-wid="'+s.workout_id+'">' +
                  '<svg class="icon"><use href="#icon-play"/></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        ).join('')
      : '<div class="card small">Ingen loggede økter ennå.</div>';

    const favHtml = favorites.length
      ? favorites.map(w =>
          '<div class="card">' +
            '<div class="row">' +
              '<div class="title"><strong>'+w.name+'</strong> <span class="small">'+(w.category||'')+' • '+(w.focus_area||'')+'</span></div>' +
              '<div class="actions">' +
                '<button class="icon-btn play" aria-label="Start" data-wid="'+w.workout_id+'">' +
                  '<svg class="icon"><use href="#icon-play"/></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        ).join('')
      : '<div class="card small">Ingen favoritter. Merk i Øktvelger.</div>';

    render('<div class="grid-2">' + section('Siste økter', recentHtml) + section('Favorittøkter', favHtml) + '</div>');

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
