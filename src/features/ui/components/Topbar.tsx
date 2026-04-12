import { useTranslation } from 'react-i18next';
import React from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useGameStore } from '../../../store/useGameStore';
import { useStoryStore } from '../../../store/useStoryStore';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../../utils/debug/logger';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';
import { Menu, SkipForward, Check, Terminal } from 'lucide-react';
import { generateFunctionByDifficulty } from '../../../utils/mathEngine';

export const Topbar: React.FC = () => {
  const { t } = useTranslation();
  const { toggleSidebar, toggleSidebarCollapse, addToast } = useUIStore();
  const { isLevelCleared, nextLevel, evaluateInput, currentLevel, currentChapter, currentRoute } = useGameStore();
  const { getLevel } = useStoryStore();
  const navigate = useNavigate();

  // Get current level title if in story mode
  const currentLevelData = (currentRoute && currentChapter && currentLevel) 
    ? getLevel(currentRoute, currentChapter, currentLevel) 
    : null;
  const levelDisplayTitle = currentLevelData ? `${currentLevelData.title}.exe` : (currentLevel ? `${currentLevel}.exe` : '');

  const handleMenuClick = () => {
    if (window.innerWidth <= 768) {
      toggleSidebar();
    } else {
      toggleSidebarCollapse();
    }
  };

  const handleVerify = async () => {
    logger.log(t('game.verifyTrigger'));
    const result = await evaluateInput();
    if (!result.isMatch) {
      logger.warn(t('game.verifyFailed', { reason: result.reason }));
      addToast(t('game.wrongAnswer'), 'error');
    } else if (result.isMatch) {
      logger.log(t('game.verifyPassedLog'));
      addToast(t('game.verifyPassedToast'), 'success');
      
      // 撒花特效
      import('../../../utils/confettiHelper').then(({ fireConfetti }) => {
        fireConfetti();
      }).catch((e) => {
        logger.warn(SYSTEM_LOGS.ERROR_LOAD_CONFETTI, e);
      });
    }
  };

  const handleNextLevel = () => {
    nextLevel();
    
    const { gameMode, randomDifficulty, randomWithParams, setTargetFunction, setRandomConfig } = useGameStore.getState();

    if (gameMode === 'random') {
      generateFunctionByDifficulty({ targetDifficulty: randomDifficulty, withParams: randomWithParams }).then((result) => {
        setTargetFunction(result.target, result.params, 'random');
        setRandomConfig(randomDifficulty, randomWithParams);
        
        const encodedLevel = btoa(encodeURIComponent(JSON.stringify({ 
          t: result.target, 
          p: result.params, 
          d: randomDifficulty, 
          wp: randomWithParams
        })));
        navigate(`/game/random/1/${encodedLevel}`);
      });
      return;
    }

    if (!currentRoute || !currentChapter || !currentLevel) {
      navigate('/');
      return;
    }

    const route = useStoryStore.getState().getRoute(currentRoute);
    if (!route) {
      navigate('/');
      return;
    }

    const chapterIndex = route.chapters.findIndex(c => c.id === currentChapter);
    const chapter = route.chapters[chapterIndex];
    if (!chapter) {
      navigate('/');
      return;
    }

    const currentIndex = chapter.levels.findIndex(l => l.id === currentLevel);
    if (currentIndex >= 0 && currentIndex < chapter.levels.length - 1) {
      const nextLevelId = chapter.levels[currentIndex + 1].id;
      navigate(`/game/${currentRoute}/${currentChapter}/${nextLevelId}`);
    } else {
      addToast(t('game.chapterEnded'), 'success');
      // Try to go to the next chapter's first level
      if (chapterIndex >= 0 && chapterIndex < route.chapters.length - 1) {
        const nextChapter = route.chapters[chapterIndex + 1];
        if (nextChapter.levels.length > 0) {
          navigate(`/game/${currentRoute}/${nextChapter.id}/${nextChapter.levels[0].id}`);
          return;
        }
      }
      // If no next chapter, open LevelSelectModal by toggling a state if we have one, or just go to random mode
      navigate('/game/random/1/1');
    }
  };

  return (
    <header className="h-[64px] bg-background border-b border-border flex justify-between items-center px-[12px] md:px-[24px] shrink-0 z-10 transition-all">
      <div className="flex items-center gap-[16px]">
        <button 
          onClick={handleMenuClick}
          className="bg-transparent border-none text-foreground cursor-pointer p-[8px] rounded-[8px] flex items-center justify-center opacity-70 hover:bg-muted hover:opacity-100 transition-all duration-200 md:flex"
        >
          <Menu size={24} strokeWidth={2} />
        </button>
        
        {levelDisplayTitle && (
          <div className="flex items-center gap-[8px] bg-card border border-border px-[12px] py-[6px] rounded-[6px] opacity-90">
            <Terminal size={16} className="text-primary" />
            <h2 className="m-0 text-[0.9rem] md:text-[0.95rem] font-mono text-foreground tracking-wider hidden sm:block">
              {levelDisplayTitle}
            </h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-[16px]">
        {isLevelCleared ? (
          <button 
            onClick={handleNextLevel}
            className="inline-flex items-center justify-center gap-[6px] sm:gap-[8px] px-[16px] sm:px-[20px] py-[8px] sm:py-[10px] rounded-[12px] font-semibold text-[0.9rem] sm:text-[0.95rem] tracking-[0.5px] transition-all bg-primary text-primary-foreground border-none shadow-btn hover:brightness-110 hover:-translate-y-[2px] hover:shadow-btn-hover outline-none"
          >
            <span className="hidden sm:inline">{t('game.nextLevelBtn')}</span>
            <SkipForward size={16} strokeWidth={2} />
          </button>
        ) : (
          <button 
            data-testid="verify-btn"
            onClick={handleVerify}
            className="inline-flex items-center justify-center gap-[6px] sm:gap-[8px] px-[16px] sm:px-[20px] py-[8px] sm:py-[10px] rounded-[12px] font-semibold text-[0.9rem] sm:text-[0.95rem] tracking-[0.5px] transition-all bg-primary text-primary-foreground border-none shadow-btn hover:brightness-110 hover:-translate-y-[2px] hover:shadow-btn-hover outline-none"
          >
            <Check size={16} strokeWidth={2} />
            <span className="hidden sm:inline">{t('game.verifyBtn')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
