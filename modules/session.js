
// modules/session.js

// Øktkjøring:
// - Pausefasen viser "Gjør deg klar!" + navn/beskrivelse på neste øvelse.
// - Nedtelling (gjeldende fase/øvelse, inkl. pause) og nedtelling for totalen.
// - Ferdig: vis "Lagre" (uten bekreftelse).
// - Skipp (knapper + piltaster), Start/Pause med Space eller Enter.
// - Autostart hvis AppState.autostart = true (settes fra Øktvelger/Dashboard).

const Session = {
  timer: null,
  state: null,

  render() {
    const w = AppState.currentWorkout; 
    if (!w) { alert('Ingen økt valgt'); return navigate('library'); }

    const pauseLen = Number(w.pause_between_items_sec || 10);

    // Tilstand
    this.state = {
      idx: -1,                 // -1 = pre-start (pause før første)
      phase: 'pause',          // 'pause' | 'work' | 'done'
      remainingInPhase: pauseLen, 
      remainingTotal: this._computeTotalRemaining(w, pauseLen), // total gjenstående
      running: false
    };

    render(`
      <div class="grid-2">
        <div>
          <div class="card">
            <div id="status" style="font-weight:bold;">Gjør deg klar.</div>
            <div id="details" class="small"></div>

            <div class="card">
              <div class="small">Gjeldende fase</div>
              <div class="progress"><div id="barPhase" class="bar"></div></div>
              <div id="timePhase" class="small">00:00</div>
            </div>

            <div class="card">
              <div class="small">Hele økta (nedtelling)</div>
              <div class="progress"><div id="barTotal" class="bar"></div></div>
              <div id="timeTotal" class="small">00:00</div>
            </div>

            <div class="flex">
              <button class="button" id="start">Start/Pause</button>
              <button class="button secondary" id="prev">Forrige</button>
              <button class="button secondary" id="next">Neste</button>
              <button class="button secondary" id="save" style="display:none;">Lagre</button>
              <button class="button secondary" id="discard">Forkast</button>
            </div>
          </div>
        </div>

        <div>
          <div class="card" id="list"></div>
        </div>
      </div>
    `);

    // Liste til høyre
    document.getElementById('list').innerHTML = (w.items||[]).map((it,i)=>{
      const e = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
      const name = e?e.name:it.exercise_id; const dur = Util.fmtMMSS(it.duration_sec);
      return `<div class="small ${i===this.state.idx?'active':''}">${name} • ${dur}</div>`;
    }).join('');

    const updateUI = () => {
      const totalPlanned = this._computeTotalPlanned(w, pauseLen);
      // Total progress: bruker remainingTotal
      document.getElementById('timeTotal').textContent = Util.fmtMMSS(this.state.remainingTotal);
      const totalDone = Math.max(0, totalPlanned - this.state.remainingTotal);
      document.getElementById('barTotal').style.width = `${Math.min(100, (totalDone/totalPlanned)*100)}%`;

      if (this.state.phase === 'pause') {
        document.getElementById('status').textContent = 'Gjør deg klar!';
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        const next = w.items[nextIdx];
        if (next) {
          const e = AppState.exercises.find(x=>x.exercise_id===next.exercise_id);
          document.getElementById('details').innerHTML = `<strong>Neste:</strong> ${e?e.name:next.exercise_id}<br>${(e?.description||'').replace(/\n/g,'<br>')}`;
        } else {
          document.getElementById('details').textContent = '';
        }
      } else if (this.state.phase === 'work') {
        const it = w.items[this.state.idx];
        const e  = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        document.getElementById('status').textContent = 'Kjør!';
        document.getElementById('details').innerHTML  = `<strong>Øvelse:</strong> ${e?e.name:it.exercise_id}<br>${(e?.description||'').replace(/\n/g,'<br>')}`;
      } else if (this.state.phase === 'done') {
        document.getElementById('status').textContent = 'Ferdig!';
        document.getElementById('details').textContent = '';
      }

      // Fase-nedtelling
      document.getElementById('timePhase').textContent = Util.fmtMMSS(this.state.remainingInPhase);
      const phaseTarget = this._currentPhaseTarget(w, pauseLen);
      const phaseDone   = Math.max(0, phaseTarget - this.state.remainingInPhase);
      document.getElementById('barPhase').style.width = `${Math.min(100,(phaseDone/phaseTarget)*100)}%`;

      // Listehighlight
      const list = document.getElementById('list');
      if (list) {
        const nodes = list.querySelectorAll('.small');
        nodes.forEach((n, i) => n.classList.toggle('active', i===this.state.idx));
      }

      // Når ferdig: vis kun "Lagre" og "Forkast"
      if (this.state.phase === 'done') {
        document.getElementById('save').style.display    = 'inline-block';
      } else {
        document.getElementById('save').style.display    = 'none';
      }
    };

    const nextPhase = () => {
      if (this.state.phase === 'pause') {
        // Fra pause -> jobb på neste øvelse
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        if (nextIdx >= w.items.length) {
          this.state.phase = 'done';
          this.state.remainingInPhase = 0;
          this.state.remainingTotal   = 0;
          this.stop();
          updateUI();
          return;
        }
        this.state.idx = nextIdx;
        this.state.phase = 'work';
        this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
        updateUI();
      } else if (this.state.phase === 'work') {
        // Fra jobb -> pause hvis det er flere igjen
        if (this.state.idx < w.items.length-1) {
          this.state.phase = 'pause';
          this.state.remainingInPhase = pauseLen;
          updateUI();
        } else {
          // Siste øvelse avsluttet
          this.state.phase = 'done';
          this.state.remainingInPhase = 0;
          this.state.remainingTotal   = 0;
          this.stop();
          updateUI();
        }
      }
    };

    const step = () => {
      if (!this.state.running) return;
      if (this.state.phase === 'done') return;

      this.state.remainingInPhase = Math.max(0, this.state.remainingInPhase - 1);
      this.state.remainingTotal   = Math.max(0, this.state.remainingTotal   - 1);

      if (this.state.remainingInPhase === 0) {
        nextPhase();
      }
      updateUI();
    };

    // API
    this.toggle = () => { 
      this.state.running = !this.state.running; 
      if (this.state.running) { this.timer = setInterval(step, 1000); } 
      else { clearInterval(this.timer); } 
    };
    this.stop = () => { this.state.running=false; clearInterval(this.timer); };

    // Skipping
    const skipPrev = () => {
      if (this.state.phase === 'done') return;
      if (this.state.phase === 'work' && this.state.idx > 0) {
        this.state.idx -= 1;
        this.state.phase = 'work';
        this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
      } else {
        // hopp til pause før nåværende, eller pre-start
        this.state.idx = Math.max(-1, this.state.idx - 1);
        this.state.phase = (this.state.idx < 0 ? 'pause' : 'pause');
        this.state.remainingInPhase = pauseLen;
      }
      this.state.remainingTotal = this._recomputeRemainingTotal(w, pauseLen, this.state.idx, this.state.phase, this.state.remainingInPhase);
      updateUI();
    };
    const skipNext = () => {
      if (this.state.phase === 'done') return;
      if (this.state.phase === 'work') {
        // hopp til neste pause eller done
        if (this.state.idx < w.items.length-1) {
          this.state.phase = 'pause';
          this.state.remainingInPhase = pauseLen;
        } else {
          this.state.phase = 'done';
          this.state.remainingInPhase = 0;
          this.state.remainingTotal   = 0;
          this.stop();
        }
      } else if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        if (nextIdx < w.items.length) {
          this.state.idx = nextIdx;
          this.state.phase = 'work';
          this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
        } else {
          this.state.phase = 'done';
          this.state.remainingInPhase = 0;
          this.state.remainingTotal   = 0;
          this.stop();
        }
      }
      this.state.remainingTotal = this._recomputeRemainingTotal(w, pauseLen, this.state.idx, this.state.phase, this.state.remainingInPhase);
      updateUI();
    };

    // Knapper
    document.getElementById('start').onclick  = () => this.toggle();
    document.getElementById('prev').onclick   = skipPrev;
    document.getElementById('next').onclick   = skipNext;
    document.getElementById('save').onclick   = () => {
      // Ferdig: lagre uten bekreftelse
      const today = new Date(); const dateStr = today.toISOString().substring(0,10);
      const day = AppState.logs.find(d=>d.date===dateStr) || { date: dateStr, sessions: [] };
      if (!AppState.logs.find(d=>d.date===dateStr)) AppState.logs.push(day);
      // total varighet ~ planlagt (kan evt. differensiere ved skipping)
      const duration = this._computeTotalPlanned(w, pauseLen);
      day.sessions.push({ workout_id: w.workout_id, name: w.name, start_time_local: today.toISOString(), duration_sec: duration, computed_hr_bpm: 90, events: [] });
      Store.save(Store.keys.logs, AppState.logs);
      alert('Økt lagret i logg.');
      navigate('log');
    };
    document.getElementById('discard').onclick= () => { if (confirm('Forkaste økta?')) { this.stop(); navigate('dashboard'); } };

    // Tastatursnarveier: Space/Enter = start/pause; piler = skip
    window.onkeydown = (e) => { 
      if (e.code==='Space' || e.code==='Enter') { e.preventDefault(); this.toggle(); } 
      else if (e.code==='ArrowRight') skipNext();
      else if (e.code==='ArrowLeft')  skipPrev();
    };

    // Autostart
    if (AppState.autostart) {
      AppState.autostart = false;
      this.toggle();
    }

    updateUI();
  },

  _computeTotalPlanned(w, pauseLen){
    const totalWork = (w.items||[]).reduce((a,b)=>a+b.duration_sec,0);
    const pauses = Math.max(0, (w.items||[]).length-1) * pauseLen;
    // + første pre-start pause (gjelder "gjør deg klar" før første) = pauseLen
    return totalWork + pauses + pauseLen;
  },

  _computeTotalRemaining(w, pauseLen){
    return this._computeTotalPlanned(w, pauseLen);
  },

  _currentPhaseTarget(w, pauseLen) {
    if (this.state.phase === 'pause') return pauseLen;
    if (this.state.phase === 'work')  return (w.items[this.state.idx]||{}).duration_sec || 60;
    return 1;
  },

  _recomputeRemainingTotal(w, pauseLen, idx, phase, remainingPhase){
    // Regn ut gjenstående fra nåværende posisjon
    let rem = 0;
    // Inkluder gjenstående tid i nåværende fase:
    rem += remainingPhase;

    if (phase === 'pause') {
      // Pause før neste øvelse; plan videre: alle resterende øvelser + pauser etter dem
      const startIdx = (idx < 0 ? 0 : idx+1);
      for (let i = startIdx; i < (w.items||[]).length; i++) {
        rem += w.items[i].duration_sec;
        if (i < w.items.length-1) rem += pauseLen;
      }
    } else if (phase === 'work') {
      // I en øvelse: legg til resterende pauser/øvelser etter denne
      for (let i = idx+1; i < (w.items||[]).length; i++) {
        rem += pauseLen; // pause før neste øvelse
        rem += w.items[i].duration_sec;
      }
    }
    return rem;
  }
};

window.Session = Session;
``
