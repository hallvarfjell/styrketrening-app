
const Log = {
  render(){
    function stats(){ const today=new Date().toISOString().substring(0,10); let daySec=0, weekSec=0, totalSec=0; const sevenDaysAgo=new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7); AppState.logs.forEach(d=>{ const dDate=new Date(d.date); const sum=d.sessions.reduce((a,b)=>a+(b.duration_sec||0),0); totalSec+=sum; if(d.date===today) daySec+=sum; if(dDate>=sevenDaysAgo) weekSec+=sum; }); return {daySec,weekSec,totalSec}; }
    const s=stats();
    render(`
      <div class=card>
        <h2>Statistikk</h2>
        <div>Varighet i dag: <strong>${Util.fmtMMSS(s.daySec)}</strong></div>
        <div>Siste 7 dager: <strong>${Util.fmtMMSS(s.weekSec)}</strong></div>
        <div>Totalt: <strong>${Util.fmtMMSS(s.totalSec)}</strong></div>
      </div>
      <div class=card>
        <h2>Logg (per dag)</h2>
        ${ AppState.logs.slice().reverse().map(d=>`<div class=card><div><strong>${d.date}</strong></div>${(d.sessions||[]).map(s=>`<div class=small>${s.name} • ${Util.fmtMMSS(s.duration_sec)}</div>`).join('')}<button class=button data-export=${d.date}>Eksporter TCX</button></div>`).join('') || '<div class=small>Ingen logg ennå.</div>' }
      </div>
    `);
    document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>this.exportTCX(b.dataset.export));
  },
  exportTCX(dateStr){ const day=AppState.logs.find(d=>d.date===dateStr); if(!day) return alert('Ingen data for valgt dag.'); const isoDate=new Date(dateStr).toISOString().substring(0,10); let xml=`<?xml version="1.0" encoding="UTF-8"?>\n`; xml+=`<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">`; xml+=`<Activities><Activity Sport="Other"><Id>${isoDate}T00:00:00Z</Id>`; day.sessions.forEach(s=>{ xml+=`<Lap StartTime="${new Date(s.start_time_local).toISOString()}">`; xml+=`<TotalTimeSeconds>${s.duration_sec}</TotalTimeSeconds>`; xml+=`<Intensity>Active</Intensity>`; xml+=`<Track>`; for(let t=0;t<s.duration_sec;t++){ const tp=new Date(new Date(s.start_time_local).getTime()+t*1000).toISOString(); xml+=`<Trackpoint><Time>${tp}</Time><HeartRateBpm><Value>${s.computed_hr_bpm||90}</Value></HeartRateBpm></Trackpoint>`; } xml+=`</Track></Lap>`; }); xml+=`</Activity></Activities></TrainingCenterDatabase>`; Util.download(`log_${dateStr}.tcx`, xml); }
};
window.Log=Log;
