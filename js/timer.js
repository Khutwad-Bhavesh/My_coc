/**
 * Real-Time Timer & Alarm Engine (V2 Hardened)
 * Handles monotonic ticking, Web Audio synthesize chime, and LocalStorage state persistence
 */

class UpgradeTimerEngine {
  constructor(onTickCallback) {
    this.timers = [];
    this.intervalId = null;
    this.onTick = onTickCallback;
    this.audioCtx = null;
    this.initVisibilityListener();
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initVisibilityListener() {
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.tick();
        }
      });
    }
  }

  playChime() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  start(upgrades) {
    this.stop(); // Stop any running interval to prevent memory leak
    const now = Date.now();
    this.timers = (upgrades || []).map(u => ({
      ...u,
      targetTime: now + ((u.remainingTimeSeconds || 0) * 1000),
      notified: false
    }));

    this.saveState();
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.tick();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('coc_active_timers', JSON.stringify(this.timers));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  tick() {
    const now = Date.now();
    const updated = this.timers.map(timer => {
      const diffMs = Math.max(0, timer.targetTime - now);
      const remainingSec = Math.ceil(diffMs / 1000);

      if (remainingSec === 0 && !timer.notified) {
        timer.notified = true;
        this.playChime();
      }

      return {
        ...timer,
        remainingSec,
        formatted: BuilderScheduler.formatDuration(remainingSec)
      };
    });

    if (typeof this.onTick === 'function') {
      this.onTick(updated);
    }
  }
}
// Oct 4 Audit V15
// Oct 4 Audit V16
// Oct 4 Audit V17
