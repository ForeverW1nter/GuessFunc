import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Volume2, VolumeX, Database, Type, Globe, Download, Upload, Trash2 } from 'lucide-react';
import { useSystemUIStore } from './useSystemUIStore';
import { useAudioStore } from '@/foundation/audio/useAudioStore';
import { useProgressStore } from '@/foundation/storage/useProgressStore';
import { useUI } from './UIManager';

import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

export const SystemControlCenter = () => {
  const { isControlCenterOpen, setControlCenterOpen, language, setLanguage, fontFamily, setFontFamily, fontSizeMultiplier, setFontSizeMultiplier } = useSystemUIStore();
  const { volume, isMuted, setVolume, toggleMute } = useAudioStore();
  const { completedLevels, seenChapters, readFiles, clearProgress } = useProgressStore();
  const { toast } = useUI();
  const { t } = useTranslation();

  const PRESET_FONTS = [
    { label: t('settings.font.default', 'System Default'), value: 'system-ui' },
    { label: t('settings.font.serif', 'Serif'), value: 'ui-serif, Georgia, serif' },
    { label: t('settings.font.mono', 'Monospace'), value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
    { label: t('settings.font.sans', 'Sans-Serif'), value: 'ui-sans-serif, system-ui, sans-serif' },
  ];

  useEffect(() => {
    document.documentElement.style.setProperty('--font-display', fontFamily);
    document.documentElement.style.setProperty('--font-sans', fontFamily);
    document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`;
  }, [fontFamily, fontSizeMultiplier]);

  const handleExportData = () => {
    try {
      const data = {
        completedLevels,
        seenChapters,
        readFiles,
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
        
        // In a real scenario, use Zod schema to validate `data` here
        if (data.completedLevels) {
           useProgressStore.setState({ 
             completedLevels: data.completedLevels || [],
             seenChapters: data.seenChapters || [],
             readFiles: data.readFiles || []
           });
        }
        
        if (data.uiSettings) {
           setLanguage(data.uiSettings.language || 'en');
           setFontFamily(data.uiSettings.fontFamily || 'system-ui');
           setFontSizeMultiplier(data.uiSettings.fontSizeMultiplier || 1);
        }
        
        if (data.audioSettings) {
           setVolume(data.audioSettings.volume ?? 0.5);
           if (data.audioSettings.isMuted) toggleMute();
        }

        toast({ title: t('settings.save.importSuccess', 'Data imported successfully'), type: 'success' });
      } catch (err) {
        toast({ title: t('settings.save.importError', 'Invalid save file format'), description: String(err), type: 'error' });
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    // We can replace this with a beautiful custom Confirm Modal later
    if (window.confirm(t('settings.save.clearConfirm', 'Are you sure you want to completely erase all local data?'))) {
      clearProgress();
      localStorage.clear();
      toast({ title: t('settings.save.clearSuccess', 'All data cleared'), type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <AnimatePresence>
      {isControlCenterOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            onClick={() => setControlCenterOpen(false)}
          />

          {/* Bottom Sheet / Drawer */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-h-[85vh] md:max-h-[70vh] w-full max-w-4xl mx-auto bg-[var(--color-muted)] border-t border-x border-[var(--color-border)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle (Visual only) */}
            <div className="w-full flex justify-center py-4 cursor-pointer" onClick={() => setControlCenterOpen(false)}>
              <div className="w-12 h-1.5 bg-[var(--color-muted-foreground)] opacity-30 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-8 pb-6 border-b border-[var(--color-border)] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
                  <Settings className="text-[var(--color-muted-foreground)]" size={24} />
                  Control Center
                </h2>
                <p className="text-xs font-mono text-[var(--color-muted-foreground)] tracking-widest mt-1">
                  System Preferences
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              
              {/* Audio Block */}
              <section className="space-y-6">
                <h3 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2">
                  <Volume2 size={16} /> Audio Output
                </h3>
                <div className="bg-black/20 p-6 rounded-2xl border border-[var(--color-border)] flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={toggleMute}
                      className="p-3 rounded-full hover:bg-white/5 transition-colors"
                    >
                      {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      disabled={isMuted}
                      className="flex-1 accent-[var(--color-foreground)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--color-foreground)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer disabled:opacity-50"
                    />
                    <span className="font-mono text-sm w-12 text-right">
                      {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                </div>
              </section>

              {/* Typography Block */}
              <section className="space-y-6">
                <h3 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2">
                  <Type size={16} /> Typography
                </h3>
                <div className="bg-black/20 p-6 rounded-2xl border border-[var(--color-border)] flex flex-col gap-6">
                  
                  {/* Font Size */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
                        {t('settings.font.size', 'Scale')}
                      </label>
                      <span className="font-mono text-sm">{Math.round(fontSizeMultiplier * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.5"
                      step="0.05"
                      value={fontSizeMultiplier}
                      onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-foreground)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--color-foreground)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                    />
                  </div>

                  {/* Font Family Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
                      {t('settings.font.family', 'Typeface')}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {PRESET_FONTS.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => setFontFamily(font.value)}
                          style={{ fontFamily: font.value }}
                          className={cn(
                            "py-3 px-4 rounded-xl border text-sm transition-all",
                            fontFamily === font.value 
                              ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                              : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-white/30"
                          )}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </section>

              {/* Language Block */}
              <section className="space-y-6">
                <h3 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2">
                  <Globe size={16} /> Localization
                </h3>
                <div className="bg-black/20 p-6 rounded-2xl border border-[var(--color-border)] flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl border font-mono text-sm tracking-widest transition-all",
                        language === 'en' 
                          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-white/30"
                      )}
                    >
                      ENGLISH
                    </button>
                    <button
                      onClick={() => setLanguage('zh')}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl border font-mono text-sm tracking-widest transition-all",
                        language === 'zh' 
                          ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-white/30"
                      )}
                    >
                      中文
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[var(--color-muted-foreground)] opacity-50 mt-2">
                    {t('settings.language.subtitle', 'Change system display language')}
                  </p>
                </div>
              </section>

              {/* Storage Block */}
              <section className="space-y-6">
                <h3 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2">
                  <Database size={16} /> Storage & Data
                </h3>
                <div className="bg-black/20 p-6 rounded-2xl border border-[var(--color-border)] flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Export */}
                    <button
                      onClick={handleExportData}
                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-white/30 transition-all"
                    >
                      <Download size={20} />
                      <span className="text-xs font-mono uppercase tracking-widest">{t('settings.save.export', 'Export Data')}</span>
                    </button>
                    
                    {/* Import */}
                    <label className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-white/30 transition-all cursor-pointer">
                      <Upload size={20} />
                      <span className="text-xs font-mono uppercase tracking-widest">{t('settings.save.import', 'Import Data')}</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleImportData}
                      />
                    </label>

                    {/* Clear */}
                    <button
                      onClick={handleClearData}
                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-red-500/20 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                    >
                      <Trash2 size={20} />
                      <span className="text-xs font-mono uppercase tracking-widest">{t('settings.save.clear', 'Wipe Data')}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[var(--color-muted-foreground)] opacity-50 mt-2 text-center">
                    {t('settings.save.subtitle', 'Manage local save files and configurations')}
                  </p>
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
