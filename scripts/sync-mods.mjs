import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITEE_TOKEN = process.env.GITEE_TOKEN || '';
const OWNER = 'foreverw1nter';
const REPO = 'guess-func-mods';
const LABEL = 'Approved';

const fetchMods = async () => {
  let allMods = [];
  let page = 1;
  const perPage = 50;
  
  try {
    while (true) {
      const url = `https://gitee.com/api/v5/repos/${OWNER}/${REPO}/issues?state=open&labels=${LABEL}&page=${page}&per_page=${perPage}&sort=created&direction=desc${GITEE_TOKEN ? `&access_token=${GITEE_TOKEN}` : ''}`;
      console.log(`Fetching page ${page}...`);
      
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403) {
          console.warn('Gitee API Rate Limit Exceeded (403).');
        }
        throw new Error(`Failed to fetch mods from Gitee: ${await res.text()}`);
      }
      
      const issues = await res.json();
      if (!Array.isArray(issues) || issues.length === 0) {
        break;
      }
      
      const mods = issues.map((issue) => ({
        id: String(issue.number),
        title: String(issue.title).replace(/^\[Mod\]\s*/i, '').trim(),
        author: issue.user.name || issue.user.login,
        avatarUrl: issue.user.avatar_url,
        description: String(issue.body).split('<!-- MOD_DATA_START -->')[0]?.trim() || '',
        createdAt: issue.created_at,
        tags: issue.labels.map((l) => l.name),
        contentBody: issue.body,
      }));
      
      allMods = allMods.concat(mods);
      
      if (issues.length < perPage) {
        break; // Last page
      }
      page++;
    }
    
    const outDir = path.join(__dirname, '..', 'public');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, 'mods.json');
    
    await fs.writeFile(outPath, JSON.stringify(allMods, null, 2), 'utf-8');
    console.log(`Successfully synced ${allMods.length} mods to public/mods.json`);
  } catch (error) {
    console.error('Error during sync:', error);
    
    // If it fails (e.g. locally due to rate limit), ensure public/mods.json at least exists
    const outDir = path.join(__dirname, '..', 'public');
    const outPath = path.join(outDir, 'mods.json');
    try {
      await fs.access(outPath);
    } catch {
      console.log('Creating empty public/mods.json fallback for local development.');
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(outPath, '[]', 'utf-8');
    }
    
    // In CI (where GITEE_TOKEN is present), we want to fail the build if sync fails
    if (process.env.GITEE_TOKEN) {
      process.exit(1);
    } else {
      console.warn('Skipping exit code 1 because no GITEE_TOKEN was found (assuming local development).');
      process.exit(0);
    }
  }
};

fetchMods();