import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '../../../store/useUIStore';
import { useGameStore } from '../../../store/useGameStore';
import { useStoryStore } from '../../../store/useStoryStore';
import { Lightbulb, Bot } from 'lucide-react';
import { TipsModal } from './TipsModal';

export const AiChatButton: React.FC = () => {
  const { 
    setAiChatOpen, 
    isSettingsOpen, 
    isLevelSelectOpen, 
    isRandomChallengeOpen,
    isAiChatOpen
  } = useUIStore();
  const { gameMode } = useGameStore();
  const currentRoute = useGameStore((state) => state.currentRoute);
  const currentChapter = useGameStore((state) => state.currentChapter);
  const currentLevelId = useGameStore((state) => state.currentLevel);
  const getLevel = useStoryStore((state) => state.getLevel);
  const location = useLocation();

  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState<string | null>(null);

  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 80 : -30, 
    y: typeof window !== 'undefined' ? window.innerHeight - 80 : -30 
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMovedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const newX = Math.min(Math.max(0, prev.x), window.innerWidth - 50);
        const newY = Math.min(Math.max(0, prev.y), window.innerHeight - 50);
        return { x: newX, y: newY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    isMovedRef.current = false;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    if (buttonRef.current) {
      buttonRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // 标记为已移动
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // 限制在屏幕内
    const boundedX = Math.min(Math.max(0, newX), window.innerWidth - 50);
    const boundedY = Math.min(Math.max(0, newY), window.innerHeight - 50);
    
    setPosition({ x: boundedX, y: boundedY });
    isMovedRef.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (buttonRef.current) {
      buttonRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleClick = () => {
    if (!isMovedRef.current) {
      if (gameMode === 'story') {
        if (currentRoute && currentChapter && currentLevelId) {
          const levelData = getLevel(currentRoute, currentChapter, currentLevelId);
          if (levelData?.tip) {
            setCurrentTip(levelData.tip);
            setIsTipsOpen(true);
          } else {
            useUIStore.getState().addToast('本关卡暂无提示。', 'info');
          }
        }
      } else {
        setAiChatOpen(true);
      }
    }
  };

  // Hide the button if any full-screen or major modal is open (except for TipsModal which belongs to this button)
  const isAnyModalOpen = isSettingsOpen || isLevelSelectOpen || isRandomChallengeOpen || isAiChatOpen;

  if (gameMode === 'idle' || location.pathname.includes('/create') || isAnyModalOpen) {
    return null;
  }

  const isStoryMode = gameMode === 'story';

  return (
    <>
      <button 
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
        className={`fixed w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(var(--primary-color-rgb),0.3)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(var(--primary-color-rgb),0.3)] transition-transform duration-200 z-[1000] select-none touch-none bg-app-primary text-white hover:brightness-110 ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-pointer'}`}
        title={isStoryMode ? "关卡提示" : "AI 对话助手"}
      >
        {isStoryMode ? (
          <Lightbulb size={24} strokeWidth={2} />
        ) : (
          <Bot size={24} strokeWidth={2} />
        )}
      </button>

      {/* 关卡提示弹窗 */}
      <TipsModal 
        isOpen={isTipsOpen} 
        onClose={() => setIsTipsOpen(false)} 
        tipContent={currentTip} 
      />
    </>
  );
};
