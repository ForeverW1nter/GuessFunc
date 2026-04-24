import { useEffect, useMemo, useState } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ModuleRegistry } from '../../core/ModuleRegistry';
import { HubPage } from '../../modules/hub/HubPage';
import { PageTransition } from '../ui/PageTransition';
import { CommandBar } from '../ui/CommandBar';

const AppLayout = () => {
  return (
    <div className="relative min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors duration-500 overflow-x-hidden">
      <PageTransition />
      <CommandBar />
    </div>
  );
};

export const AppRouter = () => {
  const [routeUpdateKey, setRouteUpdateKey] = useState(0);

  useEffect(() => {
    const updateRoutes = () => {
      setRouteUpdateKey(prev => prev + 1);
    };

    return ModuleRegistry.subscribeToRoutes(updateRoutes);
  }, []);

  const router = useMemo(() => {
    const modRoutes = ModuleRegistry.getModuleRoutes();
    
    return createHashRouter([
      {
        path: '/',
        element: <AppLayout />, // Root shell
        children: [
          { index: true, element: <HubPage /> },
          // Placeholder routes for the other core pages
          { path: 'archive', element: <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">ARCHIVE SYSTEM OFFLINE</div> },
          { path: 'workshop', element: <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">GLOBAL NETWORK OFFLINE</div> },
          { path: 'creator', element: <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">CREATOR TERMINAL OFFLINE</div> },
          { path: 'settings', element: <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">SETTINGS OFFLINE</div> },
          ...modRoutes,
        ],
      },
    ]);
  }, [routeUpdateKey]);

  return <RouterProvider key={routeUpdateKey} router={router} />;
};
