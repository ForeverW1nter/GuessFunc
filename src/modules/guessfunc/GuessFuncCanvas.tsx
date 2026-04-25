import { useTranslation } from 'react-i18next';
import { Theme } from 'mafs';
import { GraphRenderer } from './components/GraphRenderer';
import { useGuessFuncStore } from './store/guessFuncStore';

const DEFAULT_HEIGHT = 800;

export const GuessFuncCanvas = () => {
  const { expression, params, level, isSuccess } = useGuessFuncStore();
  const { t } = useTranslation();

  const currentThemeColor = isSuccess ? Theme.green : Theme.blue;

  if (!level) {
    return (
      <div className="w-full h-full relative group rounded-3xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl overflow-hidden flex items-center justify-center font-mono text-[var(--color-muted-foreground)] uppercase">
        {t('guessFunc.awaitingSignal', 'AWAITING SIGNAL DATA...')}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group rounded-3xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-10 blur-3xl transition-opacity duration-700 pointer-events-none ${isSuccess ? 'bg-green-500' : 'bg-[var(--accent-guessfunc)]'}`} />
      
      {/* Cyberpunk grid background overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 mix-blend-overlay"
        style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMSkiLz4KPC9zdmc+')] opacity-50 z-20" />

      {/* Decorative Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[var(--color-muted-foreground)] opacity-30 z-20 pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[var(--color-muted-foreground)] opacity-30 z-20 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[var(--color-muted-foreground)] opacity-30 z-20 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[var(--color-muted-foreground)] opacity-30 z-20 pointer-events-none" />

      {/* Graph Area */}
      <div className="relative w-full h-full z-0">
        <GraphRenderer
          expression={expression}
          parameters={params}
          targetExpression={level.targetExpression}
          targetParameters={params}
          lineColor={currentThemeColor}
          height={DEFAULT_HEIGHT} 
        />
      </div>

      {/* Telemetry overlay */}
      <div className="absolute bottom-6 left-8 z-20 pointer-events-none font-mono text-[10px] text-[var(--color-muted-foreground)] opacity-50 flex flex-col gap-1">
        <span>{'>'} SYSTEM.RENDER_ACTIVE</span>
        <span>{'>'} DOMAIN: [-10, 10]</span>
        {isSuccess && <span className="text-green-500 font-bold">{'>'} MATCH_FOUND: TRUE</span>}
      </div>
    </div>
  );
};
