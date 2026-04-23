import React from 'react';
import { useStoryStore } from '../../../store/useStoryStore';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../../../store/useAudioStore';
import { useUIStore } from '../../../store/useUIStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/vs2015.css';
import { Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  if (!chapter) {
    onComplete();
    return null;
  }

  const handleComplete = () => {
    const firstLevelId = chapter.levels?.[0]?.id;
    onComplete(firstLevelId);
  };

  return (
    <div className="relative w-full md:max-w-[900px] h-full md:h-auto max-h-[100dvh] md:max-h-[85vh] bg-background text-foreground md:rounded-[16px] shadow-modal overflow-hidden flex flex-col border-none md:border md:border-border animate-zoom-in">
      {/* Modal Header */}
      <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-[10px]">
          <h2 className="m-0 text-[1.25rem] font-semibold text-foreground transition-opacity duration-200">
            {chapter.title}
          </h2>
        </div>
        <div className="flex items-center gap-[15px]">
          <button 
            onClick={toggleMute}
            className={`inline-flex items-center justify-center p-[5px] rounded-full transition-all bg-transparent border-none cursor-pointer outline-none ${
              !isMuted 
                ? 'text-foreground opacity-70 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)]' 
                : 'text-foreground opacity-30 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)]'
            }`}
            title={isMuted ? t('story.unmute') : t('story.mute')}
          >
            {isMuted ? <VolumeX size={20} strokeWidth={2} /> : <Volume2 size={20} strokeWidth={2} />}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-[40px] h-[40px] flex items-center justify-center text-foreground opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] hover:rotate-90 rounded-full transition-all"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-[24px] text-[1rem] leading-[1.6]"
        style={{ 
          fontSize: `${storyFontSize}%`,
          fontFamily: storyFontFamily === 'system-ui, -apple-system, sans-serif' 
            ? '"PingFang SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif' // 默认强制使用中文字体
            : storyFontFamily
        }}
      >
        <div className="mb-4 prose dark:prose-invert max-w-none text-left prose-p:leading-relaxed prose-pre:bg-[#1E1E1E] prose-pre:text-[#D4D4D4] prose-code:text-[#D4D4D4] prose-code:bg-[#1E1E1E] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:font-mono break-words">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
          >
            {t('story.archivedFilesTip')}
          </ReactMarkdown>
        </div>

        <div className="mt-[20px] mx-auto text-right max-w-[800px] w-full">
          <button
            onClick={handleComplete}
            className="inline-flex items-center justify-center gap-[8px] px-[20px] py-[10px] rounded-[8px] font-semibold text-[1rem] transition-all bg-primary text-white border-none shadow-btn hover:brightness-110 hover:-translate-y-[2px] hover:shadow-btn-hover outline-none"
          >
            {t('story.startChallenge')}
          </button>
        </div>
      </div>
    </div>
  );
};
