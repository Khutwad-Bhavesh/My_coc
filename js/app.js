/**
 * Main Application Controller for Clash of Clans Builder Scheduler
 */

document.addEventListener('DOMContentLoaded', () => {
  const jsonInput = document.getElementById('jsonInput');
  const btnParse = document.getElementById('btnParse');
  const btnLoadSample = document.getElementById('btnLoadSample');
  const timerContainer = document.getElementById('timerContainer');
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

    timerEngine.start(villageState.activeUpgrades);
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
