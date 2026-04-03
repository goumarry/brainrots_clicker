export class AudioManager {
  private static context: AudioContext | null = null;
  private static deathSound: HTMLAudioElement | null = null;
  private static explosionSound: HTMLAudioElement | null = null;
  private static bgm: HTMLAudioElement | null = null;

  private static init(): void {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    // Background Music
    if (!this.bgm) {
      this.bgm = new Audio('assets/sounds/bgm.mp3');
      this.bgm.loop = true;
      this.bgm.volume = 0.3; // Low background volume
      this.bgm.play().catch(e => console.warn('BGM Autoplay prevented, will retry on click:', e));
    } else if (this.bgm.paused) {
      this.bgm.play().catch(() => {});
    }

    // Death Sound
    if (!this.deathSound) {
      this.deathSound = new Audio('assets/sounds/death.mp3');
      this.deathSound.volume = 0.5;
    }

    // Explosion Sound
    if (!this.explosionSound) {
      this.explosionSound = new Audio('assets/sounds/explosion.mp3');
      this.explosionSound.volume = 0.8;
    }
  }

  /**
   * Procedural SLIME Hit sound (Synthesized)
   */
  static playHitSound(): void {
    this.init();
    if (!this.context) return;

    const ctx = this.context;
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);

    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.1);
    filter.Q.value = 10;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.1);
  }

  static playExplosionSound(): void {
    this.init();
    if (this.explosionSound) {
      this.explosionSound.currentTime = 0;
      this.explosionSound.play().catch(e => console.warn('Audio playback prevented by browser:', e));
    }
  }

  static playDeathSound(): void {
    this.init();
    if (this.deathSound) {
      this.deathSound.currentTime = 0;
      this.deathSound.play().catch(e => console.warn('Audio playback prevented by browser:', e));
    }
  }
}
