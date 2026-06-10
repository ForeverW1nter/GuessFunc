import React from 'react';
import type { FileData } from '../../../types/story';
import {
  LogViewer,
  MemoViewer,
  ImageViewer,
  AudioViewer,
  MessageViewer,
  DocViewer,
  DefaultViewer
} from './viewers';

export const FileRenderer: React.FC<{ file: FileData }> = ({ file }) => {
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
    case 'mail':
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
