
// app.js - Intervalltidtager (førsteutkast + forbedringer)
// - Pause mellom blokker
// - Kopiere blokker
// - Editor som overlay (drawer)
// - Hamburgermeny ved trang topbar
// - Phosphor icons brukes i markup

const STORAGE_KEY = "interval_presets_v2";

// ---------- Utils ----------
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function pad2(n) { return String(n).padStart(2, "0"); }

function fmtMMSS(totalSec) {
  totalSec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

// Parse "mm:ss" eller sekunder ("90")
function parseTimeToSec(str) {
  const t = (str ?? "").trim();
  if (!t) return 0;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = t.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return 0;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function describePreset(p) {
  const parts = [];
  if (p.warmupSec > 0) parts.push(`Opp ${fmtMMSS(p.warmupSec)}`);
  (p.blocks || []).forEach((b, i) => {
    const base = `${b.reps}×(${fmtMMSS(b.workSec)}/${fmtMMSS(b.restSec)})`;
    if ((b.betweenSec || 0) > 0 && i < (p.blocks.length - 1)) {
      parts.push(`${base} + ${fmtMMSS(b.betweenSec)} pause`);
    } else {
      parts.push(base);
    }
  });
  if (p.cooldownSec > 0) parts.push(`Ned ${fmtMMSS(p.cooldownSec)}`);
  return parts.join(" • ");
}

function totalDurationSec(p) {
  let total = 0;
  total += p.warmupSec || 0;

  (p.blocks || []).forEach((b, i) => {
    total += (b.workSec + b.restSec) * (b.reps || 0);
    if ((b.betweenSec || 0) > 0 && i < (p.blocks.length - 1)) total += b.betweenSec;
  });

  total += p.cooldownSec || 0;
  return total;
}

// ---------- Storage ----------
function seedPresets() {
  const presets = [
    {
      id: uid(),
      name: "4×(6:00/1:00) + opp/ned",
      warmupSec: 300,
      cooldownSec: 180,
      blocks: [{ workSec: 360, restSec: 60, reps: 4, betweenSec: 0 }],
      pinned: true,
      hidden: false,
    },
    {
      id: uid(),
      name: "10×(0:30/0:30)",
      warmupSec: 0,
      cooldownSec: 0,
      blocks: [{ workSec: 30, restSec: 30, reps: 10, betweenSec: 0 }],
      pinned: true,
      hidden: false,
    },
    {
      id: uid(),
      name: "3 blokker + pause mellom blokker",
      warmupSec: 240,
      cooldownSec: 180,
      blocks: [
        { workSec: 60,  restSec: 60, reps: 4, betweenSec: 90 }, // pause etter blokk 1
        { workSec: 120, restSec: 60, reps: 3, betweenSec: 90 }, // pause etter blokk 2
        { workSec: 180, restSec: 60, reps: 2, betweenSec: 0  }
      ],
      pinned: false,
      hidden: false,
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}

function loadPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedPresets();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return seedPresets();
    // Normalize blocks for older data
    arr.forEach(p => {
      p.blocks = (p.blocks || []).map(b => ({
        workSec: b.workSec ?? 0,
        restSec: b.restSec ?? 0,
        reps: b.reps ?? 0,
        betweenSec: b.betweenSec ?? 0
      }));
    });
    return arr;
  } catch {
    return seedPresets();
  }
}

function savePresets(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ---------- Timeline builder ----------
function buildTimeline(preset) {
  // return array of phases { type, label, durationSec }
  const tl = [];

  if ((preset.warmupSec || 0) > 0) {
    tl.push({ type: "warmup", label: "Oppvarming", durationSec: preset.warmupSec });
  }

  const blocks = preset.blocks || [];
  blocks.forEach((b, bi) => {
    const reps = Math.max(0, b.reps | 0);

    for (let r = 1; r <= reps; r++) {
      tl.push({
        type: "work",
        label: `Drag (blokk ${bi + 1}, rep ${r}/${reps})`,
        durationSec: b.workSec
      });

      if ((b.restSec || 0) > 0) {
        tl.push({
          type: "rest",
          label: `Pause (blokk ${bi + 1}, rep ${r}/${reps})`,
          durationSec: b.restSec
        });
      }
    }

    // Pause mellom blokker (etter blokk bi), kun hvis ikke siste blokk
    const between = b.betweenSec || 0;
    if (between > 0 && bi < blocks.length - 1) {
      tl.push({
        type: "between",
        label: `Pause mellom blokker (etter blokk ${bi + 1})`,
        durationSec: between
      });
    }
  });

  if ((preset.cooldownSec || 0) > 0) {
    tl.push({ type: "cooldown", label: "Nedkjøling", durationSec: preset.cooldownSec });
  }
  return tl;
}

// ---------- Wake Lock (hold skjerm våken) ----------
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch { /* ignore */ }
}
async function releaseWakeLock() {
  try { if (wakeLock) await wakeLock.release(); } catch {}
  wakeLock = null;
}

// ---------- Beep ----------
function beep() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  g.gain.value = 0.05;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => { try { o.stop(); ctx.close(); } catch {} }, 120);
}

// ---------- Timer engine ----------
class IntervalEngine {
  constructor(onTick) {
    this.onTick = onTick;
    this.timeline = [];
    this.phaseIndex = 0;
    this.phaseLeft = 0;
    this.running = false;
    this._tHandle = null;
    this._lastTs = 0;
    this._acc = 0;
    this._prevIndex = 0;
  }

  loadPreset(preset) {
    this.timeline = buildTimeline(preset);
    this.phaseIndex = 0;
    this.phaseLeft = this.timeline[0]?.durationSec ?? 0;
    this.running = false;
    this._prevIndex = 0;
    this._stopLoop();
    this._emit();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._startLoop();
  }

  pause() {
    this.running = false;
    this._stopLoop();
    this._emit();
  }

  toggle() { this.running ? this.pause() : this.start(); }

  reset() {
    this.pause();
    this.phaseIndex = 0;
    this.phaseLeft = this.timeline[0]?.durationSec ?? 0;
    this._prevIndex = 0;
    this._emit();
  }

  nextPhase() { this._goToPhase(this.phaseIndex + 1); }
  prevPhase() { this._goToPhase(this.phaseIndex - 1); }

  _goToPhase(i) {
    this.pause();
    this.phaseIndex = clamp(i, 0, Math.max(0, this.timeline.length - 1));
    this.phaseLeft = this.timeline[this.phaseIndex]?.durationSec ?? 0;
    this._prevIndex = this.phaseIndex;
    this._emit();
  }

  totalLeftSec() {
    let t = this.phaseLeft;
    for (let i = this.phaseIndex + 1; i < this.timeline.length; i++) t += this.timeline[i].durationSec;
    return t;
  }

  _startLoop() {
    this._lastTs = performance.now();
    this._acc = 0;
    this._tHandle = requestAnimationFrame(this._loop.bind(this));
    this._emit();
  }

  _stopLoop() {
    if (this._tHandle) cancelAnimationFrame(this._tHandle);
    this._tHandle = null;
  }

  _loop(ts) {
    if (!this.running) return;
    const dt = ts - this._lastTs;
    this._lastTs = ts;
    this._acc += dt;

    while (this._acc >= 250) {
      this._acc -= 250;
      this._step(0.25);
    }
    this._tHandle = requestAnimationFrame(this._loop.bind(this));
  }

  _step(sec) {
    if (this.timeline.length === 0) return;

    this.phaseLeft -= sec;

    if (this.phaseLeft <= 0) {
      this.phaseIndex++;
      if (this.phaseIndex >= this.timeline.length) {
        this.phaseIndex = this.timeline.length - 1;
        this.phaseLeft = 0;
        this.pause();
      } else {
        this.phaseLeft = this.timeline[this.phaseIndex].durationSec;
      }
    }

    this._emit();
  }

  _emit() {
    const cur = this.timeline[this.phaseIndex] ?? null;
    const next = this.timeline[this.phaseIndex + 1] ?? null;

    this.onTick?.({
      running: this.running,
      phaseIndex: this.phaseIndex,
      phaseLeft: this.phaseLeft,
      cur,
      next,
      totalLeft: this.totalLeftSec(),
      timeline: this.timeline,
      phaseChanged: this.phaseIndex !== this._prevIndex
    });

    this._prevIndex = this.phaseIndex;
  }
}

// ---------- UI state ----------
let presets = loadPresets();
let selectedId = null;
let activePreset = null;

const el = (id) => document.getElementById(id);

// elements
const quickButtons = el("quickButtons");
const presetList = el("presetList");

const btnHome = el("btnHome");
const btnMenu = el("btnMenu");
const topMenu = el("topMenu");

const btnToggleEditor = el("btnToggleEditor");
const btnCloseEditor = el("btnCloseEditor");
const editorPanel = el("editorPanel");
const editorBackdrop = el("editorBackdrop");

const btnExport = el("btnExport");
const fileImport = el("fileImport");

const btnNew = el("btnNew");
const btnAddBlock = el("btnAddBlock");
const btnSave = el("btnSave");
const btnDelete = el("btnDelete");
const btnPin = el("btnPin");
const btnHide = el("btnHide");

const inpName = el("inpName");
const inpWarmup = el("inpWarmup");
const inpCooldown = el("inpCooldown");
const blocksEl = el("blocks");

const btnStartPause = el("btnStartPause");
const btnReset = el("btnReset");
const btnNext = el("btnNext");
const btnPrev = el("btnPrev");
const chkBeep = el("chkBeep");
const chkKeepScreenOn = el("chkKeepScreenOn");

const activeNameEl = el("activeName");
const timeBig = el("timeBig");
const phaseName = el("phaseName");
const totalLeft = el("totalLeft");
const chipPhase = el("chipPhase");
const chipNext = el("chipNext");
const progressBar = el("progressBar");
const timelineEl = el("timeline");

// Engine
const engine = new IntervalEngine(onTick);

// ---------- Editor overlay ----------
function openEditor() {
  document.body.classList.add("editor-open");
  editorBackdrop.hidden = false;
  editorPanel.setAttribute("aria-hidden", "false");
  closeTopMenu();
}
function closeEditor() {
  document.body.classList.remove("editor-open");
  editorBackdrop.hidden = true;
  editorPanel.setAttribute("aria-hidden", "true");
}
function toggleEditor() {
  document.body.classList.contains("editor-open") ? closeEditor() : openEditor();
}

editorBackdrop.addEventListener("click", closeEditor);
btnToggleEditor.addEventListener("click", toggleEditor);
btnCloseEditor.addEventListener("click", closeEditor);

// ---------- Top menu (hamburger collapse) ----------
function closeTopMenu() {
  topMenu.classList.remove("open");
}
function toggleTopMenu() {
  topMenu.classList.toggle("open");
}
btnMenu.addEventListener("click", toggleTopMenu);

// Close menu if click outside
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t) return;
  const clickedInside = topMenu.contains(t) || btnMenu.contains(t);
  if (!clickedInside) closeTopMenu();
});

// Decide if we need hamburger (collapse)
function updateMenuCollapse() {
  // Force collapse on small screens
  const mq = window.matchMedia("(max-width: 720px)").matches;

  // Also collapse if topbar area becomes tight:
  // (We approximate by checking if menu would overflow its own box)
  // If the menu is visible in row mode, scrollWidth > clientWidth indicates overflow.
  let overflow = false;
  try {
    // Temporarily ensure menu is in row mode for measure
    document.body.classList.remove("menu-collapsed");
    overflow = topMenu.scrollWidth > topMenu.clientWidth + 2;
  } catch {}

  if (mq || overflow) document.body.classList.add("menu-collapsed");
  else document.body.classList.remove("menu-collapsed");

  // If we just collapsed, ensure dropdown is closed
  if (document.body.classList.contains("menu-collapsed")) closeTopMenu();
}
window.addEventListener("resize", () => {
  updateMenuCollapse();
});
window.addEventListener("load", updateMenuCollapse);

// ---------- Set active preset ----------
function setActivePreset(p) {
  activePreset = p;
  activeNameEl.textContent = p ? p.name : "—";
  engine.loadPreset(p || { warmupSec: 0, cooldownSec: 0, blocks: [] });
  renderTimelinePreview(engine.timeline);
}

function onTick(state) {
  const left = Math.ceil(state.phaseLeft);
  timeBig.textContent = fmtMMSS(left);
  phaseName.textContent = state.cur?.label ?? "—";
  totalLeft.textContent = fmtMMSS(Math.ceil(state.totalLeft));

  // Start/pause icon/text
  const icon = btnStartPause.querySelector("i");
  const text = btnStartPause.querySelector("span");
  if (state.running) {
    if (icon) icon.className = "ph ph-pause";
    if (text) text.textContent = "Pause";
  } else {
    if (icon) icon.className = "ph ph-play";
    if (text) text.textContent = "Start";
  }

  chipPhase.textContent = state.cur ? `${state.cur.type.toUpperCase()} • ${fmtMMSS(Math.ceil(state.phaseLeft))}` : "—";
  chipNext.textContent = `Neste: ${state.next ? state.next.label : "—"}`;

  // progress in current phase
  if (state.cur) {
    const dur = state.cur.durationSec || 1;
    const done = clamp((dur - state.phaseLeft) / dur, 0, 1);
    progressBar.style.width = `${(done * 100).toFixed(1)}%`;

    // beep on phase change
    if (chkBeep.checked && state.running && state.phaseChanged) {
      beep();
    }
  } else {
    progressBar.style.width = "0%";
  }
}

// ---------- Render presets ----------
function render() {
  renderQuick();
  renderList();
  if (!selectedId) {
    const first = presets.find(p => !p.hidden) || presets[0];
    if (first) selectPreset(first.id);
  }
}

function renderQuick() {
  quickButtons.innerHTML = "";
  presets
    .filter(p => !p.hidden && p.pinned)
    .forEach(p => {
      const b = document.createElement("button");
      b.className = "qbtn";
      b.textContent = p.name;
      b.onclick = () => {
        setActivePreset(p);
        engine.reset();
        engine.start();
      };
      quickButtons.appendChild(b);
    });

  if (!quickButtons.childElementCount) {
    const span = document.createElement("div");
    span.className = "hint";
    span.textContent = "Ingen festede enda. Åpne editor og trykk “Fest”.";
    quickButtons.appendChild(span);
  }
}

function renderList() {
  presetList.innerHTML = "";
  presets
    .filter(p => !p.hidden)
    .forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="desc">${escapeHtml(describePreset(p))} • Total ${fmtMMSS(totalDurationSec(p))}</div>
        <div class="actions">
          <button class="btn small" type="button"><i class="ph ph-check"></i><span>Velg</span></button>
          <button class="btn small" type="button"><i class="ph ph-play"></i><span>Start</span></button>
          <button class="btn small" type="button"><i class="ph ph-push-pin"></i><span>${p.pinned ? "Løsne" : "Fest"}</span></button>
          <button class="btn small" type="button"><i class="ph ph-eye-slash"></i><span>Skjul</span></button>
        </div>
      `;
      const [btnSelect, btnStart, btnPinToggle, btnHideOne] = card.querySelectorAll("button");
      btnSelect.onclick = () => { selectPreset(p.id); openEditor(); };
      btnStart.onclick = () => { setActivePreset(p); engine.reset(); engine.start(); };
      btnPinToggle.onclick = () => { p.pinned = !p.pinned; persist(); };
      btnHideOne.onclick = () => {
        p.hidden = true;
        if (selectedId === p.id) selectedId = null;
        persist();
      };

      presetList.appendChild(card);
    });

  if (!presetList.childElementCount) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "Ingen synlige presets. Importer eller lag en ny.";
    presetList.appendChild(empty);
  }
}

function persist() {
  savePresets(presets);
  render();
  if (selectedId) loadIntoEditor(selectedId);
}

// ---------- Editor ----------
function selectPreset(id) {
  selectedId = id;
  loadIntoEditor(id);
  const p = presets.find(x => x.id === id);
  if (p) setActivePreset(p);
}

function updateEditorButtons(p) {
  const pinText = btnPin.querySelector("span");
  const hideText = btnHide.querySelector("span");
  if (pinText) pinText.textContent = p.pinned ? "Løsne" : "Fest";
  if (hideText) hideText.textContent = p.hidden ? "Vis" : "Skjul";
}

function loadIntoEditor(id) {
  const p = presets.find(x => x.id === id);
  if (!p) return;

  inpName.value = p.name ?? "";
  inpWarmup.value = fmtMMSS(p.warmupSec || 0);
  inpCooldown.value = fmtMMSS(p.cooldownSec || 0);

  blocksEl.innerHTML = "";
  (p.blocks || []).forEach((b, idx) => addBlockRow(b, idx));
  renumberBlocks();
  updateEditorButtons(p);
}

function addBlockRow(block = { workSec: 60, restSec: 60, reps: 5, betweenSec: 0 }, idx = 0) {
  const wrap = document.createElement("div");
  wrap.className = "block";

  wrap.innerHTML = `
    <div class="top">
      <div class="title">Blokk ${idx + 1}</div>
      <div class="block-actions">
        <button class="btn ghost icon" type="button" title="Kopier blokk"><i class="ph ph-copy"></i></button>
        <button class="btn ghost icon" type="button" title="Fjern blokk"><i class="ph ph-trash"></i></button>
      </div>
    </div>

    <div class="grid4">
      <div class="field">
        <label>Drag (mm:ss)</label>
        <input class="inpWork" type="text" value="${fmtMMSS(block.workSec ?? 0)}">
      </div>

      <div class="field">
        <label>Pause (mm:ss)</label>
        <input class="inpRest" type="text" value="${fmtMMSS(block.restSec ?? 0)}">
      </div>

      <div class="field">
        <label>Reps</label>
        <input class="inpReps" type="number" min="0" step="1" value="${block.reps ?? 0}">
      </div>

      <div class="field">
        <label>Pause etter blokk (mm:ss)</label>
        <input class="inpBetween" type="text" value="${fmtMMSS(block.betweenSec ?? 0)}">
      </div>
    </div>
  `;

  const [btnCopy, btnRemove] = wrap.querySelectorAll(".block-actions button");
  btnRemove.onclick = () => {
    wrap.remove();
    renumberBlocks();
  };

  btnCopy.onclick = () => {
    const cloneData = readBlockRow(wrap);
    // Insert clone after current
    const newRow = createBlockElement(cloneData);
    wrap.insertAdjacentElement("afterend", newRow);
    wireBlockButtons(newRow);
    renumberBlocks();
  };

  blocksEl.appendChild(wrap);
  wireBlockButtons(wrap);
}

function createBlockElement(block) {
  const tmp = document.createElement("div");
  tmp.className = "block";
  tmp.innerHTML = `
    <div class="top">
      <div class="title">Blokk</div>
      <div class="block-actions">
        <button class="btn ghost icon" type="button" title="Kopier blokk"><i class="ph ph-copy"></i></button>
        <button class="btn ghost icon" type="button" title="Fjern blokk"><i class="ph ph-trash"></i></button>
      </div>
    </div>

    <div class="grid4">
      <div class="field">
        <label>Drag (mm:ss)</label>
        <input class="inpWork" type="text" value="${fmtMMSS(block.workSec ?? 0)}">
      </div>

      <div class="field">
        <label>Pause (mm:ss)</label>
        <input class="inpRest" type="text" value="${fmtMMSS(block.restSec ?? 0)}">
      </div>

      <div class="field">
        <label>Reps</label>
        <input class="inpReps" type="number" min="0" step="1" value="${block.reps ?? 0}">
      </div>

      <div class="field">
        <label>Pause etter blokk (mm:ss)</label>
        <input class="inpBetween" type="text" value="${fmtMMSS(block.betweenSec ?? 0)}">
      </div>
    </div>
  `;
  return tmp;
}

function wireBlockButtons(wrap) {
  const btns = wrap.querySelectorAll(".block-actions button");
  if (btns.length < 2) return;
  const [btnCopy, btnRemove] = btns;

  // Avoid double wiring by removing old handlers: set onclick
  btnRemove.onclick = () => {
    wrap.remove();
    renumberBlocks();
  };
  btnCopy.onclick = () => {
    const cloneData = readBlockRow(wrap);
    const newRow = createBlockElement(cloneData);
    wrap.insertAdjacentElement("afterend", newRow);
    wireBlockButtons(newRow);
    renumberBlocks();
  };
}

function renumberBlocks() {
  [...blocksEl.querySelectorAll(".block")].forEach((b, i) => {
    const t = b.querySelector(".title");
    if (t) t.textContent = `Blokk ${i + 1}`;
  });
}

function readBlockRow(row) {
  const work = parseTimeToSec(row.querySelector(".inpWork")?.value);
  const rest = parseTimeToSec(row.querySelector(".inpRest")?.value);
  const between = parseTimeToSec(row.querySelector(".inpBetween")?.value);
  const reps = parseInt(row.querySelector(".inpReps")?.value || "0", 10);
  return {
    workSec: work,
    restSec: rest,
    reps: isNaN(reps) ? 0 : reps,
    betweenSec: between
  };
}

function readEditorToPreset(existing) {
  const p = existing ? { ...existing } : {
    id: uid(),
    pinned: true,
    hidden: false
  };

  p.name = (inpName.value || "").trim() || "Uten navn";
  p.warmupSec = parseTimeToSec(inpWarmup.value);
  p.cooldownSec = parseTimeToSec(inpCooldown.value);

  const blocks = [];
  [...blocksEl.querySelectorAll(".block")].forEach((row) => {
    blocks.push(readBlockRow(row));
  });
  p.blocks = blocks;
  return p;
}

// ---------- Timeline preview ----------
function renderTimelinePreview(tl) {
  timelineEl.innerHTML = "";
  const maxItems = 10;
  tl.slice(0, maxItems).forEach((ph, i) => {
    const div = document.createElement("div");
    div.className = "tline-item";
    div.innerHTML = `<span><strong>${i + 1}.</strong> ${escapeHtml(ph.label)}</span><span>${fmtMMSS(ph.durationSec)}</span>`;
    timelineEl.appendChild(div);
  });
  if (tl.length > maxItems) {
    const more = document.createElement("div");
    more.className = "hint";
    more.textContent = `… +${tl.length - maxItems} flere faser`;
    timelineEl.appendChild(more);
  }
}

// ---------- Export/Import ----------
function exportPresets() {
  const blob = new Blob([JSON.stringify(presets, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interval-presets-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importPresetsFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result);
      if (!Array.isArray(arr)) throw new Error("Ugyldig format");

      // Merge by id (simple)
      const byId = new Map(presets.map(p => [p.id, p]));
      for (const p of arr) {
        if (p && p.id) {
          // normalize
          p.blocks = (p.blocks || []).map(b => ({
            workSec: b.workSec ?? 0,
            restSec: b.restSec ?? 0,
            reps: b.reps ?? 0,
            betweenSec: b.betweenSec ?? 0
          }));
          byId.set(p.id, p);
        }
      }
      presets = [...byId.values()];
      persist();
    } catch (e) {
      alert("Import feilet: " + (e?.message || e));
    }
  };
  reader.readAsText(file);
}

// ---------- Events ----------
btnExport.onclick = () => { exportPresets(); closeTopMenu(); };

fileImport.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importPresetsFromFile(f);
  e.target.value = "";
  closeTopMenu();
});

btnNew.onclick = () => {
  const fresh = {
    id: uid(),
    name: "Ny intervalløkt",
    warmupSec: 0,
    cooldownSec: 0,
    blocks: [{ workSec: 60, restSec: 60, reps: 5, betweenSec: 0 }],
    pinned: true,
    hidden: false,
  };
  presets.unshift(fresh);
  persist();
  selectPreset(fresh.id);
  openEditor();
};

btnAddBlock.onclick = () => {
  addBlockRow({ workSec: 60, restSec: 60, reps: 5, betweenSec: 0 }, blocksEl.querySelectorAll(".block").length);
  renumberBlocks();
};

btnSave.onclick = () => {
  const existing = presets.find(p => p.id === selectedId);
  const updated = readEditorToPreset(existing);
  if (existing) Object.assign(existing, updated);
  else {
    presets.unshift(updated);
    selectedId = updated.id;
  }
  persist();
  setActivePreset(updated);
};

btnDelete.onclick = () => {
  if (!selectedId) return;
  presets = presets.filter(p => p.id !== selectedId);
  selectedId = null;
  persist();
};

btnPin.onclick = () => {
  const p = presets.find(x => x.id === selectedId);
  if (!p) return;
  p.pinned = !p.pinned;
  persist();
};

btnHide.onclick = () => {
  const p = presets.find(x => x.id === selectedId);
  if (!p) return;
  p.hidden = !p.hidden;
  persist();
};

// Home: pause + reset + close editor + release wake lock + scroll top
btnHome.onclick = async () => {
  engine.pause();
  engine.reset();
  await releaseWakeLock();
  closeEditor();
  closeTopMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

btnStartPause.onclick = async () => {
  if (chkKeepScreenOn.checked && !engine.running) await requestWakeLock();
  if (!chkKeepScreenOn.checked) await releaseWakeLock();
  engine.toggle();
};

btnReset.onclick = async () => {
  engine.reset();
  await releaseWakeLock();
};

btnNext.onclick = () => engine.nextPhase();
btnPrev.onclick = () => engine.prevPhase();

chkKeepScreenOn.addEventListener("change", async () => {
  if (!chkKeepScreenOn.checked) await releaseWakeLock();
  else if (engine.running) await requestWakeLock();
});

// Keyboard shortcuts (PC)
window.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  if (e.code === "Space") { e.preventDefault(); btnStartPause.click(); }
  if (e.key?.toLowerCase() === "r") btnReset.click();
  if (e.key?.toLowerCase() === "n") btnNext.click();
  if (e.key?.toLowerCase() === "p") btnPrev.click();
  if (e.key?.toLowerCase() === "e") btnToggleEditor.click();
  if (e.key === "Escape") { closeEditor(); closeTopMenu(); }
});

// ---------- Init ----------
render();
const first = presets.find(p => !p.hidden) || presets[0];
if (first) selectPreset(first.id);

// Ensure menu collapse is correct after first render
updateMenuCollapse();
