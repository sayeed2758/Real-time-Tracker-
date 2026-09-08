(() => {
  const KEY = 'screen_life_v4';
  const QUOTES = [
    ['You do not need a perfect day. You need a deliberate next hour.','— Focus Note'],
    ['Protect your attention today, and you protect your future.','— Daily Reminder'],
    ['Your attention is limited. Spend it on what matters.','— Focus Note'],
    ['Less scrolling. More living. The choice can start with one hour.','— Daily Reminder'],
    ['The time you reclaim today becomes freedom tomorrow.','— Life Note'],
    ['One less hour online can become one more hour fully alive.','— Focus Note'],
    ['Your day is made of minutes. Protect the ones that matter.','— Daily Reminder'],
    ['Look at your screen time without guilt. Then choose your next hour.','— Mindful Reminder'],
    ['Small changes repeated daily create surprisingly big results.','— Daily Reminder'],
    ['Use your phone as a tool, not as a place to live.','— Daily Reminder'],
    ['A smaller screen habit can create a much bigger life.','— Life Note'],
    ['Make your next hour intentional. Your future self will notice.','— Focus Note'],
    ['The goal is not less technology. It is more life.','— Life Note'],
    ['You can change a habit without changing your whole life at once.','— Daily Reminder'],
    ['Give your best attention to the life you want to build.','— Focus Note'],
    ['Your phone can wait. Your life is happening now.','— Daily Reminder']
  ];
  const TIPS = [
    'Your next hour is still yours to choose.',
    'A small reduction today becomes a big gain over a year.',
    'Track the number honestly. Then make one better choice.',
    'You do not need perfection. Consistency beats intensity.',
    'Protect one screen-free hour today.',
    'Make space for the things your screen cannot replace.'
  ];
  const ACH = [
    ['🌱','First Step','Track your first day','first'],
    ['🔥','3-Day Focus','Stay under goal for 3 days','streak3'],
    ['💎','7-Day Focus','A full week of discipline','streak7'],
    ['⏱️','Time Saver','Reclaim 10 hours','reclaim10'],
    ['🚀','Life Changer','Reclaim 30 hours','reclaim30'],
    ['🏆','Mindful Month','Track for 30 days','days30']
  ];
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2,'0');
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
  const fmt = mins => { mins=Math.max(0,Math.round(mins)); return `${Math.floor(mins/60)}h ${pad(mins%60)}m`; };
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); };
  const todayKey = () => dateKey(new Date());
  const longDate = d => new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(d);
  const headDate = d => new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(d);
  const dayName = d => new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(d);
  const shortDate = d => new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(d);
  let state = load();
  let sessionStartAt = null, timerId = null, deferredPrompt = null;

  function defaults(){return {history:{},profile:{age:'',sleep:'',work:'',goal:3.5},theme:'light',sessionAdded:0};}
  function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'null'); const base=defaults(); return {...base,...raw,profile:{...base.profile,...(raw?.profile||{})},history:raw?.history||{}};}catch{return defaults();}}
  function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
  function ensureToday(){const k=todayKey(); if(!state.history[k]) state.history[k]={minutes:0,age:state.profile.age||'',sleep:state.profile.sleep||'',work:state.profile.work||'',savedAt:Date.now()};}
  function today(){ensureToday();return state.history[todayKey()];}
  function period(days){const end=fromKey(todayKey()), start=new Date(end); start.setDate(start.getDate()-days+1);let total=0,count=0;for(let i=0;i<days;i++){const d=new Date(start);d.setDate(start.getDate()+i);const rec=state.history[dateKey(d)];if(rec&&Number(rec.minutes)>0){total+=Number(rec.minutes);count++;}}return{total,days:count};}
  function streak(goal){let n=0;for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);const rec=state.history[dateKey(d)];if(rec&&Number(rec.minutes)>0&&Number(rec.minutes)<=goal*60)n++;else if(i===0)continue;else break;}return n;}
  function getQuote(){const start=new Date(new Date().getFullYear(),0,0);const days=Math.floor((Date.now()-start)/86400000);return QUOTES[days%QUOTES.length];}
  function setInputs(){const t=today();$('hoursInput').value=t.minutes?Math.floor(t.minutes/60):'';$('minutesInput').value=t.minutes?t.minutes%60:'';$('ageInput').value=t.age||state.profile.age||'';$('sleepInput').value=t.sleep!==''?t.sleep:state.profile.sleep||'';$('workInput').value=t.work!==''?t.work:state.profile.work||'';$('goalInput').value=state.profile.goal;$('defaultSleep').value=state.profile.sleep||'';$('defaultWork').value=state.profile.work||'';updateInputPreview();}
  function updateInputPreview(){const h=clamp(Number($('hoursInput').value||0),0,24),m=clamp(Number($('minutesInput').value||0),0,59);$('inputPreview').textContent=fmt(Math.min(1440,h*60+m));}
  function saveToday(){const h=clamp(Number($('hoursInput').value||0),0,24),m=clamp(Number($('minutesInput').value||0),0,59);const t=today();t.minutes=Math.min(1440,h*60+m);t.age=$('ageInput').value||'';t.sleep=clamp(Number($('sleepInput').value||state.profile.sleep||0),0,24);t.work=clamp(Number($('workInput').value||state.profile.work||0),0,24);t.savedAt=Date.now();state.profile.age=t.age;state.profile.sleep=t.sleep||'';state.profile.work=t.work||'';persist();render();toast('Today updated');}
  function render(){
    ensureToday();persist();
    const now=new Date(),t=today(),mins=Number(t.minutes||0),goal=Number(state.profile.goal||3.5);
    $('heroDate').textContent=longDate(now);$('headerDate').textContent=headDate(now);$('headerClock').textContent=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(now);
    const q=getQuote();$('quoteText').textContent=q[0];$('quoteSource').textContent=q[1];$('sideQuote').textContent=q[0];
    $('todayStat').textContent=fmt(mins);$('todaySub').textContent=mins?'Saved locally':'Add today\'s total';
    const w=period(7),mo=period(now.getDate()),avg=w.total/(Math.max(1,w.days));$('weekStat').textContent=fmt(w.total);$('weekSub').textContent=`Average ${(avg/60).toFixed(1)}h / day`; $('monthStat').textContent=fmt(mo.total);$('monthSub').textContent=`${mo.days} tracked day${mo.days===1?'':'s'}`;
    const s=streak(goal);$('streakQuick').textContent=`${s} day${s===1?'':'s'}`;$('streakSub').textContent=s?'Keep going!':'Start today';
    renderChart();renderDay();renderGoal();renderBigPicture();renderWhatIf();renderAchievements();renderHistory();$('sessionAdded').textContent=`Added ${fmt(state.sessionAdded||0)}`;
  }
  function renderChart(){const wrap=$('chartBars');wrap.innerHTML='';const vals=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dateKey(d);vals.push({d,k,m:Number(state.history[k]?.minutes||0)});}const max=Math.max(60,...vals.map(v=>v.m));vals.forEach(v=>{const col=document.createElement('div');col.className='bar-col';const val=document.createElement('div');val.className='bar-value';val.textContent=v.m?`${(v.m/60).toFixed(1)}h`:'0h';const bar=document.createElement('div');bar.className='bar'+(v.k===todayKey()?' today':'');bar.style.height=`${Math.max(3,(v.m/max)*78)}%`;const lbl=document.createElement('div');lbl.className='bar-day';lbl.textContent=dayName(v.d);col.append(val,bar,lbl);wrap.appendChild(col);});const tracked=vals.filter(v=>v.m>0).length;$('trackedDays').textContent=`${tracked} tracked`;const prior=vals.slice(0,6).reduce((a,v)=>a+v.m,0)/6;const cur=vals[6].m;$('weekChange').textContent=prior?`${cur<prior?'↓':'↑'} ${Math.abs((cur-prior)/prior*100).toFixed(0)}% today vs avg`:'—';}
  function renderDay(){const t=today(),screen=clamp(Number(t.minutes||0)/60,0,24),sleep=clamp(Number(t.sleep||state.profile.sleep||0),0,24),work=clamp(Number(t.work||state.profile.work||0),0,24);const other=Math.max(0,24-screen-sleep-work),vals=[screen,sleep,work,other],total=vals.reduce((a,b)=>a+b,0)||24;['screenSegment','sleepSegment','workSegment','otherSegment'].forEach((id,i)=>$(id).style.width=`${vals[i]/total*100}%`);[['screenDay',screen],['sleepDay',sleep],['workDay',work],['otherDay',other]].forEach(([id,v])=>$(id).textContent=fmt(v*60).replace(' ',' '));[['screenPct',screen],['sleepPct',sleep],['workPct',work],['otherPct',other]].forEach(([id,v])=>$(id).textContent=`${Math.round(v/24*100)}%`);}
  function renderGoal(){const t=today(),g=Number(state.profile.goal||3.5),cur=Number(t.minutes||0)/60,p=g?clamp(cur/g*100,0,100):0,diff=cur-g;$('goalCurrent').textContent=fmt(t.minutes||0);$('goalValue').textContent=fmt(g*60);$('goalProgress').style.width=`${p}%`;$('goalText').textContent=diff>0?`${fmt(diff*60)} over your target today.`:`Great — you are ${fmt(Math.abs(diff*60))} under your target today.`;const s=streak(g);$('streakCount').textContent=`${s} day${s===1?'':'s'}`;const best=Object.values(state.history).filter(x=>Number(x.minutes)>0).reduce((a,b)=>a==null||b.minutes<a?b.minutes:a,null);$('recordSummary').textContent=best!=null?`Best day ${fmt(best)}`:'Best day —';}
  function renderBigPicture(){const mins=Number(today().minutes||0),perYear=mins*365/60,age=Number(today().age||state.profile.age);$('perWeekHours').textContent=`${(mins*7/60).toFixed(1)}h`;$('perYearHours').textContent=`${perYear.toFixed(1)}h`;$('per10YearHours').textContent=`${Math.round(perYear*10)}h`;if(age){const remaining=Math.max(0,80-age),lifeYears=(perYear/8760)*remaining;$('lifeProjection').textContent=`${lifeYears.toFixed(1)}y`;$('bigNote').textContent=`At this pace, you spend about ${(mins*365/1440).toFixed(1)} days each year on screens. Over ${remaining} estimated years, that is about ${lifeYears.toFixed(1)} years of life time.`;}else{$('lifeProjection').textContent='Add age';$('bigNote').textContent=`At this pace, you spend about ${(mins*365/1440).toFixed(1)} days each year on screens. Add your age for a longer-term projection.`;}}
  function renderWhatIf(){const mins=Number(today().minutes||0),r=Math.min(Number($('reduceRange').value||60),mins),hours=r*365/60;$('whatIfValue').textContent=r>=60?`${r/60}h`:`${r}m`;$('reclaimDays').textContent=(hours/24).toFixed(1);$('reclaimHours').textContent=`${Math.round(hours)}h`;}
  function renderAchievements(){const s=streak(Number(state.profile.goal||3.5)),tracked=Object.values(state.history).filter(v=>Number(v.minutes)>0).length,rec=Number(state.sessionAdded||0);const unlocked={first:tracked>=1,streak3:s>=3,streak7:s>=7,reclaim10:rec>=600,reclaim30:rec>=1800,days30:tracked>=30};let n=0;const grid=$('achievementGrid');grid.innerHTML='';ACH.forEach(([icon,title,desc,key])=>{const e=document.createElement('div');e.className='achievement'+(unlocked[key]?'':' locked');if(unlocked[key])n++;e.innerHTML=`<div class="achievement-icon">${icon}</div><strong>${title}</strong><small>${desc}</small>`;grid.appendChild(e);});$('achievementCount').textContent=`${n} / ${ACH.length}`;}
  function renderHistory(){const list=$('historyList');list.innerHTML='';const keys=Object.keys(state.history).filter(k=>Number(state.history[k].minutes)>0).sort().reverse().slice(0,8);if(!keys.length){list.innerHTML='<div class="helper">No tracked days yet. Save today’s total to build your history.</div>';return;}keys.forEach(k=>{const d=fromKey(k),row=document.createElement('div');row.className='history-row';row.innerHTML=`<div class="history-day">${shortDate(d)}<small>${k===todayKey()?'Today':dayName(d)}</small></div><div class="history-time">${fmt(state.history[k].minutes)}</div>`;list.appendChild(row);});}
  function startSession(){if(sessionStartAt)return;sessionStartAt=Date.now();$('sessionStart').disabled=true;$('sessionStop').disabled=false;$('sessionStop').classList.remove('disabled');timerId=setInterval(updateTimer,1000);updateTimer();toast('Session started');}
  function updateTimer(){if(!sessionStartAt)return;const s=Math.floor((Date.now()-sessionStartAt)/1000);$('timer').textContent=`${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`;}
  function stopSession(){if(!sessionStartAt)return;const mins=Math.round((Date.now()-sessionStartAt)/60000);today().minutes=Math.min(1440,Number(today().minutes||0)+mins);state.sessionAdded=(state.sessionAdded||0)+mins;persist();clearInterval(timerId);sessionStartAt=null;$('timer').textContent='00:00:00';$('sessionStart').disabled=false;$('sessionStop').disabled=true;$('sessionStop').classList.add('disabled');render();toast(mins?`Added ${fmt(mins)} to today`:'Session under a minute');}
  function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1800);}
  async function share(text){try{if(navigator.share)await navigator.share({title:'Screen Time • Life Time',text});else{await navigator.clipboard.writeText(text);toast('Copied to clipboard');}}catch{}}
  function openModal(id){$(id).classList.remove('hidden')}function closeModal(id){$(id).classList.add('hidden')}
  function refreshQuote(){const i=Math.floor(Math.random()*QUOTES.length),q=QUOTES[i];$('sideQuote').textContent=q[0];toast('Quote refreshed');}
  function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});}

  ['hoursInput','minutesInput'].forEach(id=>$(id).addEventListener('input',updateInputPreview));
  $('saveBtn').addEventListener('click',saveToday);
  $('updateBtn').addEventListener('click',()=>{const t=today();$('updateHours').value=Math.floor(t.minutes/60);$('updateMinutes').value=t.minutes%60;openModal('updateModal');});
  $('closeUpdate').addEventListener('click',()=>closeModal('updateModal'));
  $('updateSave').addEventListener('click',()=>{$('hoursInput').value=$('updateHours').value;$('minutesInput').value=$('updateMinutes').value;closeModal('updateModal');saveToday();});
  $('settingsBtn').addEventListener('click',()=>openModal('modalBackdrop'));$('profileNav').addEventListener('click',()=>openModal('modalBackdrop'));$('closeSettings').addEventListener('click',()=>closeModal('modalBackdrop'));
  $('editGoalBtn').addEventListener('click',()=>{ $('goalInput').value=state.profile.goal;openModal('modalBackdrop');});
  $('saveSettings').addEventListener('click',()=>{state.profile.goal=clamp(Number($('goalInput').value||3.5),0,24);state.profile.sleep=clamp(Number($('defaultSleep').value||0),0,24);state.profile.work=clamp(Number($('defaultWork').value||0),0,24);persist();setInputs();render();closeModal('modalBackdrop');toast('Settings saved');});
  $('clearBtn').addEventListener('click',()=>{if(confirm('Clear all saved screen-time history?')){state.history={};persist();setInputs();render();toast('History cleared');}});
  $('resetBtn').addEventListener('click',()=>{if(confirm('Reset all local data and settings?')){state=defaults();persist();setInputs();render();closeModal('modalBackdrop');toast('Reset complete');}});
  $('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('dark');state.theme=document.body.classList.contains('dark')?'dark':'light';persist();});
  $('shareQuoteBtn').addEventListener('click',()=>share(`${$('quoteText').textContent}\n\nScreen Time • Life Time\nMade With ❤️ By Shahid Sir`));
  $('refreshQuoteBtn').addEventListener('click',refreshQuote);
  $('reduceRange').addEventListener('input',renderWhatIf);
  $('sessionStart').addEventListener('click',startSession);$('sessionStop').addEventListener('click',stopSession);
  $('notifyBtn').addEventListener('click',()=>{$('tipText').textContent=TIPS[Math.floor(Math.random()*TIPS.length)];$('tipBubble').classList.toggle('hidden');setTimeout(()=>$('tipBubble').classList.add('hidden'),4500);});
  $('quickAddBtn').addEventListener('click',()=>{$('dataSection').scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>$('hoursInput').focus(),450);});
  document.querySelectorAll('.nav-item[data-target]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');scrollToId(btn.dataset.target);}));
  $('installBtn').addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;}else toast('Browser menu → Add to Home screen');});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast('App installed');});
  document.addEventListener('click',e=>{if(!e.target.closest('#notifyBtn')&&!e.target.closest('#tipBubble'))$('tipBubble').classList.add('hidden');});
  if(state.theme==='dark')document.body.classList.add('dark');setInputs();render();
  setInterval(()=>{const n=new Date();$('headerClock').textContent=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(n);},15000);
  if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
