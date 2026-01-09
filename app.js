
const Store = {
  keys: { exercises:'stx_exercises', workouts:'stx_workouts', logs:'stx_logs' },
  load(k){ try{ return JSON.parse(localStorage.getItem(k))||[] }catch{ return [] } },
  save(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
};
const AppState = {
  exercises: Store.load(Store.keys.exercises),
  workouts: Store.load(Store.keys.workouts),
  logs: Store.load(Store.keys.logs),
  currentRoute:'dashboard', currentWorkout:null
};
const Util = {
  fmtMMSS(sec){ const m=String(Math.floor(sec/60)).padStart(2,'0'); const s=String(Math.floor(sec%60)).padStart(2,'0'); return `${m}:${s}`; },
  parseMMSS(str){ const [m,s]=str.split(':').map(Number); return m*60+s; },
  parseCSV(text){ const lines=text.trim().split(/\r?\n/); const headers=lines.shift().split(',').map(h=>h.trim()); return lines.map(line=>{ const cols=line.split(',').map(c=>c.trim()); const o={}; headers.forEach((h,i)=>o[h]=cols[i]??''); return o; }); },
  download(filename, content){ const blob=new Blob([content],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); }
};
function render(html){ document.getElementById('app').innerHTML=html; }
function setActive(route){ document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.route===route)); }
function navigate(route){ AppState.currentRoute=route; setActive(route); if(route==='dashboard') Dashboard.render(); if(route==='library') Library.render(); if(route==='editor') Editor.render(); if(route==='log') Log.render(); }
window.addEventListener('DOMContentLoaded',()=>{ document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.route))); Dashboard.render(); });
window.AppState=AppState; window.Store=Store; window.Util=Util; window.navigate=navigate;
