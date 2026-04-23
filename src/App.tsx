import React, { useEffect, useState } from 'react';
import { UIProvider } from './foundation/ui/UIManager';
import { AppRouter } from './foundation/router/AppRouter';
import { initGuessFuncModule } from './modules/guessfunc';

const App = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error; // 强制将异步错误抛给 Error Boundary
  }

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        // In a real scenario, this would load remote modules based on a manifest.
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

  if (!initialized) return <div className="p-8 text-[var(--color-muted-foreground)]">Initializing Microkernel...</div>;

  return (
    <UIProvider>
      <AppRouter />
    </UIProvider>
  );
};

export default App;
