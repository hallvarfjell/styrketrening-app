
// modules/log.js
//
// Endringer:
// - Mer statistikk og graf: stolpediagram per dag siste 7 dager (motiverende).
// - Viser total varighet siste 7 dager, snitt per dag, beste dag (PR), og streak (antall dager på rad > 0).
// - Grafen rendres i <canvas> som enkel bar-chart med etiketter.

const Log = {
  render() {
    const stats = this._computeStats();
    render(`
      <div class="card">
        <h2>Statistikk</h2>
        <div>Varighet siste 7 dager: <strong>${Util.fmtMMSS(stats.sum7)}</strong></div>
        <div>Snitt per dag (7d): <strong>${Util.fmtMMSS(stats.avg7)}</strong></div>
        <div>Beste dag (PR): <strong>${Util.fmtMMSS(stats.best.daySec)}</strong> (${stats.best.date})</div>
        <div>Streak (antall dager på rad): <strong>${stats.streak}</strong></div>
      </div>

      <div class="card">
        <h2>Progresjon (7 dager)</h2>
        <canvas id="logChart" width="800" height="220" style="max-width:100%;"></canvas>
      </div>

      <div class="card">
        <h2>Logg (per dag)</h2>
        ${
          (AppState.logs||[]).slice().reverse().map(d=>`
            <div class="card">
              <div><strong>${d.date}</strong></div>
              ${(d.sessions||[]).map(s=>`<div class="small">${s.name} • ${Util.fmtMMSS(s.duration_sec)}</div>`).join('')}
              <button class="button" data-export="${d.date}">Eksporter TCX</button>
            </div>
          `).join('') || '<div class="small">Ingen logg ennå.</div>'
        }
      </div>
    `);

    // Chart
    this._drawChart('logChart', stats.labels, stats.values);

    // TCX-eksport
    document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>this.exportTCX(b.dataset.export));
  },

  _computeStats(){
    // Bygg map date -> seconds
    const map = new Map();
    (AppState.logs || []).forEach(d => {
      const sum = (d.sessions||[]).reduce((a,b)=>a+(b.duration_sec||0),0);
      map.set(d.date, sum);
    });

    // Siste 7 dager
    const labels = [];
    const values = [];
    const today = new Date();
    for (let i=6; i>=0; i--){
      const dt = new Date(today); dt.setDate(today.getDate() - i);
      const key = dt.toISOString().substring(0,10);
      labels.push(key.substring(5)); // MM-DD
      values.push(map.get(key) || 0);
    }
    const sum7 = values.reduce((a,b)=>a+b,0);
    const avg7 = sum7 / 7;

    // Best day (historisk)
    let best = { date:'—', daySec:0 };
    map.forEach((sec, date) => { if (sec > best.daySec) best = { date, daySec: sec }; });

    // Streak: hvor mange dager på rad (inkl. i dag) med aktivitet
    let streak = 0;
    for (let i=0; ; i++){
      const dt = new Date(today); dt.setDate(today.getDate() - i);
      const key = dt.toISOString().substring(0,10);
      const v = map.get(key) || 0;
      if (v>0) streak++; else break;
      if (i>365) break;
    }

    return { labels, values, sum7, avg7, best, streak };
  },

  _drawChart(canvasId, labels, values){
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // akser
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, H-30);
    ctx.lineTo(W-10, H-30);
    ctx.stroke();

    const max = Math.max(60, ...values); // minst 1 min referanse
    const barW = Math.floor((W-60)/labels.length) - 8;

    // stolper
    labels.forEach((lab, i) => {
      const x = 40 + i * ((W-60)/labels.length) + 4;
      const h = Math.max(2, (H-50) * (values[i]/max));
      const y = (H-30) - h;
      ctx.fillStyle = '#4c7a9f';
      ctx.fillRect(x, y, barW, h);

      // label
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.fillText(lab, x, H-12);
    });

    // målestreker / motivasjon
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText('Minutter', 5, 10);
    // små tall (minutter) over hver stolpe
    labels.forEach((lab, i) => {
      const x = 40 + i * ((W-60)/labels.length) + 4;
      const minutes = Math.round(values[i]/60);
      ctx.fillStyle = '#444';
      ctx.fillText(`${minutes}`, x, H-40);
    });
  },

  exportTCX(dateStr) {
    const day = AppState.logs.find(d=>d.date===dateStr); if (!day) return alert('Ingen data for valgt dag.');
    const isoDate = new Date(dateStr).toISOString().substring(0,10);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">`;
    xml += `<Activities><Activity Sport="Other"><Id>${isoDate}T00:00:00Z</Id>`;
    day.sessions.forEach((s) => {
      xml += `<Lap StartTime="${new Date(s.start_time_local).toISOString()}">`;
      xml += `<TotalTimeSeconds>${s.duration_sec}</TotalTimeSeconds>`;
      xml += `<Intensity>Active</Intensity>`;
      xml += `<Track>`;
      for (let t=0; t<s.duration_sec; t++) {
        const tp = new Date(new Date(s.start_time_local).getTime() + t*1000).toISOString();
        xml += `<Trackpoint><Time>${tp}</Time><HeartRateBpm><Value>${s.computed_hr_bpm||90}</Value></HeartRateBpm></Trackpoint>`;
      }
      xml += `</Track></Lap>`;
    });
    xml += `</Activity></Activities></TrainingCenterDatabase>`;
    Util.download(`log_${dateStr}.tcx`, xml);
  }
};

window.Log = Log;
