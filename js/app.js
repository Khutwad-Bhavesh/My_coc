/**
 * Main Application Controller for Clash of Clans Builder Scheduler & Meta Advisor (V2 Hardened)
 */

document.addEventListener('DOMContentLoaded', () => {
  const jsonInput = document.getElementById('jsonInput');
  const btnParse = document.getElementById('btnParse');
  const btnLoadSample = document.getElementById('btnLoadSample');
  const chkBuilderPotion = document.getElementById('chkBuilderPotion');
  const chkClockTower = document.getElementById('chkClockTower');

  const timerContainer = document.getElementById('timerContainer');
  const metaArmyContainer = document.getElementById('metaArmyContainer');
  const layoutPriorityContainer = document.getElementById('layoutPriorityContainer');

  const statFreeBuilders = document.getElementById('statFreeBuilders');
  const statActiveUpgrades = document.getElementById('statActiveUpgrades');
  const statGoldPass = document.getElementById('statGoldPass');

  let currentVillageState = null;
  let timerEngine = new UpgradeTimerEngine(renderTimers);

  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', async () => {
      try {
        const res = await fetch('./data/sample_export.json');
        if (!res.ok) throw new Error('Offline or file missing.');
        const data = await res.json();
        jsonInput.value = JSON.stringify(data, null, 2);
        processJSON(data);
      } catch (e) {
        alert('Could not load sample JSON. Please paste your exported JSON data directly.');
      }
    });
  }

  if (btnParse) {
    btnParse.addEventListener('click', () => {
      timerEngine.initAudio(); // Initialize audio on user gesture
      try {
        const parsed = CoCParser.parse(jsonInput.value);
        processJSON(parsed);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (chkBuilderPotion) chkBuilderPotion.addEventListener('change', updateSpeedupOptions);
  if (chkClockTower) chkClockTower.addEventListener('change', updateSpeedupOptions);

  function updateSpeedupOptions() {
    if (currentVillageState) {
      processJSON(currentVillageState);
    }
  }

  function processJSON(data) {
    currentVillageState = typeof data.buildings !== 'undefined' ? data : CoCParser.parse(data);

    statFreeBuilders.textContent = `${currentVillageState.freeBuilders} / ${currentVillageState.totalBuilders}`;
    statActiveUpgrades.textContent = currentVillageState.activeUpgrades.length;
    statGoldPass.textContent = `${currentVillageState.goldPassBoost}%`;

    const options = {
      builderPotionActive: chkBuilderPotion ? chkBuilderPotion.checked : false,
      clockTowerActive: chkClockTower ? chkClockTower.checked : false
    };

    const schedule = BuilderScheduler.generateSchedule(currentVillageState, options);

    renderMetaArmies(schedule.armyAnalysis);
    renderLayoutPriorities(schedule.layoutPriorities);
    timerEngine.start(schedule.activeTimeline);
  }

  function renderMetaArmies(armies) {
    if (!metaArmyContainer) return;
    metaArmyContainer.innerHTML = (armies || []).map(a => `
      <div style="background: rgba(15,23,42,0.6); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.6rem; border-left: 3px solid #ec4899;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${CoCParser.escapeHTML(a.armyName)}</strong>
          <span style="color: #ec4899; font-weight:700;">${a.readinessPercent}% Ready</span>
        </div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem;">
          Difficulty: ${CoCParser.escapeHTML(a.difficulty)} &bull; Meta Rating: ${a.metaScore}/100
        </div>
      </div>
    `).join('');
  }

  function renderLayoutPriorities(defenses) {
    if (!layoutPriorityContainer) return;
    layoutPriorityContainer.innerHTML = (defenses || []).slice(0, 4).map(d => `
      <div style="background: rgba(15,23,42,0.6); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.6rem; border-left: 3px solid #8b5cf6;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${CoCParser.escapeHTML(d.name)}</strong>
          <span style="color: #38bdf8;">Lvl ${d.level} / ${d.maxLevel}</span>
        </div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem;">
          Status: ${d.isUpgrading ? '⚡ Upgrading in Progress' : '🔨 Priority Upgrade Recommended'}
        </div>
      </div>
    `).join('');
  }

  function renderTimers(timers) {
    if (!timerContainer) return;
    if (!timers || timers.length === 0) {
      timerContainer.innerHTML = '<p style="color:#94a3b8;">No active builder upgrades detected.</p>';
      return;
    }

    timerContainer.innerHTML = timers.map(t => {
      const resClass = t.resourceType === 'darkElixir' ? 'dark-elixir' : t.resourceType === 'elixir' ? 'elixir' : '';
      return `
        <div class="timer-item ${resClass}">
          <div>
            <strong>${CoCParser.escapeHTML(t.name)}</strong>
            <div style="font-size:0.85rem; color:#94a3b8;">Level ${t.level} &bull; ${CoCParser.escapeHTML(t.resourceType)}</div>
          </div>
          <div class="timer-clock">${CoCParser.escapeHTML(t.formatted)}</div>
        </div>
      `;
    }).join('');
  }
});
// Oct 5 Audit V1
