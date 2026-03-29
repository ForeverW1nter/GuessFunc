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
    <div className="w-full h-full flex flex-col bg-modal-bg text-modal-text">
      <div className="flex items-center justify-between h-[48px] px-[16px] border-b border-[#2A2A2E] bg-[#0A0A0B] shrink-0">
        <div className="flex items-center gap-[12px] min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-white transition-colors shrink-0 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span className="text-[0.85rem] uppercase tracking-wider">{t('tools.storyEditor.back', 'BACK')}</span>
          </button>
          <div className="w-[1px] h-[16px] bg-[#2A2A2E]"></div>
          <FileCode size={16} className="text-green-400 shrink-0" />
          <h2 className="m-0 text-[0.9rem] font-semibold text-white truncate">
            {level.id}.exe
          </h2>
        </div>
        <button 
          onClick={() => onDelete(levelIndex)}
          className="text-red-500 hover:text-white bg-transparent border-none cursor-pointer p-[4px]"
          title={t('tools.storyEditor.deleteLevel', 'Delete Level')}
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-[24px] md:p-[40px] flex flex-col gap-[24px]">
        {/* ID和名称放在一行 */}
        <div className="flex flex-row gap-[24px]">
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.levelIdPlaceholder', 'Level ID')}</label>
            <input 
              type="text" 
              value={level.id}
              onChange={(e) => onUpdate('id', e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-green-400 transition-colors font-mono"
            />
          </div>
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.levelNamePlaceholder', 'Level Name')}</label>
            <input 
              type="text" 
              value={level.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-green-400 transition-colors"
            />
          </div>
        </div>

        {/* 过关提示和目标函数的 LaTeX 输入框放在同一行 */}
        <div className="flex flex-row gap-[24px]">
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.tipPlaceholder', 'Hint (Optional)')}</label>
            <input 
              type="text"
              value={level.tip || ''}
              onChange={(e) => onUpdate('tip', e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[0.7rem] text-[#606065] uppercase tracking-widest">{t('tools.storyEditor.targetFuncPlaceholder', 'Target Function')}</label>
            <input 
              type="text"
              value={level.targetFunction || ''}
              onChange={(e) => onUpdate('targetFunction', e.target.value)}
              className="w-full bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] px-[16px] py-[10px] text-[0.9rem] text-white outline-none focus:border-green-400 transition-colors font-mono"
            />
          </div>
        </div>

        {/* 目标函数 Desmos 预览 */}
        <div className="flex-1 flex flex-col gap-[16px] border-t border-[#2A2A2E] pt-[24px]">
          <div className="flex-1 min-h-[400px] border border-[#2A2A2E] rounded-[8px] bg-[#0A0A0B] relative overflow-hidden">
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
