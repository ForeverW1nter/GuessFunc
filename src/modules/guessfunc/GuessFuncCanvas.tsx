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
      {/* A subtle glowing backdrop behind the graph */}
      <div className="absolute inset-0 bg-[var(--accent-guessfunc)] opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />
      <GraphRenderer
        expression={expression}
        parameters={params}
        targetExpression={level.targetExpression}
        targetParameters={params} // Target curve ALSO uses current sliders!
        lineColor={currentThemeColor}
        height={DEFAULT_HEIGHT} 
      />
    </div>
  );
};
