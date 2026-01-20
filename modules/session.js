
// modules/session.js
//
// - Navigasjon sperres (AppState.sessionLock) til Save/Discard
// - Bakgrunn + ramme: grønn (work) / amber (pause), 80% gjennomsiktighet (se style.css)
// - Kontroller/timer-felter er transparente (se style.css)
// - Høy bjelle (to oscillatorer) + mobil-unlock
// - Status: mindre (1/3), beskrivelse 2×
// - Logger faktisk tid (elapsedSec)
// - Halvveis-markør i progress for gjeldende fase
// - Ikoner bruker <use href="#...">

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
