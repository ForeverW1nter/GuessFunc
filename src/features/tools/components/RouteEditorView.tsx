import React from 'react';
import { Route as RouteIcon, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RouteData } from '../../../types/story';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';

interface RouteEditorViewProps {
  route: RouteData;
  routeIndex: number;
  updateRoute: (field: keyof RouteData, value: string | boolean) => void;
  deleteRoute: (index: number) => void;
}

export const RouteEditorView: React.FC<RouteEditorViewProps> = ({
  route,
  routeIndex,
  updateRoute,
  deleteRoute
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="px-6 md:px-10 py-6 md:py-8 border-b border-border bg-card">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl md:text-3xl font-bold m-0 flex items-center gap-3 w-full text-foreground">
            <RouteIcon className="text-primary w-8 h-8 shrink-0" />
            <input 
              type="text" 
              value={route.title || ''}
              onChange={(e) => updateRoute('title', e.target.value)}
              className="bg-transparent border-b-2 border-transparent hover:border-border focus:border-primary text-foreground outline-none transition-colors w-full pb-1 font-mono"
              placeholder={t('tools.storyEditor.routeTitle')}
            />
          </h2>
          <button 
            onClick={() => deleteRoute(routeIndex)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer bg-transparent border-none shrink-0"
            title={t('tools.storyEditor.deleteRoute')}
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground font-mono flex items-center gap-2">
            ID:
            <input 
              type="text" 
              value={route.id || ''}
              onChange={(e) => updateRoute('id', e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-border focus:border-primary text-foreground outline-none transition-colors w-32 pb-0.5 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
        <div className="p-6 md:p-10 max-w-3xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              <TextWithCodeFont text={t('tools.storyEditor.newRouteDesc')} />
            </label>
            <textarea 
              value={route.description || ''}
              onChange={(e) => updateRoute('description', e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none h-32 custom-scrollbar shadow-sm font-mono"
              placeholder={t('tools.storyEditor.newRouteDesc')}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
};
