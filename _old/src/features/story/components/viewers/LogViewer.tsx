import React from 'react';
import { Terminal } from 'lucide-react';
import { MarkdownPanel } from '../../../ui/components/settings/MarkdownPanel';

export const LogViewer: React.FC<{ content: string, title: string, extension: string }> = ({ content, title, extension }) => {
  const cleanContent = content.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
  const isCpp = extension.toLowerCase() === 'cpp';
  const textColor = isCpp ? 'text-[#e0e0e0]' : 'text-[#00ff00]';
  const bgColor = isCpp ? 'bg-[#1e1e1e]' : 'bg-black';
  const headerBgColor = isCpp ? 'bg-[#2d2d2d]' : 'bg-[#1a1a1a]';
  const headerTextColor = isCpp ? 'text-[#cccccc]' : 'text-[#888]';

  return (
    <div className={`p-4 md:p-6 min-h-full font-mono ${isCpp ? 'bg-[#121212]' : 'bg-[#0d0d0d]'}`}>
      <div className="max-w-4xl mx-auto border border-[#333] rounded-lg overflow-hidden shadow-2xl h-full flex flex-col">
        <div className={`${headerBgColor} px-4 py-2 border-b border-[#333] flex items-center gap-2 shrink-0`}>
          <Terminal size={16} className={textColor} />
          <span className={`text-xs ${headerTextColor} tracking-widest`}>
            {isCpp ? `${title}.${extension} - VS Code` : `SYSTEM_TERMINAL_SESSION - ${title}.${extension}`}
          </span>
        </div>
        <div className={`p-4 ${bgColor} overflow-x-auto flex-1`}>
          {isCpp ? (
            <MarkdownPanel mdText={`\`\`\`cpp\n${cleanContent}\n\`\`\``} />
          ) : (
            <pre className={`${textColor} text-[0.9rem] leading-relaxed whitespace-pre-wrap break-words`}>
              {cleanContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
