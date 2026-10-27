import { describe, expect, it } from 'vitest';
import { parseTags } from '@/lib/utils/tags';

describe('parseTags', () => {
  it('解析合法的 JSON 字符串', () => {
    const result = parseTags('{"preset":["a"],"free":["b"]}');
    expect(result).toEqual({ preset: ['a'], free: ['b'] });
  });

  it('解析合法的对象，原样返回', () => {
    const input = { preset: ['a'], free: ['b'] };
    const result = parseTags(input);
    expect(result).toBe(input);
  });

  it('空字符串返回 null', () => {
    expect(parseTags('')).toBeNull();
  });

  it('null 返回 null', () => {
    expect(parseTags(null)).toBeNull();
  });

  it('undefined 返回 null', () => {
    expect(parseTags(undefined)).toBeNull();
  });

  it('非法 JSON 字符串返回 null', () => {
    expect(parseTags('{broken}')).toBeNull();
  });

  it('合法的 JSON 解析为任意值也会直接返回（运行时不做结构校验）', () => {
    expect(parseTags('"hello"')).toBe('hello');
  });

  it('对象缺 preset 字段返回 null', () => {
    expect(parseTags({ free: ['a'] })).toBeNull();
  });

  it('对象缺 free 字段返回 null', () => {
    expect(parseTags({ preset: ['a'] })).toBeNull();
  });

  it('preset 和 free 都是空数组，合法返回', () => {
    const result = parseTags({ preset: [], free: [] });
    expect(result).toEqual({ preset: [], free: [] });
  });

  it('数字类型输入返回 null', () => {
    expect(parseTags(123)).toBeNull();
  });

  it('数组类型输入返回 null', () => {
    expect(parseTags([])).toBeNull();
  });
});