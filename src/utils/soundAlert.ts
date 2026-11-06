/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for Security Guard Emergency Alerts
class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: any = null;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play a single high-low siren pulse
  public playEmergencySirenPulse() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      const now = this.audioCtx.currentTime;

      // Sweep from 880Hz (A5) to 440Hz (A4)
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio alert unavailable:', e);
    }
  }

  // Play a gentle notification chime for approved visitor
  public playVisitorChime() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn('Audio chime unavailable:', e);
    }
  }

  public playApprovalChime() {
    this.playVisitorChime();
  }

  // Play continuous siren loop for active emergencies
  public startEmergencySiren() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playEmergencySirenPulse();
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playEmergencySirenPulse();
      }
    }, 800);
  }

  public stopEmergencySiren() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const soundAlert = new SoundAlertManager();
