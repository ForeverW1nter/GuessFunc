import React, { useEffect, useState } from 'react';
import { UIProvider } from './foundation/ui/UIManager';
import { AppRouter } from './foundation/router/AppRouter';
import { initGuessFuncModule } from './modules/guessfunc';

export const App = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      // In a real scenario, this would load remote modules based on a manifest.
      await initGuessFuncModule();
      setInitialized(true);
    };
    bootstrap();
  }, []);

  if (!initialized) return <div className="p-8 text-[var(--color-muted-foreground)]">Initializing Microkernel...</div>;

  return (
    <UIProvider>
      <AppRouter />
    </UIProvider>
  );
};

export default App;
