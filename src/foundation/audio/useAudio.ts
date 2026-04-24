import { useEffect, useCallback } from 'react';
import { useAudioStore } from './useAudioStore';
import { AudioManager, AUDIO_CONSTANTS } from './AudioManager';

export const useAudio = () => {
  const { volume, isMuted } = useAudioStore();

  const playAudio = useCallback((path: string, loop: boolean = false, fadeDuration: number = AUDIO_CONSTANTS.DEFAULT_FADE_DURATION) => {
    if (isMuted) return;

    const audioManager = AudioManager.getInstance();
    const audio = audioManager.getAudio(path);

    audioManager.clearFadeInterval(path);

    audio.loop = loop;
    
    if (audio.ended || (audio.duration && Math.abs(audio.currentTime - audio.duration) < AUDIO_CONSTANTS.TIME_END_TOLERANCE)) {
      audio.currentTime = 0;
    }

    audio.volume = 0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        const steps = AUDIO_CONSTANTS.FADE_STEPS;
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
        console.error(`[Audio] Play failed for ${path}:`, err);
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }, [volume, isMuted]);

  const stopAudio = useCallback((path: string, fadeDuration: number = AUDIO_CONSTANTS.DEFAULT_FADE_DURATION) => {
    const audioManager = AudioManager.getInstance();
    const audio = audioManager.getAudio(path);
    
    if (!audio.paused && audio.currentTime > 0) {
      audioManager.clearFadeInterval(path);

      const steps = AUDIO_CONSTANTS.FADE_STEPS;
      const stepTime = fadeDuration / steps;
      const startVolume = audio.volume;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      audioManager.setFadeInterval(path, setInterval(() => {
        currentStep++;
        if (currentStep >= steps || audio.volume - volumeStep <= 0) {
          audio.volume = 0;
          audio.pause();
          
          if (!audio.loop && audio.duration && (audio.currentTime > audio.duration - 0.5)) {
             audio.currentTime = 0;
          }
          
          audioManager.clearFadeInterval(path);
        } else {
          audio.volume = Math.max(0, audio.volume - volumeStep);
        }
      }, stepTime));
    }
  }, []);

  const stopAll = useCallback(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.getAllAudioPaths().forEach((path) => {
      stopAudio(path);
    });
  }, [stopAudio]);

  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.getAllAudioPaths().forEach((path) => {
      const audio = audioManager.getAudio(path);
      if (!isMuted && !audioManager.isFading(path)) {
        audio.volume = volume;
      }
    });
  }, [volume, isMuted]);

  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.getAllAudioPaths().forEach((path) => {
      const audio = audioManager.getAudio(path);
      audioManager.clearFadeInterval(path);

      if (isMuted) {
        const steps = AUDIO_CONSTANTS.FADE_STEPS;
        const fadeDuration = AUDIO_CONSTANTS.MUTE_FADE_DURATION;
        const stepTime = fadeDuration / steps;
        const startVolume = audio.volume;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        audioManager.setFadeInterval(path, setInterval(() => {
          currentStep++;
          if (currentStep >= steps || audio.volume - volumeStep <= 0) {
            audio.volume = 0;
            audio.muted = true;
            audioManager.clearFadeInterval(path);
          } else {
            audio.volume = Math.max(0, audio.volume - volumeStep);
          }
        }, stepTime));
      } else {
        audio.muted = false;
        if (!audio.paused) {
          audio.volume = 0;
          const steps = AUDIO_CONSTANTS.FADE_STEPS;
          const fadeDuration = AUDIO_CONSTANTS.MUTE_FADE_DURATION;
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
          audio.volume = volume;
        }
      }
    });
  }, [isMuted, volume]);

  return { playAudio, stopAudio, stopAll };
};
