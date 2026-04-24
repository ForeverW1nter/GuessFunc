import { createHashRouter, RouterProvider } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageTransition } from "@/foundation/ui/PageTransition";
import { CommandBar } from "@/foundation/ui/CommandBar";
import { SettingsPage } from "@/foundation/ui/SettingsPage";

const AppLayout = () => {
  return (
    <div className="relative min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors duration-500 overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full overflow-y-auto">
        <PageTransition />
      </div>
      <CommandBar />
    </div>
  );
};

export const AppRouter = ({ moduleRoutes }: { moduleRoutes: RouteObject[] }) => {
  const { t } = useTranslation();

  const router = createHashRouter([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        // Placeholder routes for the other core pages
        {
          path: "archive",
          element: (
            <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">
              {t('appRouter.archiveOffline', 'ARCHIVE SYSTEM OFFLINE')}
            </div>
          ),
        },
        {
          path: "workshop",
          element: (
            <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">
              {t('appRouter.networkOffline', 'GLOBAL NETWORK OFFLINE')}
            </div>
          ),
        },
        {
          path: "creator",
          element: (
            <div className="min-h-screen flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)]">
              {t('appRouter.creatorMounted', 'CREATOR TERMINAL MOUNTED EXTERNALLY')}
            </div>
          ),
        },
        {
          path: "settings",
          element: <SettingsPage />,
        },
        ...moduleRoutes,
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};
