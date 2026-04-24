import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSystemUIStore } from '../useSystemUIStore';
import { useUI } from '../UIManager';
import { Button } from '../components/Button';
import { Slider } from '../components/Slider';
import { RadioCard } from '../components/RadioCard';

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
          <Slider 
            value={localFontSize}
            onChange={setLocalFontSize}
            min={MIN_FONT_SCALE}
            max={MIN_FONT_SCALE + FONT_SCALE_RANGE}
            step={0.05}
          />
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
            <RadioCard
              key={font.id}
              title={font.label}
              subtitle={font.id}
              selected={fontFamily === font.value}
              onSelect={() => setFontFamily(font.value)}
              layout="horizontal"
              titleClass="text-sm md:text-base font-medium tracking-wide"
              icon={
                <div className="text-2xl md:text-3xl w-12 md:w-16 text-center opacity-80" style={{ fontFamily: font.value }}>
                  Aa
                </div>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
