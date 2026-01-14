
// modules/dashboard.js
//
// Endringer:
// - På mobil (og generelt): en enkel hamburger-knapp som åpner en liten modul-meny (Dashboard/Øktvelger/Editor/Logg).
//   (Dette løser mangel på plass i topplinjen uten å endre index.html.)
// - Viser ALLE favorittøkter.
// - Viser SISTE tre unike økter fra loggen.
// - Autostart ved start fra Dashboard (AppState.autostart = true).

const Dashboard = {
  render() {
    // 3 siste unike fra logg
    const days = (AppState.logs || []).slice().reverse();
    const seen = new Set();
    const lastThree = [];
    for (const day of days) {
      for (const s of (day.sessions||[]).slice().reverse()) {
        if (!seen.has(s.workout_id)) { seen.add(s.workout_id); lastThree.push(s); }
        if (lastThree.length >= 3) break;
      }
      if (lastThree.length >= 3) break;
    }

    // Alle favoritter
    const favorites = (AppState.workouts || []).filter(w => w.favorite);

    render(`
      <div class="flex" style="justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h2>Dashboard</h2>
        <button id="menuBtn" class="button secondary" aria-label="Meny">☰</button>
      </div>

      <div id="menuPanel" class="card" style="display:none;">
        <div class="flex">
          <button class="button" data-nav="dashboard">Dashboard</button>
          <button class="button" data-nav="library">Øktvelger</button>
          <button class="button" data-nav="editor">Editor</button>
          <button class="button" data-nav="log">Logg</button>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <h3>Siste økter</h3>
          ${
            lastThree.length
              ? lastThree.map(s => `
                <div class="card">
                  <div><strong>${s.name}</strong> <span class="small">(${Util.fmtMMSS(s.duration_sec)})</span></div>
                  <button class="button" data-wid="${s.workout_id}">Start igjen</button>
                </div>
              `).join('')
              : '<div class="card small">Ingen loggede økter ennå.</div>'
          }
        </div>
        <div>
          <h3>Favorittøkter</h3>
          ${
            favorites.length
              ? favorites.map(w => `
                <div class="card">
                  <div><strong>${w.name}</strong> <span class="small">${w.category} • ${w.focus_area}</span></div>
                  <button class="button" data-wid="${w.workout_id}">Start</button>
                </div>
              `).join('')
              : '<div class="card small">Ingen favoritter. Merk i Øktvelger.</div>'
          }
        </div>
      </div>
    `);

    // Menyknapp
    document.getElementById('menuBtn').onclick = () => {
      const p = document.getElementById('menuPanel');
      p.style.display = (p.style.display==='none' ? 'block' : 'none');
    };
    document.querySelectorAll('#menuPanel [data-nav]').forEach(b => b.onclick = () => navigate(b.dataset.nav));

    // Start knapper
    document.querySelectorAll('button[data-wid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wid = btn.getAttribute('data-wid');
        const workout = AppState.workouts.find(w => w.workout_id === wid);
        if (workout) {
          AppState.currentWorkout = workout;
          AppState.autostart = true; // autostart
          Session.render();
          setActive('none');
        }
      });
    });
  }
};

window.Dashboard = Dashboard;
