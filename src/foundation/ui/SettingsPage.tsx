import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, VolumeX, Database, Type, Globe, Download, Upload, Trash2, CheckCircle2, Save, RotateCcw } from 'lucide-react';
import { useSystemUIStore } from './useSystemUIStore';
import { useAudioStore } from '@/foundation/audio/useAudioStore';
import { useProgressStore } from '@/foundation/storage/useProgressStore';
import { useUI } from './UIManager';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const SPRING_STIFFNESS = 350;
const SPRING_DAMPING = 28;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]; // eslint-disable-line @typescript-eslint/no-magic-numbers
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

  const PRESET_FONTS = [
    { id: 'default', label: 'Default', value: '"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
    { id: 'serif', label: 'Serif', value: 'ui-serif, Georgia, "Noto Serif CJK SC", "Songti SC", serif' },
    { id: 'mono', label: 'Mono', value: '"Space Grotesk", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "PingFang SC", "Microsoft YaHei", monospace' },
    { id: 'sans', label: 'Sans', value: 'ui-sans-serif, "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
  ];

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'storage', label: 'Storage', icon: Database },
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

  const handleClearData = () => {
    if (window.confirm(t('settings.save.clearConfirm', 'Are you sure you want to completely erase all local data?'))) {
      clearProgress();
      for (let i = 1; i <= TOTAL_SAVE_SLOTS; i++) {
        localStorage.removeItem(`system-core-slot-${i}`);
      }
      toast({ title: t('settings.save.clearSuccess', 'All data cleared'), type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col relative overflow-x-hidden selection:bg-[var(--color-foreground)] selection:text-[var(--color-background)]">
      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent-settings)] blur-[120px] pointer-events-none opacity-[0.04]" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-foreground)] blur-[120px] pointer-events-none opacity-[0.02]" />

      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row h-full z-10 pb-24 pt-8 md:pt-16 md:pb-32 px-4 md:px-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 mb-8 md:mb-0 md:pr-8 border-b md:border-b-0 md:border-r border-[var(--color-border)]/50 pb-6 md:pb-0">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="p-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-xl">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase font-display">
              {t('settings.title', 'Settings')}
            </h1>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-mono tracking-widest uppercase transition-all duration-300 text-left whitespace-nowrap",
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
        <main className="flex-1 w-full min-h-[60vh] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="w-full h-full md:pl-8"
            >
              
              {/* --- GENERAL / LANGUAGE --- */}
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display uppercase tracking-tight mb-2">Localization</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">Set your preferred interface language.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "relative flex flex-col items-start p-6 rounded-2xl border transition-all duration-300",
                        language === 'en' 
                          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                          : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
                      )}
                    >
                      <span className="font-mono tracking-widest text-sm uppercase mb-1">English</span>
                      <span className={cn("text-xs font-sans", language === 'en' ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>System Default</span>
                      {language === 'en' && <CheckCircle2 size={18} className="absolute top-6 right-6" />}
                    </button>
                    <button
                      onClick={() => setLanguage('zh')}
                      className={cn(
                        "relative flex flex-col items-start p-6 rounded-2xl border transition-all duration-300",
                        language === 'zh' 
                          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                          : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
                      )}
                    >
                      <span className="font-sans font-medium tracking-widest text-sm mb-1">中文 (简体)</span>
                      <span className={cn("text-xs font-sans", language === 'zh' ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>翻译支持</span>
                      {language === 'zh' && <CheckCircle2 size={18} className="absolute top-6 right-6" />}
                    </button>
                  </div>
                </div>
              )}

              {/* --- TYPOGRAPHY --- */}
              {activeTab === 'typography' && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-xl font-display uppercase tracking-tight mb-2">Typography</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">Customize readability and aesthetics.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Interface Scale</span>
                      <span className="text-sm font-mono tracking-widest">{Math.round(localFontSize * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative h-2 bg-[var(--color-border)] rounded-full flex-1 flex items-center">
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
                        className="px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-lg text-xs font-mono uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Typeface</span>
                    <div className="grid grid-cols-1 gap-3">
                      {PRESET_FONTS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontFamily(font.value)}
                          className={cn(
                            "relative flex flex-row items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden group",
                            fontFamily === font.value 
                              ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                              : "bg-[var(--color-muted)]/50 border-[var(--color-border)] hover:border-white/30 text-[var(--color-foreground)]"
                          )}
                        >
                          <div className="flex items-center gap-6">
                            <div 
                              className={cn(
                                "text-3xl md:text-4xl w-16 text-center opacity-80",
                                fontFamily === font.value ? "text-[var(--color-background)]" : "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]"
                              )}
                              style={{ fontFamily: font.value }}
                            >
                              Aa
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm md:text-base font-medium tracking-wide">{font.label}</span>
                              <span className={cn("text-[10px] uppercase tracking-[0.1em] font-mono mt-1", fontFamily === font.value ? "text-[var(--color-background)]/60" : "text-[var(--color-muted-foreground)]/60")}>
                                {font.id}
                              </span>
                            </div>
                          </div>
                          {fontFamily === font.value && (
                            <CheckCircle2 size={20} className="mr-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- AUDIO --- */}
              {activeTab === 'audio' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display uppercase tracking-tight mb-2">Audio</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">System volume and sound effects.</p>
                  </div>
                  
                  <div className="bg-[var(--color-muted)]/50 p-6 md:p-8 rounded-2xl border border-[var(--color-border)] flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <button 
                      onClick={toggleMute}
                      className={cn(
                        "w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
                        isMuted 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                          : "bg-[var(--color-foreground)] text-[var(--color-background)]"
                      )}
                    >
                      {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                    </button>
                    
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Master Volume</span>
                        <span className="text-sm md:text-base font-mono tracking-widest">{isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}</span>
                      </div>
                      <div className="relative h-3 bg-[var(--color-border)] rounded-full overflow-hidden flex items-center group/slider">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-display uppercase tracking-tight mb-2">Storage</h2>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Manage your local saves and progress.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Save Slots</span>
                    <div className="grid grid-cols-1 gap-3">
                      {saveSlots.map((slot) => (
                        <div key={slot.id} className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-[var(--color-muted)] transition-all">
                          <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-foreground)]/10 flex items-center justify-center font-mono text-[var(--color-foreground)] text-sm">
                              0{slot.id}
                            </div>
                            <div>
                              <div className="font-medium tracking-wide">
                                {slot.timestamp ? 'System Save Data' : 'Empty Slot'}
                              </div>
                              <div className="text-xs font-mono text-[var(--color-muted-foreground)] mt-1">
                                {slot.timestamp ? new Date(slot.timestamp).toLocaleString() : 'No data recorded'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                              onClick={() => handleSlotSave(slot.id)}
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
                            >
                              <Save size={14} /> Save
                            </button>
                            {slot.timestamp && (
                              <button
                                onClick={() => handleSlotLoad(slot.id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
                              >
                                <RotateCcw size={14} /> Load
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-[var(--color-border)]/50 my-8" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleExportData}
                      className="group/btn flex flex-col justify-between h-28 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-white/5 transition-all text-left"
                    >
                      <Download size={18} className="text-[var(--color-muted-foreground)] group-hover/btn:text-[var(--color-foreground)]" />
                      <div>
                        <span className="block text-sm font-medium">Export Data</span>
                        <span className="block text-xs font-sans text-[var(--color-muted-foreground)] mt-1">Backup JSON to disk</span>
                      </div>
                    </button>
                    
                    <label className="group/btn flex flex-col justify-between h-28 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-white/5 transition-all text-left cursor-pointer">
                      <Upload size={18} className="text-[var(--color-muted-foreground)] group-hover/btn:text-[var(--color-foreground)]" />
                      <div>
                        <span className="block text-sm font-medium">Import Data</span>
                        <span className="block text-xs font-sans text-[var(--color-muted-foreground)] mt-1">Restore from JSON</span>
                      </div>
                      <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                    </label>

                    <button
                      onClick={handleClearData}
                      className="group/btn flex flex-col justify-between h-28 p-4 rounded-2xl border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 transition-all text-left"
                    >
                      <Trash2 size={18} className="text-red-500/70 group-hover/btn:text-red-500" />
                      <div>
                        <span className="block text-sm font-medium text-red-400">Wipe Data</span>
                        <span className="block text-xs font-sans text-red-500/60 mt-1">Irreversible action</span>
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
