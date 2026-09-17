import type { CollectionEntry } from 'astro:content';

/**
 * Ranks research entries by relatedness to `current` and returns the top
 * `limit`. Replaces the hand-maintained PAPERS array in the old vanilla site
 * (assets/js/research-recommendations.js) with a computed ranking: entries
 * sharing more tags (weight 2 each) and/or the same topic (weight 1) rank
 * higher. Ties keep the relative order of `all` (Array#sort is stable).
 */
export function getRelatedResearch(
  current: CollectionEntry<'research'>,
  all: CollectionEntry<'research'>[],
  limit = 3
): CollectionEntry<'research'>[] {
  const currentTags = new Set(current.data.tags);
  return all
    .filter((r) => r.id !== current.id)
    .map((r) => {
      const sharedTags = r.data.tags.filter((t) => currentTags.has(t)).length;
      const sameTopic = r.data.topic === current.data.topic ? 1 : 0;
      return { entry: r, score: sharedTags * 2 + sameTopic };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}
