import { useTranslation } from 'react-i18next';
import { Theme } from 'mafs';
import { GraphRenderer } from './components/GraphRenderer';
import { useGuessFuncStore } from './store/guessFuncStore';

const DEFAULT_HEIGHT = 800;

export const GuessFuncCanvas = () => {
  const { functions, params, level, isSuccess } = useGuessFuncStore();
  const { t } = useTranslation();

  const currentThemeColor = isSuccess ? Theme.green : Theme.blue;

  if (!level) {
    return (
      <div className="w-full h-full relative group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl overflow-hidden flex items-center justify-center font-mono text-[var(--color-muted-foreground)] uppercase">
        {t('guessFunc.awaitingSignal', 'AWAITING SIGNAL DATA...')}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group rounded-[2rem] border border-[var(--color-border)] bg-[#050505] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Dynamic Background Glow based on success state */}
      <div className={`absolute inset-0 opacity-20 blur-[100px] transition-all duration-1000 pointer-events-none ${isSuccess ? 'bg-green-500/40' : 'bg-[var(--accent-guessfunc)]/30'}`} />
      
      {/* High-tech grid background overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] z-10 mix-blend-screen"
        style={{ 
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `, 
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px' 
        }}
      />
      
      {/* Subtle CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+Cjwvc3ZnPg==')] opacity-30 z-20 mix-blend-overlay" />

      {/* Modern HUD Elements */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-[var(--accent-guessfunc)] shadow-[0_0_8px_var(--accent-guessfunc)]'} animate-pulse`} />
          <span className="font-mono text-xs font-bold tracking-widest text-[var(--color-foreground)] opacity-80">
            SYS.OP.CORE // {isSuccess ? 'SYNCED' : 'ANALYZING'}
          </span>
        </div>
        <div className="w-32 h-[1px] bg-gradient-to-r from-[var(--color-border)] to-transparent mt-1" />
      </div>

      {/* Decorative Crosshairs */}
      <div className="absolute top-[20%] left-0 w-4 h-[1px] bg-[var(--color-border)] opacity-50 z-20 pointer-events-none" />
      <div className="absolute top-[80%] right-0 w-4 h-[1px] bg-[var(--color-border)] opacity-50 z-20 pointer-events-none" />
      <div className="absolute top-0 left-[20%] w-[1px] h-4 bg-[var(--color-border)] opacity-50 z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-[20%] w-[1px] h-4 bg-[var(--color-border)] opacity-50 z-20 pointer-events-none" />

      {/* Graph Area */}
      <div className="relative w-full h-full z-0 p-2">
        <GraphRenderer
          functions={functions}
          parameters={params}
          targetExpression={level.targetExpression}
          targetParameters={params}
          lineColor={currentThemeColor}
          height={DEFAULT_HEIGHT} 
        />
      </div>

      {/* Telemetry overlay - Bottom Right now for better balance */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none font-mono text-[10px] text-right flex flex-col gap-1 opacity-60">
        <span className="text-[var(--color-muted-foreground)]">TARGET: {level.targetExpression}</span>
        <span className="text-[var(--color-muted-foreground)]">DOMAIN: [-10, 10]</span>
        <div className="flex justify-end gap-1 mt-1">
          {Array.from({length: 5}).map((_, i) => (
            <div key={i} className={`w-1 h-3 ${i < Object.keys(params).length ? 'bg-[var(--accent-guessfunc)]' : 'bg-[var(--color-border)]'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
