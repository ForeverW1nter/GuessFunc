import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, VolumeX, Database, Type, Globe, Download, Upload, Trash2, CheckCircle2, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSystemUIStore } from './useSystemUIStore';
import { useAudioStore } from '@/foundation/audio/useAudioStore';
import { useProgressStore } from '@/foundation/storage/useProgressStore';
import { useUI } from './UIManager';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const SPRING_STIFFNESS = 250;
const SPRING_DAMPING = 30;
const MIN_FONT_SCALE = 0.8;
const FONT_SCALE_RANGE = 0.7;
const TOTAL_SAVE_SLOTS = 5;

type TabId = 'general' | 'typography' | 'audio' | 'storage';

const getInitialSlots = () => {
  const slots = [];
  for (let i = 1; i <= TOTAL_SAVE_SLOTS; i++) {
    const data = localStorage.getItem(`system-core-slot-${i}`);
    slots.push({ id: i, timestamp: data ? JSON.parse(data).timestamp : null });
  }
  return slots;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const restorePayloadToStore = (payload: any, setLanguage: any, setFontFamily: any, setFontSizeMultiplier: any, setLocalFontSize: any, setVolume: any, toggleMute: any) => {
  if (payload.completedLevels) {
    useProgressStore.setState({ 
      completedLevels: payload.completedLevels || [],
      seenChapters: payload.seenChapters || [],
      readFiles: payload.readFiles || []
    });
  }
  if (payload.uiSettings) {
    setLanguage(payload.uiSettings.language || 'en');
    setFontFamily(payload.uiSettings.fontFamily || 'system-ui');
    setFontSizeMultiplier(payload.uiSettings.fontSizeMultiplier || 1);
    setLocalFontSize(payload.uiSettings.fontSizeMultiplier || 1);
  }
  if (payload.audioSettings) {
    setVolume(payload.audioSettings.volume ?? 0.5);
    if (payload.audioSettings.isMuted) toggleMute();
  }
};

export const SettingsPage = () => { // eslint-disable-line complexity
  const { language, setLanguage, fontFamily, setFontFamily, fontSizeMultiplier, setFontSizeMultiplier } = useSystemUIStore();
  const { volume, isMuted, setVolume, toggleMute } = useAudioStore();
  const { completedLevels, seenChapters, readFiles, clearProgress } = useProgressStore();
  const { toast } = useUI();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [localFontSize, setLocalFontSize] = useState(fontSizeMultiplier);
  const [saveSlots, setSaveSlots] = useState<{ id: number; timestamp: string | null }[]>(getInitialSlots());
  
  // Custom Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const PRESET_FONTS = [
    { id: 'default', label: 'Default', value: '"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
    { id: 'serif', label: 'Serif', value: 'ui-serif, Georgia, "Noto Serif CJK SC", "Songti SC", serif' },
    { id: 'mono', label: 'Mono', value: '"Space Grotesk", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "PingFang SC", "Microsoft YaHei", monospace' },
    { id: 'sans', label: 'Sans', value: 'ui-sans-serif, "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
  ];

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: t('settings.general.tab', 'General'), icon: Globe },
    { id: 'typography', label: t('settings.typography.tab', 'Typography'), icon: Type },
    { id: 'audio', label: t('settings.audio.tab', 'Audio'), icon: Volume2 },
    { id: 'storage', label: t('settings.storage.tab', 'Storage'), icon: Database },
  ];

  useEffect(() => {
    document.documentElement.style.setProperty('--font-display', fontFamily);
    document.documentElement.style.setProperty('--font-sans', fontFamily);
    document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`;
  }, [fontFamily, fontSizeMultiplier]);

  const handleApplyFontSize = () => {
    setFontSizeMultiplier(localFontSize);
    toast({ title: t('settings.typography.applied', 'Font scale applied'), type: 'success' });
  };

  const handleSlotSave = (slotId: number) => {
    try {
      const timestamp = new Date().toISOString();
      const data = {
        timestamp,
        payload: {
          completedLevels, seenChapters, readFiles,
          uiSettings: { language, fontFamily, fontSizeMultiplier },
          audioSettings: { volume, isMuted }
        }
      };
      localStorage.setItem(`system-core-slot-${slotId}`, JSON.stringify(data));
      setSaveSlots(prev => prev.map(s => s.id === slotId ? { ...s, timestamp } : s));
      toast({ title: `Saved to Slot ${slotId}`, type: 'success' });
    } catch (err) {
      toast({ title: 'Failed to save slot', description: String(err), type: 'error' });
    }
  };

  const handleSlotLoad = (slotId: number) => {
    try {
      const raw = localStorage.getItem(`system-core-slot-${slotId}`);
      if (!raw) return;
      const { payload } = JSON.parse(raw);
      
      restorePayloadToStore(payload, setLanguage, setFontFamily, setFontSizeMultiplier, setLocalFontSize, setVolume, toggleMute);
      toast({ title: `Loaded Slot ${slotId}`, type: 'success' });
    } catch (err) {
      toast({ title: 'Failed to load slot', description: String(err), type: 'error' });
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        completedLevels, seenChapters, readFiles,
        uiSettings: { language, fontFamily, fontSizeMultiplier },
        audioSettings: { volume, isMuted }
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_core_save_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('settings.save.exportSuccess', 'Data exported successfully'), type: 'success' });
    } catch (err) {
      toast({ title: t('settings.save.exportError', 'Export failed'), description: String(err), type: 'error' });
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        restorePayloadToStore(data, setLanguage, setFontFamily, setFontSizeMultiplier, setLocalFontSize, setVolume, toggleMute);
        toast({ title: t('settings.save.importSuccess', 'Data imported successfully'), type: 'success' });
      } catch (err) {
        toast({ title: t('settings.save.importError', 'Invalid save file format'), description: String(err), type: 'error' });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmClearData = () => {
    setIsConfirmOpen(false);
    clearProgress();
    for (let i = 1; i <= TOTAL_SAVE_SLOTS; i++) {
      localStorage.removeItem(`system-core-slot-${i}`);
    }
    toast({ title: t('settings.save.clearSuccess', 'All data cleared'), type: 'success' });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col relative overflow-x-hidden selection:bg-[var(--color-foreground)] selection:text-[var(--color-background)]">
      
      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsConfirmOpen(false)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }} 
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative bg-[var(--color-muted)] border border-[var(--color-border)] p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-display uppercase tracking-tight">{t('settings.save.clearConfirmTitle', 'Wipe All Data?')}</h3>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)] mb-8 leading-relaxed">
                {t('settings.save.clearConfirm', 'Are you sure you want to completely erase all local data? This action cannot be undone and will delete all progress and settings.')}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsConfirmOpen(false)} 
                  className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-white/5 transition-colors text-sm font-mono uppercase tracking-widest"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button 
                  onClick={handleConfirmClearData} 
                  className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-sm font-mono uppercase tracking-widest"
                >
                  {t('common.confirm', 'Confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent-settings)] blur-[120px] pointer-events-none opacity-[0.04]" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-foreground)] blur-[120px] pointer-events-none opacity-[0.02]" />

      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row h-full z-10 pb-20 pt-6 md:pt-10 md:pb-24 px-4 md:px-6">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 shrink-0 mb-6 md:mb-0 md:pe-6 border-b md:border-b-0 md:border-e border-[var(--color-border)]/50 pb-4 md:pb-0">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-xl">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase font-display text-balance">
              {t('settings.title', 'Settings')}
            </h1>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-mono tracking-widest uppercase transition-all duration-300 text-left whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)]",
                  activeTab === tab.id 
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)]" 
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-white/5"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="active-tab"
                    className="absolute inset-0 bg-[var(--color-foreground)] rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: SPRING_STIFFNESS, damping: SPRING_DAMPING }}
                  />
                )}
                <tab.icon size={16} className="shrink-0" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-h-[50vh] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full md:ps-6 pb-[env(safe-area-inset-bottom)]"
            >
              
              {/* --- GENERAL / LANGUAGE --- */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">{t('settings.general.localization', 'Localization')}</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{t('settings.general.localizationDesc', 'Set your preferred interface language.')}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 min-w-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                        language === 'en' 
                          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                          : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
                      )}
                    >
                      <span className="font-mono tracking-widest text-sm uppercase mb-1 truncate w-full text-left">{t('settings.general.english', 'English')}</span>
                      <span className={cn("text-xs font-sans truncate w-full text-left", language === 'en' ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>{t('settings.general.englishSub', 'System Default')}</span>
                      {language === 'en' && <CheckCircle2 size={18} className="absolute top-5 end-5" />}
                    </button>
                    <button
                      onClick={() => setLanguage('zh')}
                      className={cn(
                        "relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 min-w-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                        language === 'zh' 
                          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                          : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
                      )}
                    >
                      <span className="font-sans font-medium tracking-widest text-sm mb-1 truncate w-full text-left">{t('settings.general.chinese', '中文 (简体)')}</span>
                      <span className={cn("text-xs font-sans truncate w-full text-left", language === 'zh' ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>{t('settings.general.chineseSub', 'Translation Support')}</span>
                      {language === 'zh' && <CheckCircle2 size={18} className="absolute top-5 end-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* --- TYPOGRAPHY --- */}
              {activeTab === 'typography' && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">{t('settings.typography.title', 'Typography')}</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{t('settings.typography.desc', 'Customize readability and aesthetics.')}</p>
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">{t('settings.typography.scale', 'Interface Scale')}</span>
                      <span className="text-sm font-mono tracking-widest">{Math.round(localFontSize * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative h-2 bg-[var(--color-border)] rounded-full flex-1 flex items-center focus-within:ring-2 focus-within:ring-[var(--color-foreground)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-background)]">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-[var(--color-foreground)] rounded-full"
                          style={{ width: `${((localFontSize - MIN_FONT_SCALE) / FONT_SCALE_RANGE) * 100}%` }}
                        />
                        <input
                          type="range" min="0.8" max="1.5" step="0.05"
                          value={localFontSize}
                          onChange={(e) => setLocalFontSize(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <button 
                        onClick={handleApplyFontSize}
                        disabled={localFontSize === fontSizeMultiplier}
                        className="px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-lg text-xs font-mono uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                      >
                        {t('settings.typography.apply', 'Apply')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">{t('settings.typography.typeface', 'Typeface')}</span>
                    <div className="grid grid-cols-1 gap-3">
                      {PRESET_FONTS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontFamily(font.value)}
                          className={cn(
                            "relative flex flex-row items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left min-w-0 group touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                            fontFamily === font.value 
                              ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                              : "bg-[var(--color-muted)]/50 border-[var(--color-border)] hover:border-white/30 text-[var(--color-foreground)]"
                          )}
                        >
                          <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            <div 
                              className={cn(
                                "text-2xl md:text-3xl w-12 md:w-16 text-center opacity-80 shrink-0",
                                fontFamily === font.value ? "text-[var(--color-background)]" : "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]"
                              )}
                              style={{ fontFamily: font.value }}
                            >
                              Aa
                            </div>
                            <div className="flex flex-col min-w-0 pe-8">
                              <span className="text-sm md:text-base font-medium tracking-wide truncate">{font.label}</span>
                              <span className={cn("text-[10px] uppercase tracking-[0.1em] font-mono mt-1 truncate", fontFamily === font.value ? "text-[var(--color-background)]/60" : "text-[var(--color-muted-foreground)]/60")}>
                                {font.id}
                              </span>
                            </div>
                          </div>
                          {fontFamily === font.value && (
                            <CheckCircle2 size={20} className="absolute end-4 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- AUDIO --- */}
              {activeTab === 'audio' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">{t('settings.audio.title', 'Audio')}</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{t('settings.audio.desc', 'System volume and sound effects.')}</p>
                  </div>
                  
                  <div className="bg-[var(--color-muted)]/50 p-6 md:p-8 rounded-2xl border border-[var(--color-border)] flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <button 
                      onClick={toggleMute}
                      className={cn(
                        "w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                        isMuted 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                          : "bg-[var(--color-foreground)] text-[var(--color-background)]"
                      )}
                    >
                      {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                    </button>
                    
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">{t('settings.audio.master', 'Master Volume')}</span>
                        <span className="text-sm md:text-base font-mono tracking-widest">{isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}</span>
                      </div>
                      <div className="relative h-3 bg-[var(--color-border)] rounded-full overflow-hidden flex items-center group/slider focus-within:ring-2 focus-within:ring-[var(--color-foreground)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-background)]">
                        <motion.div 
                          className={cn("absolute top-0 left-0 h-full rounded-full transition-colors", isMuted ? "bg-red-500/50" : "bg-[var(--color-foreground)]")}
                          style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                        />
                        <input
                          type="range" min="0" max="1" step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          disabled={isMuted}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- STORAGE --- */}
              {activeTab === 'storage' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">{t('settings.storage.title', 'Storage')}</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{t('settings.storage.desc', 'Manage your local saves and progress.')}</p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">{t('settings.storage.slots', 'Save Slots')}</span>
                    <div className="grid grid-cols-1 gap-3">
                      {saveSlots.map((slot) => (
                        <div key={slot.id} className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-[var(--color-muted)] transition-all gap-4 sm:gap-0">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--color-foreground)]/10 flex items-center justify-center font-mono text-[var(--color-foreground)] text-sm">
                              0{slot.id}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium tracking-wide truncate">
                                {slot.timestamp ? t('settings.storage.slotData', 'System Save Data') : t('settings.storage.slotEmpty', 'Empty Slot')}
                              </div>
                              <div className="text-xs font-mono text-[var(--color-muted-foreground)] mt-1 truncate">
                                {slot.timestamp ? new Date(slot.timestamp).toLocaleString(undefined, {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                }) : t('settings.storage.slotNoData', 'No data recorded')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <button
                              onClick={() => handleSlotSave(slot.id)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
                            >
                              <Save size={14} /> {t('settings.storage.btnSave', 'Save')}
                            </button>
                            {slot.timestamp && (
                              <button
                                onClick={() => handleSlotLoad(slot.id)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
                              >
                                <RotateCcw size={14} /> {t('settings.storage.btnLoad', 'Load')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-[var(--color-border)]/50 my-6" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleExportData}
                      className="group/btn flex flex-col justify-between h-24 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-white/5 transition-all text-left"
                    >
                      <Download size={18} className="text-[var(--color-muted-foreground)] group-hover/btn:text-[var(--color-foreground)]" />
                      <div>
                        <span className="block text-sm font-medium">{t('settings.storage.exportData', 'Export Data')}</span>
                        <span className="block text-xs font-sans text-[var(--color-muted-foreground)] mt-1">{t('settings.storage.exportDesc', 'Backup JSON to disk')}</span>
                      </div>
                    </button>
                    
                    <label className="group/btn flex flex-col justify-between h-24 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-white/5 transition-all text-left cursor-pointer">
                      <Upload size={18} className="text-[var(--color-muted-foreground)] group-hover/btn:text-[var(--color-foreground)]" />
                      <div>
                        <span className="block text-sm font-medium">{t('settings.storage.importData', 'Import Data')}</span>
                        <span className="block text-xs font-sans text-[var(--color-muted-foreground)] mt-1">{t('settings.storage.importDesc', 'Restore from JSON')}</span>
                      </div>
                      <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                    </label>

                    <button
                      onClick={() => setIsConfirmOpen(true)}
                      className="group/btn flex flex-col justify-between h-24 p-4 rounded-2xl border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 transition-all text-left"
                    >
                      <Trash2 size={18} className="text-red-500/70 group-hover/btn:text-red-500" />
                      <div>
                        <span className="block text-sm font-medium text-red-400">{t('settings.storage.wipeData', 'Wipe Data')}</span>
                        <span className="block text-xs font-sans text-red-500/60 mt-1">{t('settings.storage.wipeDesc', 'Irreversible action')}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
