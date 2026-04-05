import React from 'react';
import { ArrowLeft, FileCode, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LevelData } from '../../../src/types/story';
import { DesmosFunctionEditor } from './DesmosFunctionEditor';

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

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between h-14 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shrink-0 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{t('tools.storyEditor.back', 'Back')}</span>
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 shrink-0">
            <FileCode size={18} />
          </div>
          <h2 className="m-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {level.id}.exe
          </h2>
        </div>
        <button 
          onClick={() => onDelete(levelIndex)}
          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent border-none cursor-pointer p-2 rounded-md transition-colors"
          title={t('tools.storyEditor.deleteLevel', 'Delete Level')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col gap-6 max-w-5xl mx-auto w-full">
        {/* ID和名称放在一行 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.levelIdPlaceholder', 'Level ID')}</label>
            <input 
              type="text" 
              value={level.id}
              onChange={(e) => onUpdate('id', e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.levelNamePlaceholder', 'Level Name')}</label>
            <input 
              type="text" 
              value={level.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 过关提示和目标函数的 LaTeX 输入框放在同一行 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.tipPlaceholder', 'Hint (Optional)')}</label>
            <input 
              type="text"
              value={level.tip || ''}
              onChange={(e) => onUpdate('tip', e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.targetFuncPlaceholder', 'Target Function')}</label>
            <input 
              type="text"
              value={level.targetFunction || ''}
              onChange={(e) => onUpdate('targetFunction', e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all font-mono"
            />
          </div>
        </div>

        {/* 目标函数 Desmos 预览 */}
        <div className="flex-1 flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('tools.storyEditor.preview', 'Function Preview')}</label>
          <div className="flex-1 min-h-[400px] border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 relative overflow-hidden shadow-sm">
            <DesmosFunctionEditor 
              initialFunction={level.targetFunction || ''}
              onChange={(latex) => {
                let parsedLatex = latex;
                const eqIndex = latex.indexOf('=');
                if (eqIndex !== -1 && !latex.includes('<') && !latex.includes('>')) {
                  parsedLatex = latex.substring(eqIndex + 1).trim();
                }
                onUpdate('targetFunction', parsedLatex);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
