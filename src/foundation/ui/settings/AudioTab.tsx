import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '@/foundation/audio/useAudioStore';
import { cn } from '@/utils/cn';

export const AudioTab = () => {
  const { volume, isMuted, setVolume, toggleMute } = useAudioStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">
          {t('settings.audio.title', 'Audio')}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('settings.audio.desc', 'System volume and sound effects.')}
        </p>
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
            <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">
              {t('settings.audio.master', 'Master Volume')}
            </span>
            <span className="text-sm md:text-base font-mono tracking-widest">
              {isMuted ? t('settings.audio.muted', 'MUTE') : `${Math.round(volume * 100)}%`}
            </span>
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
  );
};
