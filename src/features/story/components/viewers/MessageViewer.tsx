import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { MarkdownPanel } from '../../../ui/components/settings/MarkdownPanel';

export const MessageViewer: React.FC<{ content: string, title: string }> = ({ content, title }) => {
  const lines = content.split('\n');
  const headers: { key: string, value: string }[] = [];
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      bodyStartIndex = i + 1;
      break;
    }
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      headers.push({ key: match[1], value: match[2] });
    } else {
      bodyStartIndex = i;
      break;
    }
  }

  const body = lines.slice(bodyStartIndex).join('\n').trim();
  const isEmail = headers.some(h => h.key.toLowerCase().includes('发件人') || h.key.toLowerCase().includes('收件人') || h.key.toLowerCase().includes('主题'));

  return (
    <div className="p-4 md:p-8 min-h-full bg-[#f8f9fa] dark:bg-[#121212] flex justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col h-fit my-auto">
        <div className="bg-gray-50 dark:bg-[#252526] p-4 border-b border-gray-200 dark:border-[#333]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {isEmail ? <Mail size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0 leading-none">{title}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{isEmail ? 'EMAIL MESSAGE' : 'SECURE MESSAGE'}</span>
            </div>
          </div>
          
          {headers.length > 0 && (
            <div className="space-y-1.5 mt-2 bg-white dark:bg-[#1a1a1a] p-3 rounded-lg border border-gray-100 dark:border-[#2a2a2a]">
              {headers.map((h, i) => (
                <div key={i} className="flex text-sm">
                  <span className="text-gray-500 dark:text-gray-400 w-16 shrink-0">{h.key}:</span>
                  <span className="text-gray-900 dark:text-gray-200 font-medium break-all">{h.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 md:p-8 bg-white dark:bg-[#1e1e1e]">
          <div className="font-sans text-gray-800 dark:text-gray-300 leading-relaxed text-[1.05rem] whitespace-pre-wrap break-words prose-p:my-2">
            <MarkdownPanel mdText={body || content} />
          </div>
        </div>
      </div>
    </div>
  );
};
