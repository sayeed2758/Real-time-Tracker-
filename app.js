(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const STORAGE = {
    history: 'screen_time_history_v1',
    profile: 'screen_time_profile_v1',
    goal: 'screen_time_goal_v1'
  };

  const QUOTES = [
    'Your phone is a tool,\nnot a place to live.',
    'Protect your attention today,\nand you protect your future.',
    'An hour you control today\nbecomes a day you own tomorrow.',
    'The goal is not less technology.\nIt is more life outside the screen.',
    'Look up more often.\nYour real world is still loading.',
    'You do not need more hours.\nYou need more intentional ones.',
    'Small reductions compound.\nThirty minutes a day becomes days of life.',
    'Your attention is valuable.\nSpend it like it matters.',
    'Scroll with a purpose.\nStop with a purpose too.',
    'Make your screen serve your life,\nnot replace it.',
    'A quieter phone can create\na louder, fuller life.',
    'Every notification is a tiny request\nfor your attention. Choose carefully.',
    'Your best moments rarely need\na battery percentage.',
    'Time away from the screen\nis not wasted time.',
    'You can always open another app.\nYou cannot reopen a finished day.',
    'Be present where your feet are.\nThe screen can wait.',
    'One less hour scrolling\ncan become one more hour living.',
    'Use the screen.\nDo not let the screen use you.',
    'Attention is a finite resource.\nSpend yours on what matters.',
    'Your future self will remember\nwhat you did with your time.'
  ];

  const state = {
    history: loadJSON(STORAGE.history, {}),
    profile: loadJSON(STORAGE.profile, { age: '', sleep: '' }),
    goal: Number(localStorage.getItem(STORAGE.goal) || 210),
    session: { running: false, startedAt: 0, elapsed: 0, interval: null }
  };

  function loadJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v && typeof v === 'object' ? v : fallback;
    } catch { return fallback; }
  }

  function save() {
    localStorage.setItem(STORAGE.history, JSON.stringify(state.history));
    localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
    localStorage.setItem(STORAGE.goal, String(state.goal));
  }

  function pad(v) { return String(v).padStart(2, '0'); }
  function minutesToText(minutes) {
    const m = Math.max(0, Math.round(minutes));
    const h = Math.floor(m / 60), min = m % 60;
    return `${h}h ${pad(min)}m`;
  }
  function hoursCompact(minutes) {
    const h = minutes / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  }
  function dateKey(d = new Date()) {
    const y = d.getFullYear(), m = pad(d.getMonth() + 1), day = pad(d.getDate());
    return `${y}-${m}-${day}`;
  }
  function dateLabel(key) {
    const d = new Date(`${key}T12:00:00`);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function todayMinutes() { return Number(state.history[dateKey()] || 0); }
  function sumRange(days) {
    let total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      total += Number(state.history[dateKey(d)] || 0);
    }
    return total;
  }
  function showToast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(showToast.t); showToast.t = setTimeout(() => el.classList.remove('show'), 1800);
  }
  function setQuote() {
    const dayNumber = Math.floor((new Date(new Date().getFullYear(), 0, 0) - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const date = new Date();
    const idx = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2020, 0, 1)) / 86400000) % QUOTES.length;
    $('#dailyQuote').textContent = QUOTES[(idx + QUOTES.length) % QUOTES.length];
  }
  function updateClockLabels() {
    const now = new Date();
    $('#dayLabel').textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function getWeekData() {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push({ key: dateKey(d), day: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), minutes: Number(state.history[dateKey(d)] || 0) });
    }
    return labels;
  }
  function trendText(values) {
    const tracked = values.filter(v => v.minutes > 0);
    if (tracked.length < 2) return '—';
    const first = tracked[0].minutes, last = tracked[tracked.length - 1].minutes;
    if (!first) return '—';
    const delta = ((last - first) / first) * 100;
    return `${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(0)}%`;
  }
  function update() {
    const today = todayMinutes();
    const week = sumRange(7);
    const month = sumRange(new Date().getDate());
    const yearDays = (today / 1440) * 365;
    $('#todayDisplay').textContent = minutesToText(today);
    $('#weekDisplay').textContent = minutesToText(week);
    $('#monthDisplay').textContent = minutesToText(month);
    $('#yearDaysDisplay').textContent = `${yearDays.toFixed(1)} days`;
    $('#weekAverage').textContent = `Average ${hoursCompact(week / 7 * 1)} /day`;
    const trackedMonth = Object.keys(state.history).filter(k => k.startsWith(`${new Date().getFullYear()}-${pad(new Date().getMonth()+1)}-`)).filter(k => Number(state.history[k]) > 0).length;
    $('#monthDays').textContent = `${trackedMonth} tracked day${trackedMonth === 1 ? '' : 's'}`;

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yd = Number(state.history[dateKey(yesterday)] || 0);
    $('#todayDelta').textContent = yd ? `${today === yd ? 'Same as' : today < yd ? `${minutesToText(yd - today)} less than` : `${minutesToText(today - yd)} more than`} yesterday` : (today ? 'Saved locally on this device' : 'Add today\'s screen time');
    $('#currentEntryPill').textContent = today ? minutesToText(today) : 'Not set';

    const age = Number(state.profile.age || 0);
    const sleep = Number(state.profile.sleep || 0);
    $('#weeklyHours').textContent = hoursCompact(today * 7);
    $('#yearlyHours').textContent = hoursCompact(today * 365);
    $('#tenYearYears').textContent = `${((today * 365 * 10) / 24 / 365 / 10).toFixed(2)}y`;
    $('#lifetimeYears').textContent = age ? `${((today / 1440) * (80 - Math.min(age, 79))).toFixed(1)}y` : 'Add age';
    const lifetime = age ? ((today * (80 - Math.min(age, 79))) / 1440) : 0;
    $('#lifeCallout').textContent = today ? (age ? `At this pace, roughly ${lifetime.toFixed(1)} years across the next 80-year lifespan would be spent on screens. This is only a simple projection.` : `At this pace, you spend about ${yearDays.toFixed(1)} days each year on screens. Add your age for a longer-term projection.`) : 'Enter your screen time to see the impact.';

    renderWeek();
    renderWhatIf();
    renderDay(sleep);
    renderGoal(today);
    renderHistory();
  }

  function renderWeek() {
    const data = getWeekData();
    const max = Math.max(60, ...data.map(d => d.minutes));
    const bars = $('#weekBars'); bars.innerHTML = '';
    data.forEach(d => {
      const wrap = document.createElement('div'); wrap.className = 'bar-col';
      const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${Math.max(8, (d.minutes / max) * 100)}%`; if (d.key === dateKey()) bar.classList.add('today-bar');
      bar.title = `${d.day}: ${minutesToText(d.minutes)}`;
      const val = document.createElement('div'); val.className = 'bar-value'; val.textContent = d.minutes ? `${Math.round(d.minutes/60*10)/10}` : '0';
      const lab = document.createElement('div'); lab.className = 'bar-label'; lab.textContent = d.day;
      wrap.append(val, document.createElement('div')); wrap.children[1].appendChild(bar); wrap.append(lab); bars.append(wrap);
    });
    $('#trendChip').textContent = trendText(data);
    $('#weekTracked').textContent = `${data.filter(d => d.minutes).length} tracked`;
  }

  function renderWhatIf() {
    const reduceHours = Number($('#reduceSlider').value);
    const reduceMinutes = Math.min(reduceHours * 60, todayMinutes());
    const reclaimedHours = reduceHours * 365;
    const reclaimedDays = reclaimedHours / 24;
    $('#whatIfValue').textContent = `${reduceHours % 1 ? reduceHours.toFixed(1) : reduceHours}h`;
    $('#reclaimDays').textContent = reclaimedDays.toFixed(1);
    $('#reclaimHours').textContent = `${Math.round(reclaimedHours)}h`;
  }

  function renderDay(sleep) {
    const screen = Math.min(24, todayMinutes() / 60);
    const sleepH = Math.min(24, sleep || 0);
    const work = Math.max(0, Math.min(24 - screen - sleepH, 8));
    const other = Math.max(0, 24 - screen - sleepH - work);
    const parts = [
      ['Screen', screen, 'screen'],
      ['Sleep', sleepH, 'sleep'],
      ['Work / Study', work, 'work'],
      ['Other', other, 'other']
    ];
    const track = $('#dayTrack'); track.innerHTML = '';
    parts.forEach(([name, h, cls]) => { const el = document.createElement('div'); el.className = `day-segment ${cls}`; el.style.width = `${(h / 24) * 100}%`; if (h > 0.6) el.textContent = `${h.toFixed(h % 1 ? 1 : 0)}h`; track.append(el); });
    const legend = $('#dayLegend'); legend.innerHTML = '';
    parts.forEach(([name, h, cls]) => { const item = document.createElement('div'); item.innerHTML = `<span class="legend-dot ${cls}"></span><span>${name}</span><strong>${h.toFixed(h%1?1:0)}h</strong>`; legend.append(item); });
  }

  function renderGoal(today) {
    $('#goalCurrent').textContent = minutesToText(today);
    $('#goalTarget').textContent = minutesToText(state.goal);
    const progress = state.goal ? Math.min(100, (today / state.goal) * 100) : 0;
    $('#goalProgress').style.width = `${progress}%`;
    if (!today) $('#goalMessage').textContent = 'Save today\'s time to see your goal progress.';
    else if (today <= state.goal) $('#goalMessage').textContent = `Great — you are ${minutesToText(state.goal - today)} under your target today.`;
    else $('#goalMessage').textContent = `${minutesToText(today - state.goal)} above your target today. Tomorrow is a fresh start.`;
  }

  function renderHistory() {
    const list = $('#historyList'); list.innerHTML = '';
    const keys = Object.keys(state.history).sort().reverse().slice(0, 10);
    if (!keys.length) { list.innerHTML = '<div class="empty-history">No saved days yet. Add today\'s screen time above.</div>'; return; }
    keys.forEach(k => {
      const item = document.createElement('div'); item.className = 'history-row';
      item.innerHTML = `<div><strong>${dateLabel(k)}</strong><span>${k === dateKey() ? 'Today' : 'Saved on this device'}</span></div><strong>${minutesToText(state.history[k])}</strong>`;
      list.append(item);
    });
  }

  function syncProfileInputs() {
    $('#ageInput').value = state.profile.age || '';
    $('#sleepInput').value = state.profile.sleep || '';
  }
  function updateProfile() {
    state.profile.age = $('#ageInput').value ? Number($('#ageInput').value) : '';
    state.profile.sleep = $('#sleepInput').value ? Number($('#sleepInput').value) : '';
    save(); update();
  }

  function openSettings() { $('#settingsSheet').classList.remove('hidden'); }
  function closeSettings() { $('#settingsSheet').classList.add('hidden'); }
  function openGoal() {
    $('#goalHours').value = Math.floor(state.goal / 60);
    $('#goalMinutes').value = state.goal % 60;
    $('#goalDialog').classList.remove('hidden');
  }
  function closeGoal() { $('#goalDialog').classList.add('hidden'); }
  function openShare() {
    const today = todayMinutes(), reduce = Number($('#reduceSlider').value) || 1;
    $('#shareNumber').textContent = minutesToText(today);
    $('#shareYear').textContent = `${((today * 365) / 1440).toFixed(1)} days/year`;
    $('#shareReclaim').textContent = `Save ${reduce % 1 ? reduce.toFixed(1) : reduce}h/day = ${(reduce * 365 / 24).toFixed(1)} days/year`;
    $('#shareQuote').textContent = $('#dailyQuote').textContent;
    $('#shareDialog').classList.remove('hidden');
  }
  function closeShare() { $('#shareDialog').classList.add('hidden'); }

  $('#saveEntryBtn').addEventListener('click', () => {
    const h = Math.max(0, Math.min(23, Number($('#hoursInput').value || 0)));
    const m = Math.max(0, Math.min(59, Number($('#minutesInput').value || 0)));
    const minutes = h * 60 + m;
    state.history[dateKey()] = minutes;
    save(); update(); showToast(minutes ? 'Today\'s screen time saved ✓' : 'Today cleared');
  });
  $('#hoursInput').addEventListener('change', updateProfile);
  $('#minutesInput').addEventListener('change', () => {});
  $('#ageInput').addEventListener('change', updateProfile);
  $('#sleepInput').addEventListener('change', updateProfile);
  $('#reduceSlider').addEventListener('input', renderWhatIf);
  $('#settingsBtn').addEventListener('click', openSettings);
  document.querySelectorAll('[data-close="settings"]').forEach(el => el.addEventListener('click', closeSettings));
  $('#editGoalBtn').addEventListener('click', openGoal);
  $('#closeGoalBtn').addEventListener('click', closeGoal);
  $('#saveGoalBtn').addEventListener('click', () => {
    const h = Math.max(0, Number($('#goalHours').value || 0)), m = Math.max(0, Math.min(59, Number($('#goalMinutes').value || 0)));
    state.goal = Math.min(1439, Math.round(h * 60 + m)); save(); closeGoal(); update(); showToast('Goal updated ✓');
  });
  $('#targetValueBtn').addEventListener('click', () => { closeSettings(); openGoal(); });
  $('#resetProfileBtn').addEventListener('click', () => { state.profile = { age: '', sleep: '' }; save(); syncProfileInputs(); update(); showToast('Profile reset'); });
  $('#clearDataBtn').addEventListener('click', () => { if (confirm('Clear all saved screen-time history on this device?')) { state.history = {}; save(); update(); showToast('History cleared'); } });
  $('#shareQuoteBtn').addEventListener('click', async () => {
    const text = `${$('#dailyQuote').textContent}\n\n— Screen Time • Life Time`;
    if (navigator.share) { try { await navigator.share({ title: 'Daily thought', text }); } catch {} } else { await navigator.clipboard?.writeText(text); showToast('Thought copied ✓'); }
  });

  $('#startSessionBtn').addEventListener('click', () => {
    if (state.session.running) return;
    state.session.running = true; state.session.startedAt = Date.now(); state.session.interval = setInterval(updateSessionTimer, 1000);
    $('#startSessionBtn').classList.add('disabled'); $('#stopSessionBtn').classList.remove('disabled'); $('#sessionStatus').textContent = 'Tracking'; updateSessionTimer();
  });
  $('#stopSessionBtn').addEventListener('click', () => {
    if (!state.session.running) return;
    const elapsed = Math.max(1, Math.round((Date.now() - state.session.startedAt) / 60000));
    clearInterval(state.session.interval); state.session.running = false; state.session.interval = null;
    state.history[dateKey()] = todayMinutes() + elapsed; save(); update();
    $('#startSessionBtn').classList.remove('disabled'); $('#stopSessionBtn').classList.add('disabled'); $('#sessionStatus').textContent = `Added ${minutesToText(elapsed)}`;
    state.session.elapsed = 0; updateSessionTimer(); showToast(`${minutesToText(elapsed)} added ✓`);
  });
  function updateSessionTimer() {
    let seconds = state.session.running ? Math.floor((Date.now() - state.session.startedAt) / 1000) : 0;
    const h = Math.floor(seconds / 3600); seconds %= 3600; const m = Math.floor(seconds / 60); const s = seconds % 60;
    $('#sessionTimer').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  $('#openEntryBtn').addEventListener('click', () => { $('#entryCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('#hoursInput').focus(), 450); });
  $('#nativeShareBtn').addEventListener('click', async () => {
    const text = `My screen-time check-in: ${minutesToText(todayMinutes())} today. ${$('#shareReclaim').textContent}.\n\n${$('#dailyQuote').textContent}`;
    if (navigator.share) { try { await navigator.share({ title: 'My Screen Time', text }); } catch {} }
    else { await navigator.clipboard?.writeText(text); showToast('Result copied ✓'); }
  });
  $('#closeShareBtn').addEventListener('click', closeShare);

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSettings(); closeGoal(); closeShare(); } });
  window.addEventListener('beforeunload', () => { if (state.session.running) clearInterval(state.session.interval); });

  setQuote(); updateClockLabels(); syncProfileInputs();
  const initialToday = todayMinutes();
  if (initialToday) { $('#hoursInput').value = Math.floor(initialToday / 60); $('#minutesInput').value = initialToday % 60; }
  $('#shareQuoteBtn').addEventListener('click', () => {});
  update();

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
})();
