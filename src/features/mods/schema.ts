import { z } from 'zod';

export const FileDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  extension: z.string(),
  uiType: z.enum(['log', 'memo', 'message', 'image', 'audio', 'doc', 'mail', 'default']).optional(),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
  unlockConditions: z.array(z.string()),
});

export const LevelDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetFunction: z.string().nullable(),
  params: z.record(z.string(), z.number()).nullable(),
  type: z.string().optional(),
  unlockConditions: z.array(z.string()).nullable().optional(),
  tip: z.string().nullable().optional(),
});

export const ChapterDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  levels: z.array(LevelDataSchema),
  files: z.array(FileDataSchema).optional(),
});

export const RouteDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  showToBeContinued: z.boolean(),
  modId: z.string().optional(),
  chapters: z.array(ChapterDataSchema)
});

export const StoryJSONSchema = z.object({
  routes: z.array(RouteDataSchema),
});

export const ModManifestSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: z.string(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  downloadCount: z.number().optional(),
  avatarUrl: z.string().optional(),
  createdAt: z.string().optional(),
});

export const ModPackageSchema = z.object({
  manifest: ModManifestSchema,
  storyData: StoryJSONSchema,
});
