export const EPISODES_PER_PAGE = 15;
export function episodePageCount(count: number) {
  return Math.max(1, Math.ceil(count / EPISODES_PER_PAGE));
}
