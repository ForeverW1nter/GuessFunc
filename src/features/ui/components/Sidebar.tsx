import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../store/useGameStore';
import { ConfirmModal } from './ConfirmModal';
import { extractUsedParams } from '../../../utils/mathEngine';
import { cn } from '../../../utils/cn';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  BookOpen, 
  Dices, 
  PenTool, 
  Share2, 
  Settings, 
  Activity,
  X
} from 'lucide-react';

interface NavItemProps {
  item: {
    id: string;
    icon: React.ElementType | React.FC<{ className?: string }>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    statusIcon?: React.ReactNode;
  };
  isSidebarCollapsed: boolean;
  isActive?: boolean;
}

const NavItem = ({ item, isSidebarCollapsed, isActive }: NavItemProps) => (
  <button
    id={`${item.id}-btn`}
    key={item.id}
    onClick={item.onClick}
    disabled={item.disabled}
    title={isSidebarCollapsed ? item.label : undefined}
    className={cn(
      "w-full flex items-center justify-between text-app-text rounded-[8px] transition-all duration-200 group border-none text-[0.95rem] font-medium",
      isSidebarCollapsed ? "md:justify-center md:p-[12px] px-[12px] py-[10px]" : "px-[12px] py-[10px]",
      isActive ? "bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary font-semibold" : "bg-transparent hover:bg-[rgba(128,128,128,0.08)]",
      item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
    )}
  >
    <div className="flex items-center gap-[12px]">
      <item.icon 
        size={18} 
        strokeWidth={2} 
        className={cn(
          "transition-all duration-200",
          isActive ? "text-app-primary opacity-100" : "opacity-70 group-hover:opacity-100",
          isSidebarCollapsed && "md:m-0"
        )} 
      />
      <span className={cn("whitespace-nowrap transition-opacity duration-200 opacity-100", isSidebarCollapsed && "md:hidden")}>
        {item.label}
      </span>
    </div>
    {item.statusIcon && (
      <div className={cn("flex items-center", isSidebarCollapsed && "md:hidden")}>
        {item.statusIcon}
      </div>
    )}
  </button>
);

const NavGroupTitle = ({ title, isSidebarCollapsed }: { title: string, isSidebarCollapsed: boolean }) => {
  return (
    <div className={cn(
      "px-[12px] text-[0.75rem] font-semibold text-app-text uppercase tracking-[1px] mb-[8px] opacity-50 whitespace-nowrap transition-opacity duration-200",
      isSidebarCollapsed && "md:hidden"
    )}>
      {title}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { isSidebarOpen, setSidebarOpen, isSidebarCollapsed, setSettingsOpen, setLevelSelectOpen, setRandomChallengeOpen } = useUIStore();
  const navigate = useNavigate();

  const handleRandomChallenge = () => {
    setRandomChallengeOpen(true);
    setSidebarOpen(false);
  };

  const handleStoryMode = () => {
    // 强制每次点击都检查状态机，并主动同步一次路由，避免灰屏
    const { gameMode, currentRoute, currentChapter, currentLevel } = useGameStore.getState();
    if (gameMode !== 'story' || !currentRoute || !currentChapter || !currentLevel) {
      navigate('/game/seeYouTomorrow/ch0/1', { replace: true });
    } else {
      // 即使在故事模式，也要确保路由和状态机一致
      navigate(`/game/${currentRoute}/${currentChapter}/${currentLevel}`, { replace: true });
    }
    setLevelSelectOpen(true);
    setSidebarOpen(false);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPreview, setCreatePreview] = useState<{ latex: string, params: Record<string, number> }>({ latex: '', params: {} });

  const handleCreateModeClick = () => {
    const { playerInput, playerParams } = useGameStore.getState();
    if (!playerInput || playerInput.trim() === '') {
      useUIStore.getState().addToast(t('sidebar.createEmptyError'), 'error');
      setSidebarOpen(false);
      return;
    }
    
    // 提取有效参数
    const usedParams = extractUsedParams(playerInput, playerParams);
    setCreatePreview({ latex: playerInput, params: usedParams });
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = () => {
    // 使用提取后的有效参数
    useGameStore.getState().setTargetFunction(createPreview.latex, createPreview.params, 'custom');
    useUIStore.getState().addToast(t('sidebar.createSuccess'), 'success');
    navigate(`/game/custom/1/1`);
    setIsCreateModalOpen(false);
    setSidebarOpen(false);
  };

  const handleShareMode = () => {
    const { playerParams, gameMode } = useGameStore.getState();
    
    if (gameMode === 'story') {
      useUIStore.getState().addToast(t('sidebar.shareStoryError'), 'error');
      setSidebarOpen(false);
      return;
    }
    
    // 我们应该分享 targetFunction，因为在分享或创建模式、以及随机挑战下，targetFunction 才是真正的目标
    const { targetFunction } = useGameStore.getState();
    const shareTarget = targetFunction;

    if (!shareTarget || shareTarget.trim() === '') {
      useUIStore.getState().addToast(t('sidebar.shareEmptyError'), 'error');
      setSidebarOpen(false);
      return;
    }

    const levelData = { 
      t: shareTarget,
      p: Object.keys(playerParams).length > 0 ? playerParams : undefined
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(levelData))));
    const generatedUrl = `${window.location.origin}${window.location.pathname}#/share/${encoded}`;
    
    navigator.clipboard.writeText(generatedUrl).then(() => {
      useUIStore.getState().addToast(t('sidebar.copySuccess'), 'success');
    }).catch(() => {
      useUIStore.getState().addToast(t('sidebar.copyError'), 'error');
    });
    setSidebarOpen(false);
  };

  const basicNavGroups = [
    {
      title: t('sidebar.playSection'),
      items: [
        { id: 'story', icon: BookOpen, label: t('sidebar.storyMode'), onClick: handleStoryMode },
        { id: 'random', icon: Dices, label: t('sidebar.randomMode'), onClick: handleRandomChallenge }
      ]
    },
    {
      title: t('sidebar.createSection'),
      items: [
        { id: 'custom', icon: PenTool, label: t('sidebar.freeCreateMode'), onClick: handleCreateModeClick },
        { id: 'share', icon: Share2, label: t('sidebar.shareLevelMode'), onClick: handleShareMode }
      ]
    }
  ];

  return (
    <>
      {/* 移动端遮罩 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏主体 */}
      <aside 
        className={cn(
          "fixed md:static top-0 left-0 h-full bg-card-bg border-r border-card-border z-50 transform transition-all duration-300 ease-sidebar flex flex-col shrink-0 overflow-hidden",
          isSidebarOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.1)] md:shadow-none" : "-translate-x-full md:translate-x-0",
          isSidebarCollapsed ? "md:w-[64px] w-[260px]" : "w-[260px]"
        )}
      >
        {/* Logo 区 */}
        <div className={cn(
          "h-[64px] flex items-center shrink-0 border-b border-card-border px-[20px] transition-all duration-300",
          isSidebarCollapsed ? "md:justify-center md:px-0 justify-between" : "justify-between"
        )}>
          <div className={cn("flex items-center gap-[12px] pl-[4px]", isSidebarCollapsed && "md:hidden")}>
            <div className="w-[32px] h-[32px] rounded-[8px] bg-app-primary flex items-center justify-center shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.3)]">
              <Activity size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <h1 className="m-0 text-[1.25rem] font-bold text-app-text tracking-[0.5px] whitespace-nowrap transition-opacity duration-200">
              {t('sidebar.title', 'GuessFunc')}
            </h1>
          </div>
          
          <div className={cn("w-[32px] h-[32px] rounded-[8px] bg-app-primary items-center justify-center shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.3)] hidden", isSidebarCollapsed && "md:flex")}>
            <Activity size={20} strokeWidth={2.5} className="text-white" />
          </div>
          
          {/* 移动端关闭按钮 */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-[8px] text-app-text opacity-70 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] rounded-[8px] border-none bg-transparent cursor-pointer transition-all"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* 导航菜单区 */}
        <nav className="flex-1 overflow-y-auto px-[16px] py-[20px] flex flex-col custom-scrollbar">
          {basicNavGroups.map((group, idx) => (
            <div key={idx} className="mb-[24px] last:mb-0">
              <NavGroupTitle title={group.title} isSidebarCollapsed={isSidebarCollapsed} />
              <div className="flex flex-col gap-[4px]">
                {group.items.map(item => (
                  <NavItem 
                    key={item.id} 
                    item={item} 
                    isSidebarCollapsed={isSidebarCollapsed}
                    isActive={
                      (item.id === 'story' && useGameStore.getState().gameMode === 'story') ||
                      (item.id === 'random' && useGameStore.getState().gameMode === 'random') ||
                      (item.id === 'custom' && useGameStore.getState().gameMode === 'custom') ||
                      (item.id === 'share' && window.location.hash.includes('share'))
                    }
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-auto mb-[24px]">
            <NavGroupTitle title={t('sidebar.systemSection')} isSidebarCollapsed={isSidebarCollapsed} />
            <NavItem 
              item={{ id: 'settings', icon: Settings, label: t('sidebar.settings'), onClick: () => setSettingsOpen(true) }} 
              isSidebarCollapsed={isSidebarCollapsed} 
              isActive={false}
            />
          </div>
        </nav>
      </aside>

      <ConfirmModal 
        isOpen={isCreateModalOpen}
        title={t('sidebar.confirmCreateTitle')}
        message={
          <div className="flex flex-col gap-4">
            <p>{t('sidebar.confirmCreateDesc')}</p>
            <div 
              className="bg-card-bg border border-card-border p-3 rounded-lg overflow-x-auto font-math text-center text-lg"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(`f(x) = ${createPreview.latex}`, { throwOnError: false })
              }}
            />
            {Object.keys(createPreview.params).length > 0 && (
              <>
                <p className="mt-2">{t('sidebar.validParams')}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(createPreview.params).map(([key, val]) => (
                    <div key={key} className="bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary px-3 py-1 rounded-md font-math flex items-center gap-2 border border-[rgba(var(--primary-color-rgb),0.2)]">
                      <span dangerouslySetInnerHTML={{ __html: katex.renderToString(`${key} = ${val}`, { throwOnError: false }) }} />
                    </div>
                  ))}
                </div>
                <p className="text-sm opacity-60 mt-1">{t('sidebar.paramsNote1')}</p>
              </>
            )}
            {Object.keys(createPreview.params).length === 0 && (
              <p className="text-sm opacity-60 mt-2">{t('sidebar.paramsNote2')}</p>
            )}
          </div>
        }
        confirmText={t('sidebar.confirmCreateBtn', '生成并试玩')}
        onConfirm={handleConfirmCreate}
        onCancel={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};