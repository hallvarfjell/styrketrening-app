
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
  fmtMMSS(sec){ sec = Math.max(0, Math.round(Number(sec)||0)); const m=String(Math.floor(sec/60)).padStart(2,'0'); const s=String(sec%60).padStart(2,'0'); return `${m}:${s}`; },
  parseMMSS(val){ const t=String(val||''); if(!t.includes(':')) return Number(t)||0; const [m,s]=t.split(':').map(Number); return (Number(m)||0)*60+(Number(s)||0); },
  parseCSV(text, delimiter=';'){
    const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim().length>0);
    if (!lines.length) return [];
    const headers = Util._parseCSVLine(lines[0], delimiter);
    const rows = [];
    for (let i=1;i<lines.length;i++){
      const cols = Util._parseCSVLine(lines[i], delimiter); const obj = {};
      headers.forEach((h,idx)=>obj[h]=(cols[idx]??'').trim()); rows.push(obj);
    }
    return rows;
  },
  _parseCSVLine(line, delimiter=';'){
    const res=[]; let cur='', inQ=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch==='\"'){ if (inQ && line[i+1]==='\"'){ cur+='\"'; i++; } else inQ=!inQ; }
      else if (ch===delimiter && !inQ){ res.push(cur); cur=''; }
      else cur+=ch;
    }
    res.push(cur); return res;
  },
  toCSV(headers, rows, delimiter=';'){
    const esc=(v)=>{ let s=String(v??''); const q=s.includes(delimiter)||s.includes('"')||s.includes('\n'); if (s.includes('"')) s=s.replace(/"/g,'""'); return q?`"${s}"`:s; };
    const head = headers.map(esc).join(delimiter);
    const body = rows.map(r=>r.map(esc).join(delimiter)).join('\n');
    return '\ufeff' + head + '\n' + body;
  },
  download(filename, content, mime='text/plain;charset=utf-8'){
    const blob = new Blob([content], {type:mime});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 500);
  }
};

function render(html){ document.getElementById('app').innerHTML = html; }
function setActive(route){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.route===route)); }

function navigate(route){
  window.onkeydown = null;
  AppState.currentRoute = route;
  setActive(route);
  try {
    if (route === 'dashboard') Dashboard.render();
    if (route === 'library')   Library.render();
    if (route === 'editor')    Editor.render();
    if (route === 'log')       Log.render();
  } catch (err) {
    console.error('Feil ved navigering til', route, err);
    alert('Det oppstod en feil ved åpning av ' + route + '. Se Console (F12) for detaljer.\n\n' + (err?.message||err));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));

  // Logo → Dashboard (uten reload)
  const brand = document.getElementById('brandLink');
  if (brand) brand.addEventListener('click', (e)=>{ e.preventDefault(); navigate('dashboard'); });

  // Hamburger wiring
  const hBtn  = document.getElementById('hamburgerBtn');
  const hMenu = document.getElementById('hamburgerMenu');
  if (hBtn && hMenu) {
    hBtn.onclick = () => { hMenu.style.display = (hMenu.style.display === 'none' ? 'block' : 'none'); };
    hMenu.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', () => { hMenu.style.display='none'; navigate(el.dataset.route); }));
    document.addEventListener('click', (e) => { if (!hMenu.contains(e.target) && !hBtn.contains(e.target)) hMenu.style.display = 'none'; });
  }

  Dashboard.render();
});

window.AppState=AppState; window.Store=Store; window.Util=Util; window.navigate=navigate;
