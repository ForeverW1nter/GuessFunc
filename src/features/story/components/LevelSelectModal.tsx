import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useStoryStore } from '../../../store/useStoryStore';
import { useGameStore } from '../../../store/useGameStore';
import { useAudio } from '../../audio/hooks/useAudio';
import { useAudioStore } from '../../../store/useAudioStore';
import { useNavigate } from 'react-router-dom';
import { Folder, FolderOpen, File, Check, Lock, Terminal, ArrowLeft, Music } from 'lucide-react';
import gymnopedieAudio from '../../../assets/audio/Gymnopedie_1_Erik_Satie.mp3';
import type { FileData } from '../../../types/story';

// interface RouteData is implicitly assumed since we're not declaring one, but let's add shortTitle to the typings if possible
// The compiler error `Property 'shortTitle' does not exist on type 'RouteData'` implies a defined type exists somewhere or TS infers it.
// Let's add a safe fallback or assert type.

import { MarkdownPanel } from '../../ui/components/settings/MarkdownPanel';

export const LevelSelectModal: React.FC = () => {
  const { isLevelSelectOpen, setLevelSelectOpen } = useUIStore();
  const { storyJSON, isAssistMode } = useStoryStore();
  const { completedLevels } = useGameStore();
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

  // Set default selected chapter for desktop
  useEffect(() => {
    if (!isMobile && isLevelSelectOpen && !selectedChapterId && unlockedChapters.length > 0) {
      setTimeout(() => {
        setSelectedChapterId((unlockedChapters[unlockedChapters.length - 1] as unknown as { id: string }).id);
      }, 0);
    }
  }, [isMobile, isLevelSelectOpen, unlockedChapters, selectedChapterId]);

  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  if (!isLevelSelectOpen) return null;

  const handleLevelClick = (chapterId: string, levelId: string, isLocked: boolean) => {
    if (isLocked && !isAssistMode) {
      useUIStore.getState().addToast('Access Denied: Level is locked', 'error');
      return;
    }
    navigate(`/game/${selectedRouteId}/${chapterId}/${levelId}`);
    // 强制关闭所有面板
    setLevelSelectOpen(false);
  };

  const handleFileClick = (file: FileData, isLocked: boolean) => {
    if (isLocked && !isAssistMode) {
      useUIStore.getState().addToast('Access Denied: File is locked', 'error');
      return;
    }
    setSelectedFile(file);
    // Play music when reading story files if they have specific titles
    if (file.title.includes('Story') || file.title.includes('story') || file.extension === 'md' || file.title.includes('记录')) {
      playAudio(gymnopedieAudio, true);
    }
  };

  const handleClose = () => {
    setLevelSelectOpen(false);
    setSelectedFile(null);
    stopAudio(gymnopedieAudio);
  };

  const closeFile = () => {
    setSelectedFile(null);
    stopAudio(gymnopedieAudio);
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
            <span className="text-[0.85rem] uppercase tracking-wider">{isMobile && selectedChapterId ? 'BACK' : 'SYSTEM.EXIT'}</span>
          </button>
        </div>
        
        <div className="flex items-center">
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
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* 左侧：目录树 (Directory Tree) - 桌面端常驻，移动端在无选择时显示 */}
        <div className={`
          ${isMobile ? (selectedChapterId ? 'hidden' : 'w-full') : 'w-[280px] lg:w-[320px] border-r border-[#2A2A2E]'} 
          flex flex-col h-full bg-[#0A0A0B] overflow-y-auto custom-scrollbar
        `}>
          <div className="px-[16px] py-[12px] text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase sticky top-0 bg-[#0A0A0B]/90 backdrop-blur z-10">
            Explorer / {currentRoute?.id}
          </div>
          
          <div className="flex flex-col py-[8px]">
            {unlockedChapters.length === 0 && (
              <div className="px-[16px] py-[20px] text-[#606065] text-[0.8rem]">No directories found.</div>
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
          ${isMobile ? (selectedChapterId ? 'w-full' : 'hidden') : 'flex-1'} 
          flex flex-col h-full bg-[#121214] relative
        `}>
          {selectedFile ? (
            <div className="w-full h-full flex flex-col bg-modal-bg text-modal-text">
              <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0">
                <div className="flex items-center gap-[12px] min-w-0">
                  <button
                    onClick={closeFile}
                    className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-white transition-colors shrink-0"
                  >
                    <ArrowLeft size={16} strokeWidth={2} />
                    <span className="text-[0.85rem] uppercase tracking-wider">BACK</span>
                  </button>
                  <h2 className="m-0 text-[1.1rem] font-semibold text-app-text ml-4 truncate">
                    {selectedFile.title}.{selectedFile.extension}
                  </h2>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={toggleMute}
                    className="bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center outline-none shrink-0"
                    title={isMuted ? "开启音乐" : "关闭音乐"}
                  >
                    <div className="relative w-[36px] h-[36px] rounded-full flex items-center justify-center bg-card-bg shadow-sm transition-all duration-300">
                      <div className={`absolute inset-0 rounded-full border-[3px] border-[#333] box-border transition-opacity duration-300 ${
                        !isMuted ? 'opacity-100 animate-[spin_3s_linear_infinite]' : 'opacity-20 animate-[spin_3s_linear_infinite]'
                      } bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.1)_50%,transparent_60%),repeating-radial-gradient(#222,#222_2px,#333_3px,#333_4px)]`} 
                      style={{ animationPlayState: !isMuted ? 'running' : 'paused' }} />
                      <Music size={16} className={`z-10 transition-all duration-300 flex items-center justify-center ${
                        !isMuted ? 'opacity-100 text-app-primary animate-[spin_3s_linear_infinite]' : 'opacity-50 text-app-text animate-[spin_3s_linear_infinite]'
                      }`} style={{ animationPlayState: !isMuted ? 'running' : 'paused' }} />
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-modal-bg text-app-text">
                <MarkdownPanel mdText={selectedFile.content} />
              </div>
            </div>
          ) : selectedChapterData ? (
            <div className="w-full h-full flex flex-col">
              {/* Header */}
              <div className="px-[24px] md:px-[40px] py-[24px] md:py-[32px] border-b border-[#2A2A2E] bg-[#0A0A0B]">
                <h2 className="text-[1.2rem] md:text-[1.8rem] text-white tracking-widest uppercase mb-[8px] flex items-center gap-[12px]">
                  <FolderOpen className="text-app-primary w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
                  {selectedChapterData.title}
                </h2>
                <div className="text-[0.8rem] text-[#606065] font-mono">
                  Path: ~/{currentRoute?.id}/{selectedChapterData.id}
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-[16px] px-[24px] md:px-[40px] py-[12px] border-b border-[#2A2A2E] text-[0.7rem] text-[#606065] uppercase tracking-widest sticky top-0 bg-[#121214] z-10">
                <div className="w-[24px] text-center">STS</div>
                <div>Name</div>
                <div className="text-right">Type</div>
              </div>

              {/* Files */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-[60px]">
                {/* 渲染关卡 (.exe) */}
                {selectedChapterData.levels.map((level, idx) => {
                  const isCompleted = completedLevels.includes(level.id);
                  const previousLevel = idx > 0 ? selectedChapterData.levels[idx - 1] : null;
                  const isLocked = previousLevel ? (!completedLevels.includes(previousLevel.id) && !isAssistMode) : false;

                  return (
                    <div
                      key={level.id}
                      onClick={() => handleLevelClick(selectedChapterData.id, level.id, isLocked)}
                      className={`
                        grid grid-cols-[auto_1fr_auto] items-center gap-[16px] px-[24px] md:px-[40px] py-[14px] md:py-[16px] border-b border-[#1A1A1D] transition-colors
                        ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1A1A1D]'}
                      `}
                    >
                      {/* Status Icon */}
                      <div className="w-[24px] flex justify-center">
                        {isLocked ? (
                          <Lock size={14} strokeWidth={2} className="text-[#606065]" />
                        ) : isCompleted ? (
                          <Check size={14} strokeWidth={3} className="text-app-success" />
                        ) : (
                          <div className="w-[6px] h-[6px] rounded-full bg-app-primary shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.8)] animate-pulse" />
                        )}
                      </div>

                      {/* File Name */}
                      <div className="flex items-center gap-[12px] overflow-hidden">
                        <span className={`text-[0.85rem] md:text-[0.95rem] truncate ${isLocked ? 'text-[#606065]' : isCompleted ? 'text-[#A0A0A5]' : 'text-white font-medium'}`}>
                          {level.title}.exe
                        </span>
                      </div>
                      
                      {/* File Type/Tags */}
                      <div className="flex items-center gap-[8px] justify-end">
                        {level.type === 'boss' && (
                          <span className="px-[6px] py-[2px] bg-[rgba(239,68,68,0.1)] text-[#ef4444] text-[0.65rem] border border-[rgba(239,68,68,0.2)] rounded-[2px]">
                            SYS.CRITICAL
                          </span>
                        )}
                        <span className="text-[0.75rem] text-[#606065] hidden sm:block">
                          {isLocked ? 'ENCRYPTED' : 'EXECUTABLE'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 渲染掉落文件 */}
                {selectedChapterData.files?.map((file) => {
                  const isLocked = file.unlockConditions ? !file.unlockConditions.every(id => completedLevels.includes(id)) : false;
                  
                  // 如果未解锁且不是辅助模式，我们可以选择隐藏它，或者显示为加密文件
                  // 这里选择显示为加密文件，增加探索感
                  
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file, isLocked)}
                      className={`
                        grid grid-cols-[auto_1fr_auto] items-center gap-[16px] px-[24px] md:px-[40px] py-[14px] md:py-[16px] border-b border-[#1A1A1D] transition-colors
                        ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1A1A1D]'}
                      `}
                    >
                      {/* Status Icon */}
                      <div className="w-[24px] flex justify-center">
                        {isLocked ? (
                          <Lock size={14} strokeWidth={2} className="text-[#606065]" />
                        ) : (
                          <File size={14} strokeWidth={2} className="text-[#A0A0A5]" />
                        )}
                      </div>

                      {/* File Name */}
                      <div className="flex items-center gap-[12px] overflow-hidden">
                        <span className={`text-[0.85rem] md:text-[0.95rem] truncate ${isLocked ? 'text-[#606065]' : 'text-[#D4D4D6]'}`}>
                          {isLocked ? '???' : file.title}.{file.extension}
                        </span>
                      </div>
                      
                      {/* File Type/Tags */}
                      <div className="flex items-center gap-[8px] justify-end">
                        <span className="text-[0.75rem] text-[#606065] hidden sm:block">
                          {isLocked ? 'LOCKED' : 'DOCUMENT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#606065] text-[0.85rem] uppercase tracking-widest">
              No directory selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
