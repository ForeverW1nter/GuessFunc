export interface Dialogue {
  speaker: string;
  text: string;
}

export type FileUIType = 'default' | 'log' | 'memo' | 'message' | 'mail' | 'image' | 'audio' | 'doc';

export interface FileData {
  id: string;
  title: string;
  extension: string; // e.g., 'txt', 'md', 'log'
  uiType?: FileUIType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  unlockConditions: string[]; // level ids that need to be completed to unlock this file
}

export interface LevelData {
  id: string;
  title: string;
  targetFunction: string | null;
  params: Record<string, number> | null;
  domain?: string | null;
  type?: 'normal' | 'boss' | 'hidden' | 'bonus' | string;
  unlockConditions?: string[] | null;
  tip?: string | null; // Optional tip for the level
}

export interface ChapterData {
  id: string;
  title: string;
  levels: LevelData[];
  files?: FileData[];
}

export interface RouteData {
  id: string;
  modId?: string;
  title: string;
  description: string;
  showToBeContinued: boolean;
  showInPlayInterface?: boolean;
  chapters: ChapterData[];
}

export interface StoryJSON {
  routes: RouteData[];
}
