import { z } from 'zod';
import { ModManifestSchema, ModPackageSchema } from './schema';

export type ModManifest = z.infer<typeof ModManifestSchema>;
export type ModPackage = z.infer<typeof ModPackageSchema>;

export interface ModItem extends ModManifest {
  createdAt: string;
  avatarUrl?: string;
  contentBody: string; // The raw markdown containing the mod package
}
