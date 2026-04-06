import creditsRaw from '../../../../docs/credits.md?raw';

// Extract JSON from the markdown block
export const extractCredits = () => {
  try {
    const match = creditsRaw.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.error('Failed to parse credits data:', e);
  }
  // Fallback
  return {
    title: "GUESS FUNC",
    roles: [],
    footer: "THANK YOU FOR PLAYING"
  };
};