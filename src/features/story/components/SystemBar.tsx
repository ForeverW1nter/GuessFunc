import React from 'react';
import { ArrowLeft, Terminal, Music, Check as CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_BGMS } from '../../../store/useAudioStore';

interface SystemBarProps {
  isMobile: boolean;
  selectedChapterId: string | null;
  selectedChapterData: { id: string } | undefined;
  currentRoute: { id: string; title: string } | undefined;
  storyJSON: { routes: { id: string; title: string }[] };
  selectedRouteId: string;
  isMuted: boolean;
  showBgmMenu: boolean;
  currentBgmId: string;
  isDropdownOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  bgmMenuRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onToggleMute: () => void;
  onBgmPressStart: () => void;
  onBgmPressEnd: () => void;
  onSelectBgm: (id: string, path: string) => void;
  onToggleDropdown: () => void;
  onSelectRoute: (id: string) => void;
}

export const SystemBar: React.FC<SystemBarProps> = ({
  isMobile,
  selectedChapterId,
  selectedChapterData,
  currentRoute,
  storyJSON,
  selectedRouteId,
  isMuted,
  showBgmMenu,
  currentBgmId,
  isDropdownOpen,
  dropdownRef,
  bgmMenuRef,
  onBack,
  onToggleMute,
  onBgmPressStart,
  onBgmPressEnd,
  onSelectBgm,
  onToggleDropdown,
  onSelectRoute
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative z-20 flex items-center justify-between h-[48px] px-[16px] shrink-0 border-b border-[#2A2A2E] bg-[#121214]">
      <div className="flex items-center gap-[16px]">
        <button
          onClick={onBack}
          className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span className="text-[0.85rem] uppercase tracking-wider">{isMobile && selectedChapterId ? t('tools.storyEditor.back') : t('tools.storyEditor.systemExit')}</span>
        </button>
      </div>
      
      <div className="flex items-center gap-[16px]">
        <div className="relative" ref={bgmMenuRef}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (showBgmMenu) return;
              onToggleMute();
            }}
            onPointerDown={() => {
              // 无论是鼠标还是触摸，只要按下就开始计时
              // 对于移动端，如果只是点击，通常会触发 pointerdown -> pointerup -> click
              onBgmPressStart();
            }}
            onPointerUp={() => {
              // 无论是鼠标还是触摸，松开时停止计时
              onBgmPressEnd();
            }}
            onPointerLeave={onBgmPressEnd}
            onPointerCancel={onBgmPressEnd}
            onContextMenu={(e) => {
              // 防止移动端长按弹出系统菜单
              e.preventDefault();
            }}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center outline-none shrink-0 md:mr-[16px] touch-none select-none relative z-10"
            title={isMuted ? t('story.unmute') : t('story.mute')}
          >
            <div className="relative w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[#1A1A1D] border border-[#2A2A2E] shadow-sm transition-all duration-300">
              <div className={`absolute inset-0 rounded-full border-[2px] border-[#333] box-border transition-opacity duration-300 animate-[spin_3s_linear_infinite] ${
                !isMuted ? 'opacity-100' : 'opacity-20'
              } bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%),repeating-radial-gradient(#222,#222_1px,#2a2a2a_2px,#2a2a2a_3px)]`} 
                style={{ animationPlayState: isMuted ? 'paused' : 'running' }}
              />
              <Music size={12} className={`z-10 transition-all duration-300 flex items-center justify-center animate-[spin_3s_linear_infinite] ${
                !isMuted ? 'opacity-100 text-app-primary' : 'opacity-50 text-[#A0A0A5]'
              }`} 
                style={{ animationPlayState: isMuted ? 'paused' : 'running' }}
              />
            </div>
          </button>
          
          {showBgmMenu && (
            <div className="absolute top-[40px] right-0 md:right-[16px] w-[200px] bg-[#1A1A1D] border border-[#2A2A2E] rounded-[8px] shadow-lg py-[8px] z-50 animate-fade-in">
              <div className="px-[16px] py-[8px] text-[0.7rem] text-[#606065] tracking-[0.2em] uppercase border-b border-[#2A2A2E] mb-[4px]">
                {t('story.bgmSelect', 'BGM SELECT')}
              </div>
              {AVAILABLE_BGMS.map(bgm => {
                const isSelected = currentBgmId === bgm.id;
                
                return (
                  <button
                    key={bgm.id}
                    onClick={() => {
                      if (!isSelected) {
                        onSelectBgm(bgm.id, bgm.path);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-[16px] py-[10px] text-left transition-colors ${
                      isSelected ? 'text-app-primary bg-[rgba(var(--primary-color-rgb),0.1)]' : 
                      'text-[#A0A0A5] hover:text-white hover:bg-[#2A2A2E]'
                    }`}
                  >
                    <span className="text-[0.85rem] truncate">{bgm.name}</span>
                    {isSelected && <CheckIcon size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

         {isMobile && selectedChapterId ? (
           <span className="text-[0.85rem] text-[#808085] tracking-widest uppercase">
             ~/{selectedChapterData?.id}
           </span>
         ) : (
           <div className="relative inline-block" ref={dropdownRef}>
             <div 
               className={`flex items-center gap-[8px] px-[12px] py-[4px] rounded-[4px] cursor-pointer transition-colors ${isDropdownOpen ? 'bg-[#2A2A2E] text-white' : 'hover:bg-[#1A1A1D] text-[#A0A0A5]'}`}
               onClick={onToggleDropdown}
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
                   onClick={() => onSelectRoute(route.id)}
                 >
                   <div className="text-[0.8rem] uppercase tracking-widest mb-[2px]">{route.title}</div>
                 </div>
               ))}
             </div>
           </div>
         )}
      </div>
    </div>
  );
};
