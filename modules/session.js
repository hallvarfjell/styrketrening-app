
// modules/session.js
//
// - Navigasjon sperres (AppState.sessionLock) til Save/Discard
// - Bakgrunn + ramme: grønn (work) / amber (pause), 80% gjennomsiktighet (se style.css)
// - Kontroller/timer-felter er transparente (se style.css)
// - Høy bjelle (to oscillatorer) + mobil-unlock
// - Status: mindre (1/3), beskrivelse 2×
// - Logger faktisk tid (elapsedSec)
// - Halvveis-markør i progress for gjeldende fase

const Session = {
  timer: null,
  state: null,
  audioCtx: null,
  audioUnlocked: false,
  elapsedSec: 0,

  _ensureAudio(){
    try{
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      this.audioUnlocked = true;
    }catch(e){}
  },

  _bell(){
    try{
      if (!this.audioUnlocked) return;
      const ctx = this.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      this.audioCtx = ctx;

      const g   = ctx.createGain();
      const osc1= ctx.createOscillator();
      const osc2= ctx.createOscillator();

      osc1.type='sine'; osc1.frequency.value = 880;    // A5
      osc2.type='sine'; osc2.frequency.value = 1320;   // E6

      osc1.connect(g); osc2.connect(g); g.connect(ctx.destination);

      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc1.start(now);
      osc2.start(now + 0.005);
      osc1.stop(now + 0.82);
      osc2.stop(now + 0.82);

      if (navigator.vibrate) navigator.vibrate(80);
    }catch(e){}
  },

  render() {
    const w = AppState.currentWorkout;
    if (!w) { alert('Ingen økt valgt'); return navigate('library'); }

    // Lås navigasjon til økta lagres/forkastes
    AppState.sessionLock = true;
    window.onbeforeunload = (e)=>{ e.preventDefault(); e.returnValue = ''; };

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

    const computeRemainingTotal = () => {
      let rem = 0;
      rem += Math.max(0, this.state?.remainingInPhase || 0);

      if (!w.items || !w.items.length) return rem;

      if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx + 1);
        for (let i = nextIdx; i < w.items.length; i++) {
          rem += Number(w.items[i].duration_sec)||0;
          if (i < w.items.length - 1) rem += getPauseAfter(i);
        }
      } else if (this.state.phase === 'work') {
        if (this.state.idx < w.items.length - 1) rem += getPauseAfter(this.state.idx);
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
      remainingTotal: 0,
      running: false
    };
    this.state.remainingTotal = computeRemainingTotal();
    this.elapsedSec = 0;

    render(
      '<div>' +
        '<div id="sessionWrap" class="card session-card pause">' +
          '<div id="status" class="session-title">Neste:<br><strong></strong></div>' +
          '<div id="details" class="session-desc"></div>' +

          '<div class="card">' +
            '<div class="small">Gjeldende fase</div>' +
            '<div class="progress">' +
              '<div class="half-marker"></div>' +
              '<div id="barPhase" class="bar"></div>' +
            '</div>' +
            '<div id="timePhase" class="session-timer">00:00</div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="small">Hele økta (nedtelling)</div>' +
            '<div class="progress"><div id="barTotal" class="bar"></div></div>' +
            '<div id="timeTotal" class="session-timer">00:00</div>' +
          '</div>' +

          '<div class="flex">' +
            '<button class="icon-btn play" id="start" aria-label="Start/Pause"><svg class="icon">#ph-play-fill</use></svg></button>' +
            '<button class="icon-btn" id="prev" aria-label="Forrige"><svg class="icon">#ph-caret-double-left-fill</use></svg></button>' +
            '<button class="icon-btn" id="next" aria-label="Neste"><svg class="icon">#ph-caret-double-right-fill</use></svg></button>' +
            '<button class="icon-btn" id="save" aria-label="Lagre"><svg class="icon">#ph-floppy-disk-fill</use></svg></button>' +
            '<button class="icon-btn trash" id="discard" aria-label="Forkast"><svg class="icon">#ph-trash-fill</use></svg></button>' +
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

    const getPauseAfterLocal = (idx)=>getPauseAfter(idx);
    const currentPhaseTarget = () => {
      if (this.state.phase === 'pause') return (this.state.idx<0 ? getPauseAfterLocal(-1) : getPauseAfterLocal(this.state.idx));
      if (this.state.phase === 'work')  return (w.items[this.state.idx]||{}).duration_sec || 60;
      return 1;
    };

    const setStatus = () => {
      const el = document.getElementById('status');
      const det = document.getElementById('details');

      if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        const next = w.items[nextIdx];
        const e = next ? AppState.exercises.find(x=>x.exercise_id===next.exercise_id) : null;
        el.innerHTML = 'Neste:<br><strong>' + (next ? (e?e.name:next.exercise_id) : '') + '</strong>';
        det.innerHTML = (e?.description||'').replace(/\n/g,'<br>');
        wrap.classList.add('pause'); wrap.classList.remove('work');
      } else if (this.state.phase === 'work') {
        const it = w.items[this.state.idx];
        const e  = AppState.exercises.find(x=>x.exercise_id===it.exercise_id);
        el.innerHTML = 'Øvelse:<br><strong>' + (e?e.name:it.exercise_id) + '</strong>';
        det.innerHTML  = (e?.description||'').replace(/\n/g,'<br>');
        wrap.classList.add('work'); wrap.classList.remove('pause');
      } else {
        el.innerHTML = 'Ferdig!<br><strong></strong>';
        det.textContent = '';
        wrap.classList.remove('work'); wrap.classList.add('pause');
      }
    };

    const updateUI = () => {
      document.getElementById('timeTotal').textContent = Util.fmtMMSS(this.state.remainingTotal);
      const totalDone = Math.max(0, totalPlanned - this.state.remainingTotal);
      document.getElementById('barTotal').style.width = Math.min(100,(totalDone/totalPlanned)*100) + '%';

      document.getElementById('timePhase').textContent = Util.fmtMMSS(this.state.remainingInPhase);
      const phaseTarget = currentPhaseTarget();
      const phaseDone   = Math.max(0, phaseTarget - this.state.remainingInPhase);
      document.getElementById('barPhase').style.width = Math.min(100,(phaseDone/phaseTarget)*100) + '%';

      setStatus();
      refreshListHl();
      updateStartIcon();
    };

    const nextPhase = () => {
      this._bell();

      if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        if (nextIdx >= w.items.length) {
          this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); updateUI(); return;
        }
        this.state.idx = nextIdx; this.state.phase = 'work'; this.state.remainingInPhase = w.items[this.state.idx].duration_sec;
      } else if (this.state.phase === 'work') {
        if (this.state.idx < w.items.length-1) { this.state.phase = 'pause'; this.state.remainingInPhase = getPauseAfterLocal(this.state.idx); }
        else { this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); }
      }
      updateUI();
    };

    const step = () => {
      if (!this.state.running || this.state.phase === 'done') return;
      this.state.remainingInPhase = Math.max(0, this.state.remainingInPhase - 1);
      this.state.remainingTotal   = Math.max(0, this.state.remainingTotal   - 1);
      this.elapsedSec += 1;
      (this.state.remainingInPhase === 0) ? nextPhase() : updateUI();
    };

    this.toggle = () => {
      this._ensureAudio(); // mobil-unlock
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
        this.state.phase = 'pause'; this.state.remainingInPhase = (this.state.idx<0 ? getPauseAfterLocal(-1) : getPauseAfterLocal(this.state.idx));
      }
      recomputeTotal(); updateUI();
    };

    const skipNext = () => {
      if (this.state.phase === 'done') return;
      if (this.state.phase === 'work') {
        if (this.state.idx < w.items.length-1) { this.state.phase = 'pause'; this.state.remainingInPhase = getPauseAfterLocal(this.state.idx); }
        else { this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); }
      } else if (this.state.phase === 'pause') {
        const nextIdx = (this.state.idx < 0 ? 0 : this.state.idx+1);
        if (nextIdx < w.items.length) { this.state.idx = nextIdx; this.state.phase = 'work'; this.state.remainingInPhase = w.items[this.state.idx].duration_sec; }
        else { this.state.phase = 'done'; this.state.remainingInPhase = 0; this.state.remainingTotal = 0; this.stop(); }
      }
      recomputeTotal(); updateUI();
    };

    // Handlers
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
      // Lagre FAKTISK TID
      day.sessions.push({
        workout_id: w.workout_id,
        name: w.name,
        start_time_local: today.toISOString(),
        duration_sec: this.elapsedSec,
        computed_hr_bpm: 90,
        events: []
      });
      Store.save(Store.keys.logs, AppState.logs);

      // Frigjør nav-lås
      AppState.sessionLock = false;
      window.onbeforeunload = null;

      alert('Økt lagret i logg.');
      navigate('log');
    };
    document.getElementById('discard').onclick= () => {
      if (confirm('Forkaste økta?')) {
        this.stop();
        AppState.sessionLock = false;
        window.onbeforeunload = null;
        navigate('dashboard');
      }
    };

    // Mobil audio-lås → unlock ved første interaksjon
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
``
