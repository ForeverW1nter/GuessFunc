import React from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/vs2015.css';

export const MarkdownPanel: React.FC<{ mdText: string, useStoryFont?: boolean }> = ({ mdText, useStoryFont = false }) => {
  const { storyFontSize } = useUIStore();

  return (
    <div 
      className="p-[24px]"
      style={{ fontSize: `${storyFontSize}%` }}
    >
      <div 
        className={`prose dark:prose-invert max-w-none text-left prose-p:leading-relaxed prose-pre:bg-[#1E1E1E] prose-pre:text-[#D4D4D4] prose-code:text-[#D4D4D4] prose-code:bg-[#1E1E1E] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:font-mono prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-app-primary prose-a:no-underline hover:prose-a:underline break-words ${useStoryFont ? 'font-story' : ''}`}
        style={{ 
          background: 'transparent'
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
        >
          {mdText}
        </ReactMarkdown>
      </div>
    </div>
  );
};