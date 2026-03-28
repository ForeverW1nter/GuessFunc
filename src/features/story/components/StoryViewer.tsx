import React from 'react';
import { useStoryStore } from '../../../store/useStoryStore';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../../../store/useAudioStore';
import { useUIStore } from '../../../store/useUIStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Volume2, VolumeX, X } from 'lucide-react';

interface StoryViewerProps {
  routeId: string;
  chapterId: string;
  onComplete: (firstLevelId?: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ routeId, chapterId, onComplete }) => {
  const { getChapter } = useStoryStore();
  const chapter = getChapter(routeId, chapterId);
  const navigate = useNavigate();
  const { isMuted, toggleMute } = useAudioStore();
  const { storyFontSize, storyFontFamily } = useUIStore();

  if (!chapter) {
    onComplete();
    return null;
  }

  const handleComplete = () => {
    const firstLevelId = chapter.levels?.[0]?.id;
    onComplete(firstLevelId);
  };

  return (
    <div className="relative w-full md:max-w-[900px] h-full md:h-auto max-h-[100vh] md:max-h-[85vh] bg-modal-bg text-modal-text md:rounded-[16px] shadow-modal overflow-hidden flex flex-col border-none md:border md:border-card-border animate-zoom-in">
      {/* Modal Header */}
      <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0">
        <div className="flex items-center gap-[10px]">
          <h2 className="m-0 text-[1.25rem] font-semibold text-app-text transition-opacity duration-200">
            {chapter.title}
          </h2>
        </div>
        <div className="flex items-center gap-[15px]">
          <button 
            onClick={toggleMute}
            className={`inline-flex items-center justify-center p-[5px] rounded-full transition-all bg-transparent border-none cursor-pointer outline-none ${
              !isMuted 
                ? 'text-app-text opacity-70 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)]' 
                : 'text-app-text opacity-30 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)]'
            }`}
            title={isMuted ? "开启音乐" : "关闭音乐"}
          >
            {isMuted ? <VolumeX size={20} strokeWidth={2} /> : <Volume2 size={20} strokeWidth={2} />}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-[40px] h-[40px] flex items-center justify-center text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] hover:rotate-90 rounded-full transition-all"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-[24px] text-[1rem] leading-[1.6]"
        style={{ fontFamily: storyFontFamily, fontSize: `${storyFontSize}%` }}
      >
        <div className="markdown-body">
          {/* 由于新设定删除了章节剧情，此组件可能需要重新设计或移除 */}
          {/* 目前仅作为回退显示 */}
          <div className="mb-4">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              该章节的剧情已归档为碎片文件，请在关卡选择界面的右侧面板中查看。
            </ReactMarkdown>
          </div>
        </div>

        <div className="mt-[20px] mx-auto text-right max-w-[800px] w-full">
          <button
            onClick={handleComplete}
            className="inline-flex items-center justify-center gap-[8px] px-[20px] py-[10px] rounded-[8px] font-semibold text-[1rem] transition-all bg-app-primary text-white border-none shadow-btn hover:brightness-110 hover:-translate-y-[2px] hover:shadow-btn-hover outline-none"
          >
            开始挑战
          </button>
        </div>
      </div>
    </div>
  );
};
