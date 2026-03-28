import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../../../store/useAudioStore';

export const useAudio = () => {
  const { volume, isMuted } = useAudioStore();
  
  // 缓存音频实例避免重复创建
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  // 记录正在进行的淡入/淡出定时器
  const fadeIntervals = useRef<{ [key: string]: ReturnType<typeof setInterval> }>({});
  // 记录音频停止的时间戳，用于实现短时间内继续播放
  const stopTimestamps = useRef<{ [key: string]: number }>({});

  const playAudio = useCallback((path: string, loop: boolean = false, fadeDuration: number = 1500) => {
    if (isMuted) return;

    let audio = audioRefs.current[path];
    if (!audio) {
      audio = new Audio(path);
      audioRefs.current[path] = audio;
    }

    // 清除可能存在的旧定时器
    if (fadeIntervals.current[path]) {
      clearInterval(fadeIntervals.current[path]);
      delete fadeIntervals.current[path];
    }

    audio.loop = loop;
    
    // 检查是否在短时间内重新播放
    const now = Date.now();
    const lastStopTime = stopTimestamps.current[path];
    
    if (audio.paused) {
      if (lastStopTime && (now - lastStopTime < 5000)) {
        // 在 5 秒内恢复播放，模拟在后台一直播放
        // 我们需要把播放时间加上这流逝的时间
        const timeElapsed = (now - lastStopTime) / 1000;
        const newTime = audio.currentTime + timeElapsed;
        
        // 如果这首曲子不是无限循环且计算出的时间超过了总时长，则重置
        if (!loop && audio.duration && newTime >= audio.duration) {
          audio.currentTime = 0;
        } else if (audio.duration) {
          // 如果是循环播放，对时长取模
          audio.currentTime = newTime % audio.duration;
        } else {
          audio.currentTime = newTime;
        }
      } else {
        // 超过 5 秒，从头开始
        audio.currentTime = 0;
      }
    }
    
    // 初始音量设为0，准备淡入
    audio.volume = 0;
    
    audio.play().then(() => {
      const steps = 15; // 动画帧数
      const stepTime = fadeDuration / steps;
      const targetVolume = volume;
      const volumeStep = targetVolume / steps;
      let currentStep = 0;

      fadeIntervals.current[path] = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          audio.volume = targetVolume;
          clearInterval(fadeIntervals.current[path]);
          delete fadeIntervals.current[path];
        } else {
          audio.volume = Math.min(targetVolume, currentStep * volumeStep);
        }
      }, stepTime);
    }).catch((err) => {
      console.warn(`Failed to play audio: ${path}`, err);
    });
  }, [volume, isMuted]);

  const stopAudio = useCallback((path: string, fadeDuration: number = 1500) => {
    const audio = audioRefs.current[path];
    if (audio && !audio.paused) {
      // 清除可能存在的旧定时器
      if (fadeIntervals.current[path]) {
        clearInterval(fadeIntervals.current[path]);
        delete fadeIntervals.current[path];
      }

      const steps = 15;
      const stepTime = fadeDuration / steps;
      const startVolume = audio.volume;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      fadeIntervals.current[path] = setInterval(() => {
        currentStep++;
        if (currentStep >= steps || audio.volume - volumeStep <= 0) {
          audio.volume = 0;
          audio.pause();
          stopTimestamps.current[path] = Date.now(); // 记录暂停时间
          clearInterval(fadeIntervals.current[path]);
          delete fadeIntervals.current[path];
        } else {
          audio.volume = Math.max(0, audio.volume - volumeStep);
        }
      }, stepTime);
    }
  }, []);

  const stopAll = useCallback(() => {
    Object.keys(audioRefs.current).forEach((path) => {
      stopAudio(path);
    });
  }, [stopAudio]);

  // 当音量或静音状态改变时，实时更新所有正在播放的音频
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([path, audio]) => {
      // 只有在没有进行淡入淡出动画时才直接设置音量
      if (!fadeIntervals.current[path]) {
        audio.volume = volume;
      }
      audio.muted = isMuted;
    });
  }, [volume, isMuted]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      Object.values(fadeIntervals.current).forEach(clearInterval);
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      });
      audioRefs.current = {};
      fadeIntervals.current = {};
    };
  }, []);

  return { playAudio, stopAudio, stopAll };
};
