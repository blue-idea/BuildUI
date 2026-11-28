import { describe, it, expect } from 'vitest';
import {
  PROJECT_DELETE_COOLDOWN_SECONDS,
  PROJECT_DELETE_COOLDOWN_MS,
  createDeleteCooldownUntil,
  calculateRemainingCooldownSeconds,
  calculateNextCooldownTickDelayMs,
  pruneProjectDeleteCooldowns,
  getEarliestNextCooldownTickDelayMs,
} from './projectDelete';

describe('projectDelete config & cooldown helpers (TDD)', () => {
  it('默认删除冷静期应为 20 秒（20000 毫秒）', () => {
    expect(PROJECT_DELETE_COOLDOWN_SECONDS).toBe(20);
    expect(PROJECT_DELETE_COOLDOWN_MS).toBe(20_000);
  });

  it('createDeleteCooldownUntil 应基于当前时间与冷静期秒数计算截止时间戳', () => {
    const now = 1_700_000_000_000;
    expect(createDeleteCooldownUntil(undefined, now)).toBe(now + 20_000);
    expect(createDeleteCooldownUntil(5, now)).toBe(now + 5_000);
    expect(createDeleteCooldownUntil(0, now)).toBe(now);
    expect(createDeleteCooldownUntil(-3, now)).toBe(now);
  });

  it('calculateRemainingCooldownSeconds 应向上取整剩余秒数，过期或为空时返回 0', () => {
    const now = 10_000;
    expect(calculateRemainingCooldownSeconds(null, now)).toBe(0);
    expect(calculateRemainingCooldownSeconds(now, now)).toBe(0);
    expect(calculateRemainingCooldownSeconds(now - 500, now)).toBe(0);
    expect(calculateRemainingCooldownSeconds(now + 1, now)).toBe(1);
    expect(calculateRemainingCooldownSeconds(now + 19_001, now)).toBe(20);
    expect(calculateRemainingCooldownSeconds(now + 20_000, now)).toBe(20);
  });

  it('calculateNextCooldownTickDelayMs 应精确对齐下一次秒数变化的等待毫秒数', () => {
    const now = 10_000;
    expect(calculateNextCooldownTickDelayMs(now, now)).toBe(0);
    expect(calculateNextCooldownTickDelayMs(now - 10, now)).toBe(0);
    expect(calculateNextCooldownTickDelayMs(now + 20_000, now)).toBe(1_000);
    expect(calculateNextCooldownTickDelayMs(now + 8_700, now)).toBe(700);
    expect(calculateNextCooldownTickDelayMs(now + 1_001, now)).toBe(1);
    expect(calculateNextCooldownTickDelayMs(now + 450, now)).toBe(450);
  });

  it('pruneProjectDeleteCooldowns 应自动移除已删除项目与已过期的冷静期条目', () => {
    const now = 10_000;
    const existingIds = new Set([1, 2]);
    const pruned = pruneProjectDeleteCooldowns(
      {
        1: now + 15_000, // 有效：项目存在且未过期
        2: now - 100, // 已过期：应移除
        3: now + 20_000, // 项目已删除：应自动取消
      },
      existingIds,
      now
    );

    expect(pruned).toEqual({ 1: now + 15_000 });
  });

  it('getEarliestNextCooldownTickDelayMs 应返回多项目冷静期中最早的下一次整秒边界延迟', () => {
    const now = 10_000;
    expect(getEarliestNextCooldownTickDelayMs({}, now)).toBeNull();
    expect(
      getEarliestNextCooldownTickDelayMs(
        {
          1: now + 15_800, // 下一次边界 800ms
          2: now + 8_300, // 下一次边界 300ms
        },
        now
      )
    ).toBe(300);
    expect(
      getEarliestNextCooldownTickDelayMs(
        {
          1: now - 10, // 已到期应返回 0 以便立即清理
        },
        now
      )
    ).toBe(0);
  });
});
