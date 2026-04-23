import React, { useEffect } from 'react';
import { ArrowLeft, FileCode, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LevelData } from '../../../types/story';
import { DesmosFunctionEditor } from './DesmosFunctionEditor';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';
import { autoExtractParams } from '../../../utils/mathEngine/utils';

interface LevelEditorProps {
  level: LevelData;
  levelIndex: number;
  onUpdate: (field: keyof LevelData, value: unknown) => void;
  onDelete: (index: number) => void;
  onBack: () => void;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({
  level,
  levelIndex,
  onUpdate,
  onDelete,
  onBack
}) => {
  const { t } = useTranslation();

  // Auto-extract parameters from targetFunction when it changes
  useEffect(() => {
    if (level.targetFunction) {
      const extracted = autoExtractParams(level.targetFunction, level.params);
      // Only update if there's a difference to avoid infinite loops
      const currentKeys = Object.keys(level.params || {});
      const extractedKeys = extracted ? Object.keys(extracted) : [];
      
      const isDifferent = 
        currentKeys.length !== extractedKeys.length ||
        extractedKeys.some(k => !currentKeys.includes(k));

      if (isDifferent) {
        onUpdate('params', extracted);
      }
    }
  }, [level.targetFunction, level.params, onUpdate]);

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between h-14 px-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium"><TextWithCodeFont text={t('tools.storyEditor.back')} /></span>
          </button>
          <div className="w-px h-5 bg-border"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileCode size={18} />
          </div>
          <h2 className="m-0 text-sm font-semibold text-foreground truncate font-mono">
            {level.id}.exe
          </h2>
        </div>
        <button 
          onClick={() => onDelete(levelIndex)}
          className="text-muted-foreground hover:text-destructive hover:text-destructive hover:bg-destructive/10 hover:bg-destructive/20 bg-transparent border-none cursor-pointer p-2 rounded-md transition-colors"
          title={t('tools.storyEditor.deleteLevel')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col gap-6 max-w-5xl mx-auto w-full">
        {/* ID和名称放在一起 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.levelIdPlaceholder')} /></label>
            <input 
              type="text" 
              value={level.id}
              onChange={(e) => onUpdate('id', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.levelNamePlaceholder')} /></label>
            <input 
              type="text" 
              value={level.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
            />
          </div>
        </div>

        {/* 过关提示和目标函数的 LaTeX 输入框放在同一行 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.tipPlaceholder')} /></label>
            <input 
              type="text"
              value={level.tip || ''}
              onChange={(e) => onUpdate('tip', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.targetFuncPlaceholder')} /></label>
            <input 
              type="text"
              value={level.targetFunction || ''}
              onChange={(e) => onUpdate('targetFunction', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-mono"
              placeholder="e.g. x^2"
            />
          </div>
        </div>

        {/* 目标函数 Desmos 预览 */}
        <div className="flex-1 flex flex-col gap-4 border-t border-border pt-6">
          <label className="text-sm font-medium text-foreground"><TextWithCodeFont text={t('tools.storyEditor.preview')} /></label>
          <div className="flex-1 min-h-[400px] border border-border rounded-xl bg-card relative overflow-hidden shadow-sm">
            <DesmosFunctionEditor 
              initialFunction={level.targetFunction || ''}
              params={level.params}
              onChange={(latex, newParams) => {
                let parsedLatex = latex;
                const eqIndex = latex.indexOf('=');
                if (eqIndex !== -1 && !latex.includes('<') && !latex.includes('>')) {
                  parsedLatex = latex.substring(eqIndex + 1).trim();
                }
                
                const extracted = autoExtractParams(parsedLatex, newParams || level.params);

                onUpdate('targetFunction', parsedLatex);
                if (extracted) {
                  // Only update if parameters actually changed to avoid unnecessary re-renders
                  const isDifferent = !level.params || 
                    Object.keys(extracted).length !== Object.keys(level.params).length ||
                    Object.keys(extracted).some(k => extracted[k] !== level.params![k]);
                  
                  if (isDifferent) {
                    onUpdate('params', extracted);
                  }
                } else if (level.params) {
                  onUpdate('params', null);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
