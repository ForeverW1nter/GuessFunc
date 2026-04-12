import React from 'react';
import { Mic } from 'lucide-react';

export const AudioViewer: React.FC<{ content: string, title: string, extension: string }> = ({ content, title, extension }) => {
  const cleanContent = content.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
  const heights = [35, 78, 42, 91, 56, 88, 23, 67, 45, 82, 19, 74];

  return (
    <div className="p-6 h-full bg-background flex justify-center">
      <div className="max-w-3xl w-full bg-card border border-border rounded-2xl overflow-hidden shadow-lg flex flex-col">
        <div className="bg-[#2A2A2E] p-6 flex items-center justify-between border-b border-[#3A3A3E]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Mic size={24} />
            </div>
            <div>
              <div className="text-white font-medium text-lg uppercase">{title}.{extension}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 h-2">
                  {heights.map((height, i) => (
                    <div key={i} className="w-1 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms`, height: `${height}%` }} />
                  ))}
                </div>
                <span className="text-xs text-[#888] font-mono ml-2">PLAYING...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card font-mono text-[0.95rem] leading-loose whitespace-pre-wrap break-words text-foreground/80">
          {cleanContent}
        </div>
      </div>
    </div>
  );
};
