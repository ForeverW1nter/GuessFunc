import React, { useEffect } from 'react';
import { createHashRouter, RouterProvider, Navigate, Outlet, useParams, useNavigate } from 'react-router-dom';
import { GameFeature } from './features/game/GameFeature';
import { Sidebar } from './features/ui/components/Sidebar';
import { Topbar } from './features/ui/components/Topbar';
import { SettingsModal } from './features/ui/components/SettingsModal';
import { ToastContainer } from './features/ui/components/ToastContainer';
import { LevelSelectModal } from './features/story/components/LevelSelectModal';
import { AiChatButton } from './features/ui/components/AiChatButton';
import { AiChatModal } from './features/ui/components/AiChatModal';
import { RandomChallengeModal } from './features/ui/components/RandomChallengeModal';
import { useGameStore } from './store/useGameStore';
import { useStoryStore } from './store/useStoryStore';
import { CreateModePage } from './features/creation/components/CreateModePage';
import './i18n';

const Layout = () => (
  <div className="flex flex-row h-screen w-screen overflow-hidden bg-app-bg text-app-text">
    <Sidebar />
    <main className="flex-1 relative flex flex-col overflow-hidden">
      <Topbar />
      <div className="flex-1 relative w-full h-full">
        <GameFeature />
        <Outlet />
      </div>
    </main>
    <SettingsModal />
    <LevelSelectModal />
    <RandomChallengeModal />
    <AiChatButton />
    <AiChatModal />
    <ToastContainer />
  </div>
);

const LevelRoute = () => {
  const { routeId, chapterId, levelId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (routeId && routeId !== 'random' && routeId !== 'create' && routeId !== 'custom' && routeId !== 'share') {
      if (chapterId && levelId) {
        const storyStore = useStoryStore.getState();
        const gameStore = useGameStore.getState();
        const chapter = storyStore.getChapter(routeId, chapterId);
        
        if (chapter) {
          const levelIndex = chapter.levels.findIndex(l => l.id === levelId);
          if (levelIndex > 0) {
            // 检查前一关是否已经通关
            const prevLevelId = chapter.levels[levelIndex - 1].id;
            if (!gameStore.isLevelCompleted(prevLevelId)) {
              // 未解锁，回退到第一关或最新解锁的关卡
              navigate(`/game/${routeId}/${chapterId}/${chapter.levels[0].id}`, { replace: true });
              return;
            }
          }
          gameStore.loadLevel(routeId, chapterId, levelId);
        }
      }
    }
  }, [routeId, chapterId, levelId, navigate]);

  return null;
};

const ShareRoute = () => {
  const { encodedLevel } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (encodedLevel) {
        const decoded = decodeURIComponent(escape(atob(encodedLevel)));
        let levelData;
        try {
          levelData = JSON.parse(decoded);
        } catch {
          levelData = { t: decoded };
        }
        
        const target = levelData.t || levelData;
        const levelParams = levelData.p || {};
        if (target) {
          useGameStore.getState().setTargetFunction(target, levelParams, 'share');
          navigate('/game/share/1/1', { replace: true });
          return;
        }
      }
    } catch (e) {
      console.error("解析分享关卡失败:", e); // keep it, dev only
    }
    navigate('/', { replace: true });
  }, [encodedLevel, navigate]);

  return null;
};

const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/game/random/1/1" replace />
      },
      {
        path: "create",
        element: <CreateModePage />
      },
      {
        path: "game/:routeId/:chapterId/:levelId",
        element: <LevelRoute />
      },
      {
        path: "share/:encodedLevel",
        element: <ShareRoute />
      },
      {
        path: "*",
        element: <Navigate to="/game/random/1/1" replace />
      }
    ]
  }
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
