
// modules/log.js
//
// Beholder baseline med overskrifter og enkel graf. (Ingen ikonendringer nødvendig her.)

const Log = {
  render() {
    const stats = this._computeStats();
    render(
      '<div class="card">' +
        '<h2>Statistikk</h2>' +
        '<div>Varighet siste 7 dager: <strong>'+Util.fmtMMSS(stats.sum7)+'</strong></div>' +
        '<div>Snitt per dag (7d): <strong>'+Util.fmtMMSS(stats.avg7)+'</strong></div>' +
      '</div>' +

      '<div class="card">' +
        '<h2>Progresjon (7 dager)</h2>' +
        '<canvas id="logChart" width="800" height="260" style="max-width:100%;"></canvas>' +
      '</div>' +

      '<div class="card">' +
        '<h2>Logg (per dag)</h2>' +
        (
          (AppState.logs||[]).slice().reverse().map(d =>
            '<div class="card">' +
              '<div><strong>'+d.date+'</strong></div>' +
              ((d.sessions||[]).map(s => {
                 const t = new Date(s.start_time_local);
                 const hh = String(t.getHours()).padStart(2,'0');
                 const mm = String(t.getMinutes()).padStart(2,'0');
                 return '<div class="small">'+hh+':'+mm+' — '+s.name+' • '+Util.fmtMMSS(s.duration_sec)+'</div>';
               }).join('')) +
              '<button class="button" data-export="'+d.date+'">Eksporter TCX</button>' +
            '</div>'
          ).join('') || '<div class="small">Ingen logg ennå.</div>'
        ) +
      '</div>'
    );

    this._drawChart('logChart', stats.labels, stats.values);
    document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>this.exportTCX(b.dataset.export));
  },

  _computeStats(){
    const map = new Map();
    (AppState.logs || []).forEach(d => {
      const sum = (d.sessions||[]).reduce((a,b)=>a+(b.duration_sec||0),0);
      map.set(d.date, sum);
    });

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
    return { labels, values, sum7, avg7 };
  },

  _drawChart(canvasId, labels, values){
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    const left = 50, right = 10, top = 10, bottom = 40;
    const chartW = W - left - right;
    const chartH = H - top - bottom;

    // akser
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, H-30);
    ctx.lineTo(W-10, H-30);
    ctx.stroke();

    const max = Math.max(60, ...values);
    const barW = Math.floor(chartW/labels.length) - 8;

    // y-akse “Minutter”
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText('Minutter', left - 40, top + 10);

    for (let i=0;i<=4;i++){
      const y = (H-30) - (chartH * i / 4);
      const val = Math.round((max*i/4)/60);
      ctx.fillText(String(val), left - 30, y);
      ctx.strokeStyle = '#eee';
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(W-10, y); ctx.stroke();
    }

    // stolper + etiketter
    labels.forEach((lab, i) => {
      const x = left + i * (chartW/labels.length) + 4;
      const h = Math.max(2, chartH * (values[i]/max));
      const y = (H-30) - h;
      ctx.fillStyle = '#4c7a9f';
      ctx.fillRect(x, y, barW, h);

      ctx.fillStyle = '#444';
      ctx.fillText(lab, x, H-12);
    });
  },

  exportTCX(dateStr) {
    const day = AppState.logs.find(d=>d.date===dateStr); if (!day) return alert('Ingen data for valgt dag.');
    const isoDate = new Date(dateStr).toISOString().substring(0,10);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">';
    xml += '<Activities><Activity Sport="Other"><Id>'+isoDate+'T00:00:00Z</Id>';
    day.sessions.forEach((s) => {
      xml += '<Lap StartTime="'+new Date(s.start_time_local).toISOString()+'">';
      xml += '<TotalTimeSeconds>'+s.duration_sec+'</TotalTimeSeconds>';
      xml += '<Intensity>Active</Intensity>';
      xml += '<Track>';
      for (let t=0; t<s.duration_sec; t++) {
        const tp = new Date(new Date(s.start_time_local).getTime() + t*1000).toISOString();
        xml += '<Trackpoint><Time>'+tp+'</Time><HeartRateBpm><Value>'+(s.computed_hr_bpm||90)+'</Value></HeartRateBpm></Trackpoint>';
      }
      xml += '</Track></Lap>';
    });
    xml += '</Activity></Activities></TrainingCenterDatabase>';
    Util.download('log_'+dateStr+'.tcx', xml, 'application/xml');
  }
};
window.Log = Log;
