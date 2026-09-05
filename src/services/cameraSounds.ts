// Web Audio Synthesizers for camera shutter and Xenon studio strobe flash
// Runs 100% offline without external audio assets

class CameraSoundEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Standard mechanical camera shutter sound
  playShutterSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Click 1: Curtain opening
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(110, now + 0.06);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Click 2: Curtain closing (rebound)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(450, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain2.gain.setValueAtTime(0.25, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.11);
    } catch {
      // Ignore audio failure
    }
  }

  // Xenon Strobe Flash: Capacitor charge whine + dual high-voltage discharge pop
  playXenonFlashSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. High-pitch Xenon capacitor charge whine
      const whineOsc = ctx.createOscillator();
      const whineGain = ctx.createGain();
      whineOsc.type = 'sawtooth';
      whineOsc.frequency.setValueAtTime(1600, now);
      whineOsc.frequency.exponentialRampToValueAtTime(3800, now + 0.16);
      whineGain.gain.setValueAtTime(0.12, now);
      whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      whineOsc.connect(whineGain);
      whineGain.connect(ctx.destination);
      whineOsc.start(now);
      whineOsc.stop(now + 0.17);

      // 2. Pre-flash spark
      const preOsc = ctx.createOscillator();
      const preGain = ctx.createGain();
      preOsc.type = 'square';
      preOsc.frequency.setValueAtTime(320, now + 0.06);
      preGain.gain.setValueAtTime(0.2, now + 0.06);
      preGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      preOsc.connect(preGain);
      preGain.connect(ctx.destination);
      preOsc.start(now + 0.06);
      preOsc.stop(now + 0.1);

      // 3. Main Xenon explosive flash pop
      const mainOsc = ctx.createOscillator();
      const mainGain = ctx.createGain();
      mainOsc.type = 'triangle';
      mainOsc.frequency.setValueAtTime(140, now + 0.12);
      mainOsc.frequency.exponentialRampToValueAtTime(35, now + 0.26);
      mainGain.gain.setValueAtTime(0.45, now + 0.12);
      mainGain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);
      mainOsc.connect(mainGain);
      mainGain.connect(ctx.destination);
      mainOsc.start(now + 0.12);
      mainOsc.stop(now + 0.27);
    } catch {
      // Ignore audio failure
    }
  }

  // Timer countdown beep
  playBeep(isFinal: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1200 : 750, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isFinal ? 0.25 : 0.12));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.26 : 0.13));
    } catch {
      // Ignore audio failure
    }
  }
}

export const cameraSound = new CameraSoundEngine();
