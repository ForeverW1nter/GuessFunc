import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MarkdownPanel } from '../../../ui/components/settings/MarkdownPanel';

export const ImageViewer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="p-4 md:p-8 min-h-full bg-[#e8e8e8] dark:bg-[#121212] flex flex-col items-center justify-center overflow-x-hidden">
      <div className="max-w-3xl w-full bg-white dark:bg-[#1e1e1e] p-3 md:p-4 pb-8 md:pb-12 rounded shadow-xl transform rotate-0 md:rotate-1 transition-transform hover:rotate-0 duration-300 my-auto">
        <div className="w-full aspect-video bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5 flex items-center justify-center mb-4 md:mb-6 relative overflow-hidden">
          <ImageIcon size={48} className="text-black/20 dark:text-white/10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 dark:via-white/2 dark:to-transparent pointer-events-none" />
        </div>
        <div className="text-center font-serif text-black/80 dark:text-white/80 italic text-base md:text-lg px-4 md:px-8 break-words w-full overflow-hidden">
          <MarkdownPanel mdText={content} />
        </div>
      </div>
    </div>
  );
};
