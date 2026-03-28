import React from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const MarkdownPanel: React.FC<{ mdText: string }> = ({ mdText }) => {
  const { storyFontSize, storyFontFamily } = useUIStore();

  return (
    <div 
      className="p-[24px]"
      style={{ fontSize: `${storyFontSize}%` }}
    >
      <div 
        className="markdown-body text-left" 
        style={{ 
          background: 'transparent',
          fontFamily: storyFontFamily === 'system-ui, -apple-system, sans-serif' 
            ? '"PingFang SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif' // 默认强制使用中文字体
            : storyFontFamily
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {mdText}
        </ReactMarkdown>
      </div>
    </div>
  );
};