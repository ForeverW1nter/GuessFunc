import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, Database, Type, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

import { GeneralTab } from './settings/GeneralTab';
import { TypographyTab } from './settings/TypographyTab';
import { AudioTab } from './settings/AudioTab';
import { StorageTab } from './settings/StorageTab';

const SPRING_STIFFNESS = 250;
const SPRING_DAMPING = 30;

type TabId = 'general' | 'typography' | 'audio' | 'storage';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: t('settings.general.tab', 'General'), icon: Globe },
    { id: 'typography', label: t('settings.typography.tab', 'Typography'), icon: Type },
    { id: 'audio', label: t('settings.audio.tab', 'Audio'), icon: Volume2 },
    { id: 'storage', label: t('settings.storage.tab', 'Storage'), icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col relative overflow-x-hidden selection:bg-[var(--color-foreground)] selection:text-[var(--color-background)]">
      
      {/* Decorative Blur Backgrounds */}
      <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent-settings)] blur-[120px] pointer-events-none opacity-[0.04]" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-foreground)] blur-[120px] pointer-events-none opacity-[0.02]" />

      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row h-full z-10 pb-20 pt-6 md:pt-10 md:pb-24 px-4 md:px-6">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 shrink-0 mb-6 md:mb-0 md:pe-6 border-b md:border-b-0 md:border-e border-[var(--color-border)]/50 pb-4 md:pb-0">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-xl">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase font-display text-balance">
              {t('settings.title', 'Settings')}
            </h1>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-mono tracking-widest uppercase transition-all duration-300 text-left whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)]",
                  activeTab === tab.id 
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)]" 
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-white/5"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="active-tab"
                    className="absolute inset-0 bg-[var(--color-foreground)] rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: SPRING_STIFFNESS, damping: SPRING_DAMPING }}
                  />
                )}
                <tab.icon size={16} className="shrink-0" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-h-[50vh] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full md:ps-6 pb-[env(safe-area-inset-bottom)]"
            >
              {activeTab === 'general' && <GeneralTab />}
              {activeTab === 'typography' && <TypographyTab />}
              {activeTab === 'audio' && <AudioTab />}
              {activeTab === 'storage' && <StorageTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
