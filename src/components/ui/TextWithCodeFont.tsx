import React from 'react';

export const TextWithCodeFont: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  // 匹配连续的英文字母、数字、以及所有半角可打印字符
  const parts = text.split(/([\x21-\x7E]+)/);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^[\x21-\x7E]+$/.test(part)) {
          return <span key={index} className="font-mono">{part}</span>;
        }
        return <span key={index} className="font-sans">{part}</span>;
      })}
    </span>
  );
};
