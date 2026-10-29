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
  const completedZone = document.getElementById('completedZone');

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

    if (completedZone) {
      if (schedule.activeTimeline.length > 0) {
        completedZone.classList.remove('hidden');
      } else {
        completedZone.classList.add('hidden');
      }
    }
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

    timerContainer.innerHTML = timers.map((t, index) => {
      const resClass = t.resourceType === 'darkElixir' ? 'dark-elixir' : t.resourceType === 'elixir' ? 'elixir' : '';
      return `
        <div class="timer-item ${resClass}" draggable="true" data-index="${index}">
          <div>
            <strong>${CoCParser.escapeHTML(t.name)}</strong>
            <div style="font-size:0.85rem; color:#94a3b8;">Level ${t.level} &bull; ${CoCParser.escapeHTML(t.resourceType)}</div>
          </div>
          <div class="timer-clock">${CoCParser.escapeHTML(t.formatted)}</div>
        </div>
      `;
    }).join('');
  }

  // Drag and Drop Logic
  if (timerContainer) {
    timerContainer.addEventListener('dragstart', (e) => {
      const timerItem = e.target.closest('.timer-item');
      if (timerItem) {
        timerItem.classList.add('dragging');
        e.dataTransfer.setData('text/plain', timerItem.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    timerContainer.addEventListener('dragend', (e) => {
      const timerItem = e.target.closest('.timer-item');
      if (timerItem) {
        timerItem.classList.remove('dragging');
      }
    });
  }

  if (completedZone) {
    completedZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      completedZone.classList.add('drag-over');
    });

    completedZone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      completedZone.classList.add('drag-over');
    });

    completedZone.addEventListener('dragleave', (e) => {
      completedZone.classList.remove('drag-over');
    });

    completedZone.addEventListener('drop', (e) => {
      e.preventDefault();
      completedZone.classList.remove('drag-over');
      
      const timerIndexStr = e.dataTransfer.getData('text/plain');
      if (timerIndexStr !== '' && currentVillageState) {
        const idx = parseInt(timerIndexStr, 10);
        if (!isNaN(idx) && timerEngine.timers[idx]) {
          const droppedTimer = timerEngine.timers[idx];
          // Find the original item in currentVillageState.activeUpgrades
          const originalIndex = currentVillageState.activeUpgrades.findIndex(
            (u) => u.name === droppedTimer.name && u.level === droppedTimer.level && u.remainingTimeSeconds === droppedTimer.remainingTimeSeconds
          );
          
          if (originalIndex !== -1) {
            // Remove it from activeUpgrades
            const completedUpgrade = currentVillageState.activeUpgrades.splice(originalIndex, 1)[0];
            
            // Increment free builders
            currentVillageState.freeBuilders = Math.min(
              currentVillageState.totalBuilders,
              currentVillageState.freeBuilders + 1
            );
            
            // Mark the building as not upgrading in buildings array
            const buildingIndex = currentVillageState.buildings.findIndex(
              (b) => b.name === completedUpgrade.name && b.level === completedUpgrade.level && b.isUpgrading
            );
            if (buildingIndex !== -1) {
              currentVillageState.buildings[buildingIndex].isUpgrading = false;
              currentVillageState.buildings[buildingIndex].level += 1; // It leveled up!
            }

            processJSON(currentVillageState);
          }
        }
      }
    });
  }
});
// Oct 5 Audit V1
// Oct 5 Audit V2
// Oct 5 Audit V3
// Oct 5 Audit V4
// Oct 5 Audit V5
// Oct 5 Toast Error
// Oct 5 Performance
