import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAudio } from '../../../audio/hooks/useAudio';
import { useAudioStore } from '../../../../store/useAudioStore';
import { useUIStore } from '../../../../store/useUIStore';
import epicCinematicAudio from '../../../../assets/audio/Epic_Cinematic.mp3';

export const FakeEndingAnimationViewer: React.FC<{ content: string, onClose: () => void }> = ({ onClose }) => {
  const [stage, setStage] = useState(0);
  const { playAudio, stopAll } = useAudio();
  const { unlockBgm, setCurrentBgmId } = useAudioStore();
  const { addToast } = useUIStore();
  const { t } = useTranslation();
  
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

    const stages = [
      { stage: 1, delay: 500 },    // Background fades in
      { stage: 2, delay: 2500 },   // Line 1
      { stage: 3, delay: 6000 },   // Line 2
      { stage: 4, delay: 9500 },   // Line 3
      { stage: 5, delay: 12500 },  // Lines 1-3 fade out
      { stage: 6, delay: 14500 },  // Core line
      { stage: 7, delay: 18000 },  // Core line out
      { stage: 8, delay: 19000 },  // SHATTER EFFECT START
      { stage: 9, delay: 21000 },  // Sub line in
      { stage: 10, delay: 25000 }, // Fade out
      { stage: 11, delay: 28000 }  // Exit
    ];

    const timers = stages.map(({ stage, delay }) => 
      setTimeout(() => setStage(stage), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [playAudio, stopAll, unlockBgm, setCurrentBgmId, addToast, t]);

  useEffect(() => {
    if (stage === 11) {
      onCloseRef.current();
    }
  }, [stage]);

  const content = (
    <div 
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
      <style>
        {`
          @keyframes glitch {
            0% { transform: translate(0) }
            20% { transform: translate(-5px, 5px) }
            40% { transform: translate(-5px, -5px) }
            60% { transform: translate(5px, 5px) }
            80% { transform: translate(5px, -5px) }
            100% { transform: translate(0) }
          }
          @keyframes rgbSplit {
            0% { text-shadow: -2px 0 red, 2px 0 cyan; }
            50% { text-shadow: 2px 0 red, -2px 0 cyan; }
            100% { text-shadow: -2px 0 red, 2px 0 cyan; }
          }
          @keyframes screenShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
          }
          .glitch-text {
            animation: rgbSplit 0.1s linear infinite;
            color: white;
          }
          .shatter-bg {
            animation: screenShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}
      </style>

      <div className={`absolute inset-0 bg-[#020202] z-0 ${stage >= 8 ? 'shatter-bg' : ''}`}></div>
      
      <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay z-0 transition-opacity duration-[5000ms]" style={{ opacity: stage >= 1 ? 1 : 0 }}></div>
      
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[80vw] md:h-[80vw] bg-[radial-gradient(circle_at_center,rgba(100,150,255,0.08)_0%,transparent_60%)] mix-blend-screen z-0 pointer-events-none transition-all duration-[5000ms]" 
        style={{ opacity: stage >= 6 && stage < 10 ? 1 : 0, transform: stage >= 6 ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%) scale(1)' }}
      ></div>

      <div 
        className={`absolute bottom-0 left-0 right-0 h-[60vh] bg-[radial-gradient(ellipse_at_bottom,rgba(255,50,50,0.15)_0%,transparent_70%)] mix-blend-screen z-0 pointer-events-none transition-opacity duration-[200ms]`} 
        style={{ opacity: stage >= 8 && stage < 10 ? 1 : 0 }}
      ></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-8 text-center" style={{ minHeight: '400px' }}>
        <div 
          className="flex flex-col gap-12 md:gap-16 items-center justify-center w-full absolute inset-0 transition-opacity duration-[3000ms]"
          style={{ opacity: stage >= 2 && stage < 5 ? 1 : 0, pointerEvents: stage >= 2 && stage < 5 ? 'auto' : 'none' }}
        >
          <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/70 transition-opacity duration-[2000ms]" style={{ opacity: stage >= 2 ? 1 : 0 }}>
            {t('story.fakeEnding.line1')}
          </p>
          <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/80 transition-opacity duration-[2000ms]" style={{ opacity: stage >= 3 ? 1 : 0 }}>
            {t('story.fakeEnding.line2')}
          </p>
          <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/90 transition-opacity duration-[2000ms]" style={{ opacity: stage >= 4 ? 1 : 0 }}>
            {t('story.fakeEnding.line3')}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center w-full absolute inset-0">
          <p 
            className="text-xl md:text-2xl font-light tracking-[0.2em] text-white/90 transition-opacity duration-[2000ms] absolute"
            style={{ opacity: stage >= 6 && stage < 8 ? 1 : 0 }}
          >
            {t('story.fakeEnding.core1')}
          </p>
          
          {/* Shatter text */}
          {stage >= 8 && stage < 9 && (
            <p className="text-2xl md:text-3xl font-bold tracking-[0.3em] glitch-text absolute">
              {t('story.fakeEnding.core2')}
            </p>
          )}

          <p 
            className="text-lg md:text-xl font-mono tracking-[0.1em] text-red-400/90 transition-opacity duration-[2000ms] absolute"
            style={{ opacity: stage >= 9 && stage < 10 ? 1 : 0 }}
          >
            {t('story.fakeEnding.sub')}
          </p>
        </div>
      </div>

      <div 
        className="absolute inset-0 bg-black z-50 pointer-events-none transition-opacity duration-[3000ms]" 
        style={{ opacity: stage >= 10 ? 1 : 0 }}
      ></div>
    </div>
  );

  return createPortal(content, document.body);
};
