
// modules/log.js

const Log = {
  render() {
    const stats = this._computeStats();
    render(
      '<div class="card">' +
        '<h2>Statistikk</h2>' +
        '<div>Varighet siste 7 dager: <strong>'+Util.fmtMMSS(stats.sum7)+'</strong></div>' +
        '<div>Snitt per dag (7d): <strong>'+Util.fmtMMSS(Math.round(stats.avg7))+'</strong></div>' +  // mm:ss uten desimaler
        '<div>Beste dag (PR): <strong>'+Util.fmtMMSS(stats.best.daySec)+'</strong> ('+stats.best.date+')</div>' +
        '<div>Streak (dager på rad): <strong>'+stats.streak+'</strong></div>' +
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

    this._drawChart('logChart', stats.labels, stats.values, stats.yMax);
    document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>this.exportTCX(b.dataset.export));
  },

  _computeStats(){
    const map=new Map();
    (AppState.logs||[]).forEach(d => {
      const sum=(d.sessions||[]).reduce((a,b)=>a+(b.duration_sec||0),0);
      map.set(d.date, sum);
    });

    const labels=[], values=[];
    const today=new Date();
    const weekday=['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'];
    let best={date:'—',daySec:0};
    for(let i=6;i>=0;i--){
      const dt=new Date(today); dt.setDate(today.getDate()-i);
      const key=dt.toISOString().substring(0,10);
      const lab=weekday[dt.getDay()]+' '+dt.getDate();
      labels.push(lab);
      const v=map.get(key)||0;
      values.push(v);
      if (v>best.daySec) best={date:key, daySec:v};
    }
    const sum7=values.reduce((a,b)=>a+b,0), avg7=sum7/7, yMax=Math.max(60, ...values);

    // Streak
    let streak=0; for(let i=0;;i++){ const dt=new Date(today); dt.setDate(today.getDate()-i); const key=dt.toISOString().substring(0,10); const v=map.get(key)||0; if(v>0) streak++; else break; if(i>365) break; }

    return { labels, values, sum7, avg7, yMax, best, streak };
  },

  _drawChart(id, labels, values, yMax){
    const c=document.getElementById(id); if(!c) return; const ctx=c.getContext('2d');
    const W=c.width, H=c.height; ctx.clearRect(0,0,W,H);
    const left=54, right=10, top=16, bottom=40, chartW=W-left-right, chartH=H-top-bottom;

    // Akser
    ctx.strokeStyle='#ddd'; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, H-bottom); ctx.lineTo(W-right, H-bottom); ctx.stroke();

    // Y-akse tall (uten "Minutter")
    const steps=4; ctx.fillStyle='#666'; ctx.font='12px sans-serif';
    for(let i=0;i<=steps;i++){
      const val=Math.round((yMax*i)/steps);
      const y=(H-bottom)-(chartH*i/steps);
      ctx.fillText(String(Math.round(val/60)), left-30, y+4);
      ctx.strokeStyle='#eee'; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(W-right,y); ctx.stroke();
    }

    // Stolper
    const bw=Math.floor(chartW/labels.length)-10;
    labels.forEach((lab,i)=>{ const x=left+i*(chartW/labels.length)+5; const h=Math.max(2, chartH*(values[i]/yMax)); const y=(H-bottom)-h;
      ctx.fillStyle='#4c7a9f'; ctx.fillRect(x,y,bw,h);
      ctx.fillStyle='#444'; ctx.font='12px sans-serif'; ctx.fillText(lab, x, H-bottom+16);
    });
  },

  exportTCX(dateStr){
    const day=AppState.logs.find(d=>d.date===dateStr); if(!day) return alert('Ingen data for valgt dag.');
    const isoDate=new Date(dateStr).toISOString().substring(0,10);
    let xml='<?xml version="1.0" encoding="UTF-8"?>\n';
    xml+='<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">';
    xml+='<Activities><Activity Sport="Other"><Id>'+isoDate+'T00:00:00Z</Id>';
    day.sessions.forEach(s=>{
      xml+='<Lap StartTime="'+new Date(s.start_time_local).toISOString()+'">';
      xml+='<TotalTimeSeconds>'+s.duration_sec+'</TotalTimeSeconds>';
      xml+='<Intensity>Active</Intensity><Track>';
      for(let t=0;t<s.duration_sec;t++){ const tp=new Date(new Date(s.start_time_local).getTime()+t*1000).toISOString();
        xml+='<Trackpoint><Time>'+tp+'</Time><HeartRateBpm><Value>'+(s.computed_hr_bpm||90)+'</Value></HeartRateBpm></Trackpoint>'; }
      xml+='</Track></Lap>';
    });
    xml+='</Activity></Activities></TrainingCenterDatabase>';
    Util.download('log_'+dateStr+'.tcx', xml, 'application/xml');
  }
};
window.Log = Log;
