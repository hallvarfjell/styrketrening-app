
// app.js

const Store = {
  keys: { exercises:'stx_exercises', workouts:'stx_workouts', logs:'stx_logs' },
  load(k){ try{ return JSON.parse(localStorage.getItem(k))||[] }catch{ return [] } },
  save(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
};

const AppState = {
  exercises: Store.load(Store.keys.exercises),
  workouts: Store.load(Store.keys.workouts),
  logs: Store.load(Store.keys.logs),
  currentRoute: 'dashboard',
  currentWorkout: null,
  autostart: false
};

const Util = {
  fmtMMSS(sec){ const m=String(Math.floor(sec/60)).padStart(2,'0'); const s=String(Math.floor(sec%60)).padStart(2,'0'); return `${m}:${s}`; },
  parseMMSS(str){ const [m,s]=str.split(':').map(Number); return m*60 + s; },
  parseCSV(text, delimiter=';'){
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l=>l.trim().length>0);
    if (!lines.length) return [];
    const headers = Util._parseCSVLine(lines[0], delimiter);
    const rows = [];
    for (let i=1; i<lines.length; i++){
      const cols = Util._parseCSVLine(lines[i], delimiter);
      const obj = {}; headers.forEach((h, idx) => obj[h] = (cols[idx] ?? '').trim());
      rows.push(obj);
    }
    return rows;
  },
  _parseCSVLine(line, delimiter){
    const result = []; let cur = '', inQuotes = false;
    for (let i=0; i<line.length; i++){
      const ch=line[i];
      if (ch === '"'){ if (inQuotes && line[i+1] === '"'){ cur+='"'; i++; } else inQuotes=!inQuotes; }
      else if (ch === delimiter && !inQuotes){ result.push(cur); cur=''; }
      else cur+=ch;
    }
    result.push(cur); return result;
  },
  toCSV(headers, rows, delimiter=';'){
    const esc = (val) => {
      let s = String(val ?? '');
      const needsQuotes = s.includes(delimiter) || s.includes('"') || s.includes('\n');
      if (s.includes('"')) s = s.replace(/"/g, '""');
      return needsQuotes ? `"${s}"` : s;
    };
    const head = headers.map(esc).join(delimiter);
    const body = rows.map(r => r.map(esc).join(delimiter)).join('\n');
    return '\ufeff' + head + '\n' + body;
  }
};

function render(html){ document.getElementById('app').innerHTML = html; }
function setActive(route){
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.route===route));
}
function navigate(route){
  window.onkeydown = null;
  AppState.currentRoute = route;
  setActive(route);
  if (route === 'dashboard') Dashboard.render();
  if (route === 'library')   Library.render();
  if (route === 'editor')    Editor.render();
  if (route === 'log')       Log.render();
  const menu = document.getElementById('hamburgerMenu'); if (menu) menu.style.display='none';
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));

  // Hamburgermeny
  const hBtn  = document.getElementById('hamburgerBtn');
  const hMenu = document.getElementById('hamburgerMenu');
  if (hBtn && hMenu) {
    hBtn.onclick = () => { hMenu.style.display = (hMenu.style.display === 'none' ? 'block' : 'none'); };
    hMenu.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.route)));
    document.addEventListener('click', (e) => {
      if (!hMenu.contains(e.target) && !hBtn.contains(e.target)) { hMenu.style.display = 'none'; }
    });
  }

  Dashboard.render();
});

window.AppState=AppState; window.Store=Store; window.Util=Util; window.navigate=navigate;
