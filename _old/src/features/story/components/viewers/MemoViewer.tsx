import React from 'react';

export const MemoViewer: React.FC<{ content: string, title: string }> = ({ content, title }) => {
  return (
    <div className="p-4 md:p-8 min-h-full bg-[#f4f4f0] dark:bg-[#1c1c1a] flex justify-center">
      <div className="max-w-2xl w-full bg-[#fffdf5] dark:bg-[#252522] p-6 md:p-8 rounded shadow-md border-l-4 border-yellow-400/60 relative my-auto h-fit">
        <div className="absolute top-4 right-4 text-xs text-black/20 dark:text-white/20 uppercase tracking-widest font-serif">MEMO</div>
        <h3 className="text-xl font-serif text-black/80 dark:text-white/80 mb-6 border-b border-black/10 dark:border-white/10 pb-2">{title}</h3>
        <div className="font-serif text-black/70 dark:text-white/70 leading-loose text-[1.05rem] whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    </div>
  );
};
