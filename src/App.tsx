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
import { useUIStore } from './store/useUIStore';
import { CreateModePage } from './features/creation/components/CreateModePage';
import { GAME_CONSTANTS } from './utils/constants';
import i18n from './i18n';

const Layout = () => (
  <div className="absolute inset-0 flex flex-row w-full overflow-hidden bg-app-bg text-app-text">
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
    if (routeId === 'random' || routeId === 'share' || routeId === 'custom') {
      const gameStore = useGameStore.getState();
      
      // Attempt to decode levelId if it contains base64 encoded target function
      if (levelId && levelId !== '1') {
        try {
          const decoded = decodeURIComponent(escape(atob(levelId)));
          let levelData;
          try {
            levelData = JSON.parse(decoded);
          } catch {
            levelData = { t: decoded };
          }
          
          const target = levelData.t || levelData;
          const levelParams = levelData.p || {};
          const diff = levelData.d !== undefined ? Number(levelData.d) : 0;
          const wp = levelData.wp !== undefined ? Boolean(levelData.wp) : false;

          if (target && (gameStore.gameMode !== routeId || gameStore.targetFunction !== target)) {
            gameStore.setTargetFunction(target, levelParams, routeId as 'random' | 'share' | 'custom');
            if (routeId === 'random') {
              gameStore.setRandomConfig(diff, wp);
            }
            return;
          }
        } catch (e) {
          console.error(`解析${routeId === 'random' ? '随机' : routeId === 'share' ? '分享' : '自定义'}关卡参数失败:`, e);
          if (routeId === 'share') {
            useUIStore.getState().addToast(i18n.t('sidebar.shareParseError'), 'error');
            navigate('/', { replace: true });
            return;
          }
        }
      }

      // Only set random target if it's currently missing
      if (routeId === 'random') {
        if (gameStore.gameMode !== 'random' || !gameStore.targetFunction || gameStore.targetFunction === 'x^2') {
           // Default random fallback, usually overridden by UI logic setting the function before routing
           gameStore.setTargetFunction('x', {}, 'random');
        }
      } else if (routeId === 'share' || routeId === 'custom') {
        // For share/custom, if no valid target, redirect to home
        if (!gameStore.targetFunction || gameStore.targetFunction === 'x^2') {
          navigate('/', { replace: true });
        }
      }
      return;
    }
    
    if (routeId && !GAME_CONSTANTS.NON_STORY_ROUTES.includes(routeId)) {
      if (chapterId && levelId) {
        const storyStore = useStoryStore.getState();
        const gameStore = useGameStore.getState();
        const route = storyStore.getRoute(routeId);
        const chapter = storyStore.getChapter(routeId, chapterId);
        
        if (route && chapter) {
          const chapterIndex = route.chapters.findIndex(c => c.id === chapterId);
          const levelIndex = chapter.levels.findIndex(l => l.id === levelId);
          
          if (levelIndex >= 0) {
            const completedLevels = gameStore.completedLevels;
            const isAssistMode = useUIStore.getState().isAssistMode;
            
            // Check chapter lock status
            const previousChapter = chapterIndex > 0 ? route.chapters[chapterIndex - 1] : null;
            let isChapterUnlocked = true;
            if (previousChapter && !isAssistMode) {
              const prevChapterLevelIds = previousChapter.levels.map(l => `${routeId}/${previousChapter.id}/${l.id}`);
              const prevCompletedCount = prevChapterLevelIds.filter(id => completedLevels.includes(id)).length;
              const requiredCount = Math.ceil(prevChapterLevelIds.length * 0.8);
              const prevUnfinishedCount = prevChapterLevelIds.length - prevCompletedCount;
              isChapterUnlocked = prevCompletedCount >= requiredCount || prevUnfinishedCount <= 3;
            }

            if (!isChapterUnlocked) {
              navigate(`/game/${routeId}/${route.chapters[0].id}/${route.chapters[0].levels[0].id}`, { replace: true });
              return;
            }

            // Check level lock status
            const chapterCompletedCount = chapter.levels.filter(l => completedLevels.includes(`${routeId}/${chapterId}/${l.id}`)).length;
            const isLocked = !isAssistMode && levelIndex >= chapterCompletedCount + 3;

            if (isLocked) {
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
    if (encodedLevel) {
      navigate(`/game/share/1/${encodedLevel}`, { replace: true });
      return;
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
