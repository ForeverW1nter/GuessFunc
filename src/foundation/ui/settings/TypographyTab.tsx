import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSystemUIStore } from '../useSystemUIStore';
import { useUI } from '../UIManager';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '../components/Button';

const MIN_FONT_SCALE = 0.8;
const FONT_SCALE_RANGE = 0.7;

export const TypographyTab = () => {
  const { fontFamily, setFontFamily, fontSizeMultiplier, setFontSizeMultiplier } = useSystemUIStore();
  const { toast } = useUI();
  const { t } = useTranslation();

  const [localFontSize, setLocalFontSize] = useState(fontSizeMultiplier);
  const [prevFontSize, setPrevFontSize] = useState(fontSizeMultiplier);

  if (fontSizeMultiplier !== prevFontSize) {
    setLocalFontSize(fontSizeMultiplier);
    setPrevFontSize(fontSizeMultiplier);
  }

  const handleApplyFontSize = () => {
    setFontSizeMultiplier(localFontSize);
    toast({ title: t('settings.typography.applied', 'Font scale applied'), type: 'success' });
  };

  const PRESET_FONTS = [
    { id: 'default', label: t('settings.typography.defaultFont', 'Default'), value: '"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
    { id: 'serif', label: t('settings.typography.serifFont', 'Serif'), value: 'ui-serif, Georgia, "Noto Serif CJK SC", "Songti SC", serif' },
    { id: 'mono', label: t('settings.typography.monoFont', 'Mono'), value: '"Space Grotesk", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "PingFang SC", "Microsoft YaHei", monospace' },
    { id: 'sans', label: t('settings.typography.sansFont', 'Sans'), value: 'ui-sans-serif, "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">
          {t('settings.typography.title', 'Typography')}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('settings.typography.desc', 'Customize readability and aesthetics.')}
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-end">
          <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">
            {t('settings.typography.scale', 'Interface Scale')}
          </span>
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
          <Button
            size="sm"
            disabled={localFontSize === fontSizeMultiplier}
            onClick={handleApplyFontSize}
          >
            {t('settings.typography.apply', 'Apply')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">
          {t('settings.typography.typeface', 'Typeface')}
        </span>
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
  );
};
