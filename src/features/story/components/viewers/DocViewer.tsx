import React from 'react';
import { MarkdownPanel } from '../../../ui/components/settings/MarkdownPanel';

export const DocViewer: React.FC<{ content: string, title: string, extension: string }> = ({ content, title, extension }) => {
  return (
    <div className="p-4 md:p-8 min-h-full bg-[#f0f2f5] dark:bg-[#0f1115] flex justify-center">
      <div className="max-w-4xl w-full bg-white dark:bg-[#1a1d24] rounded-sm shadow-2xl flex flex-col border border-black/10 dark:border-white/10 my-auto h-auto min-h-[80%]">
        <div className="bg-[#e0e0e0] dark:bg-[#252830] px-4 py-2 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-black/60 dark:text-white/60 uppercase tracking-widest truncate">{title}.{extension}</span>
          <div className="flex gap-1 ml-2 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-black/20 dark:bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20 dark:bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20 dark:bg-white/20" />
          </div>
        </div>
        <div className="p-6 md:p-10 flex-1 overflow-x-hidden">
          <div className="max-w-none text-left prose-p:leading-relaxed text-black/80 dark:text-white/80 font-sans break-words w-full overflow-hidden">
             <MarkdownPanel mdText={content} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DefaultViewer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="p-6 h-full max-w-4xl mx-auto">
      <MarkdownPanel mdText={content} />
    </div>
  );
};
