import React, { useState } from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import { useGameStore } from '../../../../store/useGameStore';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../ConfirmModal';
import { ToggleSwitch } from '../ToggleSwitch';
import { Download, Upload, Trash2, Unlock, Zap } from 'lucide-react';

const SettingsOption = ({ icon: Icon, label, onClick, isDanger, isFile, rightContent }: { icon: React.ElementType, label: string, onClick?: (e: React.MouseEvent<HTMLButtonElement> | React.ChangeEvent<HTMLInputElement>) => void, isDanger?: boolean, isFile?: boolean, rightContent?: React.ReactNode }) => {
  const baseClasses = `group relative overflow-hidden flex items-center justify-between px-[20px] py-[16px] text-[1.05rem] font-medium bg-option-bg text-option-text border border-card-border rounded-[10px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[2px] w-full cursor-pointer`;
  
  const hoverClasses = isDanger 
    ? `hover:shadow-[0_4px_12px_rgba(244,67,54,0.15)] dark:hover:shadow-[0_4px_12px_rgba(229,115,115,0.20)] hover:border-app-danger dark:hover:border-[#ef5350] hover:bg-app-danger/10 hover:text-app-danger dark:hover:text-[#ef5350]`
    : `hover:shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.2)] hover:border-app-primary dark:hover:border-[rgba(var(--primary-color-rgb),0.6)] hover:bg-[rgba(var(--primary-color-rgb),0.15)] hover:text-app-text dark:hover:text-option-text`;
    
  const barColor = isDanger ? 'bg-app-danger' : 'bg-app-primary';
  const textColor = isDanger ? 'text-app-danger' : '';

  const content = (
    <>
      <div className="flex items-center gap-[12px] z-10">
        <Icon className={`opacity-70 group-hover:opacity-100 transition-opacity ${textColor}`} />
        <span className={textColor}>{label}</span>
      </div>
      {rightContent && <div className="z-10">{rightContent}</div>}
      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${barColor} scale-y-0 transition-transform duration-200 ease-out group-hover:scale-y-100`} />
    </>
  );

  if (isFile) {
    return (
      <label className={`${baseClasses} ${hoverClasses}`}>
        {content}
        <input type="file" accept=".json" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => onClick && onClick(e)} />
      </label>
    );
  }

  return (
    <button onClick={(e) => onClick && onClick(e)} className={`${baseClasses} ${hoverClasses}`}>
      {content}
    </button>
  );
};

export const SavePanel: React.FC = () => {
  const { isAssistMode, toggleAssistMode, isSpeedrunMode, toggleSpeedrunMode } = useUIStore();
  const [currentSlot, setCurrentSlot] = React.useState(() => localStorage.getItem('guessfunc_current_slot') || '1');
  const { t } = useTranslation();

  // We need a force render to show slot status correctly when it changes
  const [, setForceRender] = React.useState(0);

  const getSlotKey = (slot: string) => slot === '1' ? 'guess-func-storage' : `guess-func-storage_slot${slot}`;

  const hasSaveData = (slot: string) => {
    const dataStr = localStorage.getItem(getSlotKey(slot));
    if (!dataStr) return false;
    try {
      const data = JSON.parse(dataStr);
      // 只有完成了至少一个关卡才算有存档
      return data?.state?.completedLevels?.length > 0;
    } catch {
      return false;
    }
  };

  const handleSlotSelect = (slot: string) => {
    if (slot === currentSlot) return;
    
    // Save current progress to current slot
    const state = useGameStore.getState();
    const currentDataToSave = { state: { completedLevels: state.completedLevels, seenChapters: state.seenChapters } };
    localStorage.setItem(getSlotKey(currentSlot), JSON.stringify(currentDataToSave));

    // Load new slot data
    const newData = localStorage.getItem(getSlotKey(slot));
    if (newData) {
      try {
        const parsed = JSON.parse(newData);
        if (parsed.state) {
          useGameStore.setState({ 
            completedLevels: parsed.state.completedLevels || [],
            seenChapters: parsed.state.seenChapters || []
          });
        }
      } catch (e: unknown) {
        console.error("Error loading slot", e);
      }
    } else {
      // New slot is empty, clear current state
      useGameStore.setState({ completedLevels: [], seenChapters: [] });
    }

    setCurrentSlot(slot);
    localStorage.setItem('guessfunc_current_slot', slot);
    useUIStore.getState().addToast(t('settings.save.switchSlotSuccess', { slot }), 'success');
  };

  const handleExport = () => {
    const data = {
      completedLevels: useGameStore.getState().completedLevels,
      theme: useUIStore.getState().theme,
      isSpeedrunMode: useUIStore.getState().isSpeedrunMode
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guessfunc_save_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    useUIStore.getState().addToast(t('settings.save.exportSuccess'), 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('target' in e && (e.target as HTMLInputElement).files) {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.completedLevels) {
          useGameStore.setState({ completedLevels: data.completedLevels });
        }
        if (data.theme) {
          useUIStore.getState().setTheme(data.theme);
        }
        if (data.isSpeedrunMode !== undefined) {
          useUIStore.setState({ isSpeedrunMode: data.isSpeedrunMode });
        }
     useUIStore.getState().addToast(t('settings.save.importSuccess'), 'success');
        } catch (err: unknown) {
          console.error(err);
          useUIStore.getState().addToast(t('settings.save.importFormatError'), 'error');
        }
      };
     reader.readAsText(file);
    }
    if ('target' in e && e.target instanceof HTMLInputElement) {
      e.target.value = ''; // reset input
    }
  };

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleClearClick = () => {
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = (e?: React.MouseEvent) => {
    // 动态计算点击位置（相对于视口），用于撒花特效
    // ConfirmModal 已经算好了比例，直接取
    let x = 0.5;
    let y = 0.5;
    
    if (e && e.clientX !== undefined && e.clientY !== undefined) {
      x = e.clientX;
      y = e.clientY;
    }

    useGameStore.setState({ completedLevels: [], seenChapters: [] });
    localStorage.removeItem(getSlotKey(currentSlot));
    setForceRender(prev => prev + 1);
    
    // 从触发位置发射红色的删除特效
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 50,
        spread: 70,
        origin: { x, y },
        colors: ['#ef5350', '#d32f2f', '#c62828'], // 红色系
        disableForReducedMotion: true
      });
    });

    useUIStore.getState().addToast(t('settings.save.clearSuccess'), 'success');
    setIsClearModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="m-0 font-bold text-lg border-b border-card-border pb-2 text-app-text">{t('settings.save.slotsTitle')}</h3>
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((num) => {
            const slotStr = String(num);
            const isCurrent = slotStr === currentSlot;
            const hasData = hasSaveData(slotStr);
            return (
              <button
                key={slotStr}
                onClick={() => handleSlotSelect(slotStr)}
                className={`flex items-center justify-between w-full px-4 py-3 border transition-all rounded-xl transform hover:-translate-y-0.5 ${
                  isCurrent 
                    ? 'border-app-primary bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary' 
                    : 'border-card-border bg-card-bg text-app-text hover:border-app-primary hover:bg-card-hover'
                }`}
              >
                <span className="font-medium text-base">
                  {isCurrent ? t('settings.save.slotCurrent', { num }) : t('settings.save.slot', { num })}
                </span>
                <span className={`text-sm ${hasData ? 'opacity-80' : 'opacity-40'}`}>
                  {hasData ? t('settings.save.hasSave') : t('settings.save.emptySave')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="m-0 font-bold text-lg border-b border-card-border pb-2 text-app-text">{t('settings.save.operationsTitle')}</h3>
        
        <SettingsOption icon={Download} label={t('settings.save.export')} onClick={handleExport} />
        <SettingsOption icon={Upload} label={t('settings.save.import')} onClick={handleImport} isFile />
        <SettingsOption icon={Trash2} label={t('settings.save.clear')} onClick={handleClearClick} isDanger />
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="m-0 font-bold text-lg border-b border-card-border pb-2 text-app-text">{t('settings.save.assistTitle')}</h3>
        <SettingsOption 
          icon={Unlock} 
          label={`${t('settings.save.previewMode')}: ${isAssistMode ? t('common.on') : t('common.off')}`}
          onClick={toggleAssistMode}
          rightContent={
            <ToggleSwitch checked={isAssistMode} />
          }
        />
        <div className="text-sm opacity-80 px-2.5 text-app-text mb-4">
          {t('settings.save.previewModeDesc')}
        </div>

        <SettingsOption 
          icon={Zap} 
          label={`${t('settings.main.speedrun')}: ${isSpeedrunMode ? t('common.on') : t('common.off')}`}
          onClick={toggleSpeedrunMode}
          rightContent={
            <ToggleSwitch checked={isSpeedrunMode} />
          }
        />
        <div className="text-sm opacity-80 px-2.5 text-app-text">
          {t('settings.save.speedrunModeDesc')}
        </div>
      </div>

      <ConfirmModal 
        isOpen={isClearModalOpen}
        title={t('settings.save.clearWarningTitle')}
        message={t('settings.save.clearWarningMsg')}
        confirmText={t('settings.save.clearConfirm')}
        requireInput="Say Goodbye to Shirloy"
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};