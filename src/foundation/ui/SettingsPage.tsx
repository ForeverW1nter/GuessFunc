import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Volume2, VolumeX, Database, Type, Globe, Download, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { useSystemUIStore } from './useSystemUIStore';
import { useAudioStore } from '@/foundation/audio/useAudioStore';
import { useProgressStore } from '@/foundation/storage/useProgressStore';
import { useUI } from './UIManager';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const SettingsPage = () => {
  const { language, setLanguage, fontFamily, setFontFamily, fontSizeMultiplier, setFontSizeMultiplier } = useSystemUIStore();
  const { volume, isMuted, setVolume, toggleMute } = useAudioStore();
  const { completedLevels, seenChapters, readFiles, clearProgress } = useProgressStore();
  const { toast } = useUI();
  const { t } = useTranslation();

  const PRESET_FONTS = [
    { id: 'default', label: t('settings.font.default', 'System Default'), value: '"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
    { id: 'serif', label: t('settings.font.serif', 'Serif'), value: 'ui-serif, Georgia, "Noto Serif CJK SC", "Songti SC", serif' },
    { id: 'mono', label: t('settings.font.mono', 'Monospace'), value: '"Space Grotesk", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "PingFang SC", "Microsoft YaHei", monospace' },
    { id: 'sans', label: t('settings.font.sans', 'Sans-Serif'), value: 'ui-sans-serif, "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
  ];

  useEffect(() => {
    document.documentElement.style.setProperty('--font-display', fontFamily);
    document.documentElement.style.setProperty('--font-sans', fontFamily);
    document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`;
  }, [fontFamily, fontSizeMultiplier]);

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
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm(t('settings.save.clearConfirm', 'Are you sure you want to completely erase all local data?'))) {
      clearProgress();
      localStorage.clear();
      toast({ title: t('settings.save.clearSuccess', 'All data cleared'), type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col p-8 md:p-12 relative overflow-x-hidden selection:bg-[var(--color-foreground)] selection:text-[var(--color-background)]">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[var(--accent-settings)] blur-[120px] pointer-events-none opacity-[0.03]" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-blue-500 blur-[120px] pointer-events-none opacity-[0.03]" />

      <div className="w-full max-w-5xl mx-auto flex flex-col h-full z-10 pb-32">
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 flex items-center justify-between border-b border-[var(--color-border)] pb-8"
        >
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-2xl">
                <Settings size={28} strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase font-display">
                {t('settings.title', 'Settings')}
              </h1>
            </div>
            <p className="text-sm font-mono text-[var(--color-muted-foreground)] tracking-[0.2em] uppercase ml-16">
              {t('settings.subtitle', 'System Preferences')}
            </p>
          </div>
        </motion.header>

        {/* Bento Grid Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          
          {/* --- LANGUAGE BENTO --- */}
          <motion.div variants={itemVariants} className="md:col-span-5 rounded-3xl bg-[var(--color-muted)]/40 border border-[var(--color-border)] backdrop-blur-xl overflow-hidden relative group p-8 flex flex-col justify-between hover:border-[var(--card-hover-border)] hover:bg-[var(--card-hover-bg)] transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
              <Globe size={120} strokeWidth={0.5} />
            </div>
            <div className="z-10 mb-8">
              <h2 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2 mb-2">
                <Globe size={14} /> {t('settings.localization.title', 'Localization')}
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)] font-sans">
                {t('settings.language.subtitle', 'Change system display language')}
              </p>
            </div>

            <div className="flex flex-col gap-3 z-10">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "relative flex items-center justify-between w-full py-4 px-6 rounded-2xl border transition-all duration-300",
                  language === 'en' 
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)] shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                    : "bg-black/20 border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-white/30 hover:text-[var(--color-foreground)]"
                )}
              >
                <span className="font-mono tracking-widest text-sm uppercase">English</span>
                {language === 'en' && <CheckCircle2 size={18} />}
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={cn(
                  "relative flex items-center justify-between w-full py-4 px-6 rounded-2xl border transition-all duration-300",
                  language === 'zh' 
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)] shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                    : "bg-black/20 border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-white/30 hover:text-[var(--color-foreground)]"
                )}
              >
                <span className="font-sans text-sm font-medium tracking-widest">中文 (简体)</span>
                {language === 'zh' && <CheckCircle2 size={18} />}
              </button>
            </div>
          </motion.div>

          {/* --- AUDIO BENTO --- */}
          <motion.div variants={itemVariants} className="md:col-span-7 rounded-3xl bg-[var(--color-muted)]/40 border border-[var(--color-border)] backdrop-blur-xl overflow-hidden relative group p-8 flex flex-col justify-between hover:border-[var(--card-hover-border)] hover:bg-[var(--card-hover-bg)] transition-all duration-500">
            <div className="z-10 mb-8">
              <h2 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2 mb-2">
                <Volume2 size={14} /> {t('settings.audio.title', 'Audio Output')}
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)] font-sans">
                Master volume control and mute toggle
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 z-10 bg-black/40 p-6 rounded-2xl border border-[var(--color-border)]">
              <button 
                onClick={toggleMute}
                className={cn(
                  "w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
                  isMuted 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                    : "bg-[var(--color-foreground)] text-[var(--color-background)]"
                )}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              
              <div className="flex-1 w-full space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Master Volume</span>
                  <span className="text-sm font-mono tracking-widest">{isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}</span>
                </div>
                <div className="relative h-2 bg-[var(--color-border)] rounded-full overflow-hidden flex items-center group/slider">
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
          </motion.div>

          {/* --- TYPOGRAPHY BENTO --- */}
          <motion.div variants={itemVariants} className="md:col-span-12 rounded-3xl bg-[var(--color-muted)]/40 border border-[var(--color-border)] backdrop-blur-xl overflow-hidden relative group p-8 hover:border-[var(--card-hover-border)] hover:bg-[var(--card-hover-bg)] transition-all duration-500">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="w-full md:w-1/3 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2 mb-2">
                    <Type size={14} /> {t('settings.typography.title', 'Typography')}
                  </h2>
                  <p className="text-xs text-[var(--color-muted-foreground)] font-sans leading-relaxed">
                    Customize the visual reading experience. Scale affects global layout dimensions.
                  </p>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">{t('settings.font.size', 'Scale')}</span>
                    <span className="text-sm font-mono tracking-widest text-[var(--color-foreground)]">{Math.round(fontSizeMultiplier * 100)}%</span>
                  </div>
                  <div className="relative h-2 bg-[var(--color-border)] rounded-full flex items-center">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-[var(--color-foreground)] rounded-full"
                      style={{ width: `${((fontSizeMultiplier - 0.8) / 0.7) * 100}%` }}
                    />
                    <input
                      type="range" min="0.8" max="1.5" step="0.05"
                      value={fontSizeMultiplier}
                      onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRESET_FONTS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.value)}
                    className={cn(
                      "group/font relative flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 text-left overflow-hidden",
                      fontFamily === font.value 
                        ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]" 
                        : "bg-black/20 border-[var(--color-border)] hover:border-white/30 text-[var(--color-foreground)]"
                    )}
                  >
                    <span className={cn("text-xs uppercase tracking-widest font-mono mb-4", fontFamily === font.value ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>
                      {font.id}
                    </span>
                    <span 
                      style={{ fontFamily: font.value }} 
                      className="text-2xl whitespace-nowrap overflow-hidden text-ellipsis w-full"
                    >
                      {font.label}
                    </span>
                    {fontFamily === font.value && (
                      <div className="absolute top-6 right-6">
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* --- STORAGE BENTO --- */}
          <motion.div variants={itemVariants} className="md:col-span-12 rounded-3xl bg-[var(--color-muted)]/40 border border-[var(--color-border)] backdrop-blur-xl overflow-hidden relative group p-8 hover:border-[var(--card-hover-border)] hover:bg-[var(--card-hover-bg)] transition-all duration-500">
            <div className="mb-8">
              <h2 className="text-sm font-mono tracking-[0.2em] text-[var(--color-muted-foreground)] uppercase flex items-center gap-2 mb-2">
                <Database size={14} /> {t('settings.storage.title', 'Storage & Data')}
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)] font-sans">
                {t('settings.save.subtitle', 'Manage local save files and configurations')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Export */}
              <button
                onClick={handleExportData}
                className="group/btn flex flex-col items-start justify-between h-32 p-6 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 hover:border-white/30 transition-all text-left"
              >
                <div className="p-2 bg-[var(--color-border)] rounded-lg text-[var(--color-foreground)] group-hover/btn:scale-110 group-hover/btn:-translate-y-1 transition-transform">
                  <Download size={20} />
                </div>
                <div>
                  <span className="block text-sm font-display font-medium mb-1">{t('settings.save.export', 'Export Data')}</span>
                  <span className="block text-xs font-sans text-[var(--color-muted-foreground)]">Backup to local disk</span>
                </div>
              </button>
              
              {/* Import */}
              <label className="group/btn flex flex-col items-start justify-between h-32 p-6 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 hover:border-white/30 transition-all text-left cursor-pointer">
                <div className="p-2 bg-[var(--color-border)] rounded-lg text-[var(--color-foreground)] group-hover/btn:scale-110 group-hover/btn:-translate-y-1 transition-transform">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="block text-sm font-display font-medium mb-1">{t('settings.save.import', 'Import Data')}</span>
                  <span className="block text-xs font-sans text-[var(--color-muted-foreground)]">Restore from JSON</span>
                </div>
                <input 
                  type="file" accept=".json" className="hidden" 
                  onChange={handleImportData}
                />
              </label>

              {/* Clear */}
              <button
                onClick={handleClearData}
                className="group/btn flex flex-col items-start justify-between h-32 p-6 rounded-2xl border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 hover:border-red-500/50 transition-all text-left"
              >
                <div className="p-2 bg-red-950/50 border border-red-900/50 rounded-lg text-red-500 group-hover/btn:scale-110 group-hover/btn:-translate-y-1 transition-transform">
                  <Trash2 size={20} />
                </div>
                <div>
                  <span className="block text-sm font-display font-medium text-red-400 mb-1">{t('settings.save.clear', 'Wipe Data')}</span>
                  <span className="block text-xs font-sans text-red-500/60">Irreversible action</span>
                </div>
              </button>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};
