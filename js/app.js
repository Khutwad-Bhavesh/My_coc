/**
 * Main Application Controller for Clash of Clans Builder Scheduler & Meta Advisor
 */

document.addEventListener('DOMContentLoaded', () => {
  const jsonInput = document.getElementById('jsonInput');
  const btnParse = document.getElementById('btnParse');
  const btnLoadSample = document.getElementById('btnLoadSample');
  const timerContainer = document.getElementById('timerContainer');
  const metaArmyContainer = document.getElementById('metaArmyContainer');
  const layoutPriorityContainer = document.getElementById('layoutPriorityContainer');

  const statFreeBuilders = document.getElementById('statFreeBuilders');
  const statActiveUpgrades = document.getElementById('statActiveUpgrades');
  const statGoldPass = document.getElementById('statGoldPass');

  let timerEngine = new UpgradeTimerEngine(renderTimers);

  btnLoadSample.addEventListener('click', async () => {
    try {
      const res = await fetch('./data/sample_export.json');
      const data = await res.json();
      jsonInput.value = JSON.stringify(data, null, 2);
      processJSON(data);
    } catch (e) {
      alert('Error loading sample JSON file.');
    }
  });

  btnParse.addEventListener('click', () => {
    try {
      const parsed = CoCParser.parse(jsonInput.value);
      processJSON(parsed);
    } catch (err) {
      alert(err.message);
    }
  });

  function processJSON(data) {
    const villageState = typeof data.buildings !== 'undefined' ? data : CoCParser.parse(data);

    statFreeBuilders.textContent = `${villageState.freeBuilders} / ${villageState.totalBuilders}`;
    statActiveUpgrades.textContent = villageState.activeUpgrades.length;
    statGoldPass.textContent = `${villageState.goldPassBoost}%`;

    const schedule = BuilderScheduler.generateSchedule(villageState);

    renderMetaArmies(schedule.armyAnalysis);
    renderLayoutPriorities(schedule.layoutPriorities);
    timerEngine.start(villageState.activeUpgrades);
  }

  function renderMetaArmies(armies) {
    if (!metaArmyContainer) return;
    metaArmyContainer.innerHTML = armies.map(a => `
      <div style="background: rgba(15,23,42,0.6); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.6rem; border-left: 3px solid #ec4899;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${a.armyName}</strong>
          <span style="color: #ec4899; font-weight:700;">${a.readinessPercent}% Ready</span>
        </div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem;">
          Difficulty: ${a.difficulty} &bull; Meta Rating: ${a.metaScore}/100
        </div>
      </div>
    `).join('');
  }

  function renderLayoutPriorities(defenses) {
    if (!layoutPriorityContainer) return;
    layoutPriorityContainer.innerHTML = defenses.slice(0, 4).map(d => `
      <div style="background: rgba(15,23,42,0.6); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.6rem; border-left: 3px solid #8b5cf6;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${d.name}</strong>
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
    if (timers.length === 0) {
      timerContainer.innerHTML = '<p style="color:#94a3b8;">No active builder upgrades detected.</p>';
      return;
    }

    timerContainer.innerHTML = timers.map(t => {
      const resClass = t.resourceType === 'darkElixir' ? 'dark-elixir' : t.resourceType === 'elixir' ? 'elixir' : '';
      return `
        <div class="timer-item ${resClass}">
          <div>
            <strong>${t.name}</strong>
            <div style="font-size:0.85rem; color:#94a3b8;">Level ${t.level} &bull; ${t.resourceType}</div>
          </div>
          <div class="timer-clock">${t.formatted}</div>
        </div>
      `;
    }).join('');
  }
});
