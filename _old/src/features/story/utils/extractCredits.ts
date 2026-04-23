import creditsRaw from '../../../../docs/credits.md?raw';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';

// Extract JSON from the markdown block
export const extractCredits = () => {
  try {
    const match = creditsRaw.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.error(SYSTEM_LOGS.STORY_PARSE_CREDITS_ERROR, e);
  }
  // Fallback
  return {
    title: "GUESS FUNC",
    roles: [],
    footer: "THANK YOU FOR PLAYING"
  };
};