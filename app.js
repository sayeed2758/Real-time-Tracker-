(() => {
  const KEY = 'screen_life_v3';
  const QUOTES = [
    ['Protect your attention today, and you protect your future.','— Daily reminder'],
    ['Your attention is a limited resource. Spend it on what matters.','— Focus note'],
    ['A smaller screen habit can create a much bigger life.','— Daily reminder'],
    ['The time you reclaim today becomes freedom tomorrow.','— Life note'],
    ['Use your phone as a tool, not as a place to live.','— Daily reminder'],
    ['One less hour online can become one more hour fully alive.','— Focus note'],
    ['Your day is made of minutes. Protect the ones that matter.','— Daily reminder'],
    ['Look at your screen time without guilt. Then choose your next hour.','— Mindful reminder'],
    ['Small changes repeated daily create surprisingly big results.','— Daily reminder'],
    ['Be intentional with your time. Your future self will notice.','— Life note'],
    ['You do not need a perfect day. You need a deliberate next hour.','— Focus note'],
    ['Less scrolling. More living. The choice can start with one hour.','— Daily reminder']
  ];
  const ACH = [
    ['🌱','First Step','Track your first day','first'],['🔥','3-Day Focus','Stay under goal for 3 days','streak3'],['💎','7-Day Focus','Stay under goal for 7 days','streak7'],['⏱️','10 Hours','Reclaim 10 hours','reclaim10'],['🚀','30 Hours','Reclaim 30 hours','reclaim30'],['🏆','30-Day Consistency','Track 30 days','days30']
  ];
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2,'0');
  const fmt = mins => { mins = Math.max(0, Math.round(mins)); return `${Math.floor(mins/60)}h ${pad(mins%60)}m`; };
  const dateKey = d => { const x=new Date(d); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`; };
  const fromKey = k => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); };
  const todayKey = () => dateKey(new Date());
  const dayName = d => new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(d);
  const longDate = d => new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(d);
  const monthLabel = d => new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(d);
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

  let state = load();
  let timerId = null, sessionStartAt = null, deferredPrompt = null;

  function defaults(){ return {history:{}, profile:{age:'',sleep:'',work:'',goal:3.5}, theme:'light', sessionAdded:0}; }
  function load(){ try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)||'{}')); } catch { return defaults(); } }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function ensureToday(){ const k=todayKey(); if(state.history[k] == null) state.history[k] = {minutes:0, age:state.profile.age||'', sleep:state.profile.sleep||'', work:state.profile.work||'', savedAt:Date.now()}; }
  function today(){ ensureToday(); return state.history[todayKey()]; }
  function setInputValues(){ const t=today(); $('hoursInput').value=Math.floor(t.minutes/60)||''; $('minutesInput').value=(t.minutes%60)||''; $('ageInput').value=t.age||state.profile.age||''; $('sleepInput').value=t.sleep??state.profile.sleep??''; $('workInput').value=t.work??state.profile.work??''; $('goalInput').value=state.profile.goal; $('defaultSleep').value=state.profile.sleep||''; $('defaultWork').value=state.profile.work||''; updatePreview(); }
  function updatePreview(){ const h=+($('hoursInput').value||0), m=+($('minutesInput').value||0); $('inputPreview').textContent=fmt(h*60+m); }
  function saveToday(){
    const h=clamp(Number($('hoursInput').value||0),0,24); const m=clamp(Number($('minutesInput').value||0),0,59); const mins=Math.min(1440,h*60+m);
    const t=today(); t.minutes=mins; t.age=$('ageInput').value||''; t.sleep=Number($('sleepInput').value||state.profile.sleep||0); t.work=Number($('workInput').value||state.profile.work||0); t.savedAt=Date.now();
    state.profile.age=t.age; state.profile.sleep=t.sleep||''; state.profile.work=t.work||''; save(); render(); toast('Today updated');
  }
  function render(){
    ensureToday(); save();
    const now=new Date(), t=today(), mins=t.minutes;
    $('dateLabel').textContent=longDate(now); $('todayStat').textContent=fmt(mins); $('inputPreview').textContent=fmt(mins); $('sessionAdded').textContent=`Added ${fmt(state.sessionAdded||0)}`;
    const week=periodMinutes(7), month=periodMinutes(new Date().getDate()), avg=week.total/(Math.max(1,week.days||1));
    $('weekStat').textContent=fmt(week.total); $('weekSub').textContent=`Average ${formatHours(avg)} / day`; $('monthStat').textContent=fmt(month.total); $('monthSub').textContent=`${month.days} tracked day${month.days===1?'':'s'}`;
    const yearHours=mins*365/60; $('yearStat').textContent=`${(mins*365/1440).toFixed(1)} days`; $('perWeekHours').textContent=`${(mins*7/60).toFixed(1)}h`; $('perYearHours').textContent=`${yearHours.toFixed(1)}h`; $('per10YearHours').textContent=`${(yearHours*10).toFixed(0)}h`;
    const age=Number(t.age||state.profile.age); if(age){ const remaining=Math.max(0,80-age); const lifeYears=yearHours/8760*remaining; $('lifeProjection').textContent=`${lifeYears.toFixed(1)}y`; $('bigNote').textContent=`At this pace, you spend about ${(mins*365/1440).toFixed(1)} days each year on screens. Over ${remaining} estimated years, that is about ${lifeYears.toFixed(1)} years of life time.`; } else { $('lifeProjection').textContent='Add age'; $('bigNote').textContent=`At this pace, you spend about ${(mins*365/1440).toFixed(1)} days each year on screens. Add your age for a longer-term projection.`; }
    renderChart(); renderWhatIf(); renderDay(); renderGoal(); renderAchievements(); renderHistory();
  }
  function periodMinutes(days){ const end=fromKey(todayKey()), start=new Date(end); start.setDate(start.getDate()-days+1); let total=0,count=0; for(let i=0;i<days;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const k=dateKey(d); if(state.history[k]&&state.history[k].minutes>0){total+=state.history[k].minutes;count++;} } return {total,days:count}; }
  function formatHours(mins){ return `${(mins/60).toFixed(1)}h`; }
  function renderChart(){ const wrap=$('chartBars'); wrap.innerHTML=''; const vals=[]; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const k=dateKey(d); vals.push({d,k,m:state.history[k]?.minutes||0}); } const max=Math.max(60,...vals.map(x=>x.m)); vals.forEach(v=>{ const col=document.createElement('div'); col.className='bar-col'; const value=document.createElement('div'); value.className='bar-value'; value.textContent=v.m?formatHours(v.m):'0'; const bar=document.createElement('div'); bar.className='bar'+(v.k===todayKey()?' today':''); bar.style.height=`${Math.max(4,(v.m/max)*78)}%`; const lbl=document.createElement('div'); lbl.className='bar-day'; lbl.textContent=dayName(v.d); col.append(value,bar,lbl); wrap.appendChild(col); }); const tracked=vals.filter(v=>v.m>0).length; $('trackedDays').textContent=`${tracked} tracked`; const prior=vals.slice(0,6).reduce((a,b)=>a+b.m,0)/6; const cur=vals[6].m; $('weekChange').textContent=prior?`${cur<prior?'↓':'↑'} ${Math.abs((cur-prior)/prior*100).toFixed(0)}% today vs prior avg`:'—'; }
  function renderWhatIf(){ const m=today().minutes, reduce=Number($('reduceRange').value||60), actualReduce=Math.min(reduce,m); $('whatIfValue').textContent=actualReduce>=60?`${actualReduce/60}h`:`${actualReduce}m`; const hours=actualReduce*365/60; $('reclaimDays').textContent=(hours/24).toFixed(1); $('reclaimHours').textContent=`${Math.round(hours)}h`; }
  function renderDay(){ const t=today(), screen=t.minutes/60, sleep=clamp(Number(t.sleep||state.profile.sleep||0),0,24), work=clamp(Number(t.work||state.profile.work||0),0,24); const scale=24, other=Math.max(0,scale-screen-sleep-work); const vals=[screen,sleep,work,other].map(v=>Math.max(0,v)); const total=vals.reduce((a,b)=>a+b,0)||24; [$('screenSegment'),$('sleepSegment'),$('workSegment'),$('otherSegment')].forEach((el,i)=>el.style.width=`${vals[i]/total*100}%`); $('screenDay').textContent=formatHours(screen*60); $('sleepDay').textContent=formatHours(sleep*60); $('workDay').textContent=formatHours(work*60); $('otherDay').textContent=formatHours(other*60); }
  function renderGoal(){ const t=today(), goal=Number(state.profile.goal||3.5), current=t.minutes/60; $('goalCurrent').textContent=fmt(t.minutes); $('goalValue').textContent=fmt(goal*60); const p=goal>0?clamp(current/goal*100,0,100):0; $('goalProgress').style.width=`${p}%`; const diff=current-goal; $('goalText').textContent=diff>0?`${fmt(diff*60)} over your target today.`:`Great — you are ${fmt(Math.abs(diff*60))} under your target today.`; const streak=calcStreak(goal); $('streakCount').textContent=`${streak} day${streak===1?'':'s'}`; const best=Object.values(state.history).reduce((a,b)=>a===null||a===undefined||b.minutes<a?b.minutes:a,null); $('recordSummary').textContent=best!=null?`Best day ${fmt(best)}`:'Best day —'; }
  function calcStreak(goal){ let s=0; for(let i=0;i<365;i++){ const d=new Date(); d.setDate(d.getDate()-i); const rec=state.history[dateKey(d)]; if(rec&&rec.minutes>0&&rec.minutes<=goal*60)s++; else if(i===0) continue; else break; } return s; }
  function renderAchievements(){ const streak=calcStreak(Number(state.profile.goal||3.5)); const totalHistory=Object.values(state.history).reduce((a,b)=>a+b.minutes,0); const tracked=Object.values(state.history).filter(x=>x.minutes>0).length; const reclaimed=Math.max(0, Number(state.sessionAdded||0)); const unlocked={first:tracked>=1,streak3:streak>=3,streak7:streak>=7,reclaim10:reclaimed>=600,reclaim30:reclaimed>=1800,days30:tracked>=30}; const grid=$('achievementGrid'); grid.innerHTML=''; let n=0; ACH.forEach(([icon,title,desc,key])=>{ const el=document.createElement('div'); el.className='achievement'+(unlocked[key]?'':' locked'); if(unlocked[key]) n++; el.innerHTML=`<div class="achievement-icon">${icon}</div><strong>${title}</strong><small>${desc}</small>`; grid.appendChild(el); }); $('achievementCount').textContent=`${n} / ${ACH.length}`; }
  function renderHistory(){ const list=$('historyList'); list.innerHTML=''; const keys=Object.keys(state.history).filter(k=>state.history[k].minutes>0).sort().reverse().slice(0,10); if(!keys.length){ list.innerHTML='<div class="tip">No tracked days yet. Save today’s total to build your history.</div>'; return; } keys.forEach(k=>{ const row=document.createElement('div'); row.className='history-row'; const d=fromKey(k); row.innerHTML=`<div class="history-day">${monthLabel(d)}<small>${k===todayKey()?'Today':dayName(d)}</small></div><div class="history-time">${fmt(state.history[k].minutes)}</div>`; list.appendChild(row); }); }
  function setQuote(){ const base=new Date(new Date().getFullYear(),0,1); const days=Math.floor((Date.now()-base)/86400000); const q=QUOTES[days%QUOTES.length]; $('quoteText').textContent=q[0]; $('quoteSource').textContent=q[1]; }
  function startSession(){ if(sessionStartAt) return; sessionStartAt=Date.now(); $('sessionStart').disabled=true; $('sessionStop').disabled=false; $('sessionStop').classList.remove('disabled'); timerId=setInterval(updateTimer,1000); updateTimer(); }
  function updateTimer(){ if(!sessionStartAt)return; const s=Math.floor((Date.now()-sessionStartAt)/1000); $('timer').textContent=`${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`; }
  function stopSession(){ if(!sessionStartAt)return; const mins=Math.round((Date.now()-sessionStartAt)/60000); today().minutes=Math.min(1440,today().minutes+mins); state.sessionAdded=(state.sessionAdded||0)+mins; save(); clearInterval(timerId); sessionStartAt=null; $('timer').textContent='00:00:00'; $('sessionStart').disabled=false; $('sessionStop').disabled=true; $('sessionStop').classList.add('disabled'); render(); toast(mins?`Added ${fmt(mins)} to today`:'Session too short to add'); }
  function toast(msg){ let t=document.querySelector('.toast'); if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)} t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1800); }
  async function share(text){ try{ if(navigator.share){ await navigator.share({title:'Screen Time',text}); } else { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } }catch{} }
  function shareQuote(){ share(`${$('quoteText').textContent}\n\nScreen Time — Life Time\nMade With ❤️ By Shahid Sir`); }
  function openModal(el){ el.classList.remove('hidden'); } function closeModal(el){ el.classList.add('hidden'); }

  ['hoursInput','minutesInput'].forEach(id=>$(id).addEventListener('input',updatePreview));
  $('saveBtn').addEventListener('click',saveToday); $('updateBtn').addEventListener('click',()=>openModal($('updateModal'))); $('closeUpdate').addEventListener('click',()=>closeModal($('updateModal'))); $('updateSave').addEventListener('click',()=>{ $('hoursInput').value=$('updateHours').value; $('minutesInput').value=$('updateMinutes').value; closeModal($('updateModal')); saveToday(); });
  $('sessionStart').addEventListener('click',startSession); $('sessionStop').addEventListener('click',stopSession); $('reduceRange').addEventListener('input',renderWhatIf); $('editGoalBtn').addEventListener('click',()=>{ $('goalInput').value=state.profile.goal; openModal($('modalBackdrop')); });
  $('settingsBtn').addEventListener('click',()=>openModal($('modalBackdrop'))); $('closeSettings').addEventListener('click',()=>closeModal($('modalBackdrop'))); $('saveSettings').addEventListener('click',()=>{state.profile.goal=clamp(Number($('goalInput').value||3.5),0,24);state.profile.sleep=Number($('defaultSleep').value||0);state.profile.work=Number($('defaultWork').value||0);save();setInputValues();render();closeModal($('modalBackdrop'));toast('Settings saved')});
  $('clearBtn').addEventListener('click',()=>{ if(confirm('Clear all saved screen-time history?')){state.history={};save();setInputValues();render();toast('History cleared')} });
  $('resetBtn').addEventListener('click',()=>{ if(confirm('Reset all local data and settings?')){state=defaults();save();setInputValues();render();closeModal($('modalBackdrop'));toast('Reset complete')} });
  $('themeBtn').addEventListener('click',()=>{state.theme=document.body.classList.toggle('dark')?'dark':'light';save()}); $('shareQuoteBtn').addEventListener('click',shareQuote); $('installBtn').addEventListener('click',async()=>{ if(deferredPrompt){deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;} else toast('Use your browser menu → Add to Home screen'); });
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').style.display='block'}); window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast('App installed')});
  setQuote(); if(state.theme==='dark')document.body.classList.add('dark'); setInputValues(); render(); $('installBtn').style.display='block';
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
