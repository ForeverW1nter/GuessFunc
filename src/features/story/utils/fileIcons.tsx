import { FileText, Image as ImageIcon, FileArchive, Mic, BookOpen, Terminal } from 'lucide-react';

export const getFileIcon = (ext: string, size: number = 18, className?: string) => {
  const baseClassName = className || "";
  
  switch (ext.toLowerCase()) {
    case 'log':
    case 'dat':
    case 'cpp':
    case 'math':
      return <Terminal size={size} className={`text-[#00ff00] ${baseClassName}`} />;
    case 'memo':
    case 'txt':
    case 'note':
    case 'msg':
    case 'letter':
      return <FileText size={size} className={`text-yellow-500 ${baseClassName}`} />;
    case 'jpg':
    case 'png':
    case 'svg':
      return <ImageIcon size={size} className={`text-blue-400 ${baseClassName}`} />;
    case 'trans':
    case 'wav':
      return <Mic size={size} className={`text-purple-400 ${baseClassName}`} />;
    case 'pdf':
    case 'rule':
    case 'rcpt':
      return <BookOpen size={size} className={`text-red-400 ${baseClassName}`} />;
    default:
      return <FileArchive size={size} className={`text-gray-400 ${baseClassName}`} />;
  }
};
