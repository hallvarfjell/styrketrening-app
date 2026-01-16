
// modules/session.js

const Session = {
  timer: null,
  state: null,

  render() {
    const w = AppState.currentWorkout;
    if (!w) { alert('Ingen økt valgt'); return navigate('library'); }

    const getPauseAfter = (idx) => {
      const item = w.items[idx];
      if (item && typeof item.pause_after_sec === 'number') return item.pause_after_sec;
      if (typeof w.pause_between_items_sec === 'number')    return w.pause_between_items_sec;
      return 10;
    };

    const totalPlanned = (() => {
      const work = (w.items||[]).reduce((a,b)=>a+(Number(b.duration_sec)||0),0);
      let pauses = 0;
      (w.items||[]).forEach((it, i) => { if (i<w.items.length-1) pauses += getPauseAfter(i); });
      const preStart = w.items?.length ? getPauseAfter(-1) : 10;
      return work + pauses + preStart;
    })();

    this.state = {
      idx: -1,                   // -1: pre-start
      phase: 'pause',            // 'pause' | 'work' | 'done'
      remainingInPhase: (w.items && w.items.length ? getPauseAfter(-1) : 10),
      remainingTotal: totalPlanned,
      running: false
    };

    render(
      '<div class="grid-2">' +
        '<div>' +
          '<div id="sessionWrap" class="card session-wrapper pause">' +
            '<div id="status" class="session-title">Neste:</div>' +
            '<div id="details" class="session-details small"></div>' +

            '<div class="card">' +
              '<div class="small">Gjeldende fase</div>' +
              '<div class="progress"><div id="barPhase" class="bar"></div></div>' +
              '<div id="timePhase" class="session-timer">00:00</div>' +
            '</div>' +

            '<div class="card">' +
              '<div class="small">Hele økta (nedtelling)</div>' +
              '<div class="progress"><div id="barTotal" class="bar"></div></div>' +
              '<div id="timeTotal" class="session-timer">00:00</div>' +
            '</div>' +

            '<div class="small" style="color:#666; margin:6px 0;">Tips: Enter/Mellomrom = Pause/Gjenoppta · Piltaster = bytt øvelse</div>' +

            '<div class="flex">' +
              '<button class="icon-btn play" id="start" aria-label="Start/Pause">' +
                '<svg class="icon"><use href="#icon-play"/></svg>' +
              '</button>' +
              '<button class="icon-btn" id="prev" aria-label="Forrige"><svg class="icon"><use href="#icon-prev"/></svg></button>' +
              '<button class="icon-btn" id="next" aria-label="Neste"><svg class="icon"><use href="#icon-next"/></svg></button>' +
              '<button class="icon-btn" id="save" aria-label="Lagre"><svg class="icon"><use href="#icon-save"/></svg></button>' +
              '<button class="icon-btn" id="discard" aria-label="Forkast"><svg class="icon"><use href="#icon-trash"/></svg></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="card" id="list"></div>' +
        '</div>' +
      '</div>'
    );

    const wrap = document.getElementById('sessionWrap');

    const refreshListHl = () => {
      const list = document.getElementById('list');
      list.innerHTML = (w.items||[]).map((it,i)=>{
        const e = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        const name = e?e.name:it.exercise_id; const dur = Util.fmtMMSS(it.duration_sec);
        return '<div class="small '+(i===this.state.idx?'active':'')+'">'+name+' • '+dur+'</div>';
      }).join('');
    };
    refreshListHl();

    const updateStartBtn = () => {
      const b = document.getElementById('start');
      const icon = b.querySelector('use');
      if (this.state.phase === 'done') { b.disabled = true; return; }
      icon.setAttribute('href', this.state.running ? '#icon-pause' : '#icon-play');
    };

    const currentPhaseTarget = () => {
      if (this.state.phase === 'pause') return (this.state.idx<0 ? getPauseAfter(-1) : getPauseAfter(this.state.idx));
      if (this.state.phase === 'work')  return (w.items[this.state.idx]||{}).duration_sec || 60;
      return 1;
    };

    const updateUI = () => {
      // total
      document.getElementById('timeTotal').textContent = Util.fmtMMSS(this.state.remainingTotal);
      const totalDone = Math.max(0, totalPlanned - this.state.remainingTotal);
      document.getElementById('barTotal').style.width = Math.min(100,(totalDone/totalPlanned)*100) + '%';

      if (this.state.phase === 'pause') {
        wrap.classList.add('pause'); wrap.classList.remove('work');
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        const next = w.items[nextIdx];
        if (next) {
          const e = AppState.exercises.find(x=>x.exercise_id===next.exercise_id);
          document.getElementById('status').textContent = 'Neste: ' + (e?e.name:next.exercise_id);
          document.getElementById('details').innerHTML  = (String(e?.description||'')).replace(/\n/g,'<br>');
        } else {
          document.getElementById('status').textContent = 'Neste:';
          document.getElementById('details').textContent = '';
        }
      } else if (this.state.phase === 'work') {
        wrap.classList.add('work'); wrap.classList.remove('pause');
        const it = w.items[this.state.idx]; const e  = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        document.getElementById('status').textContent = 'Øvelse: ' + (e?e.name:it.exercise_id);
        document.getElementById('details').innerHTML  = (String(e?.description||'')).replace(/\n/g,'<br>');
      } else {
        wrap.classList.remove('work'); wrap.classList.remove('pause');
        document.getElementById('status').textContent = 'Ferdig!';
        document.getElementById('details').textContent = '';
      }

      // fase
      document.getElementById('timePhase').textContent = Util.fmtMMSS(this.state.remainingInPhase);
      const phaseTarget = currentPhaseTarget();
      const phaseDone   = Math.max(0, phaseTarget - this.state.remainingInPhase);
      document.getElementById('barPhase').style.width = Math.min(100,(phaseDone/phaseTarget)*100) + '%';

      refreshListHl();
      updateStartBtn();
    };

    const nextPhase = () => {
      if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        if (nextIdx >= w.items.length) {
          this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); updateUI(); return;
        }
        this.state.idx = nextIdx; this.state.phase = 'work'; this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
      } else if (this.state.phase === 'work') {
        if (this.state.idx < w.items.length-1) { this.state.phase = 'pause'; this.state.remainingInPhase = getPauseAfter(this.state.idx); }
        else { this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); }
      }
      updateUI();
    };

    const step = () => {
      if (!this.state.running || this.state.phase === 'done') return;
      this.state.remainingInPhase = Math.max(0, this.state.remainingInPhase - 1);
      this.state.remainingTotal   = Math.max(0, this.state.remainingTotal   - 1);
      (this.state.remainingInPhase === 0) ? nextPhase() : updateUI();
    };

    this.toggle = () => {
      this.state.running = !this.state.running;
      if (this.state.running) this.timer = setInterval(step, 1000);
      else clearInterval(this.timer);
      updateStartBtn();
    };
    this.stop = () => { this.state.running=false; clearInterval(this.timer); updateStartBtn(); };

    const skipPrev = () => {
      if (this.state.phase === 'done') return;
      if (this.state.phase === 'work' && this.state.idx > 0) {
        this.state.idx -= 1; this.state.phase = 'work'; this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
      } else {
        this.state.idx = Math.max(-1, this.state.idx - 1);
        this.state.phase = 'pause'; this.state.remainingInPhase = (this.state.idx<0 ? getPauseAfter(-1) : getPauseAfter(this.state.idx));
      }
      this.state.remainingTotal = totalPlanned; updateUI();
    };
    const skipNext = () => {
      if (this.state.phase === 'done') return;
      if (this.state.phase === 'work') {
        if (this.state.idx < w.items.length-1) { this.state.phase = 'pause'; this.state.remainingInPhase = getPauseAfter(this.state.idx); }
        else { this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); }
      } else if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        if (nextIdx < w.items.length) { this.state.idx = nextIdx; this.state.phase = 'work'; this.state.remainingInPhase = w.items[this.state.idx].duration_sec; }
        else { this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); }
      }
      this.state.remainingTotal = totalPlanned; updateUI();
    };

    document.getElementById('start').onclick  = () => this.toggle();
    document.getElementById('prev').onclick   = skipPrev;
    document.getElementById('next').onclick   = skipNext;
    document.getElementById('save').onclick   = () => {
      if (this.state.phase !== 'done') {
        if (!confirm('Stoppe og lagre økta?')) return;
        this.stop();
      }
      const today = new Date(); const dateStr = today.toISOString().substring(0,10);
      const day = AppState.logs.find(d=>d.date===dateStr) || { date: dateStr, sessions: [] };
      if (!AppState.logs.find(d=>d.date===dateStr)) AppState.logs.push(day);
      day.sessions.push({ workout_id: w.workout_id, name: w.name, start_time_local: today.toISOString(), duration_sec: totalPlanned, computed_hr_bpm: 90, events: [] });
      Store.save(Store.keys.logs, AppState.logs);
      alert('Økt lagret i logg.'); navigate('log');
    };
    document.getElementById('discard').onclick= () => { if (confirm('Forkaste økta?')) { this.stop(); navigate('dashboard'); } };

    window.onkeydown = (e) => {
      if (e.code==='Space' || e.code==='Enter') { e.preventDefault(); this.toggle(); }
      else if (e.code==='ArrowRight') skipNext();
      else if (e.code==='ArrowLeft')  skipPrev();
    };

    if (AppState.autostart) { AppState.autostart = false; this.toggle(); }
    updateUI();
  }
};

window.Session = Session;
``
