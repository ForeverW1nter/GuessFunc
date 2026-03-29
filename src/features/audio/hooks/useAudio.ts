import { useEffect, useCallback } from 'react';
import { useAudioStore } from '../../../store/useAudioStore';
import { logger, DEBUG_MODULES } from '../../../utils/debug/logger';

// 采用单例模式彻底解决闭包与生命周期导致的竞态问题
class AudioManager {
  private static instance: AudioManager;
  private audioRefs: { [key: string]: HTMLAudioElement } = {};
  private fadeIntervals: { [key: string]: ReturnType<typeof setInterval> } = {};

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
        logger.module(DEBUG_MODULES.AUDIO, `Audio ended natively: ${path}`);
        if (!audio.loop) {
          audio.currentTime = 0;
        }
      });
      this.audioRefs[path] = audio;
    }
    return this.audioRefs[path];
  }

  public clearFadeInterval(path: string) {
    if (this.fadeIntervals[path]) {
      clearInterval(this.fadeIntervals[path]);
      delete this.fadeIntervals[path];
    }
  }

  public setFadeInterval(path: string, interval: ReturnType<typeof setInterval>) {
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

export const useAudio = () => {
  const { volume, isMuted } = useAudioStore();

  const playAudio = useCallback((path: string, loop: boolean = false, fadeDuration: number = 1500) => {
    if (isMuted) return;

    logger.module(DEBUG_MODULES.AUDIO, `Play requested: ${path}, loop: ${loop}`);
    
    const audioManager = AudioManager.getInstance();
    const audio = audioManager.getAudio(path);

    audioManager.clearFadeInterval(path);

    audio.loop = loop;
    
    // 纯粹的状态驱动：只要音频结束了，就重置它，不再去猜测时间
    if (audio.ended || (audio.duration && Math.abs(audio.currentTime - audio.duration) < 0.1)) {
      audio.currentTime = 0;
    }

    audio.volume = 0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        logger.module(DEBUG_MODULES.AUDIO, `Playback started successfully: ${path}`);
        const steps = 15;
        const stepTime = fadeDuration / steps;
        const targetVolume = volume;
        const volumeStep = targetVolume / steps;
        let currentStep = 0;

        audioManager.setFadeInterval(path, setInterval(() => {
          currentStep++;
          if (currentStep >= steps) {
            audio.volume = targetVolume;
            audioManager.clearFadeInterval(path);
          } else {
            audio.volume = Math.min(targetVolume, currentStep * volumeStep);
          }
        }, stepTime));
      }).catch((err) => {
        logger.error(`Failed to play audio: ${path}`, err);
        // 自动播放策略限制或其他错误导致播放失败时，清理状态
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }, [volume, isMuted]);

  const stopAudio = useCallback((path: string, fadeDuration: number = 1500) => {
    logger.module(DEBUG_MODULES.AUDIO, `Stop requested: ${path}`);
    
    const audioManager = AudioManager.getInstance();
    const audio = audioManager.getAudio(path);
    
    if (!audio.paused && audio.currentTime > 0) {
      audioManager.clearFadeInterval(path);

      const steps = 15;
      const stepTime = fadeDuration / steps;
      const startVolume = audio.volume;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      audioManager.setFadeInterval(path, setInterval(() => {
        currentStep++;
        if (currentStep >= steps || audio.volume - volumeStep <= 0) {
          audio.volume = 0;
          audio.pause();
          
          // 如果是一次性音频且已经播放到很靠后的位置，直接重置，避免下次播放卡在末尾
          if (!audio.loop && audio.duration && (audio.currentTime > audio.duration - 0.5)) {
             audio.currentTime = 0;
          }
          
          audioManager.clearFadeInterval(path);
        } else {
          audio.volume = Math.max(0, audio.volume - volumeStep);
        }
      }, stepTime));
    } else {
       logger.module(DEBUG_MODULES.AUDIO, `Audio is already paused: ${path}`);
    }
  }, []);

  const stopAll = useCallback(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.getAllAudioPaths().forEach((path) => {
      stopAudio(path);
    });
  }, [stopAudio]);

  // 全局音量同步
  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.getAllAudioPaths().forEach((path) => {
      const audio = audioManager.getAudio(path);
      // 如果没有被静音且没有在淡入淡出，直接更新音量
      if (!isMuted && !audioManager.isFading(path)) {
        audio.volume = volume;
      }
    });
  }, [volume, isMuted]);

  // 静音/取消静音的渐入渐出
  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.getAllAudioPaths().forEach((path) => {
      const audio = audioManager.getAudio(path);
      audioManager.clearFadeInterval(path);

      if (isMuted) {
        // 渐出并静音，但不暂停播放，以便保持进度
        const steps = 15;
        const fadeDuration = 1000;
        const stepTime = fadeDuration / steps;
        const startVolume = audio.volume;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        audioManager.setFadeInterval(path, setInterval(() => {
          currentStep++;
          if (currentStep >= steps || audio.volume - volumeStep <= 0) {
            audio.volume = 0;
            audio.muted = true; // 设置静音
            audioManager.clearFadeInterval(path);
          } else {
            audio.volume = Math.max(0, audio.volume - volumeStep);
          }
        }, stepTime));
      } else {
        // 解除静音并渐入
        audio.muted = false;
        if (!audio.paused) {
          audio.volume = 0;
          const steps = 15;
          const fadeDuration = 1000;
          const stepTime = fadeDuration / steps;
          const targetVolume = volume;
          const volumeStep = targetVolume / steps;
          let currentStep = 0;

          audioManager.setFadeInterval(path, setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
              audio.volume = targetVolume;
              audioManager.clearFadeInterval(path);
            } else {
              audio.volume = Math.min(targetVolume, currentStep * volumeStep);
            }
          }, stepTime));
        } else {
          // 如果是暂停的，直接恢复正常音量
          audio.volume = volume;
        }
      }
    });
  }, [isMuted, volume]);

  return { playAudio, stopAudio, stopAll };
};
