// app.js - Core Reactive Application Logic for Bir High-Performance OS
import { MASTER_TIMETABLE, WEEKLY_SCHEDULE, RECIPES, WORKOUT_PROGRESSIONS, PROTOCOL_CITATIONS, PROTOCOL_INFO } from './protocolData.js';

// --- Global State ---
class Store {
  constructor() {
    this.currentDate = this.getTodayDateString();
    this.activeTab = 'dashboard';
    this.data = this.loadData();
    this.syncConfig = this.loadSyncConfig();
    this.timerState = null;
    this.audioCtx = null;
  }

  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadData() {
    const raw = localStorage.getItem('bir_os_data');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse local storage data", e);
      }
    }
    return {
      days: {},
      stats: {
        totalRunsKm: 0,
        totalElevationM: 0,
        completedBouts: 0,
        streak: 1
      }
    };
  }

  saveData() {
    localStorage.setItem('bir_os_data', JSON.stringify(this.data));
    this.broadcastChange();
    if (this.syncConfig.autoSync && this.syncConfig.syncCode) {
      this.syncToCloud();
    }
  }

  loadSyncConfig() {
    const raw = localStorage.getItem('bir_os_sync');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return {
      syncCode: '',
      serverUrl: window.location.origin,
      autoSync: false,
      lastSync: null
    };
  }

  saveSyncConfig(cfg) {
    this.syncConfig = { ...this.syncConfig, ...cfg };
    localStorage.setItem('bir_os_sync', JSON.stringify(this.syncConfig));
  }

  getDayLog(dateStr = this.currentDate) {
    if (!this.data.days[dateStr]) {
      this.data.days[dateStr] = {
        timetable: {},
        run: { completed: false, type: 'zone2', distanceKm: 0, elevationM: 0, durationMins: 0, avgPace: '', avgHr: 0, notes: '' },
        coldShower: { completed: false, durationMins: 3, morningSafe: true },
        calisthenics: { completed: false, split: 'Upper Push', exercises: [], notes: '' },
        mobility: { completed: false, durationMins: 45, notes: '' },
        productivity: {
          bouts: [
            { id: 1, name: 'Deep Work 1 (Morning)', completed: false, visualFocusDone: false, microRestsCount: 0, task: '', errorRate: 15 },
            { id: 2, name: 'Deep Work 2 (Midday)', completed: false, physiologicalSighDone: false, task: '' },
            { id: 3, name: 'Deep Work 3 (Learning)', completed: false, errorRate: 15, task: '' }
          ],
          sunlightExposure: false,
          caffeineDelayed: false,
          nsdrCompleted: false,
          opticFlowChores: false,
          sleepHours: 8.5,
          sleepQuality: 5
        },
        diet: {
          waterLiters: 1.0,
          seaSaltMorning: true,
          breakfastEggBites: false,
          lunchKhichdi: false,
          dinnerPaneerTikka: false,
          customProteinGrams: 0
        }
      };
      this.saveData();
    }
    return this.data.days[dateStr];
  }

  toggleTimetableItem(id, dateStr = this.currentDate) {
    const log = this.getDayLog(dateStr);
    log.timetable[id] = !log.timetable[id];
    
    // Auto-sync related modules
    if (id === 'morning_run') log.run.completed = log.timetable[id];
    if (id === 'cold_shower') log.coldShower.completed = log.timetable[id];
    if (id === 'calisthenics') log.calisthenics.completed = log.timetable[id];
    if (id === 'goggins_mobility') log.mobility.completed = log.timetable[id];
    if (id === 'breakfast') log.diet.breakfastEggBites = log.timetable[id];
    if (id === 'lunch') log.diet.lunchKhichdi = log.timetable[id];
    if (id === 'dinner') log.diet.dinnerPaneerTikka = log.timetable[id];
    if (id === 'nsdr') log.productivity.nsdrCompleted = log.timetable[id];
    if (id === 'optic_flow') log.productivity.opticFlowChores = log.timetable[id];

    this.saveData();
    return log.timetable[id];
  }

  getDailyCompliance(dateStr = this.currentDate) {
    const log = this.getDayLog(dateStr);
    const total = MASTER_TIMETABLE.length;
    let completed = 0;
    MASTER_TIMETABLE.forEach(item => {
      if (log.timetable[item.id]) completed++;
    });
    return Math.round((completed / total) * 100);
  }

  broadcastChange() {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('bir_os_sync_channel');
      bc.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
      bc.close();
    }
  }

  async syncToCloud() {
    if (!this.syncConfig.syncCode) return;
    try {
      const endpoint = `${this.syncConfig.serverUrl}/api/sync/${encodeURIComponent(this.syncConfig.syncCode)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      });
      if (res.ok) {
        this.syncConfig.lastSync = new Date().toLocaleTimeString();
        this.saveSyncConfig({});
        this.updateSyncUI();
      }
    } catch (err) {
      console.warn("Cloud sync failed (offline or server not active)", err);
    }
  }

  async syncFromCloud() {
    if (!this.syncConfig.syncCode) return false;
    try {
      const endpoint = `${this.syncConfig.serverUrl}/api/sync/${encodeURIComponent(this.syncConfig.syncCode)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && cloudData.days) {
          // Merge days
          this.data.days = { ...this.data.days, ...cloudData.days };
          this.saveData();
          this.syncConfig.lastSync = new Date().toLocaleTimeString();
          this.saveSyncConfig({});
          return true;
        }
      }
    } catch (e) {
      console.warn("Cloud pull failed", e);
    }
    return false;
  }

  updateSyncUI() {
    const pill = document.getElementById('syncStatusBtn');
    if (pill) {
      if (this.syncConfig.syncCode) {
        pill.innerHTML = `<span class="sync-dot"></span> Synced (${this.syncConfig.syncCode})`;
      } else {
        pill.innerHTML = `<span class="sync-dot" style="background:#6b7280; box-shadow:none;"></span> Local Only`;
      }
    }
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq = 528, duration = 1.2, type = 'sine') {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.error(e);
    }
  }

  playChime() {
    this.playTone(432, 1.8, 'sine');
    setTimeout(() => this.playTone(648, 2.2, 'triangle'), 150);
  }

  playAlert() {
    this.playTone(880, 0.25, 'triangle');
    setTimeout(() => this.playTone(880, 0.25, 'triangle'), 300);
  }
}

const store = new Store();

// --- Audio & Breathing Utilities ---
let activeInterval = null;

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Render Navigation ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-btn');
  navItems.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = btn.dataset.view;
      if (targetView) {
        switchView(targetView);
      }
    });
  });

  // Date picker navigation
  const prevDateBtn = document.getElementById('prevDateBtn');
  const nextDateBtn = document.getElementById('nextDateBtn');
  const currentDateEl = document.getElementById('currentDateText');

  function updateDateDisplay() {
    const d = new Date(store.currentDate + 'T00:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    currentDateEl.innerText = d.toLocaleDateString(undefined, options);
    
    const today = store.getTodayDateString();
    const isToday = store.currentDate === today;
    const todayBadge = document.getElementById('todayBadge');
    if (todayBadge) {
      todayBadge.style.display = isToday ? 'inline-block' : 'none';
    }
    renderActiveView();
  }

  if (prevDateBtn) {
    prevDateBtn.addEventListener('click', () => {
      const d = new Date(store.currentDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      store.currentDate = d.toISOString().split('T')[0];
      updateDateDisplay();
    });
  }

  if (nextDateBtn) {
    nextDateBtn.addEventListener('click', () => {
      const d = new Date(store.currentDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      store.currentDate = d.toISOString().split('T')[0];
      updateDateDisplay();
    });
  }

  updateDateDisplay();
}

function switchView(viewName) {
  store.activeTab = viewName;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });
  document.querySelectorAll('.mobile-nav-btn').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });
  renderActiveView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchView = switchView;

// --- Render Views ---
function renderActiveView() {
  const container = document.getElementById('viewContent');
  if (!container) return;

  // Update compliance score in header
  const score = store.getDailyCompliance();
  const headerScoreVal = document.getElementById('headerComplianceVal');
  if (headerScoreVal) headerScoreVal.innerText = `${score}%`;

  switch (store.activeTab) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'productivity':
      renderProductivity(container);
      break;
    case 'fitness':
      renderFitness(container);
      break;
    case 'diet':
      renderDiet(container);
      break;
    case 'weekly':
      renderWeekly(container);
      break;
    case 'recipes':
      renderRecipes(container);
      break;
    case 'analytics':
      renderAnalytics(container);
      break;
    case 'sync':
      renderSync(container);
      break;
    default:
      renderDashboard(container);
  }
}

// --- Dashboard View ---
function renderDashboard(container) {
  const log = store.getDayLog();
  const compliance = store.getDailyCompliance();
  const currentMinutes = getCurrentMinutesOfDay();

  // Find active block based on current time
  let activeBlockId = null;
  MASTER_TIMETABLE.forEach(item => {
    const itemMinutes = parseTimeToMinutes(item.time);
    if (currentMinutes >= itemMinutes && currentMinutes < itemMinutes + item.durationMins) {
      activeBlockId = item.id;
    }
  });

  // Calculate macro totals
  let proteinTotal = 0;
  if (log.diet.breakfastEggBites) proteinTotal += 32;
  if (log.diet.lunchKhichdi) proteinTotal += 35;
  if (log.diet.dinnerPaneerTikka) proteinTotal += 31;
  proteinTotal += Number(log.diet.customProteinGrams || 0);

  container.innerHTML = `
    <!-- Hero Banner -->
    <div class="overview-hero">
      <div class="hero-content">
        <div class="hero-title-group">
          <h1>Productivity Tracker</h1>
          <p class="hero-subtitle">
            Altitude: <strong>1,400m - 3,080m</strong> • Bir Marathon & Calisthenics Protocol • Synergized for Neuroplasticity & Longevity.
          </p>
          <div class="hero-tags">
            <span class="tag-badge cyan">Huberman Neurobiology</span>
            <span class="tag-badge emerald">Goggins Mobility</span>
            <span class="tag-badge amber">Wim Hof Autonomic</span>
            <span class="tag-badge">mTOR Leucine Trigger</span>
          </div>
        </div>
        <div class="hero-score-ring">
          <div class="hero-score-val">${compliance}%</div>
          <div class="hero-score-label">Protocol Adherence</div>
        </div>
      </div>
    </div>

    <!-- Quick Action Launchers -->
    <div class="quick-action-bar">
      <button class="action-btn active-action" id="btnLaunchFocus">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        90m Deep Work Bout
      </button>
      <button class="action-btn" id="btnLaunchWimHof">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Wim Hof Breathwork
      </button>
      <button class="action-btn" id="btnLaunchSigh">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12s1.5 2 4 2 4-2 4-2"/></svg>
        Physiological Sigh (5m)
      </button>
      <button class="action-btn" id="btnLaunchGoggins">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Goggins 45m Mobility
      </button>
      <button class="action-btn" id="btnLaunchCold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Cold Shower Timer
      </button>
    </div>

    <!-- Main Grid -->
    <div class="dashboard-grid">
      <!-- Left Column: Master Daily Timetable -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h3 class="card-title">Daily Master Protocol</h3>
              <p class="card-subtitle">Chronobiological sequence engineered to eliminate interference</p>
            </div>
          </div>
          <span class="tag-badge cyan">${MASTER_TIMETABLE.filter(i => log.timetable[i.id]).length}/${MASTER_TIMETABLE.length} Done</span>
        </div>

        <div class="timetable-list" id="timetableList">
          ${MASTER_TIMETABLE.map(item => {
            const isChecked = !!log.timetable[item.id];
            const isNow = item.id === activeBlockId;
            return `
              <div class="timetable-item ${isNow ? 'active-now' : ''} ${isChecked ? 'completed' : ''}" data-id="${item.id}">
                <button class="timetable-check-btn ${isChecked ? 'checked' : ''}" data-toggle="${item.id}">
                  ✓
                </button>
                <div class="timetable-time">${item.time}</div>
                <div class="timetable-content">
                  <div class="timetable-header-row">
                    <span class="timetable-title">${item.title}</span>
                    <span class="timetable-badge badge-${item.category}">${item.badge}</span>
                  </div>
                  <div class="timetable-desc">${item.description}</div>
                  <div class="timetable-rationale">${item.rationale}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Right Column: Live Pillars & Leucine Trigger -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Pillar 1: Nutrition & Leucine Trigger Threshold -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <div class="card-icon-badge violet">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              </div>
              <div>
                <h3 class="card-title">Leucine Trigger & Diet</h3>
                <p class="card-subtitle">Target: >=2.5g leucine/meal to flip mTOR switch</p>
              </div>
            </div>
            <strong style="color:var(--violet); font-size:1.1rem;">${proteinTotal}g</strong>
          </div>

          <!-- Hydration & Salt -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(6,182,212,0.08); padding:10px 14px; border-radius:var(--radius-sm); margin-bottom:12px; border:1px solid rgba(6,182,212,0.2);">
            <div>
              <span style="font-size:0.82rem; font-weight:600; color:#fff;">Morning 1L + Sea Salt</span>
              <div style="font-size:0.72rem; color:var(--text-muted);">Replenishes adrenal electrolyte balance</div>
            </div>
            <input type="checkbox" id="checkSaltWater" ${log.diet.seaSaltMorning ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--cyan); cursor:pointer;">
          </div>

          <!-- Breakfast Card -->
          <div class="leucine-meter-card">
            <div class="meter-header">
              <span class="meter-title">Breakfast: Egg Bites (~32g Protein)</span>
              <span class="meter-val" style="color:${log.diet.breakfastEggBites ? 'var(--emerald)' : 'var(--text-muted)'}">
                ${log.diet.breakfastEggBites ? 'Trigger Met (3.1g Leucine)' : 'Pending'}
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill violet" style="width: ${log.diet.breakfastEggBites ? '100%' : '0%'}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px;">
              <span style="font-size:0.72rem; color:var(--text-muted);">Air Fryer @ 170°C for 12-14m</span>
              <button class="ext-link-btn" onclick="openRecipeModal('egg_bites')">Recipe & Video</button>
            </div>
          </div>

          <!-- Lunch Card -->
          <div class="leucine-meter-card">
            <div class="meter-header">
              <span class="meter-title">Lunch: Anabolic Khichdi (~35g Protein)</span>
              <span class="meter-val" style="color:${log.diet.lunchKhichdi ? 'var(--emerald)' : 'var(--text-muted)'}">
                ${log.diet.lunchKhichdi ? 'Trigger Met (2.8g Leucine)' : 'Pending'}
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill violet" style="width: ${log.diet.lunchKhichdi ? '100%' : '0%'}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px;">
              <span style="font-size:0.72rem; color:var(--text-muted);">1:1 Moong to Rice + Soya Chunks</span>
              <button class="ext-link-btn" onclick="openRecipeModal('khichdi')">Recipe & Video</button>
            </div>
          </div>

          <!-- Dinner Card -->
          <div class="leucine-meter-card">
            <div class="meter-header">
              <span class="meter-title">Dinner: Paneer Tikka (~31g Protein)</span>
              <span class="meter-val" style="color:${log.diet.dinnerPaneerTikka ? 'var(--emerald)' : 'var(--text-muted)'}">
                ${log.diet.dinnerPaneerTikka ? 'Trigger Met (2.9g Casein)' : 'Pending'}
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill violet" style="width: ${log.diet.dinnerPaneerTikka ? '100%' : '0%'}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px;">
              <span style="font-size:0.72rem; color:var(--text-muted);">Air Fryer @ 200°C for 12m</span>
              <button class="ext-link-btn" onclick="openRecipeModal('paneer')">Recipe & Video</button>
            </div>
          </div>
        </div>

        <!-- Pillar 2: Concurrent Training State (Marathon + Calisthenics) -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <div class="card-icon-badge emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              </div>
              <div>
                <h3 class="card-title">Concurrent Training Status</h3>
                <p class="card-subtitle">8h Temporal separation between AMPK & mTOR</p>
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(16,185,129,0.06); padding:12px; border-radius:var(--radius-sm); border:1px solid rgba(16,185,129,0.2);">
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:#fff;">Morning Marathon Run</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">Bir Elevation • AMPK / Mitochondrial base</div>
              </div>
              <span class="tag-badge ${log.run.completed ? 'emerald' : ''}">${log.run.completed ? 'Logged ✓' : 'Pending'}</span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(6,182,212,0.06); padding:12px; border-radius:var(--radius-sm); border:1px solid rgba(6,182,212,0.2);">
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:#fff;">Evening Calisthenics</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">3-4s Eccentric • Mechanical Disadvantage</div>
              </div>
              <span class="tag-badge ${log.calisthenics.completed ? 'cyan' : ''}">${log.calisthenics.completed ? 'Logged ✓' : 'Pending'}</span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(239,68,68,0.06); padding:12px; border-radius:var(--radius-sm); border:1px solid rgba(239,68,68,0.2);">
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:#fff;">Goggins Mobility Routine</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">45m Static stretching (Couch, Pigeon, Calves)</div>
              </div>
              <span class="tag-badge ${log.mobility.completed ? 'crimson' : ''}">${log.mobility.completed ? 'Logged ✓' : 'Pending'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach interactive events
  attachDashboardEvents(container);
}

function attachDashboardEvents(container) {
  // Timetable check buttons
  container.querySelectorAll('.timetable-check-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.toggle;
      const newState = store.toggleTimetableItem(id);
      store.playTone(600, 0.15, 'sine');
      renderActiveView();
    });
  });

  // Timetable item row click to open corresponding protocol tool
  container.querySelectorAll('.timetable-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.timetable-check-btn')) return;
      const id = item.dataset.id;
      if (id === 'wim_hof') openWimHofModal();
      else if (id === 'morning_run' || id === 'calisthenics') switchView('fitness');
      else if (id === 'cold_shower') openTimerModal('cold', 3 * 60, 'Cold Water Exposure (2-3 Mins)', 'coldShower');
      else if (id === 'breakfast') openRecipeModal('egg_bites');
      else if (id === 'lunch') openRecipeModal('khichdi');
      else if (id === 'dinner') openRecipeModal('paneer');
      else if (id === 'deep_work_1') openTimerModal('focus', 90 * 60, '90-Min Ultradian Deep Work Bout', 'visualPrimer');
      else if (id === 'nsdr') openTimerModal('nsdr', 20 * 60, 'NSDR / Yoga Nidra (20 Mins)');
      else if (id === 'deep_work_2' || id === 'deep_work_3') openTimerModal('focus', 90 * 60, 'Ultradian Deep Work Bout');
      else if (id === 'goggins_mobility') openGogginsMobilityModal();
    });
  });

  // Salt water check
  const saltCheck = container.querySelector('#checkSaltWater');
  if (saltCheck) {
    saltCheck.addEventListener('change', () => {
      const log = store.getDayLog();
      log.diet.seaSaltMorning = saltCheck.checked;
      store.saveData();
    });
  }

  // Quick Action Launchers
  container.querySelector('#btnLaunchFocus')?.addEventListener('click', () => {
    openTimerModal('focus', 90 * 60, "90-Min Ultradian Deep Work Bout", "visualPrimer");
  });

  container.querySelector('#btnLaunchWimHof')?.addEventListener('click', () => {
    openWimHofModal();
  });

  container.querySelector('#btnLaunchSigh')?.addEventListener('click', () => {
    openPhysiologicalSighModal();
  });

  container.querySelector('#btnLaunchGoggins')?.addEventListener('click', () => {
    openGogginsMobilityModal();
  });

  container.querySelector('#btnLaunchCold')?.addEventListener('click', () => {
    openTimerModal('cold', 3 * 60, "Cold Water Exposure (2-3 Mins)", "coldShower");
  });
}

// --- Productivity View ---
function renderProductivity(container) {
  const log = store.getDayLog();
  const prod = log.productivity;

  container.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title-group">
          <div class="card-icon-badge cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <div>
            <h3 class="card-title">Neurobiological Productivity Engine</h3>
            <p class="card-subtitle">Anchored to circadian and ultradian rhythms (90-minute BRAC cycles)</p>
          </div>
        </div>
      </div>

      <!-- Circadian Alignment Checklist -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:24px;">
        <label style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); cursor:pointer;">
          <input type="checkbox" id="checkSunlight" ${prod.sunlightExposure ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--amber);">
          <div>
            <div style="font-weight:600; font-size:0.88rem; color:#fff;">Morning Sunlight (ipRGCs)</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Within 30-60m of waking; sets melatonin clock (14-16h)</div>
          </div>
        </label>

        <label style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); cursor:pointer;">
          <input type="checkbox" id="checkCaffeine" ${prod.caffeineDelayed ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--cyan);">
          <div>
            <div style="font-weight:600; font-size:0.88rem; color:#fff;">Delayed Caffeine (90-120m)</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Prevents afternoon crash by clearing adenosine organically</div>
          </div>
        </label>

        <label style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); cursor:pointer;">
          <input type="checkbox" id="checkNSDR" ${prod.nsdrCompleted ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--violet);">
          <div>
            <div style="font-weight:600; font-size:0.88rem; color:#fff;">NSDR / Yoga Nidra (10-20m)</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Restores striatal dopamine baselines; clears fatigue</div>
          </div>
        </label>

        <label style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); cursor:pointer;">
          <input type="checkbox" id="checkOpticFlow" ${prod.opticFlowChores ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--emerald);">
          <div>
            <div style="font-weight:600; font-size:0.88rem; color:#fff;">Optic Flow Ambulation / Chores</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Lateral eye movement down-regulates amygdala stress</div>
          </div>
        </label>
      </div>

      <!-- 3 Ultradian 90-Minute Focus Bouts -->
      <h4 style="font-size:0.92rem; text-transform:uppercase; color:var(--cyan); letter-spacing:0.05em; margin-bottom:14px; font-weight:700;">
        Daily 90-Minute Focus Bouts
      </h4>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Bout 1 -->
        <div style="background:rgba(17,24,39,0.8); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
              <span class="tag-badge cyan" style="margin-right:8px;">09:00 - 10:30 AM</span>
              <strong style="color:#fff; font-size:0.95rem;">Deep Work Block 1: Peak Cortisol & Dopamine</strong>
            </div>
            <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="openTimerModal('focus', 90 * 60, 'Block 1: High Cognitive Focus', 'visualPrimer')">
              Launch 90m Timer
            </button>
          </div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
            Protocol: 25-30 deep breaths + 60s visual stationary focus (acetylcholine recruitment) + 10s micro-rests.
          </p>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <input type="text" class="form-input" id="bout1Task" placeholder="Primary task objective..." value="${prod.bouts[0].task || ''}">
            <div style="display:flex; gap:12px; align-items:center;">
              <label style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="bout1VisualFocus" ${prod.bouts[0].visualFocusDone ? 'checked' : ''}>
                60s Visual Primer Done
              </label>
              <label style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="bout1Done" ${prod.bouts[0].completed ? 'checked' : ''}>
                Bout Completed
              </label>
            </div>
          </div>
        </div>

        <!-- Bout 2 -->
        <div style="background:rgba(17,24,39,0.8); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
              <span class="tag-badge cyan" style="margin-right:8px;">11:00 - 12:30 PM</span>
              <strong style="color:#fff; font-size:0.95rem;">Deep Work Block 2: Second Cognitive Peak</strong>
            </div>
            <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="openTimerModal('focus', 90 * 60, 'Block 2: Second Cognitive Peak')">
              Launch 90m Timer
            </button>
          </div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
            Protocol: Utilize physiological sigh (double nasal inhale, long slow mouth exhale) if acute frustration spikes.
          </p>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <input type="text" class="form-input" id="bout2Task" placeholder="Second cognitive output task..." value="${prod.bouts[1].task || ''}">
            <div style="display:flex; gap:12px; align-items:center;">
              <button class="btn-secondary" style="padding:6px 12px; font-size:0.75rem;" onclick="openPhysiologicalSighModal()">
                Physiological Sigh Guide
              </button>
              <label style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="bout2Done" ${prod.bouts[1].completed ? 'checked' : ''}>
                Bout Completed
              </label>
            </div>
          </div>
        </div>

        <!-- Bout 3 -->
        <div style="background:rgba(17,24,39,0.8); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
              <span class="tag-badge violet" style="margin-right:8px;">02:30 - 04:00 PM</span>
              <strong style="color:#fff; font-size:0.95rem;">Deep Work Block 3: Skill Acquisition & 15% Error Rate</strong>
            </div>
            <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="openTimerModal('focus', 90 * 60, 'Block 3: Skill & Error Rate')">
              Launch 90m Timer
            </button>
          </div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
            Protocol: Embrace the 15% failure rate during complex reading/learning to trigger localized adrenaline & synaptic change.
          </p>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <input type="text" class="form-input" id="bout3Task" placeholder="Reading, language, code, or skill..." value="${prod.bouts[2].task || ''}">
            <div style="display:flex; gap:12px; align-items:center;">
              <label style="font-size:0.8rem; color:var(--text-muted);">
                Target Error Rate: <strong style="color:var(--violet);">15%</strong>
              </label>
              <label style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="bout3Done" ${prod.bouts[2].completed ? 'checked' : ''}>
                Bout Completed
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Sleep & Nocturnal Recovery -->
      <div style="margin-top:24px; padding-top:20px; border-top:1px solid var(--border-subtle); display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div class="form-group">
          <label class="form-label">Sleep Opportunity (Target: 8.5 Hours)</label>
          <input type="number" step="0.5" class="form-input" id="sleepHoursInput" value="${prod.sleepHours || 8.5}">
        </div>
        <div class="form-group">
          <label class="form-label">Sleep & Morning Restoration Score (1-10)</label>
          <input type="number" min="1" max="10" class="form-input" id="sleepQualityInput" value="${prod.sleepQuality || 8}">
        </div>
      </div>
    </div>
  `;

  // Attach productivity event listeners
  container.querySelector('#checkSunlight').addEventListener('change', (e) => {
    prod.sunlightExposure = e.target.checked;
    store.saveData();
  });
  container.querySelector('#checkCaffeine').addEventListener('change', (e) => {
    prod.caffeineDelayed = e.target.checked;
    store.saveData();
  });
  container.querySelector('#checkNSDR').addEventListener('change', (e) => {
    prod.nsdrCompleted = e.target.checked;
    store.saveData();
  });
  container.querySelector('#checkOpticFlow').addEventListener('change', (e) => {
    prod.opticFlowChores = e.target.checked;
    store.saveData();
  });

  ['bout1', 'bout2', 'bout3'].forEach((prefix, idx) => {
    container.querySelector(`#${prefix}Task`)?.addEventListener('blur', (e) => {
      prod.bouts[idx].task = e.target.value;
      store.saveData();
    });
    container.querySelector(`#${prefix}Done`)?.addEventListener('change', (e) => {
      prod.bouts[idx].completed = e.target.checked;
      store.saveData();
    });
  });

  container.querySelector('#bout1VisualFocus')?.addEventListener('change', (e) => {
    prod.bouts[0].visualFocusDone = e.target.checked;
    store.saveData();
  });

  container.querySelector('#sleepHoursInput')?.addEventListener('change', (e) => {
    prod.sleepHours = Number(e.target.value);
    store.saveData();
  });
  container.querySelector('#sleepQualityInput')?.addEventListener('change', (e) => {
    prod.sleepQuality = Number(e.target.value);
    store.saveData();
  });
}

// --- Fitness & Concurrent Training View ---
function renderFitness(container) {
  const log = store.getDayLog();
  const run = log.run;
  const cali = log.calisthenics;
  const cold = log.coldShower;
  const mob = log.mobility;

  // Day of week
  const d = new Date(store.currentDate + 'T00:00:00');
  const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
  const weeklyTarget = WEEKLY_SCHEDULE.find(w => w.day === dayName) || WEEKLY_SCHEDULE[0];

  container.innerHTML = `
    <!-- Macro Guidance Banner -->
    <div class="card" style="margin-bottom: 24px; border-color: rgba(16,185,129,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <span class="tag-badge emerald">${dayName} Macro Focus</span>
          <h3 style="font-size:1.15rem; color:#fff; margin-top:4px;">
            Run: ${weeklyTarget.runTitle} • Strength: ${weeklyTarget.strengthTitle}
          </h3>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">
            ${weeklyTarget.runDescription}
          </p>
        </div>
        <button class="btn-primary" onclick="switchView('weekly')">View 7-Day Plan</button>
      </div>
    </div>

    <!-- Concurrent Training Grid -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:24px; margin-bottom:24px;">
      
      <!-- Module 1: Morning Marathon Endurance Run -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
              <h3 class="card-title">Morning Marathon Altitude Run</h3>
              <p class="card-subtitle">06:30 AM • HIF-1α & EPO erythropoiesis trigger</p>
            </div>
          </div>
          <input type="checkbox" id="runCompletedCheck" ${run.completed ? 'checked' : ''} style="width:22px; height:22px; accent-color:var(--emerald);">
        </div>

        <div class="form-group">
          <label class="form-label">Session Type</label>
          <select class="form-select" id="runTypeSelect">
            <option value="zone2" ${run.type === 'zone2' ? 'selected' : ''}>Zone 2 Aerobic Base (70-80% Volume)</option>
            <option value="tempo" ${run.type === 'tempo' ? 'selected' : ''}>Tempo / Lactate Threshold</option>
            <option value="hills" ${run.type === 'hills' ? 'selected' : ''}>Vertical Kilometer (VK) Trail Ascents</option>
            <option value="longrun" ${run.type === 'longrun' ? 'selected' : ''}>Progressive Long Run (Downhill Eccentric)</option>
            <option value="recovery" ${run.type === 'recovery' ? 'selected' : ''}>Active Recovery Walk (Chowgan)</option>
          </select>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Distance (km)</label>
            <input type="number" step="0.1" class="form-input" id="runDistanceInput" value="${run.distanceKm || ''}" placeholder="e.g. 10.5">
          </div>
          <div class="form-group">
            <label class="form-label">Elevation Gain (m)</label>
            <input type="number" class="form-input" id="runElevationInput" value="${run.elevationM || ''}" placeholder="e.g. 450">
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Duration (Mins)</label>
            <input type="number" class="form-input" id="runDurationInput" value="${run.durationMins || ''}" placeholder="e.g. 60">
          </div>
          <div class="form-group">
            <label class="form-label">Avg Pace (min/km)</label>
            <input type="text" class="form-input" id="runPaceInput" value="${run.avgPace || ''}" placeholder="e.g. 5:30">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Trail Notes / Terrain / Heart Rate</label>
          <input type="text" class="form-input" id="runNotesInput" value="${run.notes || ''}" placeholder="e.g. Billing jeep track, steady 142 bpm">
        </div>
      </div>

      <!-- Module 2: Evening Calisthenics Hypertrophy -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 16.5l-3 3M18 7.5l3-3m-7.5 7.5l-4.5 4.5M12 12l4.5-4.5"/></svg>
            </div>
            <div>
              <h3 class="card-title">Evening Calisthenics Hypertrophy</h3>
              <p class="card-subtitle">04:30 PM • 8h post-run (AMPK clearance, mTOR active)</p>
            </div>
          </div>
          <input type="checkbox" id="caliCompletedCheck" ${cali.completed ? 'checked' : ''} style="width:22px; height:22px; accent-color:var(--cyan);">
        </div>

        <div class="form-group">
          <label class="form-label">Focus Split</label>
          <select class="form-select" id="caliSplitSelect">
            <option value="Upper Push" ${cali.split === 'Upper Push' ? 'selected' : ''}>Upper Body (Push Focus: Pseudo-planche, archer push-ups, dips)</option>
            <option value="Lower Unilateral" ${cali.split === 'Lower Unilateral' ? 'selected' : ''}>Lower Body (Pistol squats, shrimp squats, nordic curls)</option>
            <option value="Upper Pull" ${cali.split === 'Upper Pull' ? 'selected' : ''}>Upper Body (Pull Focus: Pull-ups, chin-ups, front lever)</option>
            <option value="Full Body" ${cali.split === 'Full Body' ? 'selected' : ''}>Full Body (Burpees, muscle-up progressions, hollow holds)</option>
          </select>
        </div>

        <div style="background:rgba(6,182,212,0.06); padding:12px; border-radius:var(--radius-sm); border:1px solid rgba(6,182,212,0.2); margin-bottom:14px;">
          <div style="font-size:0.8rem; font-weight:700; color:var(--cyan); margin-bottom:4px;">Biomechanics Rules (Ref #49, #51):</div>
          <ul style="font-size:0.75rem; color:var(--text-muted); padding-left:18px; line-height:1.5;">
            <li><strong>Mechanical Disadvantage:</strong> Shift leverage forward (pseudo-planche) or single limb (pistol squat).</li>
            <li><strong>3 to 4 Second Eccentric Tempo:</strong> Controlled descent maximizes mechanical tension and localized muscle damage.</li>
          </ul>
        </div>

        <div class="form-group">
          <label class="form-label">Workout Log & Sets/Reps</label>
          <textarea class="form-textarea" id="caliNotesInput" rows="3" placeholder="e.g. Pseudo-planche push-ups 4x8 (3s down), Dips 4x10, Wall handstand 3x45s">${cali.notes || ''}</textarea>
        </div>
      </div>
    </div>

    <!-- Mobility & Cold Exposure Row -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:24px;">
      
      <!-- Goggins Mobility Protocol -->
      <div class="card" style="border-color: rgba(239,68,68,0.25);">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge crimson">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div>
              <h3 class="card-title">David Goggins Mobility Protocol</h3>
              <p class="card-subtitle">07:00 PM • 30-45m Static stretching routine</p>
            </div>
          </div>
          <input type="checkbox" id="mobilityCheck" ${mob.completed ? 'checked' : ''} style="width:22px; height:22px; accent-color:var(--crimson);">
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
          ${WORKOUT_PROGRESSIONS.mobility.map(m => `
            <div style="background:rgba(0,0,0,0.3); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#fff; font-size:0.85rem;">${m.target}</strong>
                <span style="font-size:0.75rem; color:var(--crimson); font-weight:700;">${m.duration}</span>
              </div>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${m.protocol}</div>
              <div style="font-size:0.72rem; color:var(--text-dim); margin-top:4px;">${m.why}</div>
            </div>
          `).join('')}
        </div>

        <button class="btn-primary" style="width:100%; background:linear-gradient(135deg, var(--crimson), #b91c1c); box-shadow:0 0 15px var(--crimson-glow);" onclick="openGogginsMobilityModal()">
          Launch Guided Mobility Timer (4 Stations)
        </button>
      </div>

      <!-- Cold Exposure & mTOR Protection -->
      <div class="card" style="border-color: rgba(6,182,212,0.25);">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <h3 class="card-title">Morning Cold Exposure</h3>
              <p class="card-subtitle">07:45 AM • 2-3 min cold shower</p>
            </div>
          </div>
          <input type="checkbox" id="coldCheck" ${cold.completed ? 'checked' : ''} style="width:22px; height:22px; accent-color:var(--cyan);">
        </div>

        <div style="background:rgba(239,68,68,0.08); padding:12px; border-radius:var(--radius-sm); border:1px solid rgba(239,68,68,0.25); margin-bottom:16px;">
          <strong style="color:var(--crimson); font-size:0.82rem; display:block; margin-bottom:4px;">CRITICAL TIMING RULE (Ref #35, #36):</strong>
          <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.4;">
            Cold water immersion blunts mTOR & p70S6K signaling if done after calisthenics. It MUST be placed in the morning post-run (where it aids mitochondrial biogenesis) and never within 4-6 hours post-strength!
          </p>
        </div>

        <button class="btn-secondary" style="width:100%;" onclick="openTimerModal('cold', 3 * 60, 'Cold Shower (3 Mins)', 'coldShower')">
          Launch 3-Min Cold Shower Timer
        </button>
      </div>

    </div>
  `;

  // Attach fitness inputs
  container.querySelector('#runCompletedCheck')?.addEventListener('change', (e) => {
    run.completed = e.target.checked;
    store.saveData();
  });
  container.querySelector('#runTypeSelect')?.addEventListener('change', (e) => {
    run.type = e.target.value;
    store.saveData();
  });
  container.querySelector('#runDistanceInput')?.addEventListener('change', (e) => {
    run.distanceKm = Number(e.target.value);
    store.saveData();
  });
  container.querySelector('#runElevationInput')?.addEventListener('change', (e) => {
    run.elevationM = Number(e.target.value);
    store.saveData();
  });
  container.querySelector('#runDurationInput')?.addEventListener('change', (e) => {
    run.durationMins = Number(e.target.value);
    store.saveData();
  });
  container.querySelector('#runPaceInput')?.addEventListener('change', (e) => {
    run.avgPace = e.target.value;
    store.saveData();
  });
  container.querySelector('#runNotesInput')?.addEventListener('change', (e) => {
    run.notes = e.target.value;
    store.saveData();
  });

  container.querySelector('#caliCompletedCheck')?.addEventListener('change', (e) => {
    cali.completed = e.target.checked;
    store.saveData();
  });
  container.querySelector('#caliSplitSelect')?.addEventListener('change', (e) => {
    cali.split = e.target.value;
    store.saveData();
  });
  container.querySelector('#caliNotesInput')?.addEventListener('blur', (e) => {
    cali.notes = e.target.value;
    store.saveData();
  });

  container.querySelector('#mobilityCheck')?.addEventListener('change', (e) => {
    mob.completed = e.target.checked;
    store.saveData();
  });
  container.querySelector('#coldCheck')?.addEventListener('change', (e) => {
    cold.completed = e.target.checked;
    store.saveData();
  });
}

// --- Diet & Nutrition View ---
function renderDiet(container) {
  const log = store.getDayLog();
  const diet = log.diet;

  container.innerHTML = `
    <!-- Top Leucine Architecture Card -->
    <div class="card" style="margin-bottom: 24px; border-color: rgba(139,92,246,0.3);">
      <div class="card-header">
        <div class="card-title-group">
          <div class="card-icon-badge violet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <h3 class="card-title">Nutritional Architecture: Leucine Threshold</h3>
            <p class="card-subtitle">mTORC1 requires 2.5g - 3.0g leucine per meal to flip the muscle protein synthesis switch</p>
          </div>
        </div>
      </div>
      <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5;">
        Living alone in Bir demands high protein density with low kitchen friction. Rice (methionine) + Dal (lysine) + Soya Chunks (52% protein) forms an anabolic powerhouse, while Air Fryer Egg Bites and Paneer Tikka provide rapid hands-free cooking.
      </p>
    </div>

    <!-- Recipe Directory -->
    <h3 style="font-size:1.1rem; color:#fff; font-weight:700; margin-bottom:16px;">
      Daily High-Yield, Low-Friction Recipes
    </h3>

    <div class="recipes-grid">
      ${RECIPES.map(r => `
        <div class="recipe-card">
          <div class="recipe-meal-tag">${r.meal}</div>
          <div class="recipe-name">${r.title}</div>
          <div class="recipe-meta-row">
            <span>⏱ ${r.time}</span>
            <span>🔥 ${r.temp}</span>
          </div>
          
          <div class="recipe-macros-pill">
            <div class="macro-item">
              <span>Protein</span>
              <strong>${r.macros.protein}</strong>
            </div>
            <div class="macro-item">
              <span>Carbs</span>
              <strong>${r.macros.carbs}</strong>
            </div>
            <div class="macro-item">
              <span>Fats</span>
              <strong>${r.macros.fats}</strong>
            </div>
            <div class="macro-item">
              <span>Energy</span>
              <strong>${r.macros.calories}</strong>
            </div>
          </div>

          <div style="font-size:0.75rem; color:var(--violet); font-weight:600; margin-bottom:12px;">
            🧬 ${r.macros.leucine}
          </div>

          <div style="margin-bottom:14px;">
            <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-dim); display:block; margin-bottom:6px;">Key Ingredients:</strong>
            <ul style="font-size:0.78rem; color:var(--text-muted); padding-left:16px;">
              ${r.ingredients.slice(0, 4).map(ing => `<li>${ing}</li>`).join('')}
              ${r.ingredients.length > 4 ? `<li>+ ${r.ingredients.length - 4} more...</li>` : ''}
            </ul>
          </div>

          <div class="recipe-links-section">
            <div class="recipe-links-title">Video & Blog Guides</div>
            <div class="link-buttons">
              ${r.videoLinks.map(v => `
                <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="ext-link-btn video">
                  ▶ Video: ${v.title}
                </a>
              `).join('')}
              ${r.blogLinks.map(b => `
                <a href="${b.url}" target="_blank" rel="noopener noreferrer" class="ext-link-btn">
                  📖 ${b.title}
                </a>
              `).join('')}
            </div>
            <button class="btn-secondary" style="width:100%; margin-top:12px; font-size:0.78rem;" onclick="openRecipeModal('${r.id}')">
              View Full Cooking Instructions
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// --- Weekly Macro Schedule View ---
function renderWeekly(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title-group">
          <div class="card-icon-badge emerald">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <h3 class="card-title">16-Week Weekly Macro-Schedule</h3>
            <p class="card-subtitle">Undulating periodization for Bir mountain endurance & calisthenics recovery</p>
          </div>
        </div>
      </div>

      <div class="weekly-table-container">
        <table class="weekly-table">
          <thead>
            <tr>
              <th style="width:110px;">Day</th>
              <th>Morning Run (Altitude Focus)</th>
              <th>Afternoon / Evening Calisthenics & Hypertrophy</th>
              <th>Recovery Focus</th>
            </tr>
          </thead>
          <tbody>
            ${WEEKLY_SCHEDULE.map(item => `
              <tr>
                <td class="day-col">
                  <strong>${item.day}</strong>
                </td>
                <td>
                  <span class="badge-run">${item.runVolume}</span>
                  <div style="font-weight:600; color:#fff;">${item.runTitle}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${item.runDescription}</div>
                </td>
                <td>
                  <span class="badge-calisthenics">${item.tempo}</span>
                  <div style="font-weight:600; color:#fff;">${item.strengthTitle}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${item.strengthDescription}</div>
                </td>
                <td>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${item.strengthFocus}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// --- Recipes Tab View ---
function renderRecipes(container) {
  renderDiet(container);
}

// --- Analytics View ---
function renderAnalytics(container) {
  const dates = Object.keys(store.data.days).sort();
  const recentDates = dates.slice(-7);
  let totalKm = 0;
  let totalElev = 0;
  dates.forEach(d => {
    const l = store.data.days[d];
    if (l.run) {
      totalKm += Number(l.run.distanceKm || 0);
      totalElev += Number(l.run.elevationM || 0);
    }
  });

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card" style="text-align:center;">
        <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Running Volume</span>
        <div style="font-size:2rem; font-weight:900; color:var(--emerald); margin-top:4px;">${totalKm.toFixed(1)} km</div>
        <span style="font-size:0.75rem; color:var(--text-dim);">Bir Marathon Prep</span>
      </div>

      <div class="card" style="text-align:center;">
        <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Elevation Gain</span>
        <div style="font-size:2rem; font-weight:900; color:var(--cyan); margin-top:4px;">${totalElev} m</div>
        <span style="font-size:0.75rem; color:var(--text-dim);">High-Altitude Hypoxia</span>
      </div>

      <div class="card" style="text-align:center;">
        <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Daily Compliance</span>
        <div style="font-size:2rem; font-weight:900; color:var(--amber); margin-top:4px;">${store.getDailyCompliance()}%</div>
        <span style="font-size:0.75rem; color:var(--text-dim);">Today's Adherence</span>
      </div>
    </div>

    <!-- Research Citations Directory -->
    <div class="card">
      <div class="card-header">
        <div class="card-title-group">
          <div class="card-icon-badge violet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div>
            <h3 class="card-title">Research Protocol Citations</h3>
            <p class="card-subtitle">Underlying peer-reviewed science behind each protocol block</p>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:12px;">
        ${PROTOCOL_CITATIONS.map(c => `
          <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); color:var(--text-main); font-size:0.82rem; transition:var(--transition-default);">
            <div>
              <span style="color:var(--cyan); font-weight:700; margin-right:8px;">[Ref #${c.id}]</span>
              <span>${c.title}</span>
            </div>
            <span style="color:var(--text-dim); font-size:0.72rem;">↗</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

// --- Sync & Settings View ---
function renderSync(container) {
  const cfg = store.syncConfig;
  const jsonExport = JSON.stringify(store.data, null, 2);

  container.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title-group">
          <div class="card-icon-badge emerald">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <div>
            <h3 class="card-title">Desktop & Android Cross-Device Synchronization</h3>
            <p class="card-subtitle">Seamlessly sync workouts, timers, and meal logs between your mobile phone and desktop</p>
          </div>
        </div>
      </div>

      <!-- Sync Method 1: Cloud Sync Code -->
      <div style="background:rgba(17,24,39,0.8); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px; margin-bottom:20px;">
        <h4 style="font-size:0.95rem; color:#fff; font-weight:700; margin-bottom:8px;">
          Method 1: Sync Code (Cloud / Local Server)
        </h4>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:14px;">
          Enter any custom Sync Room Code (e.g. <code>bir-athlete-2026</code>) on both your Desktop and your Android browser. Your daily logs will automatically sync between them!
        </p>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
          <input type="text" class="form-input" id="syncCodeInput" placeholder="Enter Sync Room Code..." value="${cfg.syncCode || ''}" style="max-width:280px;">
          <button class="btn-primary" id="btnSaveSyncCode">Save & Sync Now</button>
          <button class="btn-secondary" id="btnPullCloud">Pull from Cloud</button>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="autoSyncCheck" ${cfg.autoSync ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--emerald);">
          <label for="autoSyncCheck" style="font-size:0.8rem; color:var(--text-muted);">
            Auto-sync in background whenever changes are logged
          </label>
        </div>
        ${cfg.lastSync ? `<div style="font-size:0.75rem; color:var(--emerald); margin-top:8px;">Last Synced: ${cfg.lastSync}</div>` : ''}
      </div>

      <!-- Sync Method 2: Android Wi-Fi Direct Access -->
      <div style="background:rgba(17,24,39,0.8); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px; margin-bottom:20px;">
        <h4 style="font-size:0.95rem; color:#fff; font-weight:700; margin-bottom:8px;">
          Method 2: Access & Install on Android via Local Wi-Fi
        </h4>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
          Run the lightweight local server on your PC using <code>node server.js</code>. Then on your Android phone, connect to the same Wi-Fi network and open:
        </p>
        <div style="background:rgba(0,0,0,0.4); padding:10px 14px; border-radius:var(--radius-sm); font-family:monospace; color:var(--cyan); font-size:0.95rem; margin-bottom:12px; display:inline-block;">
          http://[your-pc-ip]:3000
        </div>
        <p style="font-size:0.78rem; color:var(--text-dim);">
          Tip: Tap the three dots (⋮) in Android Chrome and choose <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong> to use it as a full-screen offline Android app!
        </p>
      </div>

      <!-- Sync Method 3: Backup / Restore JSON -->
      <div style="background:rgba(17,24,39,0.8); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px;">
        <h4 style="font-size:0.95rem; color:#fff; font-weight:700; margin-bottom:8px;">
          Method 3: Direct JSON Backup & Restore
        </h4>
        <div style="display:flex; gap:12px; margin-bottom:14px;">
          <button class="btn-secondary" id="btnDownloadBackup">Download Backup File (.json)</button>
          <button class="btn-secondary" id="btnRestoreBackup">Restore from JSON</button>
        </div>
        <textarea class="form-textarea" id="jsonExportBox" rows="6" style="font-family:monospace; font-size:0.75rem;">${jsonExport}</textarea>
      </div>

    </div>
  `;

  // Attach sync events
  container.querySelector('#btnSaveSyncCode')?.addEventListener('click', () => {
    const code = container.querySelector('#syncCodeInput').value.trim();
    const autoSync = container.querySelector('#autoSyncCheck').checked;
    store.saveSyncConfig({ syncCode: code, autoSync });
    store.syncToCloud();
    store.updateSyncUI();
    alert(`Sync Room Code set to: "${code}". Data synced!`);
  });

  container.querySelector('#btnPullCloud')?.addEventListener('click', async () => {
    const success = await store.syncFromCloud();
    if (success) {
      alert("Successfully pulled latest logs from cloud!");
      renderActiveView();
    } else {
      alert("Could not pull data. Make sure the sync server is running or the room code exists.");
    }
  });

  container.querySelector('#btnDownloadBackup')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bir_high_performance_backup_${store.currentDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  container.querySelector('#btnRestoreBackup')?.addEventListener('click', () => {
    try {
      const text = container.querySelector('#jsonExportBox').value;
      const parsed = JSON.parse(text);
      if (parsed && parsed.days) {
        store.data = parsed;
        store.saveData();
        alert("Backup restored successfully!");
        renderActiveView();
      } else {
        alert("Invalid JSON data format.");
      }
    } catch (e) {
      alert("Error parsing JSON: " + e.message);
    }
  });
}

// --- Interactive Modals (Timer, Wim Hof, Physiological Sigh, Goggins, Recipe) ---

// Generic Timer Modal
window.openTimerModal = function(type, durationSeconds, title, mode = null) {
  const modal = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  let remaining = durationSeconds;
  let isRunning = false;
  let interval = null;

  body.innerHTML = `
    <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:4px;">${title}</h3>
    <p class="timer-subtitle" id="timerModeSubtitle">
      ${mode === 'visualPrimer' ? 'Protocol: 60s stationary visual focus before 90m work bout' : 'Distraction-free high-altitude session'}
    </p>

    ${mode === 'visualPrimer' ? `
      <div id="visualPrimerBox" style="background:rgba(0,0,0,0.5); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-accent); margin-bottom:16px; text-align:center;">
        <span style="font-size:0.75rem; color:var(--cyan); text-transform:uppercase; font-weight:700; display:block; margin-bottom:8px;">
          Visual Focus Primer (Ref #19)
        </span>
        <div style="width:14px; height:14px; background:var(--cyan); border-radius:50%; margin:16px auto; box-shadow:0 0 20px var(--cyan);"></div>
        <p style="font-size:0.78rem; color:var(--text-muted); max-width:380px; margin:0 auto;">
          Stare intently at this stationary dot for 30-60 seconds. This activates the frontal eye fields and releases acetylcholine to physically narrow your cognitive aperture.
        </p>
      </div>
    ` : ''}

    <div class="timer-hero-box">
      <div class="timer-digits" id="timerDigitsDisplay">${formatSeconds(remaining)}</div>
      <div class="timer-control-row">
        <button class="btn-primary" id="btnStartPauseTimer">Start Timer</button>
        <button class="btn-secondary" id="btnResetTimer">Reset</button>
      </div>
    </div>
  `;

  modal.classList.add('open');

  const digits = document.getElementById('timerDigitsDisplay');
  const startBtn = document.getElementById('btnStartPauseTimer');
  const resetBtn = document.getElementById('btnResetTimer');

  startBtn.onclick = () => {
    store.initAudio();
    if (isRunning) {
      clearInterval(interval);
      isRunning = false;
      startBtn.innerText = 'Resume';
    } else {
      isRunning = true;
      startBtn.innerText = 'Pause';
      store.playTone(520, 0.3, 'sine');
      interval = setInterval(() => {
        if (remaining > 0) {
          remaining--;
          digits.innerText = formatSeconds(remaining);
          
          // Gap learning micro-rest chime every 20 mins for 90m bout
          if (type === 'focus' && remaining > 0 && remaining % (20 * 60) === 0) {
            store.playChime();
            showMicroRestBanner();
          }
        } else {
          clearInterval(interval);
          isRunning = false;
          startBtn.innerText = 'Completed';
          store.playChime();
          alert(`${title} completed! Logged to today.`);
        }
      }, 1000);
    }
  };

  resetBtn.onclick = () => {
    clearInterval(interval);
    isRunning = false;
    remaining = durationSeconds;
    digits.innerText = formatSeconds(remaining);
    startBtn.innerText = 'Start Timer';
  };
};

function showMicroRestBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#06b6d4; color:#000; padding:12px 24px; border-radius:999px; font-weight:700; font-size:0.85rem; z-index:9999; box-shadow:0 0 20px rgba(6,182,212,0.6);';
  banner.innerText = '10-Second Micro-Rest: Close eyes, no input. Replaying neural circuits!';
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 10000);
}

// Wim Hof Guided Modal
window.openWimHofModal = function() {
  const modal = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:4px;">Wim Hof Breathwork Protocol</h3>
    <p class="timer-subtitle">30-40 Cyclic hyperventilation breaths + retention on empty lungs + recovery hold (Ref #32)</p>

    <div class="breathing-circle-container">
      <div class="breathing-circle" id="wimHofCircle">
        <div class="breathing-instruction" id="wimHofInstruction">Tap Start</div>
        <div class="breathing-subtext" id="wimHofCounter">Round 1</div>
      </div>
    </div>

    <div style="text-align:center; margin-bottom:20px;">
      <div style="font-family:monospace; font-size:2rem; font-weight:800; color:var(--cyan);" id="wimHofHoldTime">--:--</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">Retention Stopwatch</div>
    </div>

    <div class="timer-control-row">
      <button class="btn-primary" id="btnStartWimHof">Start Round 1</button>
      <button class="btn-secondary" id="btnNextWimHofPhase">Next Phase</button>
    </div>
  `;

  modal.classList.add('open');

  let phase = 'idle'; // 'breathing', 'retention', 'recovery'
  let breathCount = 0;
  let breathInterval = null;
  let retentionSeconds = 0;
  let retentionInterval = null;

  const circle = document.getElementById('wimHofCircle');
  const instruction = document.getElementById('wimHofInstruction');
  const counter = document.getElementById('wimHofCounter');
  const holdDisplay = document.getElementById('wimHofHoldTime');
  const startBtn = document.getElementById('btnStartWimHof');
  const nextBtn = document.getElementById('btnNextWimHofPhase');

  startBtn.onclick = () => {
    store.initAudio();
    if (phase === 'idle') {
      phase = 'breathing';
      breathCount = 0;
      instruction.innerText = 'Deep Inhale';
      circle.style.transform = 'scale(1.35)';
      startBtn.style.display = 'none';

      breathInterval = setInterval(() => {
        breathCount++;
        const isInhale = breathCount % 2 === 1;
        if (isInhale) {
          instruction.innerText = 'Deep Inhale';
          counter.innerText = `Breath ${Math.ceil(breathCount / 2)} / 30`;
          circle.style.transform = 'scale(1.35)';
          store.playTone(400, 0.15, 'sine');
        } else {
          instruction.innerText = 'Let Go (Exhale)';
          circle.style.transform = 'scale(1.0)';
        }

        if (breathCount >= 60) {
          // 30 full breaths complete
          clearInterval(breathInterval);
          startRetention();
        }
      }, 1800);
    }
  };

  function startRetention() {
    phase = 'retention';
    instruction.innerText = 'HOLD (Empty Lungs)';
    counter.innerText = 'Intermittent Hypoxia';
    circle.style.transform = 'scale(0.9)';
    store.playChime();

    retentionSeconds = 0;
    retentionInterval = setInterval(() => {
      retentionSeconds++;
      holdDisplay.innerText = formatSeconds(retentionSeconds);
    }, 1000);
  }

  nextBtn.onclick = () => {
    if (phase === 'retention') {
      clearInterval(retentionInterval);
      phase = 'recovery';
      instruction.innerText = 'RECOVERY HOLD (15s)';
      counter.innerText = 'Deep Inhale & Hold';
      circle.style.transform = 'scale(1.4)';
      store.playTone(520, 0.3, 'sine');
      setTimeout(() => {
        store.playChime();
        instruction.innerText = 'Round Complete!';
        counter.innerText = 'Prime for Running';
        phase = 'idle';
        startBtn.style.display = 'inline-block';
        startBtn.innerText = 'Start Next Round';
      }, 15000);
    } else if (phase === 'breathing') {
      clearInterval(breathInterval);
      startRetention();
    }
  };
};

// Physiological Sigh Modal
window.openPhysiologicalSighModal = function() {
  const modal = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:4px;">The Physiological Sigh</h3>
    <p class="timer-subtitle">Two sharp nasal sniffs + long, slow mouth exhale (Ref #27, #28)</p>

    <div class="breathing-circle-container">
      <div class="breathing-circle" id="sighCircle">
        <div class="breathing-instruction" id="sighInstruction">Ready</div>
        <div class="breathing-subtext" id="sighSubtext">Vagal Stimulation</div>
      </div>
    </div>

    <div style="text-align:center; margin-bottom:20px; font-size:0.8rem; color:var(--text-muted); max-width:420px; margin:0 auto 20px;">
      Second sniff re-inflates collapsed pulmonary alveoli. The prolonged exhalation heavily stimulates the vagus nerve, rapidly lowering heart rate and clearing CO2.
    </div>

    <div class="timer-control-row">
      <button class="btn-primary" id="btnStartSigh">Start 5-Minute Session</button>
    </div>
  `;

  modal.classList.add('open');

  const circle = document.getElementById('sighCircle');
  const instruction = document.getElementById('sighInstruction');
  const subtext = document.getElementById('sighSubtext');
  const startBtn = document.getElementById('btnStartSigh');

  let cycleInterval = null;
  let isRunning = false;

  startBtn.onclick = () => {
    store.initAudio();
    if (isRunning) {
      clearInterval(cycleInterval);
      isRunning = false;
      startBtn.innerText = 'Resume';
    } else {
      isRunning = true;
      startBtn.innerText = 'Pause';
      runSighCycle();
      cycleInterval = setInterval(runSighCycle, 9000);
    }
  };

  function runSighCycle() {
    // Phase 1: Inhale 1 (2s)
    instruction.innerText = '1. Inhale (Nose)';
    subtext.innerText = 'Deep belly inhalation';
    circle.style.transform = 'scale(1.25)';
    store.playTone(380, 0.2, 'sine');

    // Phase 2: Inhale 2 (1s)
    setTimeout(() => {
      instruction.innerText = '2. Sharp Second Sniff!';
      subtext.innerText = 'Re-inflate alveoli';
      circle.style.transform = 'scale(1.4)';
      store.playTone(480, 0.2, 'sine');
    }, 2000);

    // Phase 3: Long Exhale (6s)
    setTimeout(() => {
      instruction.innerText = '3. Long Slow Exhale (Mouth)';
      subtext.innerText = 'Stimulate vagus nerve';
      circle.style.transform = 'scale(0.95)';
      store.playTone(300, 0.5, 'sine');
    }, 3000);
  }
};

// Goggins Mobility 4-Station Modal
window.openGogginsMobilityModal = function() {
  const modal = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  const stations = [
    { title: "Station 1: Couch Stretch (Psoas & Hip Flexor)", duration: 3 * 60, side: "Left Leg", cue: "Goggins: Psoas is the soul of the body. Long hold against wall." },
    { title: "Station 1: Couch Stretch (Psoas & Hip Flexor)", duration: 3 * 60, side: "Right Leg", cue: "Drive hips forward, chest upright." },
    { title: "Station 2: Seated Figure-4 / Pigeon Pose", duration: 3 * 60, side: "Left Glute", cue: "Releases posterior hip capsule and sciatic nerve pathway." },
    { title: "Station 2: Seated Figure-4 / Pigeon Pose", duration: 3 * 60, side: "Right Glute", cue: "Square hips, deep slow breathing." },
    { title: "Station 3: Incline Calf & Achilles Stretch", duration: 2.5 * 60, side: "Left Calf", cue: "70-degree slant board or deep doorway stretch for Bir climbs." },
    { title: "Station 3: Incline Calf & Achilles Stretch", duration: 2.5 * 60, side: "Right Calf", cue: "Restores ankle dorsiflexion and running recoil." },
    { title: "Station 4: Doorway Chest & Thoracic Lat Stretch", duration: 3 * 60, side: "Both Sides", cue: "Counteracts forward posture; expands vital lung capacity." }
  ];

  let currentStationIdx = 0;
  let remaining = stations[0].duration;
  let interval = null;
  let isRunning = false;

  function renderStation() {
    const s = stations[currentStationIdx];
    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="tag-badge crimson">Goggins Mobility Protocol</span>
        <span style="font-size:0.75rem; color:var(--text-muted);">Station ${currentStationIdx + 1} of ${stations.length}</span>
      </div>
      <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin-top:6px;">${s.title}</h3>
      <div style="font-size:0.85rem; color:var(--crimson); font-weight:700; margin-bottom:4px;">${s.side}</div>
      <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:16px;">${s.cue}</p>

      <div class="timer-hero-box" style="border-color:rgba(239,68,68,0.3);">
        <div class="timer-digits" style="color:var(--crimson); text-shadow:0 0 25px var(--crimson-glow);">${formatSeconds(remaining)}</div>
        <div class="timer-control-row">
          <button class="btn-primary" id="btnGogginsStart" style="background:linear-gradient(135deg, var(--crimson), #991b1b);">
            ${isRunning ? 'Pause' : 'Start Stretch'}
          </button>
          <button class="btn-secondary" id="btnGogginsSkip">Next Station ⏭</button>
        </div>
      </div>
    `;

    document.getElementById('btnGogginsStart').onclick = () => {
      store.initAudio();
      if (isRunning) {
        clearInterval(interval);
        isRunning = false;
        renderStation();
      } else {
        isRunning = true;
        store.playTone(450, 0.25, 'sine');
        interval = setInterval(() => {
          if (remaining > 0) {
            remaining--;
            renderStation();
          } else {
            clearInterval(interval);
            store.playChime();
            if (currentStationIdx < stations.length - 1) {
              currentStationIdx++;
              remaining = stations[currentStationIdx].duration;
              isRunning = true;
              renderStation();
            } else {
              alert("All Goggins mobility stations complete! Muscle fascial tension released.");
              modal.classList.remove('open');
            }
          }
        }, 1000);
      }
    };

    document.getElementById('btnGogginsSkip').onclick = () => {
      clearInterval(interval);
      isRunning = false;
      if (currentStationIdx < stations.length - 1) {
        currentStationIdx++;
        remaining = stations[currentStationIdx].duration;
        renderStation();
      }
    };
  }

  modal.classList.add('open');
  renderStation();
};

// Full Recipe Modal
window.openRecipeModal = function(recipeId) {
  const modal = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  const r = RECIPES.find(item => item.id === recipeId);
  if (!r) return;

  body.innerHTML = `
    <span class="tag-badge cyan">${r.meal} • Leucine Target Surpassed</span>
    <h2 style="font-size:1.35rem; font-weight:800; color:#fff; margin-top:6px; margin-bottom:4px;">${r.title}</h2>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">${r.subtitle}</p>

    <div class="recipe-macros-pill" style="margin-bottom:16px;">
      <div class="macro-item"><span>Protein</span><strong>${r.macros.protein}</strong></div>
      <div class="macro-item"><span>Carbs</span><strong>${r.macros.carbs}</strong></div>
      <div class="macro-item"><span>Fats</span><strong>${r.macros.fats}</strong></div>
      <div class="macro-item"><span>Calories</span><strong>${r.macros.calories}</strong></div>
    </div>

    <div style="background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.3); padding:10px 14px; border-radius:var(--radius-sm); margin-bottom:16px; font-size:0.8rem; color:#e9d5ff;">
      ⚡ <strong>Anabolic Leucine Trigger:</strong> ${r.macros.leucine}
    </div>

    <div style="margin-bottom:16px;">
      <strong style="color:#fff; font-size:0.9rem; display:block; margin-bottom:8px;">Ingredients:</strong>
      <ul style="font-size:0.82rem; color:var(--text-muted); padding-left:20px; line-height:1.6;">
        ${r.ingredients.map(ing => `<li>${ing}</li>`).join('')}
      </ul>
    </div>

    <div style="margin-bottom:20px;">
      <strong style="color:#fff; font-size:0.9rem; display:block; margin-bottom:8px;">Step-by-Step Preparation:</strong>
      <ol style="font-size:0.82rem; color:var(--text-muted); padding-left:20px; line-height:1.6;">
        ${r.instructions.map(inst => `<li>${inst}</li>`).join('')}
      </ol>
    </div>

    <div class="recipe-links-section" style="border-top:1px solid var(--border-subtle); padding-top:14px;">
      <div class="recipe-links-title">Original Recipe Sources (Videos & Blogs)</div>
      <div class="link-buttons">
        ${r.videoLinks.map(v => `<a href="${v.url}" target="_blank" rel="noopener noreferrer" class="ext-link-btn video">▶ Video: ${v.title}</a>`).join('')}
        ${r.blogLinks.map(b => `<a href="${b.url}" target="_blank" rel="noopener noreferrer" class="ext-link-btn">📖 ${b.title}</a>`).join('')}
      </div>
    </div>
  `;

  modal.classList.add('open');
};

// Modal Close logic
function setupModals() {
  const modal = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalCloseBtn');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
}

// Utility Helpers
function parseTimeToMinutes(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function getCurrentMinutesOfDay() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// PWA Service Worker & Install Prompt Setup
function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration skipped:', err);
    });
  }

  let deferredPrompt = null;
  const pwaBtn = document.getElementById('pwaInstallBtn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBtn) pwaBtn.style.display = 'inline-flex';
  });

  if (pwaBtn) {
    pwaBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          pwaBtn.style.display = 'none';
        }
        deferredPrompt = null;
      }
    });
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupModals();
  setupPWA();
  store.updateSyncUI();
  renderActiveView();

  // Listen to BroadcastChannel for multi-tab sync
  if ('BroadcastChannel' in window) {
    const bc = new BroadcastChannel('bir_os_sync_channel');
    bc.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'DATA_UPDATED') {
        store.data = store.loadData();
        renderActiveView();
      }
    };
  }
});
