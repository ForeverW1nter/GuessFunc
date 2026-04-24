import React, { useEffect, useState, useMemo } from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ModuleRegistry } from '../../core/ModuleRegistry';
import { HubPage } from '../../modules/hub/HubPage';
import { PageTransition } from '../ui/PageTransition';
import { CommandBar } from '../ui/CommandBar';

const AppLayout = () => {
  return (
    <>
      <PageTransition>
        <Outlet />
      </PageTransition>
      <CommandBar />
    </>
  );
};

/**
 * Foundation Router Module
 * Uses HashRouter to ensure static deployment compatibility (e.g., GitHub Pages).
 */
export const AppRouter = () => {
  const [routeUpdateKey, setRouteUpdateKey] = useState(0);

  // 监听路由变化，只更新 key，不直接存 router 实例到 state 中
  useEffect(() => {
    const updateRoutes = () => {
      setRouteUpdateKey(prev => prev + 1);
    };
    
    // 初始化时不需要调用，因为 useMemo 会在首次渲染时计算
    return ModuleRegistry.subscribeToRoutes(updateRoutes);
  }, []);

  // 使用 useMemo 并在依赖项中加入 routeUpdateKey，确保只在需要时重新创建 router
  const router = useMemo(() => {
    const modRoutes = ModuleRegistry.getModuleRoutes();
    
    // We wrap all routes with PageTransition to get smooth entry/exit animations
    const wrappedModRoutes: RouteObject[] = modRoutes.map(route => ({
      ...route,
      element: route.element ? <PageTransition>{route.element}</PageTransition> : undefined
    }));

    return createHashRouter([
      {
        path: '/',
        element: <AppLayout />, // Root shell
        children: [
          { index: true, element: <HubPage /> },
          // Placeholder routes for the other core pages
          { path: 'archive', element: <div className="p-20 text-center font-mono">ARCHIVE SYSTEM OFFLINE</div> },
          { path: 'workshop', element: <div className="p-20 text-center font-mono">GLOBAL NETWORK OFFLINE</div> },
          { path: 'creator', element: <div className="p-20 text-center font-mono">CREATOR TERMINAL OFFLINE</div> },
          { path: 'settings', element: <div className="p-20 text-center font-mono">SETTINGS OFFLINE</div> },
          ...wrappedModRoutes,
        ],
      },
    ]);
  }, [routeUpdateKey]);

  // 使用 key 强制 RouterProvider 在 router 实例改变时重新挂载，
  // 防止 React Router v6+ 抛出 "You cannot change <RouterProvider router>" 错误
  return <RouterProvider key={routeUpdateKey} router={router} />;
};
