
// modules/log.js

const Log = {
  render() {
    const stats = this._computeStats();

    // Statistikk (uten tittel)
    const statHtml =
      '<div class="card">' +
        '<div>Varighet siste 7 dager: <strong>'+Util.fmtMMSS(stats.sum7)+'</strong></div>' +
        '<div>Snitt per dag (7d): <strong>'+Util.fmtMMSS(Math.round(stats.avg7))+'</strong></div>' +
        '<div>Beste dag (PR): <strong>'+Util.fmtMMSS(stats.best.daySec)+'</strong> ('+stats.best.date+')</div>' +
        '<div>Streak (dager på rad): <strong>'+stats.streak+'</strong></div>' +
      '</div>';

    // Graf (uten tittel)
    const chartHtml =
      '<div class="card">' +
        '<canvas id="logChart" width="800" height="260" style="max-width:100%;"></canvas>' +
      '</div>';

    // Dagslogger med Import + Export-all på toppen
    const daysHtml = this._renderDays();

    render(statHtml + chartHtml + daysHtml);

    this._drawChart('logChart', stats.labels, stats.values, stats.yMax);

    // Wire topp-knapper
    const impBtn = document.getElementById('logImport');
    if (impBtn) impBtn.onclick = () => this._importCSVAll();
    const expAllBtn = document.getElementById('logExportAll');
    if (expAllBtn) expAllBtn.onclick = () => this._exportCSVAll();

    // Wire per-dag knapper (TCX og ev. CSV per dag)
    document.querySelectorAll('[data-export-tcx]').forEach(b=>b.onclick=()=>this.exportTCX(b.dataset.exportTcx));
    document.querySelectorAll('[data-del-session]').forEach(b=>b.onclick=()=>this._deleteSession(b.dataset.day, Number(b.dataset.idx)));
  },

  _renderDays(){
    const days = (AppState.logs||[]).slice().reverse();

    // Import + Export-all på topp
    let html =
      '<div class="card">' +
        '<div class="flex" style="align-items:center; justify-content:space-between;">' +
          '<div><strong>Dagslogger</strong></div>' +
          '<div class="flex" style="gap:8px;">' +
            '<input type="file" id="logcsv" accept=".csv" />' +
            '<button class="button" id="logImport">Importer logg (CSV)</button>' +
            '<button class="button secondary" id="logExportAll">Eksporter logg (CSV)</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    if (!days.length) {
      html += '<div class="card small">Ingen logg ennå.</div>';
      return html;
    }

    // Per dag: dato (venstre) + total tid (høyre, samme størrelse som dato)
    for (const d of days) {
      const totalForDay = (d.sessions||[]).reduce((a,b)=>a+(b.duration_sec||0),0);
      html +=
        '<div class="card">' +
          '<div class="flex" style="justify-content:space-between; align-items:center;">' +
            '<div><strong>'+d.date+'</strong></div>' +
            '<div><strong>'+Util.fmtMMSS(totalForDay)+'</strong></div>' +
          '</div>' +
          ((d.sessions||[]).map((s, idx) => {
            const t = new Date(s.start_time_local);
            const hh = String(t.getHours()).padStart(2,'0');
            const mm = String(t.getMinutes()).padStart(2,'0');
            return (
              '<div class="row" style="justify-content:space-between;">' +
                '<div class="small">'+hh+':'+mm+' — '+s.name+' • '+Util.fmtMMSS(s.duration_sec)+'</div>' +
                '<div class="actions">' +
                  '<button class="icon-btn trash" title="Slett økt" aria-label="Slett økt" data-del-session data-day="'+d.date+'" data-idx="'+idx+'">' +
                    '<svg class="icon"><use href="#ph-trash-fill"/></svg>' +
                  '</button>' +
                '</div>' +
              '</div>'
            );
          }).join('')) +
          '<div class="flex" style="gap:8px; margin-top:8px;">' +
            '<button class="button" data-export-tcx="'+d.date+'">Eksporter TCX</button>' +
          '</div>' +
        '</div>';
    }
    return html;
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

  // ===== Import/Export CSV (ALLE DAGER) =====

  _exportCSVAll(){
    const headers = ['date','start_time_local','name','duration_sec','workout_id','computed_hr_bpm'];
    const rows = [];
    (AppState.logs||[]).forEach(d=>{
      (d.sessions||[]).forEach(s=>{
        rows.push([ d.date, s.start_time_local, s.name, s.duration_sec, s.workout_id||'', s.computed_hr_bpm||'' ]);
      });
    });
    const csv = Util.toCSV(headers, rows, ';');
    Util.download('logg_alle.csv', csv, 'text/csv;charset=utf-8');
  },

  _importCSVAll(){
    const file = document.getElementById('logcsv').files[0];
    if (!file) return alert('Velg en logg-CSV først.');
    const r = new FileReader();
    r.onload = () => {
      const rows = Util.parseCSV(r.result, ';');
      // Bygg nøyaktig samme struktur (AppState.logs = [{ date, sessions: [...] }, ...], sortert stigende på dato)
      const byDate = new Map();
      rows.forEach(row => {
        const date = (row.date && row.date.length>=10) ? row.date.substring(0,10)
                    : (row.start_time_local ? String(row.start_time_local).substring(0,10) : null);
        if (!date) return;
        const sess = {
          workout_id: row.workout_id || '',
          name: row.name || 'Økt',
          start_time_local: row.start_time_local || (date+'T00:00:00.000Z'),
          duration_sec: Number(row.duration_sec || 0),
          computed_hr_bpm: Number(row.computed_hr_bpm || 90) || 90,
          events: []
        };
        if (!byDate.has(date)) byDate.set(date, { date, sessions: [] });
        byDate.get(date).sessions.push(sess);
      });
      // Sorter sessions per dag etter start_time, og dager etter dato (stigende)
      const list = Array.from(byDate.values()).sort((a,b)=>a.date.localeCompare(b.date));
      list.forEach(d => d.sessions.sort((a,b)=>new Date(a.start_time_local)-new Date(b.start_time_local)));
      AppState.logs = list;
      Store.save(Store.keys.logs, AppState.logs);
      alert('Logg importert.');
      Log.render();
    };
    r.readAsText(file);
  },

  _deleteSession(dateStr, idx){
    const day = (AppState.logs||[]).find(d=>d.date===dateStr);
    if (!day) return;
    if (idx<0 || idx>=day.sessions.length) return;
    if (!confirm('Slette denne økta fra loggen?')) return;
    day.sessions.splice(idx,1);
    Store.save(Store.keys.logs, AppState.logs);
    Log.render();
  },

  // ===== TCX-eksport: per dag, i ønsket schema =====
  exportTCX(dateStr){
    const day = (AppState.logs||[]).find(d=>d.date===dateStr); if (!day) return alert('Ingen data for valgt dag.');

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    let xml = xmlHeader +
`<TrainingCenterDatabase
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1"
  xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
  xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2"
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns4="http://www.garmin.com/xmlschemas/ProfileExtension/v1">
  <Activities>`;

    const all = (day.sessions||[]).slice().sort((a,b)=>new Date(a.start_time_local)-new Date(b.start_time_local));
    const startIso = (all[0]?.start_time_local) || (new Date(day.date+'T00:00:00Z')).toISOString();
    const totalDur = (day.sessions||[]).reduce((a,b)=>a+(b.duration_sec||0),0);

    const avgHr = Math.round(((day.sessions||[]).reduce((a,b)=>a+(b.computed_hr_bpm||90),0) / ((day.sessions||[]).length||1)) || 90);
    const maxHr = Math.max(...(day.sessions||[]).map(s=>s.computed_hr_bpm||90), avgHr+15);

    xml += `
    <Activity Sport="Other">
      <Id>${startIso}</Id>
      <Lap StartTime="${startIso}">
        <TotalTimeSeconds>${totalDur.toFixed(3)}</TotalTimeSeconds>
        <DistanceMeters>0.0</DistanceMeters>
        <Calories>${Math.max(1, Math.round(totalDur/60*6))}</Calories>
        <AverageHeartRateBpm>
          <Value>${avgHr}</Value>
        </AverageHeartRateBpm>
        <MaximumHeartRateBpm>
          <Value>${maxHr}</Value>
        </MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
`;

    let curTs = new Date(startIso).getTime();
    for (const s of (day.sessions||[])) {
      const hr = s.computed_hr_bpm || 90;
      for (let t=0; t<s.duration_sec; t++){
        const tpIso = new Date(curTs).toISOString();
        xml +=
`          <Trackpoint>
            <Time>${tpIso}</Time>
            <DistanceMeters>0.0</DistanceMeters>
            <HeartRateBpm>
              <Value>${hr}</Value>
            </HeartRateBpm>
            <Extensions>
              <ns3:TPX/>
            </Extensions>
          </Trackpoint>
`;
        curTs += 1000;
      }
    }

    xml +=
`        </Track>
        <Extensions>
          <ns3:LX/>
        </Extensions>
      </Lap>
      <Creator xsi:type="Device_t">
        <Name>Styrketreningsapp</Name>
        <UnitId>3477229470</UnitId>
        <ProductID>4376</ProductID>
        <Version>
          <VersionMajor>23</VersionMajor>
          <VersionMinor>48</VersionMinor>
          <BuildMajor>0</BuildMajor>
          <BuildMinor>0</BuildMinor>
        </Version>
      </Creator>
    </Activity>
  </Activities>
  <Author xsi:type="Application_t">
    <Name>Connect Api</Name>
    <Build>
      <Version>
        <VersionMajor>25</VersionMajor>
        <VersionMinor>24</VersionMinor>
        <BuildMajor>0</BuildMajor>
        <BuildMinor>0</BuildMinor>
      </Version>
    </Build>
    <LangID>en</LangID>
    <PartNumber>006-D2449-00</PartNumber>
  </Author>
</TrainingCenterDatabase>`;

    const yymmdd = this._fmtYYMMDD(day.date);
    Util.download(`${yymmdd}_logg.tcx`, xml, 'application/xml');
  },

  _fmtYYMMDD(dateStr){ // "YYYY-MM-DD" -> "YYMMDD"
    const y = dateStr.substring(2,4);
    const m = dateStr.substring(5,7);
    const d = dateStr.substring(8,10);
    return `${y}${m}${d}`;
  }
};

window.Log = Log;
