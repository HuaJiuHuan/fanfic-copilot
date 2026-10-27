import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({}));
vi.mock('@/app/actions/generate', () => ({}));
vi.mock('@/app/actions/outline', () => ({}));
vi.mock('@/app/actions/draft', () => ({}));

import {
  getCurrentRecord,
  getCurrentOutline,
  getActiveSceneInfo,
  type WorkspaceSlice,
} from '@/lib/stores/workspace.slice';
import type { OutlineRecord, StoryOutline } from '@/lib/types';

function makeScene(id: string) {
  return {
    id,
    sceneNumber: 1,
    location: '学校',
    plotAction: '发现异常',
    conflict: '内心挣扎',
    emotionalShift: '期待→绝望',
  };
}

function makeOutline(): StoryOutline {
  return {
    title: '测试',
    logline: '一条主线',
    characterArcs: [],
    acts: [
      { actTitle: '第一幕', scenes: [makeScene('s1'), makeScene('s2')] },
      { actTitle: '第二幕', scenes: [makeScene('s3')] },
    ],
  };
}

function makeRecord(overrides: Partial<OutlineRecord> = {}): OutlineRecord {
  return {
    id: 'r1',
    content: makeOutline(),
    projectId: 'p1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as OutlineRecord;
}

function makeState(overrides: Partial<WorkspaceSlice> = {}): WorkspaceSlice {
  return {
    history: [makeRecord()],
    selectedIndex: 0,
    activeSceneId: null,
    ...overrides,
  } as WorkspaceSlice;
}

describe('getCurrentRecord', () => {
  it('history 非空时返回 selectedIndex 对应的记录', () => {
    const state = makeState();
    const record = getCurrentRecord(state);
    expect(record).toBeDefined();
    expect(record!.id).toBe('r1');
  });

  it('history 为空时返回 undefined', () => {
    const state = makeState({ history: [] });
    expect(getCurrentRecord(state)).toBeUndefined();
  });

  it('selectedIndex 越界时返回 undefined', () => {
    const state = makeState({ history: [makeRecord()], selectedIndex: 5 });
    expect(getCurrentRecord(state)).toBeUndefined();
  });

  it('selectedIndex 为负数时返回 undefined', () => {
    const state = makeState({ history: [makeRecord()], selectedIndex: -1 });
    expect(getCurrentRecord(state)).toBeUndefined();
  });
});

describe('getCurrentOutline', () => {
  it('有记录时返回 content', () => {
    const outline = getCurrentOutline(makeState());
    expect(outline).not.toBeNull();
    expect(outline!.title).toBe('测试');
    expect(outline!.acts).toHaveLength(2);
  });

  it('history 为空时返回 null', () => {
    expect(getCurrentOutline(makeState({ history: [] }))).toBeNull();
  });

  it('selectedIndex 越界时返回 null', () => {
    expect(getCurrentOutline(makeState({ selectedIndex: 99 }))).toBeNull();
  });
});

describe('getActiveSceneInfo', () => {
  it('匹配到场景时返回该场景', () => {
    const state = makeState({ activeSceneId: 's2' });
    const scene = getActiveSceneInfo(state);
    expect(scene).not.toBeNull();
    expect(scene!.id).toBe('s2');
  });

  it('activeSceneId 不匹配任何场景时返回 null', () => {
    const state = makeState({ activeSceneId: 'nonexistent' });
    expect(getActiveSceneInfo(state)).toBeNull();
  });

  it('activeSceneId 为 null 时返回 null', () => {
    expect(getActiveSceneInfo(makeState({ activeSceneId: null }))).toBeNull();
  });

  it('跨 act 查找场景（第二幕）', () => {
    const state = makeState({ activeSceneId: 's3' });
    const scene = getActiveSceneInfo(state);
    expect(scene).not.toBeNull();
    expect(scene!.id).toBe('s3');
    expect(scene!.location).toBe('学校');
  });

  it('outline 为 null 时返回 null', () => {
    const state = makeState({ history: [], activeSceneId: 's1' });
    expect(getActiveSceneInfo(state)).toBeNull();
  });
});