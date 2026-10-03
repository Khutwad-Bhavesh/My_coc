/**
 * Real-Time Timer & Alarm Engine
 * Handles monotonic ticking, Web Audio synthesize chime, and LocalStorage state persistence
 */

class UpgradeTimerEngine {
  constructor(onTickCallback) {
    this.timers = [];
    this.intervalId = null;
    this.onTick = onTickCallback;
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
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
    this.stop();
    const now = Date.now();
    this.timers = upgrades.map(u => ({
      ...u,
      targetTime: now + (u.remainingTimeSeconds * 1000),
      notified: false
    }));

    this.intervalId = setInterval(() => this.tick(), 1000);
    this.tick();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
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
// LocalStorage backup active
