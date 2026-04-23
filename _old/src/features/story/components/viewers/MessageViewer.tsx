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

  let isParsingHeaders = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过空行
    if (line.trim() === '') {
        if (isParsingHeaders && headers.length > 0) {
            isParsingHeaders = false;
            bodyStartIndex = i + 1;
            continue;
        }
        if(messageLines.length === 0 && headers.length === 0) {
            bodyStartIndex = i + 1;
            continue;
        } else {
            continue;
        }
    }

    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match && isParsingHeaders) {
        const keyLower = match[1].toLowerCase();
        const isHeaderKey = keyLower.includes('发件人') || keyLower.includes('收件人') || keyLower.includes('主题') || keyLower.includes('时间') || keyLower.includes('日期') || keyLower.includes('状态') || keyLower.includes('运营商') || ['from', 'to', 'subject', 'date', 'time', 'status'].includes(keyLower);
        
        if (headers.length > 0 || isHeaderKey) {
            headers.push({ key: match[1], value: match[2] });
            isMessageFormat = false; // 邮件形式不按照对话框渲染
            continue;
        }
    }
    
    isParsingHeaders = false;

    if (match) {
        // 正常对话
        const speaker = match[1].trim();
        speakers.add(speaker);
        messageLines.push({ speaker, text: match[2] });
    } else {
        if(messageLines.length === 0) {
            bodyStartIndex = i;
            isMessageFormat = false;
            break;
        } else {
            messageLines[messageLines.length - 1].text += '\n' + line;
        }
    }
  }

  const isEmail = headers.length > 0;

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
        <div className="bg-gray-50 dark:bg-[#252526] p-5 border-b border-gray-200 dark:border-[#333]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              {isEmail ? <Mail size={24} /> : <MessageSquare size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 m-0 leading-tight tracking-tight">{title}</h3>
              <span className="text-[0.8rem] font-medium text-blue-600/80 dark:text-blue-400/80 mt-1 block tracking-wider uppercase">{isEmail ? 'SECURE MAIL' : 'SECURE MESSAGE'}</span>
            </div>
          </div>
          
          {headers.length > 0 && (
            <div className="mt-5 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200/80 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
              <div className="bg-gray-50/80 dark:bg-[#1e1e1e] px-4 py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metadata</span>
              </div>
              <div className="p-4 space-y-3">
                {headers.map((h, i) => (
                  <div key={i} className="flex text-[0.95rem] leading-snug">
                    <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0 font-medium">{h.key}</span>
                    <span className="text-gray-900 dark:text-gray-200 break-all">{h.value}</span>
                  </div>
                ))}
              </div>
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
