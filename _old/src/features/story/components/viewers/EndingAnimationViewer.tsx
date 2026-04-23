import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAudio } from '../../../audio/hooks/useAudio';
import { useAudioStore } from '../../../../store/useAudioStore';
import { useUIStore } from '../../../../store/useUIStore';
import epicCinematicAudio from '../../../../assets/audio/Epic_Cinematic.mp3';
import { extractCredits } from '../../utils/extractCredits';

export const EndingAnimationViewer: React.FC<{ content: string, onClose: () => void }> = ({ onClose }) => {
  const [stage, setStage] = useState(0);
  const { playAudio, stopAll } = useAudio();
  const { unlockBgm, setCurrentBgmId } = useAudioStore();
  const { addToast } = useUIStore();
  const { t } = useTranslation();
  
  const [creditsData] = useState(extractCredits());

  // Use a ref to avoid effect re-running when onClose changes
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    stopAll();
    playAudio(epicCinematicAudio, true);
    
    setTimeout(() => {
      unlockBgm('epic');
      setCurrentBgmId('epic');
    }, 0);

    // Speed up the animation so the user doesn't wait 6 seconds for the first text
    const stages = [
      { stage: 1, delay: 500 },    // Background fades in
      { stage: 2, delay: 2500 },   // Line 1
      { stage: 3, delay: 6000 },   // Line 2
      { stage: 4, delay: 9500 },   // Line 3
      { stage: 5, delay: 12500 },  // Lines 1-3 fade out
      { stage: 6, delay: 14500 },  // Core line
      { stage: 7, delay: 18000 },  // Core line out
      { stage: 8, delay: 20000 },  // Sub line in
      { stage: 9, delay: 23500 },  // Sub line out
      { stage: 10, delay: 25500 }  // Start Credits
    ];

    const timers = stages.map(({ stage, delay }) => 
      setTimeout(() => setStage(stage), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [playAudio, stopAll, unlockBgm, setCurrentBgmId, addToast, t]);

  // Handle Long Press to Skip
  const skipTimerRef = useRef<number | null>(null);
  const skipStartTimeRef = useRef<number | null>(null);
  const skipBackTimerRef = useRef<number | null>(null);
  const skipProgressRef = useRef(0);
  const [skipProgress, setSkipProgress] = useState(0);
  
  const handlePressStart = () => {
    if (stage < 10 || stage >= 11) return; // Only allow skip during credits
    
    // 如果正在回退，取消回退
    if (skipBackTimerRef.current) {
      cancelAnimationFrame(skipBackTimerRef.current);
      skipBackTimerRef.current = null;
    }
    
    const duration = 1500; // 1.5s to skip
    skipStartTimeRef.current = Date.now() - (skipProgressRef.current / 100) * duration;
    
    const animateSkip = () => {
      const elapsed = Date.now() - (skipStartTimeRef.current as number);
      let progress = (elapsed / duration) * 100;
      
      if (progress >= 100) {
        progress = 100;
        skipProgressRef.current = progress;
        setSkipProgress(progress);
        
        // Trigger Skip
        setSkipProgress(0);
        skipProgressRef.current = 0;
        onCloseRef.current();
        addToast(t('story.ending.musicTip'), 'info');
        return;
      }
      
      skipProgressRef.current = progress;
      setSkipProgress(progress);
      skipTimerRef.current = requestAnimationFrame(animateSkip);
    };
    
    skipTimerRef.current = requestAnimationFrame(animateSkip);
  };

  const handlePressEnd = () => {
    if (stage < 10) return;
    
    // 取消前进动画
    if (skipTimerRef.current) {
      cancelAnimationFrame(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    
    const duration = 500; // 0.5s to fall back to 0
    const startProgress = skipProgressRef.current;
    const fallStartTime = Date.now();
    
    const animateBack = () => {
      const elapsed = Date.now() - fallStartTime;
      let progress = startProgress - (elapsed / duration) * startProgress;
      
      if (progress <= 0) {
        progress = 0;
        skipProgressRef.current = progress;
        setSkipProgress(progress);
        return;
      }
      
      skipProgressRef.current = progress;
      setSkipProgress(progress);
      skipBackTimerRef.current = requestAnimationFrame(animateBack);
    };
    
    skipBackTimerRef.current = requestAnimationFrame(animateBack);
  };

  const content = (
    <div 
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: 'black',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
        userSelect: 'none',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      <div className="absolute inset-0 bg-[#020202] z-0"></div>
      
      {/* 基础星空噪点层 */}
      <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay z-0 transition-opacity duration-[5000ms]" style={{ opacity: stage >= 1 ? 1 : 0 }}></div>
      
      {/* 第6阶段：核心句高亮与背景色温转换 */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[80vw] md:h-[80vw] bg-[radial-gradient(circle_at_center,rgba(100,150,255,0.08)_0%,transparent_60%)] mix-blend-screen z-0 pointer-events-none transition-all duration-[5000ms]" 
        style={{ opacity: stage >= 6 && stage < 10 ? 1 : 0, transform: stage >= 6 ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(1)' }}
      ></div>

      {/* 第8阶段：副标题时的背景进一步异变，增加一点史诗感的光晕 */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.08)_0%,transparent_70%)] mix-blend-screen z-0 pointer-events-none transition-opacity duration-[5000ms]" 
        style={{ opacity: stage >= 8 && stage < 10 ? 1 : 0 }}
      ></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-8 text-center" style={{ minHeight: '400px' }}>
        <div 
          className="flex flex-col gap-12 md:gap-16 items-center justify-center w-full absolute inset-0 transition-opacity duration-[3000ms]"
          style={{ opacity: stage >= 2 && stage < 5 ? 1 : 0, pointerEvents: stage >= 2 && stage < 5 ? 'auto' : 'none' }}
        >
          <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/70 transition-opacity duration-[2000ms]" style={{ opacity: stage >= 2 ? 1 : 0 }}>
            {t('story.ending.line1')}
          </p>
          <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/80 transition-opacity duration-[2000ms]" style={{ opacity: stage >= 3 ? 1 : 0 }}>
            {t('story.ending.line2')}
          </p>
          <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/90 transition-opacity duration-[2000ms]" style={{ opacity: stage >= 4 ? 1 : 0 }}>
            {t('story.ending.line3')}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center w-full absolute inset-0">
          <p 
            className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/90 transition-opacity duration-[2000ms] absolute"
            style={{ opacity: stage >= 6 && stage < 7 ? 1 : 0 }}
          >
            {t('story.ending.core')}
          </p>
          <p 
            className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/90 transition-opacity duration-[2000ms] absolute"
            style={{ opacity: stage >= 8 && stage < 9 ? 1 : 0 }}
          >
            {t('story.ending.sub')}
          </p>
        </div>
      </div>

      {/* Credits Roll */}
      {stage >= 10 && (
        <div className="absolute inset-0 flex justify-center w-full z-20 pointer-events-none overflow-hidden">
          <style>
            {`
              @keyframes scrollCredits {
                0% { transform: translateY(100vh); opacity: 0; }
                5% { opacity: 1; }
                100% { transform: translateY(-100%); opacity: 1; }
              }
            `}
          </style>
          <div 
            className="flex flex-col items-center w-full max-w-2xl text-center absolute top-0"
            style={{ 
              animation: 'scrollCredits 35s linear forwards'
            }}
            onAnimationEnd={(e) => {
              if (e.animationName === 'scrollCredits') {
                setStage(11); // Trigger Fade Out
                setTimeout(() => {
                  onCloseRef.current();
                  addToast(t('story.ending.musicTip'), 'info');
                }, 3000); // 3s for the fade out to complete
              }
            }}
          >
            <div className="flex flex-col items-center gap-16 md:gap-24 w-full px-8 py-12">
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-serif tracking-widest text-white/90">{creditsData.title}</h2>
                <div className="w-12 h-[1px] bg-white/30 mx-auto mt-2"></div>
              </div>
              
              {creditsData.roles.map((role: { title: string, names: string[] }, idx: number) => (
                <div key={idx} className="flex flex-col gap-2">
                  <span className="text-xs tracking-[0.3em] text-white/40 uppercase">{role.title}</span>
                  {role.names.map((name: string, nameIdx: number) => (
                    <span key={nameIdx} className="text-lg tracking-wider text-white/80">{name}</span>
                  ))}
                </div>
              ))}
              
              <div className="mt-32 mb-16">
                <span className="text-sm tracking-[0.4em] text-white/30">{creditsData.footer}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Hint */}
      {stage >= 10 && stage < 11 && (
        <div className="absolute bottom-12 right-12 z-30 flex items-center gap-4 animate-fade-in opacity-50">
          <span className="text-xs tracking-widest font-mono text-white/50">{t('story.ending.skip')}</span>
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle 
              cx="16" 
              cy="16" 
              r="14" 
              fill="none" 
              stroke="rgba(255,255,255,0.8)" 
              strokeWidth="2"
              strokeDasharray="88"
              strokeDashoffset={88 - (skipProgress / 100) * 88}
              style={{ transition: 'none' }}
            />
          </svg>
        </div>
      )}
      {/* 全局黑屏淡出过渡层 */}
      <div 
        className="absolute inset-0 bg-black z-50 pointer-events-none transition-opacity duration-[3000ms]" 
        style={{ opacity: stage >= 11 ? 1 : 0 }}
      ></div>
    </div>
  );

  return createPortal(content, document.body);
};
