import React from 'react';
import { Lock, Check, Gamepad2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFileIcon } from './fileIcons';

/**
 * @typedef {Object} FileExplorerItem
 * @property {string} id - 唯一标识符
 * @property {string} name - 文件名/关卡名
 * @property {string} type - 'level' | 'file'
 * @property {string} [extension] - 如果是文件，表示其扩展名 (如 .txt, .mp3)
 * @property {boolean} isLocked - 是否被锁定
 * @property {boolean} isCompleted - 是否已完成（针对关卡）或已读（针对文件）
 * @property {boolean} [isEditing] - 是否处于编辑模式（针对工坊模式）
 * @property {() => void} [onDelete] - 删除回调函数（针对工坊模式）
 */
export interface FileExplorerItem {
  id: string;
  name: string;
  type: 'level' | 'file';
  extension?: string;
  isLocked: boolean;
  isCompleted: boolean;
  isEditing?: boolean;
  onDelete?: () => void;
}

interface FileExplorerGridProps {
  items: FileExplorerItem[];
  onItemClick: (item: FileExplorerItem) => void;
}

/**
 * 统一的模拟文件资源管理器列表组件
 * 采用 DRY 原则，复用于 故事模式(ChapterFiles) 和 创意工坊(ChapterEditorView)
 */
export const FileExplorerGrid: React.FC<FileExplorerGridProps> = ({ items, onItemClick }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col">
      {/* Table Header */}
      <div className="grid grid-cols-[32px_1fr_auto] gap-[16px] px-[24px] md:px-[40px] py-[12px] border-b border-[#2A2A2E] text-[0.7rem] text-[#606065] uppercase tracking-widest sticky top-0 bg-[#121214] z-10">
        <div className="w-[32px] text-center">{t('tools.storyEditor.sts', 'STS')}</div>
        <div>{t('tools.storyEditor.nameCol', 'NAME')}</div>
        <div className="text-right">{t('tools.storyEditor.typeCol', 'TYPE')}</div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-[60px]">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className={`
              grid grid-cols-[32px_1fr_auto] items-center gap-[16px] px-[24px] md:px-[40px] py-[14px] md:py-[16px] border-b border-[#1A1A1D] transition-colors group
              ${item.isLocked && !item.isEditing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1A1A1D]'}
            `}
          >
            {/* Status Icon & Delete Button */}
            <div className="w-[32px] flex justify-center relative">
              {item.isEditing && item.onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); item.onDelete?.(); }}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[#606065] hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer z-10"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className={`flex items-center justify-center ${item.isEditing && item.onDelete ? 'group-hover:opacity-0 transition-opacity' : ''}`}>
                {item.isEditing ? (
                  <div className="w-[6px] h-[6px] rounded-full bg-app-primary shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.8)]" />
                ) : item.isLocked ? (
                  <Lock size={14} strokeWidth={2} className="text-[#606065]" />
                ) : item.isCompleted ? (
                  <Check size={14} strokeWidth={3} className="text-app-success" />
                ) : (
                  <div className="w-[6px] h-[6px] rounded-full bg-app-primary shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.8)] animate-pulse" />
                )}
              </div>
            </div>

            {/* Name and Icon */}
            <div className="flex items-center gap-[12px] min-w-0">
              {item.type === 'level' ? (
                <Gamepad2 size={18} className="text-[#A0A0A5] shrink-0" />
              ) : (
                getFileIcon(item.extension || '')
              )}
              {/* 文件名严格执行等宽字体标准 */}
              <span className={`text-[0.9rem] md:text-[1rem] truncate font-mono ${
                item.isCompleted && !item.isEditing ? 'text-[#808085]' : 'text-[#E0E0E0]'
              }`}>
                {item.name}{item.type === 'level' ? '.exe' : `.${item.extension || 'unknown'}`}
              </span>
            </div>

            {/* Type Extension */}
            <div className="text-[0.7rem] md:text-[0.8rem] text-[#606065] uppercase tracking-wider font-mono">
              {item.type === 'level' ? 'EXECUTABLE' : (item.extension?.replace('.', '') || 'FILE')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};