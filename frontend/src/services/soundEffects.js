/**
 * Pure Web Audio API Sound Synthesizer for Study Arena
 * Zero-asset, zero-dependency audio synthesizer generating real-time tones:
 * - Round Start Gong / Harmonic Swell
 * - Urgency Countdown Ticks (10s warning)
 * - Turn Transition Chime
 * - Completion Victory Bell / Chord
 * - Hand Raise Bubble Sound
 */

class SoundEffectsService {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
  }

  getIsMuted() {
    return this.isMuted;
  }

  /**
   * Round Start: Deep resonant gong and harmonic swell
   */
  playRoundStart() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Resonant frequencies for a rich gong chord (G minor / pentatonic foundation)
      const freqs = [196.0, 293.66, 392.0, 587.33];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + 2.0);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2 / (idx + 1), now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.3);
      });
    } catch (e) {
      console.warn('[SoundEffects] Error playing round start:', e);
    }
  }

  /**
   * Turn Transition: Smooth dual-tone upward chime (C5 -> G5)
   */
  playTurnChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.25 }, // C5
        { freq: 783.99, time: 0.15, dur: 0.6 }, // G5
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0, now + note.time);
        gain.gain.linearRampToValueAtTime(0.18, now + note.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur + 0.05);
      });
    } catch (e) {
      console.warn('[SoundEffects] Error playing turn chime:', e);
    }
  }

  /**
   * Countdown Tick: High woodblock tick when urgent (<= 10s)
   */
  playCountdownTick(isUrgent = true) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const freq = isUrgent ? 980 : 640;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.05);

      gain.gain.setValueAtTime(isUrgent ? 0.12 : 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.warn('[SoundEffects] Error playing countdown tick:', e);
    }
  }

  /**
   * Completion Bell: Celebratory harmonic chord (C5, E5, G5, C6)
   */
  playCompletionBell() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggiated chord

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const delay = idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 1.7);
      });
    } catch (e) {
      console.warn('[SoundEffects] Error playing completion bell:', e);
    }
  }

  /**
   * Hand Raise: Upward gentle water-bubble sweep
   */
  playHandRaise() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.18);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('[SoundEffects] Error playing hand raise sound:', e);
    }
  }
}

export const soundEffects = new SoundEffectsService();
export default soundEffects;
