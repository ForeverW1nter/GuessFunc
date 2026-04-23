import React, { useEffect, useState, useMemo } from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ModuleRegistry } from '../../core/ModuleRegistry';
import { Hub } from '../../hub/Hub';

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
    return createHashRouter([
      {
        path: '/',
        element: <Outlet />, // Root shell
        children: [
          { index: true, element: <Hub /> },
          ...modRoutes,
        ],
      },
    ]);
  }, [routeUpdateKey]);

  // 使用 key 强制 RouterProvider 在 router 实例改变时重新挂载，
  // 防止 React Router v6+ 抛出 "You cannot change <RouterProvider router>" 错误
  return <RouterProvider key={routeUpdateKey} router={router} />;
};
