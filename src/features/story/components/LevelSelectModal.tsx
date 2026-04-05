import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useStoryStore } from '../../../store/useStoryStore';
import { useGameStore } from '../../../store/useGameStore';
import { useAudio } from '../../audio/hooks/useAudio';
import { useAudioStore, AVAILABLE_BGMS } from '../../../store/useAudioStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { FileData } from '../../../types/story';
import { FileViewer } from './FileViewer';
import { ChapterFiles } from './ChapterFiles';

import { ChapterList } from './ChapterList';
import { SystemBar } from './SystemBar';

export const LevelSelectModal: React.FC = () => {
  const { t } = useTranslation();
  const { isLevelSelectOpen, setLevelSelectOpen, isAssistMode } = useUIStore();
  const { storyJSON } = useStoryStore();
  const { completedLevels, readFiles, markFileRead } = useGameStore();
  const { playAudio, stopAudio, stopAll } = useAudio();
  const { isMuted, toggleMute, currentBgmId, unlockedBgms, setCurrentBgmId } = useAudioStore();
  const navigate = useNavigate();

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    storyJSON.routes[0]?.id || ''
  );
  
  // Track selected chapter to show its levels (desktop: right pane, mobile: full screen sub-view)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // BGM selection state
  const [showBgmMenu, setShowBgmMenu] = useState(false);
  const bgmMenuTimerRef = useRef<number | null>(null);
  const bgmMenuRef = useRef<HTMLDivElement>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Folder states (preserve opened file and scroll position per chapter)
  const [openFiles, setOpenFiles] = useState<Record<string, FileData | null>>({});
  const scrollPositions = useRef<Record<string, number>>({});

  const currentBgm = AVAILABLE_BGMS.find(b => b.id === currentBgmId) || AVAILABLE_BGMS[0];

  useEffect(() => {
    if (isLevelSelectOpen) {
      // 停止所有其他音乐，播放当前选中的 BGM
      stopAll();
      playAudio(currentBgm.path, true);
    } else {
      stopAudio(currentBgm.path);
    }
  }, [isLevelSelectOpen, currentBgm.path, playAudio, stopAudio, stopAll]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (bgmMenuRef.current && !bgmMenuRef.current.contains(event.target as Node)) {
        setShowBgmMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRoute = storyJSON.routes.find((r) => r.id === selectedRouteId);

  // 计算章节解锁状态 (Memoized)
  const unlockedChapters = useMemo(() => {
    if (!currentRoute) return [];
    const status: typeof currentRoute.chapters = [];
    currentRoute.chapters.forEach((chapter, chapterIndex) => {
      const previousChapter = chapterIndex > 0 ? currentRoute.chapters[chapterIndex - 1] : null;
      let isChapterUnlocked = true;
      if (previousChapter && !isAssistMode) {
        const prevChapterLevelIds = previousChapter.levels.map(l => l.id);
        const prevCompletedCount = prevChapterLevelIds.filter(id => completedLevels.includes(id)).length;
        const requiredCount = Math.ceil(prevChapterLevelIds.length * 0.8);
        isChapterUnlocked = prevCompletedCount >= requiredCount;
      }
      if (isChapterUnlocked || isAssistMode) {
        status.push(chapter);
      }
    });
    return status;
  }, [currentRoute, isAssistMode, completedLevels]);

  const currentFile = selectedChapterId ? openFiles[selectedChapterId] : null;

  // Set default selected chapter for desktop
  useEffect(() => {
    if (!isMobile && isLevelSelectOpen && !selectedChapterId && unlockedChapters.length > 0) {
      setTimeout(() => {
        setSelectedChapterId(unlockedChapters[unlockedChapters.length - 1].id);
      }, 0);
    }
  }, [isMobile, isLevelSelectOpen, unlockedChapters, selectedChapterId]);

  const closeFile = React.useCallback(() => {
    if (selectedChapterId) {
      setOpenFiles(prev => ({ ...prev, [selectedChapterId]: null }));
    }
  }, [selectedChapterId]);

  if (!isLevelSelectOpen) return null;

  const handleLevelClick = (chapterId: string, levelId: string, isLocked: boolean) => {
    if (isLocked && !isAssistMode) {
      useUIStore.getState().addToast(t('story.accessDenied'), 'error');
      return;
    }
    navigate(`/game/${selectedRouteId}/${chapterId}/${levelId}`);
    // 强制关闭所有面板
    setLevelSelectOpen(false);
  };

  const handleFileClick = (file: FileData, isLocked: boolean) => {
    if (isLocked && !isAssistMode) {
      useUIStore.getState().addToast(t('story.fileLocked'), 'error');
      return;
    }
    if (selectedChapterId) {
      setOpenFiles(prev => ({ ...prev, [selectedChapterId]: file }));
      markFileRead(file.id);
    }
  };

  const handleClose = () => {
    setLevelSelectOpen(false);
    // 只在有关闭文件动作时停止音乐
    stopAudio(currentBgm.path);
  };

  const selectedChapterData = currentRoute?.chapters.find(c => c.id === selectedChapterId);

  const handleBgmPressStart = () => {
    // 防止结局前调出菜单
    // 判断条件：如果当前没有解锁除默认BGM外的任何BGM，且也没有看完真结局（用 readFiles 判断最后的门）
    // 为了更严谨，我们可以直接用 unlockedBgms.length > 1 来判断，因为结局播放时一定会 unlockBgm
    if (unlockedBgms.length <= 1) return;
    
    bgmMenuTimerRef.current = window.setTimeout(() => {
      setShowBgmMenu(true);
    }, 500); // 500ms长按
  };

  const handleBgmPressEnd = () => {
    if (bgmMenuTimerRef.current) {
      clearTimeout(bgmMenuTimerRef.current);
      bgmMenuTimerRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col pointer-events-auto bg-[#0A0A0B] text-[#D4D4D6] animate-fade-in font-mono overflow-hidden">
      
      {/* 极简系统栏 (System Bar) */}
      <SystemBar
        isMobile={isMobile}
        selectedChapterId={selectedChapterId}
        selectedChapterData={selectedChapterData}
        currentRoute={currentRoute}
        storyJSON={storyJSON}
        selectedRouteId={selectedRouteId}
        isMuted={isMuted}
        showBgmMenu={showBgmMenu}
        currentBgmId={currentBgmId}
        unlockedBgms={unlockedBgms}
        isDropdownOpen={isDropdownOpen}
        dropdownRef={dropdownRef}
        bgmMenuRef={bgmMenuRef}
        onBack={() => {
          if (isMobile && selectedChapterId) {
            setSelectedChapterId(null);
          } else {
            handleClose();
          }
        }}
        onToggleMute={toggleMute}
        onBgmPressStart={handleBgmPressStart}
        onBgmPressEnd={handleBgmPressEnd}
        onSelectBgm={(id, path) => {
          stopAll();
          setCurrentBgmId(id);
          playAudio(path, true);
          setShowBgmMenu(false);
        }}
        onToggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
        onSelectRoute={(id) => {
          setSelectedRouteId(id);
          setSelectedChapterId(null);
          setIsDropdownOpen(false);
        }}
      />

      {/* 主工作区 (Main Workspace) */}
      <div className="flex-1 relative flex overflow-hidden min-h-0">
        
        {/* 左侧：目录树 (Directory Tree) - 桌面端常驻，移动端在无选择时显示 */}
        <ChapterList
          isMobile={isMobile}
          selectedChapterId={selectedChapterId}
          currentRouteId={currentRoute?.id}
          unlockedChapters={unlockedChapters}
          completedLevels={completedLevels}
          onSelectChapter={setSelectedChapterId}
        />

        {/* 右侧：文件列表 (File List) - 桌面端常驻，移动端在选中时显示 */}
        <div className={`
          ${isMobile ? (selectedChapterId ? 'w-full' : 'hidden') : 'flex-1 min-w-0'} 
          flex flex-col h-full bg-[#121214] relative
        `}>
          {currentFile ? (
            <FileViewer file={currentFile} onClose={closeFile} />
          ) : selectedChapterData && selectedRouteId ? (
            <ChapterFiles 
              routeId={selectedRouteId}
              chapter={selectedChapterData}
              completedLevels={completedLevels}
              readFiles={readFiles}
              isAssistMode={isAssistMode}
              onLevelClick={handleLevelClick}
              onFileClick={handleFileClick}
              getScrollTop={() => scrollPositions.current[selectedChapterData.id] || 0}
              setScrollTop={(scrollTop) => {
                scrollPositions.current[selectedChapterData.id] = scrollTop;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#606065] text-[0.85rem] uppercase tracking-widest">
              {t('tools.storyEditor.emptySelect')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
