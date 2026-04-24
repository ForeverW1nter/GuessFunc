import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UIProvider } from "@/foundation/ui/UIManager";
import { AppRouter } from "@/foundation/router/AppRouter";
import { useSystemUIStore } from "@/foundation/ui/useSystemUIStore";
import { initGuessFuncModule } from "@/modules/guessfunc";
import { initHubModule } from "@/modules/hub";

const BOOTSTRAP_DELAY = 600;

const App = () => {
  const { t } = useTranslation();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Apply font family and size globally from the Zustand store
  const { fontFamily, fontSizeMultiplier } = useSystemUIStore();

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-display', fontFamily);
    document.documentElement.style.setProperty('--app-font-sans', fontFamily);
    document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`;
  }, [fontFamily, fontSizeMultiplier]);

  if (error) {
    throw error;
  }

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, BOOTSTRAP_DELAY));

        await initHubModule();
        await initGuessFuncModule();
        if (isMounted) {
          setInitialized(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-[1px] bg-[var(--color-border)] relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-[var(--color-primary)] animate-[slide_1.5s_ease-in-out_infinite]" />
          </div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase opacity-50">
            {t("common.booting", "Booting Microkernel...")}
          </p>
        </div>
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <UIProvider>
      <AppRouter />
    </UIProvider>
  );
};

export default App;
