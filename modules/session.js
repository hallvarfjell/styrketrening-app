
// modules/session.js

const Session = {
  timer: null,
  state: null,
  audioCtx: null,
  audioUnlocked: false,

  _ensureAudio(){
    try{
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      this.audioUnlocked = true;
    }catch(e){/* no-op */}
  },

  _ding(){
    try{
      if (!this.audioUnlocked) return; // venter på første brukerklikk
      const ctx = this.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      this.audioCtx = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);
      o.stop(now + 0.21);
    }catch(e){}
  },

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

    // Beregn gjenværende total-tid gitt nåværende state
    const computeRemainingTotal = () => {
      let rem = 0;
      // gjenværende i nåværende fase
      rem += Math.max(0, this.state?.remainingInPhase || 0);

      if (!w.items || !w.items.length) return rem;

      if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx + 1);
        for (let i = nextIdx; i < w.items.length; i++) {
          rem += Number(w.items[i].duration_sec)||0;
          if (i < w.items.length - 1) rem += getPauseAfter(i);
        }
      } else if (this.state.phase === 'work') {
        // pause etter nåværende (om ikke siste)
        if (this.state.idx < w.items.length - 1) rem += getPauseAfter(this.state.idx);
        // resterende øvelser + pauser
        for (let i = this.state.idx + 1; i < w.items.length; i++) {
          rem += Number(w.items[i].duration_sec)||0;
          if (i < w.items.length - 1) rem += getPauseAfter(i);
        }
      }
      return rem;
    };

    this.state = {
      idx: -1,
      phase: 'pause',
      remainingInPhase: (w.items && w.items.length ? getPauseAfter(-1) : 10),
      remainingTotal: 0, // settes under
      running: false
    };
    this.state.remainingTotal = computeRemainingTotal();

    render(
      '<div>' +
        '<div id="sessionWrap" class="card session-card pause">' +
          // Stor status med linjeskift og fet navn
          '<div id="status" class="session-title">Neste:<br><strong></strong></div>' +
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

          '<div class="small" style="color:#666; margin:6px 0;">Tips: Enter/Mellomrom = Start/Pause · Piltaster = bytt øvelse</div>' +

          '<div class="flex">' +
            '<button class="icon-btn play" id="start" aria-label="Start/Pause"><svg class="icon"><use href="#ph-play-fill"></use></svg></button>' +
            '<button class="icon-btn" id="prev" aria-label="Forrige"><svg class="icon"><use href="#ph-caret-double-left-fill"></use></svg></button>' +
            '<button class="icon-btn" id="next" aria-label="Neste"><svg class="icon"><use href="#ph-caret-double-right-fill"></use></svg></button>' +
            '<button class="icon-btn" id="save" aria-label="Lagre"><svg class="icon"><use href="#ph-floppy-disk-fill"></use></svg></button>' +
            '<button class="icon-btn trash" id="discard" aria-label="Forkast"><svg class="icon"><use href="#ph-trash-fill"></use></svg></button>' +
          '</div>' +
        '</div>' +

        '<div class="card" id="list" style="margin-top:12px;"></div>' +
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

    const updateStartIcon = () => {
      const useEl = document.querySelector('#start use');
      if (!useEl) return;
      useEl.setAttribute('href', this.state.running ? '#ph-pause-fill' : '#ph-play-fill');
    };

    const currentPhaseTarget = () => {
      if (this.state.phase === 'pause') return (this.state.idx<0 ? getPauseAfter(-1) : getPauseAfter(this.state.idx));
      if (this.state.phase === 'work')  return (w.items[this.state.idx]||{}).duration_sec || 60;
      return 1;
    };

    const setStatus = () => {
      const el = document.getElementById('status');
      if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        const next = w.items[nextIdx];
        const e = next ? AppState.exercises.find(x=>x.exercise_id===next.exercise_id) : null;
        el.innerHTML = 'Neste:<br><strong>' + (next ? (e?e.name:next.exercise_id) : '') + '</strong>';
        const desc = e?.description || '';
        document.getElementById('details').innerHTML = desc.replace(/\n/g,'<br>');
        wrap.classList.add('pause'); wrap.classList.remove('work');
      } else if (this.state.phase === 'work') {
        const it = w.items[this.state.idx];
        const e  = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        el.innerHTML = 'Øvelse:<br><strong>' + (e?e.name:it.exercise_id) + '</strong>';
        const desc = e?.description || '';
        document.getElementById('details').innerHTML  = desc.replace(/\n/g,'<br>');
        wrap.classList.add('work'); wrap.classList.remove('pause');
      } else {
        el.innerHTML = 'Ferdig!<br><strong></strong>';
        document.getElementById('details').textContent = '';
        wrap.classList.remove('work'); wrap.classList.add('pause');
      }
    };

    const updateUI = () => {
      // total
      document.getElementById('timeTotal').textContent = Util.fmtMMSS(this.state.remainingTotal);
      const totalDone = Math.max(0, totalPlanned - this.state.remainingTotal);
      document.getElementById('barTotal').style.width = Math.min(100,(totalDone/totalPlanned)*100) + '%';

      // fase
      document.getElementById('timePhase').textContent = Util.fmtMMSS(this.state.remainingInPhase);
      const phaseTarget = currentPhaseTarget();
      const phaseDone   = Math.max(0, phaseTarget - this.state.remainingInPhase);
      document.getElementById('barPhase').style.width = Math.min(100,(phaseDone/phaseTarget)*100) + '%';

      setStatus();
      refreshListHl();
      updateStartIcon();
    };

    const nextPhase = () => {
      this._ding(); // lyd ved hver overgang

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
      // total justeres ikke eksplisitt her; klokket tikker videre
      updateUI();
    };

    const step = () => {
      if (!this.state.running || this.state.phase === 'done') return;
      this.state.remainingInPhase = Math.max(0, this.state.remainingInPhase - 1);
      // total trekkes hvert sekund
      this.state.remainingTotal = Math.max(0, this.state.remainingTotal - 1);
      (this.state.remainingInPhase === 0) ? nextPhase() : updateUI();
    };

    this.toggle = () => {
      this._ensureAudio(); // lås opp audio ved første start/pause-trykk (mobil)
      this.state.running = !this.state.running;
      if (this.state.running) this.timer = setInterval(step, 1000);
      else clearInterval(this.timer);
      updateStartIcon();
    };
    this.stop = () => { this.state.running=false; clearInterval(this.timer); updateStartIcon(); };

    const recomputeTotal = () => { this.state.remainingTotal = computeRemainingTotal(); };

    const skipPrev = () => {
      if (this.state.phase === 'done') return;
      if (this.state.phase === 'work' && this.state.idx > 0) {
        this.state.idx -= 1; this.state.phase = 'work'; this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
      } else {
        this.state.idx = Math.max(-1, this.state.idx - 1);
        this.state.phase = 'pause'; this.state.remainingInPhase = (this.state.idx<0 ? getPauseAfter(-1) : getPauseAfter(this.state.idx));
      }
      recomputeTotal(); updateUI();
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
      recomputeTotal(); updateUI();
    };

    // Knapp‑handlers
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

    // Unngå iOS audio‑policy: lås opp ved første interaksjon
    ['touchend','mousedown'].forEach(ev=>{
      document.body.addEventListener(ev, ()=>{ if (!this.audioUnlocked) this._ensureAudio(); }, {once:true});
    });

    window.onkeydown = (e) => {
      if (e.code==='Space' || e.code==='Enter') { e.preventDefault(); this.toggle(); }
      else if (e.code==='ArrowRight') skipNext();
      else if (e.code==='ArrowLeft')  skipPrev();
    };

    updateUI();
    if (AppState.autostart) { AppState.autostart = false; this.toggle(); }
  }
};
window.Session = Session;
