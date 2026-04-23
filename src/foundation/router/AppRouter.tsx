import React, { useEffect, useState } from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ModuleRegistry } from '../../core/ModuleRegistry';
import { Hub } from '../../hub/Hub';

/**
 * Foundation Router Module
 * Uses HashRouter to ensure static deployment compatibility (e.g., GitHub Pages).
 */
export const AppRouter = () => {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    // Dynamic update when new modules register
    const updateRoutes = () => {
      const modRoutes = ModuleRegistry.getModuleRoutes();
      const newRouter = createHashRouter([
        {
          path: '/',
          element: <Outlet />, // Root shell
          children: [
            { index: true, element: <Hub /> },
            ...modRoutes,
          ],
        },
      ]);
      setRoutes([newRouter]);
    };

    updateRoutes();
    return ModuleRegistry.subscribeToRoutes(updateRoutes);
  }, []);

  if (routes.length === 0) return <div>Loading Core...</div>;

  return <RouterProvider router={routes[0]} />;
};
