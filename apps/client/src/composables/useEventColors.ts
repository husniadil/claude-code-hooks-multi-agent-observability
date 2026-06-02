export function useEventColors() {
  // Muted, warm-leaning categorical palette for per-agent / per-session coding.
  // Tuned to harmonize with the cream + coral canvas (DESIGN.md) — medium
  // saturation, no neon. "Blue" reads as a dusty slate, never cyan.
  const palette = [
    '#c1715a', // terracotta
    '#c79a49', // amber
    '#6f8f5f', // sage
    '#4e8a86', // teal
    '#5f7aa1', // dusty blue
    '#9a6f9c', // muted plum
    '#b3637e', // dusty rose
    '#a06b46', // clay
    '#7e8a6a', // olive
    '#8a8f99', // warm slate
  ];

  // Stable string hash with good distribution (djb2-ish).
  const hashString = (str: string): number => {
    let hash = 7151;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash >>> 0);
  };

  const colorFor = (key: string): string => palette[hashString(key) % palette.length];

  const getHexColorForApp = (appName: string): string => colorFor(appName);
  const getHexColorForSession = (sessionId: string): string => colorFor(sessionId);

  return {
    getHexColorForApp,
    getHexColorForSession,
  };
}
