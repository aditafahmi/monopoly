class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.08,
    delay = 0
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playDiceRoll(): void {
    this.tone(180, 0.06, 'triangle', 0.08, 0);
    this.tone(240, 0.06, 'triangle', 0.07, 0.07);
    this.tone(210, 0.06, 'triangle', 0.07, 0.14);
    this.tone(320, 0.08, 'triangle', 0.09, 0.21);
  }

  public playTokenHop(stepIndex = 0): void {
    const base = 360 + (stepIndex % 5) * 35;
    this.tone(base, 0.075, 'sine', 0.065, 0);
  }

  public playBuyProperty(): void {
    this.tone(523.25, 0.11, 'triangle', 0.09, 0);
    this.tone(659.25, 0.12, 'triangle', 0.09, 0.08);
    this.tone(783.99, 0.22, 'triangle', 0.1, 0.16);
  }

  public playCashIn(): void {
    this.tone(587.33, 0.1, 'sine', 0.08, 0);
    this.tone(880, 0.2, 'sine', 0.09, 0.08);
  }

  public playRentPaid(): void {
    this.tone(330, 0.12, 'sawtooth', 0.045, 0);
    this.tone(247, 0.22, 'sawtooth', 0.04, 0.1);
  }

  public playCardDraw(): void {
    this.tone(440, 0.09, 'sine', 0.07, 0);
    this.tone(554.37, 0.14, 'sine', 0.07, 0.07);
  }

  public playJailSiren(): void {
    this.tone(420, 0.15, 'square', 0.04, 0);
    this.tone(310, 0.22, 'square', 0.04, 0.15);
  }

  public playChatPing(): void {
    this.tone(740, 0.07, 'sine', 0.04, 0);
    this.tone(987.77, 0.1, 'sine', 0.04, 0.06);
  }

  public playVictoryFanfare(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, 0.24, 'triangle', 0.1, idx * 0.11);
    });
  }
}

export const soundEngine = new SoundEngine();
