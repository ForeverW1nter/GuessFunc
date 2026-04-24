export const AUDIO_CONSTANTS = {
  FADE_STEPS: 15,
  DEFAULT_FADE_DURATION: 1500,
  MUTE_FADE_DURATION: 1000,
  TIME_END_TOLERANCE: 0.1,
} as const;

export class AudioManager {
  private static instance: AudioManager;
  private audioRefs: Record<string, HTMLAudioElement> = {};
  private fadeIntervals: Record<string, ReturnType<typeof setInterval>> = {};

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public getAudio(path: string): HTMLAudioElement {
    if (!this.audioRefs[path]) {
      const audio = new Audio(path);
      audio.addEventListener('ended', () => {
        if (!audio.loop) {
          audio.currentTime = 0;
        }
      });
      this.audioRefs[path] = audio;
    }
    return this.audioRefs[path];
  }

  public clearFadeInterval(path: string): void {
    if (this.fadeIntervals[path]) {
      clearInterval(this.fadeIntervals[path]);
      delete this.fadeIntervals[path];
    }
  }

  public setFadeInterval(path: string, interval: ReturnType<typeof setInterval>): void {
    this.clearFadeInterval(path);
    this.fadeIntervals[path] = interval;
  }
  
  public isFading(path: string): boolean {
    return !!this.fadeIntervals[path];
  }
  
  public getAllAudioPaths(): string[] {
    return Object.keys(this.audioRefs);
  }
}
