import React from 'react';
import { ArrowLeft, Terminal, Image as ImageIcon, Mic, Mail, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MarkdownPanel } from '../../ui/components/settings/MarkdownPanel';
import type { FileData } from '../../../types/story';
import { getFileIcon } from '../utils/fileIcons';

interface FileViewerProps {
  file: FileData;
  onClose: () => void;
}

// 终端/日志类型渲染器
const LogViewer: React.FC<{ content: string, title: string, extension: string }> = ({ content, title, extension }) => {
  // 去除 markdown 的 ``` 包裹（如果存在）
  const cleanContent = content.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
  
  // 针对 cpp 代码文件的特殊处理
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

// 文本/便签类型渲染器
const MemoViewer: React.FC<{ content: string, title: string }> = ({ content, title }) => {
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

// 扫描件/照片类型渲染器
const ImageViewer: React.FC<{ content: string }> = ({ content }) => {
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

// 录音/转录类型渲染器
const AudioViewer: React.FC<{ content: string, title: string, extension: string }> = ({ content, title, extension }) => {
  const cleanContent = content.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
  const heights = [35, 78, 42, 91, 56, 88, 23, 67, 45, 82, 19, 74];

  return (
    <div className="p-6 h-full bg-app-bg flex justify-center">
      <div className="max-w-3xl w-full bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-lg flex flex-col">
        <div className="bg-[#2A2A2E] p-6 flex items-center justify-between border-b border-[#3A3A3E]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-app-primary/20 flex items-center justify-center text-app-primary">
              <Mic size={24} />
            </div>
            <div>
              <div className="text-white font-medium text-lg uppercase">{title}.{extension}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 h-2">
                  {heights.map((height, i) => (
                    <div key={i} className="w-1 bg-app-primary/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms`, height: `${height}%` }} />
                  ))}
                </div>
                <span className="text-xs text-[#888] font-mono ml-2">PLAYING...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card-bg font-mono text-[0.95rem] leading-loose whitespace-pre-wrap break-words text-app-text/80">
          {cleanContent}
        </div>
      </div>
    </div>
  );
};

// 信息/邮件类型渲染器
const MessageViewer: React.FC<{ content: string, title: string }> = ({ content, title }) => {
  // 简单的解析发件人、收件人等头部信息
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
      // 如果遇到不符合 header 格式的行，停止解析 header
      bodyStartIndex = i;
      break;
    }
  }

  const body = lines.slice(bodyStartIndex).join('\n').trim();
  const isEmail = headers.some(h => h.key.toLowerCase().includes('发件人') || h.key.toLowerCase().includes('收件人') || h.key.toLowerCase().includes('主题'));

  return (
    <div className="p-4 md:p-8 min-h-full bg-[#f8f9fa] dark:bg-[#121212] flex justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col h-fit my-auto">
        {/* Header */}
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
        
        {/* Body */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1e1e1e]">
          <div className="font-sans text-gray-800 dark:text-gray-300 leading-relaxed text-[1.05rem] whitespace-pre-wrap break-words prose-p:my-2">
            <MarkdownPanel mdText={body || content} />
          </div>
        </div>
      </div>
    </div>
  );
};

// 官方文档/PDF类型渲染器
const DocViewer: React.FC<{ content: string, title: string, extension: string }> = ({ content, title, extension }) => {
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

// 默认渲染器 (MD)
const DefaultViewer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="p-6 h-full max-w-4xl mx-auto">
      <MarkdownPanel mdText={content} />
    </div>
  );
};

export const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const { t } = useTranslation();

  const renderContent = () => {
    switch (file.extension.toLowerCase()) {
      case 'log':
      case 'dat':
      case 'cpp':
      case 'math':
        return <LogViewer content={file.content} title={file.title} extension={file.extension} />;
      case 'memo':
      case 'txt':
      case 'note':
      case 'letter':
        return <MemoViewer content={file.content} title={file.title} />;
      case 'msg':
        return <MessageViewer content={file.content} title={file.title} />;
      case 'jpg':
      case 'png':
      case 'svg':
        return <ImageViewer content={file.content} />;
      case 'trans':
      case 'wav':
        return <AudioViewer content={file.content} title={file.title} extension={file.extension} />;
      case 'pdf':
      case 'rule':
      case 'rcpt':
        return <DocViewer content={file.content} title={file.title} extension={file.extension} />;
      default:
        return <DefaultViewer content={file.content} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-modal-bg text-modal-text animate-fade-in">
      <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-[16px] min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-[8px] text-[#A0A0A5] hover:text-app-primary transition-colors shrink-0 bg-transparent border-none cursor-pointer outline-none"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            <span className="text-[0.9rem] font-medium tracking-wider">{t('tools.storyEditor.back', 'BACK')}</span>
          </button>
          <div className="w-px h-6 bg-card-border mx-2" />
          <div className="flex items-center gap-3 truncate">
            {getFileIcon(file.extension)}
            <h2 className="m-0 text-[1.1rem] font-semibold text-app-text truncate">
              {file.title}.<span className="opacity-60">{file.extension}</span>
            </h2>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-modal-bg relative">
        {renderContent()}
      </div>
    </div>
  );
};
