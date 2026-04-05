import React from 'react';
import { Mail, MessageSquare, User } from 'lucide-react';
import { MarkdownPanel } from '../../../ui/components/settings/MarkdownPanel';

export const MessageViewer: React.FC<{ content: string, title: string }> = ({ content, title }) => {
  const lines = content.split('\n');
  const headers: { key: string, value: string }[] = [];
  let bodyStartIndex = 0;
  
  // 用于判断是不是常规的消息记录（对话形式）
  const messageLines: { speaker: string, text: string }[] = [];
  let isMessageFormat = true;
  const speakers = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过空行
    if (line.trim() === '') {
        if(messageLines.length === 0) {
            bodyStartIndex = i + 1;
            continue;
        } else {
            // 如果已经在解析对话，遇到空行可以认为这一句是空的，或者直接跳过
            continue;
        }
    }

    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
        if(messageLines.length === 0 && (match[1].toLowerCase().includes('发件人') || match[1].toLowerCase().includes('收件人') || match[1].toLowerCase().includes('主题') || match[1].toLowerCase() === 'from' || match[1].toLowerCase() === 'to' || match[1].toLowerCase() === 'subject')) {
            // 这看起来像是一个邮件的 Header
            headers.push({ key: match[1], value: match[2] });
            isMessageFormat = false; // 邮件形式不按照对话框渲染
        } else {
            // 正常对话
            const speaker = match[1].trim();
            speakers.add(speaker);
            messageLines.push({ speaker, text: match[2] });
        }
    } else {
        // 如果遇到无法解析为 `A: B` 的行
        if(messageLines.length === 0) {
            // 一开始就没匹配上，说明是普通文本
            bodyStartIndex = i;
            isMessageFormat = false;
            break;
        } else {
            // 如果已经开始了解析对话，但中间突然穿插了非对话行，我们把它追加到上一句话中，或者视为普通格式
            messageLines[messageLines.length - 1].text += '\n' + line;
        }
    }
  }

  const isEmail = headers.some(h => h.key.toLowerCase().includes('发件人') || h.key.toLowerCase().includes('收件人') || h.key.toLowerCase().includes('主题') || h.key.toLowerCase() === 'from' || h.key.toLowerCase() === 'to' || h.key.toLowerCase() === 'subject');

  // 如果判断为聊天记录
  if (isMessageFormat && messageLines.length > 0) {
      const uniqueSpeakers = Array.from(speakers);
      const isTwoPeople = uniqueSpeakers.length === 2;
      const rightSpeaker = isTwoPeople ? uniqueSpeakers[1] : null; // 第二个说话的人放右边

      return (
        <div className="p-4 md:p-8 min-h-full bg-[#f8f9fa] dark:bg-[#121212] flex justify-center">
          <div className="max-w-2xl w-full bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-[#333] flex flex-col h-fit my-auto">
            <div className="bg-gray-50 dark:bg-[#252526] p-4 border-b border-gray-200 dark:border-[#333] rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0 leading-none">{title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">CHAT LOG</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6 bg-gray-50/50 dark:bg-[#1a1a1a] flex flex-col gap-4 rounded-b-xl overflow-hidden">
              {messageLines.map((msg, idx) => {
                  const isRight = isTwoPeople && msg.speaker === rightSpeaker;
                  
                  return (
                      <div key={idx} className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex gap-3 max-w-[85%] ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* 头像 */}
                              <div className="w-8 h-8 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mt-1">
                                  <User size={16} />
                              </div>
                              
                              {/* 消息内容区 */}
                              <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                                  {/* 昵称 */}
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                      {msg.speaker}
                                  </span>
                                  {/* 气泡 */}
                                  <div 
                                      className={`px-4 py-2.5 rounded-2xl text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words shadow-sm
                                          ${isRight 
                                              ? 'bg-blue-500 text-white rounded-tr-sm' 
                                              : 'bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#333] rounded-tl-sm'
                                          }`}
                                  >
                                      {msg.text}
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
            </div>
          </div>
        </div>
      );
  }

  // 否则，按原来的邮件/文本格式渲染
  const body = lines.slice(bodyStartIndex).join('\n').trim();

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
