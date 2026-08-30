import type { ComponentType } from 'react';

export type Track = 'basics' | 'intermediate' | 'advanced';

export interface ChallengeMeta {
  /** Stable id, used for progress tracking, e.g. 'locator-gym'. */
  id: string;
  track: Track;
  title: string;
  summary: string;
  /** Playwright concepts this challenge exercises. */
  concepts: string[];
  /** Full task shown on the challenge page. */
  task: string;
  /** Progressive hints, disclosed one <details> at a time. */
  hints: string[];
  /** Reference solution snippet. */
  solution: string;
  /** Path of the reference test in the repo. */
  example: string;
  /** Route path of the challenge page. */
  path: string;
  component: ComponentType;
}

export const TRACK_LABELS: Record<Track, string> = {
  basics: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
