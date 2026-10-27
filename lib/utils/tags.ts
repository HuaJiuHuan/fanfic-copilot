import type { TagsData } from '@/lib/types';

export function parseTags(raw: unknown): TagsData | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as TagsData;
    } catch {
      return null;
    }
  }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'preset' in raw &&
    'free' in raw
  ) {
    return raw as TagsData;
  }
  return null;
}