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

const SPRING_STIFFNESS = 350;
const SPRING_DAMPING = 28;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]; // eslint-disable-line @typescript-eslint/no-magic-numbers
const MIN_FONT_SCALE = 0.8;
const FONT_SCALE_RANGE = 0.7;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: SPRING_STIFFNESS, damping: SPRING_DAMPING } }
};

export const SettingsPage = () => {
  const { language, setLanguage, fontFamily, setFontFamily, fontSizeMultiplier, setFontSizeMultiplier } = useSystemUIStore();
  const { volume, isMuted, setVolume, toggleMute } = useAudioStore();
  const { completedLevels, seenChapters, readFiles, clearProgress } = useProgressStore();
  const { toast } = useUI();
  const { t } = useTranslation();

  const PRESET_FONTS = [
    { id: 'default', label: t('settings.font.default', 'System'), value: '"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
    { id: 'serif', label: t('settings.font.serif', 'Serif'), value: 'ui-serif, Georgia, "Noto Serif CJK SC", "Songti SC", serif' },
    { id: 'mono', label: t('settings.font.mono', 'Mono'), value: '"Space Grotesk", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "PingFang SC", "Microsoft YaHei", monospace' },
    { id: 'sans', label: t('settings.font.sans', 'Sans'), value: 'ui-sans-serif, "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
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
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col px-4 py-8 md:p-12 relative overflow-x-hidden selection:bg-[var(--color-foreground)] selection:text-[var(--color-background)]">
      
      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent-settings)] blur-[120px] pointer-events-none opacity-[0.04]" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500 blur-[120px] pointer-events-none opacity-[0.04]" />

      <div className="w-full max-w-4xl mx-auto flex flex-col h-full z-10 pb-24 md:pb-32">
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="mb-8 md:mb-16 flex items-center justify-between border-b border-[var(--color-border)] pb-6 md:pb-8"
        >
          <div>
            <div className="flex items-center gap-3 md:gap-4 mb-2">
              <div className="p-2.5 md:p-3 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-xl md:rounded-2xl">
                <Settings className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase font-display">
                {t('settings.title', 'Settings')}
              </h1>
            </div>
            <p className="text-xs md:text-sm font-mono text-[var(--color-muted-foreground)] tracking-[0.1em] md:tracking-[0.2em] uppercase ml-12 md:ml-16">
              {t('settings.subtitle', 'System Preferences')}
            </p>
          </div>
        </motion.header>

        {/* Settings List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 md:space-y-10"
        >
          
          {/* --- LANGUAGE SECTION --- */}
          <motion.section variants={itemVariants} className="flex flex-col md:flex-row gap-4 md:gap-12">
            <div className="w-full md:w-1/3 shrink-0">
              <h2 className="text-sm font-mono tracking-[0.15em] text-[var(--color-foreground)] uppercase flex items-center gap-2 mb-2">
                <Globe size={16} className="text-[var(--color-muted-foreground)]" /> {t('settings.localization.title', 'Localization')}
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)] font-sans">
                {t('settings.language.subtitle', 'Change system display language')}
              </p>
            </div>
            
            <div className="w-full md:w-2/3 grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "relative flex flex-col items-start justify-center py-4 px-5 rounded-2xl border transition-all duration-300 group",
                  language === 'en' 
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)] shadow-md" 
                    : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
                )}
              >
                <span className="font-mono tracking-widest text-sm uppercase mb-1">English</span>
                <span className={cn("text-xs font-sans", language === 'en' ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>System Default</span>
                {language === 'en' && <CheckCircle2 size={16} className="absolute top-4 right-4" />}
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={cn(
                  "relative flex flex-col items-start justify-center py-4 px-5 rounded-2xl border transition-all duration-300 group",
                  language === 'zh' 
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)] shadow-md" 
                    : "bg-[var(--color-muted)]/50 border-[var(--color-border)] text-[var(--color-foreground)] hover:border-white/30"
                )}
              >
                <span className="font-sans font-medium tracking-widest text-sm mb-1">中文 (简体)</span>
                <span className={cn("text-xs font-sans", language === 'zh' ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>翻译支持</span>
                {language === 'zh' && <CheckCircle2 size={16} className="absolute top-4 right-4" />}
              </button>
            </div>
          </motion.section>

          <div className="h-[1px] w-full bg-[var(--color-border)]/50" />

          {/* --- AUDIO SECTION --- */}
          <motion.section variants={itemVariants} className="flex flex-col md:flex-row gap-4 md:gap-12">
            <div className="w-full md:w-1/3 shrink-0">
              <h2 className="text-sm font-mono tracking-[0.15em] text-[var(--color-foreground)] uppercase flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-[var(--color-muted-foreground)]" /> {t('settings.audio.title', 'Audio Output')}
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)] font-sans">
                Master volume control and mute toggle
              </p>
            </div>
            
            <div className="w-full md:w-2/3 bg-[var(--color-muted)]/50 p-5 md:p-6 rounded-2xl border border-[var(--color-border)] flex items-center gap-4 md:gap-6">
              <button 
                onClick={toggleMute}
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
                  isMuted 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                    : "bg-[var(--color-foreground)] text-[var(--color-background)]"
                )}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">Master</span>
                  <span className="text-xs md:text-sm font-mono tracking-widest">{isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}</span>
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
          </motion.section>

          <div className="h-[1px] w-full bg-[var(--color-border)]/50" />

          {/* --- TYPOGRAPHY SECTION --- */}
          <motion.section variants={itemVariants} className="flex flex-col md:flex-row gap-4 md:gap-12">
            <div className="w-full md:w-1/3 shrink-0">
              <h2 className="text-sm font-mono tracking-[0.15em] text-[var(--color-foreground)] uppercase flex items-center gap-2 mb-2">
                <Type size={16} className="text-[var(--color-muted-foreground)]" /> {t('settings.typography.title', 'Typography')}
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)] font-sans leading-relaxed">
                Customize the visual reading experience. Scale affects global layout dimensions.
              </p>
            </div>
            
            <div className="w-full md:w-2/3 space-y-6">
              {/* Font Size */}
              <div className="bg-[var(--color-muted)]/50 p-5 md:p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">{t('settings.font.size', 'Scale')}</span>
                  <span className="text-sm font-mono tracking-widest text-[var(--color-foreground)]">{Math.round(fontSizeMultiplier * 100)}%</span>
                </div>
                <div className="relative h-2 bg-[var(--color-border)] rounded-full flex items-center">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-[var(--color-foreground)] rounded-full"
                      style={{ width: `${((fontSizeMultiplier - MIN_FONT_SCALE) / FONT_SCALE_RANGE) * 100}%` }}
                    />
                    <input
                      type="range" min="0.8" max="1.5" step="0.05"
                    value={fontSizeMultiplier}
                    onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Font Family Selection */}
              <div className="grid grid-cols-2 gap-3">
                {PRESET_FONTS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.value)}
                    className={cn(
                      "group/font relative flex flex-col items-start p-4 md:p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden",
                      fontFamily === font.value 
                        ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)] shadow-md" 
                        : "bg-[var(--color-muted)]/50 border-[var(--color-border)] hover:border-white/30 text-[var(--color-foreground)]"
                    )}
                  >
                    <span className={cn("text-[10px] md:text-xs uppercase tracking-[0.15em] font-mono mb-2 md:mb-3", fontFamily === font.value ? "text-[var(--color-background)]/70" : "text-[var(--color-muted-foreground)]")}>
                      {font.id}
                    </span>
                    <span 
                      style={{ fontFamily: font.value }} 
                      className="text-lg md:text-xl font-medium tracking-tight w-full break-words leading-tight"
                    >
                      {font.label}
                    </span>
                    {fontFamily === font.value && (
                      <CheckCircle2 size={16} className="absolute top-4 right-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          <div className="h-[1px] w-full bg-[var(--color-border)]/50" />

          {/* --- STORAGE SECTION --- */}
          <motion.section variants={itemVariants} className="flex flex-col md:flex-row gap-4 md:gap-12">
            <div className="w-full md:w-1/3 shrink-0">
              <h2 className="text-sm font-mono tracking-[0.15em] text-[var(--color-foreground)] uppercase flex items-center gap-2 mb-2">
                <Database size={16} className="text-[var(--color-muted-foreground)]" /> {t('settings.storage.title', 'Storage & Data')}
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)] font-sans">
                {t('settings.save.subtitle', 'Manage local save files and configurations')}
              </p>
            </div>
            
            <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Export */}
              <button
                onClick={handleExportData}
                className="group/btn flex flex-row sm:flex-col items-center sm:items-start justify-start sm:justify-between gap-4 sm:gap-0 p-4 md:p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 hover:bg-white/5 hover:border-white/30 transition-all text-left sm:h-32"
              >
                <div className="p-2 bg-[var(--color-border)] rounded-lg text-[var(--color-foreground)] sm:group-hover/btn:scale-110 sm:group-hover/btn:-translate-y-1 transition-transform">
                  <Download size={18} />
                </div>
                <div>
                  <span className="block text-sm font-display font-medium mb-0.5">{t('settings.save.export', 'Export Data')}</span>
                  <span className="block text-xs font-sans text-[var(--color-muted-foreground)]">Backup to disk</span>
                </div>
              </button>
              
              {/* Import */}
              <label className="group/btn flex flex-row sm:flex-col items-center sm:items-start justify-start sm:justify-between gap-4 sm:gap-0 p-4 md:p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 hover:bg-white/5 hover:border-white/30 transition-all text-left sm:h-32 cursor-pointer">
                <div className="p-2 bg-[var(--color-border)] rounded-lg text-[var(--color-foreground)] sm:group-hover/btn:scale-110 sm:group-hover/btn:-translate-y-1 transition-transform">
                  <Upload size={18} />
                </div>
                <div>
                  <span className="block text-sm font-display font-medium mb-0.5">{t('settings.save.import', 'Import Data')}</span>
                  <span className="block text-xs font-sans text-[var(--color-muted-foreground)]">Restore JSON</span>
                </div>
                <input 
                  type="file" accept=".json" className="hidden" 
                  onChange={handleImportData}
                />
              </label>

              {/* Clear */}
              <button
                onClick={handleClearData}
                className="group/btn flex flex-row sm:flex-col items-center sm:items-start justify-start sm:justify-between gap-4 sm:gap-0 p-4 md:p-5 rounded-2xl border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 hover:border-red-500/50 transition-all text-left sm:h-32"
              >
                <div className="p-2 bg-red-950/50 border border-red-900/50 rounded-lg text-red-500 sm:group-hover/btn:scale-110 sm:group-hover/btn:-translate-y-1 transition-transform">
                  <Trash2 size={18} />
                </div>
                <div>
                  <span className="block text-sm font-display font-medium text-red-400 mb-0.5">{t('settings.save.clear', 'Wipe Data')}</span>
                  <span className="block text-xs font-sans text-red-500/60">Irreversible</span>
                </div>
              </button>
            </div>
          </motion.section>

        </motion.div>
      </div>
    </div>
  );
};