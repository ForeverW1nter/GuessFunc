import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useStoryStore } from '../../../store/useStoryStore';
import { useGameStore } from '../../../store/useGameStore';
import { useAudio } from '../../audio/hooks/useAudio';
import { useAudioStore } from '../../../store/useAudioStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Folder, FolderOpen, Check, Terminal, ArrowLeft, Music } from 'lucide-react';
import gymnopedieAudio from '../../../assets/audio/Gymnopedie_1_Erik_Satie.mp3';
import type { FileData } from '../../../types/story';
import { FileViewer } from './FileViewer';
import { ChapterFiles } from './ChapterFiles';

export const LevelSelectModal: React.FC = () => {
  const { t } = useTranslation();
  const { isLevelSelectOpen, setLevelSelectOpen, isAssistMode } = useUIStore();
  const { storyJSON } = useStoryStore();
  const { completedLevels, readFiles, markFileRead } = useGameStore();
  const { playAudio, stopAudio } = useAudio();
  const { isMuted, toggleMute } = useAudioStore();
  const navigate = useNavigate();

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    storyJSON.routes[0]?.id || ''
  );
  
  // Track selected chapter to show its levels (desktop: right pane, mobile: full screen sub-view)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Folder states (preserve opened file and scroll position per chapter)
  const [openFiles, setOpenFiles] = useState<Record<string, FileData | null>>({});
  const scrollPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    if (isLevelSelectOpen) {
      playAudio(gymnopedieAudio, true);
    } else {
      stopAudio(gymnopedieAudio);
    }
  }, [isLevelSelectOpen, playAudio, stopAudio]);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRoute = storyJSON.routes.find((r) => r.id === selectedRouteId);

  // 计算章节解锁状态 (Memoized)
  const unlockedChapters = useMemo(() => {
    if (!currentRoute) return [];
    const status: Record<string, unknown>[] = [];
    currentRoute.chapters.forEach((chapter, chapterIndex) => {
      const previousChapter = chapterIndex > 0 ? currentRoute.chapters[chapterIndex - 1] : null;
      let isChapterUnlocked = true;
      if (previousChapter && !isAssistMode) {
        const prevChapterLevelIds = previousChapter.levels.map(l => l.id);
        isChapterUnlocked = prevChapterLevelIds.every(id => completedLevels.includes(id));
      }
      if (isChapterUnlocked || isAssistMode) {
        status.push(chapter as unknown as Record<string, unknown>);
      }
    });
    return status;
  }, [currentRoute, isAssistMode, completedLevels]);

  const currentFile = selectedChapterId ? openFiles[selectedChapterId] : null;

  // Set default selected chapter for desktop
  useEffect(() => {
    if (!isMobile && isLevelSelectOpen && !selectedChapterId && unlockedChapters.length > 0) {
      setTimeout(() => {
        setSelectedChapterId((unlockedChapters[unlockedChapters.length - 1] as unknown as { id: string }).id);
      }, 0);
    }
  }, [isMobile, isLevelSelectOpen, unlockedChapters, selectedChapterId]);

  if (!isLevelSelectOpen) return null;

  const handleLevelClick = (chapterId: string, levelId: string, isLocked: boolean) => {
    if (isLocked && !isAssistMode) {
      useUIStore.getState().addToast(t('story.accessDenied', 'Access Denied: Level is locked'), 'error');
      return;
    }
    navigate(`/game/${selectedRouteId}/${chapterId}/${levelId}`);
    // 强制关闭所有面板
    setLevelSelectOpen(false);
  };

  const handleFileClick = (file: FileData, isLocked: boolean) => {
    if (isLocked && !isAssistMode) {
      useUIStore.getState().addToast(t('story.fileLocked', 'Access Denied: File is locked'), 'error');
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
    stopAudio(gymnopedieAudio);
  };

  const closeFile = () => {
    if (selectedChapterId) {
      setOpenFiles(prev => ({ ...prev, [selectedChapterId]: null }));
    }
  };

  const selectedChapterData = currentRoute?.chapters.find(c => c.id === selectedChapterId);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col pointer-events-auto bg-[#0A0A0B] text-[#D4D4D6] animate-fade-in font-mono overflow-hidden">
      
      {/* 极简系统栏 (System Bar) */}
      <div className="relative z-20 flex items-center justify-between h-[48px] px-[16px] shrink-0 border-b border-[#2A2A2E] bg-[#121214]">
        <div className="flex items-center gap-[16px]">
          <button
            onClick={() => {
              if (isMobile && selectedChapterId) {
                setSelectedChapterId(null);
              } else {
                handleClose();
              }
            }}
            className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span className="text-[0.85rem] uppercase tracking-wider">{isMobile && selectedChapterId ? t('tools.storyEditor.back', 'BACK') : t('tools.storyEditor.systemExit', 'SYSTEM.EXIT')}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={toggleMute}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center outline-none shrink-0 md:mr-[16px]"
            title={isMuted ? t('story.unmute', "开启音乐") : t('story.mute', "关闭音乐")}
          >
            <div className="relative w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[#1A1A1D] border border-[#2A2A2E] shadow-sm transition-all duration-300">
              <div className={`absolute inset-0 rounded-full border-[2px] border-[#333] box-border transition-opacity duration-300 ${
                !isMuted ? 'opacity-100 animate-[spin_3s_linear_infinite]' : 'opacity-20 animate-[spin_3s_linear_infinite]'
              } bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%),repeating-radial-gradient(#222,#222_1px,#2a2a2a_2px,#2a2a2a_3px)]`} 
              style={{ animationPlayState: !isMuted ? 'running' : 'paused' }} />
              <Music size={12} className={`z-10 transition-all duration-300 flex items-center justify-center ${
                !isMuted ? 'opacity-100 text-app-primary animate-[spin_3s_linear_infinite]' : 'opacity-50 text-[#A0A0A5] animate-[spin_3s_linear_infinite]'
              }`} style={{ animationPlayState: !isMuted ? 'running' : 'paused' }} />
            </div>
          </button>

           {isMobile && selectedChapterId ? (
             <span className="text-[0.85rem] text-[#808085] tracking-widest uppercase">
               ~/{selectedChapterData?.id}
             </span>
           ) : (
             <div className="relative inline-block" ref={dropdownRef}>
               <div 
                 className={`flex items-center gap-[8px] px-[12px] py-[4px] rounded-[4px] cursor-pointer transition-colors ${isDropdownOpen ? 'bg-[#2A2A2E] text-white' : 'hover:bg-[#1A1A1D] text-[#A0A0A5]'}`}
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               >
                 <Terminal size={18} strokeWidth={2} className="opacity-70 shrink-0" />
                 <span className="text-[0.85rem] tracking-widest uppercase select-none truncate max-w-[150px] sm:max-w-none">
                   {isMobile ? ((currentRoute as unknown as { shortTitle?: string })?.shortTitle || currentRoute?.title || 'ROOT') : (currentRoute?.title || 'ROOT')}
                 </span>
               </div>

               {/* Dropdown Menu */}
               <div 
                 className={`absolute top-[calc(100%+4px)] right-0 w-[200px] bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] shadow-2xl overflow-hidden z-[100] transition-all duration-200 origin-top-right ${isDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}
               >
                 {storyJSON.routes.map((route) => (
                   <div 
                     key={route.id}
                     className={`px-[16px] py-[10px] cursor-pointer transition-colors ${selectedRouteId === route.id ? 'bg-[rgba(var(--primary-color-rgb),0.15)] text-app-primary border-l-[2px] border-app-primary' : 'text-[#A0A0A5] hover:bg-[#2A2A2E] hover:text-white border-l-[2px] border-transparent'}`}
                     onClick={() => {
                       setSelectedRouteId(route.id);
                       setSelectedChapterId(null);
                       setIsDropdownOpen(false);
                     }}
                   >
                     <div className="text-[0.8rem] uppercase tracking-widest mb-[2px]">{route.title}</div>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>

      {/* 主工作区 (Main Workspace) */}
      <div className="flex-1 relative flex overflow-hidden min-h-0">
        
        {/* 左侧：目录树 (Directory Tree) - 桌面端常驻，移动端在无选择时显示 */}
        <div className={`
          ${isMobile ? (selectedChapterId ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-[#2A2A2E]'} 
          flex flex-col h-full bg-[#0A0A0B] overflow-y-auto custom-scrollbar shrink-0
        `}>
          <div className="px-[16px] py-[12px] text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase sticky top-0 bg-[#0A0A0B]/90 backdrop-blur z-10">
            {t('tools.storyEditor.explorer', 'Explorer')} / {currentRoute?.id}
          </div>
          
          <div className="flex flex-col py-[8px]">
            {unlockedChapters.length === 0 && (
              <div className="px-[16px] py-[20px] text-[#606065] text-[0.8rem]">{t('tools.storyEditor.noDirs', 'No directories found.')}</div>
            )}
            
            {unlockedChapters.map((chapterObj) => {
              const chapter = chapterObj as unknown as { id: string; title: string; levels: { id: string }[] };
              const chapterLevelIds = chapter.levels.map(l => l.id);
              const completedCount = chapterLevelIds.filter((id: string) => completedLevels.includes(id)).length;
              const totalCount = chapterLevelIds.length;
              const isAllCompleted = completedCount === totalCount && totalCount > 0;
              const isSelected = selectedChapterId === chapter.id;

              return (
                <div 
                    key={chapter.id}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className={`
                    group relative flex items-center justify-between px-[16px] py-[10px] cursor-pointer transition-colors
                    ${isSelected ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' : 'text-[#A0A0A5] hover:bg-[#1A1A1D] hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-[12px] overflow-hidden">
                    {isSelected ? (
                      <FolderOpen size={16} className="shrink-0 text-app-primary" />
                    ) : (
                      <Folder size={16} className="shrink-0 text-[#606065] group-hover:text-[#A0A0A5]" />
                    )}
                    <span className="text-[0.85rem] truncate">{chapter.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-[8px] shrink-0">
                    <span className={`text-[0.7rem] ${isAllCompleted ? 'text-app-success' : 'text-[#606065]'}`}>
                      {completedCount}/{totalCount}
                    </span>
                    {isAllCompleted && <Check size={14} strokeWidth={3} className="text-app-success" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
              chapter={selectedChapterData as any} // eslint-disable-line @typescript-eslint/no-explicit-any
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
              {t('tools.storyEditor.emptySelect', 'No directory selected')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
