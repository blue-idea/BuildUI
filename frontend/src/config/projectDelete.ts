/**
 * 工程管理删除冷静期集中配置与时间计算工具
 */

/** 工程删除操作后的默认冷静期时长（秒） */
export const PROJECT_DELETE_COOLDOWN_SECONDS = 20;

/** 工程删除操作后的默认冷静期时长（毫秒） */
export const PROJECT_DELETE_COOLDOWN_MS = PROJECT_DELETE_COOLDOWN_SECONDS * 1000;

/** 按项目 ID 记录的删除冷静期截止时间戳映射（appId -> cooldownUntilMs） */
export type ProjectDeleteCooldownMap = Record<number, number>;

/**
 * 基于当前时间戳与冷静期秒数，计算冷静期截止时间戳（毫秒）
 */
export const createDeleteCooldownUntil = (
  cooldownSeconds: number = PROJECT_DELETE_COOLDOWN_SECONDS,
  now: number = Date.now()
): number => {
  if (!Number.isFinite(cooldownSeconds) || cooldownSeconds <= 0) {
    return now;
  }
  return now + Math.round(cooldownSeconds * 1000);
};

/**
 * 计算距离冷静期结束的剩余秒数（向上取整；已过期或无冷静期时返回 0）
 */
export const calculateRemainingCooldownSeconds = (
  cooldownUntil: number | null | undefined,
  now: number = Date.now()
): number => {
  if (cooldownUntil == null || !Number.isFinite(cooldownUntil)) {
    return 0;
  }
  const remainingMs = cooldownUntil - now;
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
};

/**
 * 计算距离下一次剩余秒数递减的精确等待毫秒数，避免整秒跳变抖动与多余渲染
 */
export const calculateNextCooldownTickDelayMs = (
  cooldownUntil: number,
  now: number = Date.now()
): number => {
  const remainingMs = cooldownUntil - now;
  if (remainingMs <= 0) {
    return 0;
  }
  const remainder = remainingMs % 1000;
  return remainder === 0 ? 1000 : remainder;
};

/**
 * 清理已删除项目及已到期的冷静期记录，确保项目被删除后自动取消其冷静期
 */
export const pruneProjectDeleteCooldowns = (
  cooldowns: ProjectDeleteCooldownMap,
  existingAppIds: ReadonlySet<number>,
  now: number = Date.now()
): ProjectDeleteCooldownMap => {
  const next: ProjectDeleteCooldownMap = {};
  for (const [rawId, untilMs] of Object.entries(cooldowns)) {
    const appId = Number(rawId);
    if (!Number.isFinite(appId) || !existingAppIds.has(appId)) {
      continue;
    }
    if (calculateRemainingCooldownSeconds(untilMs, now) > 0) {
      next[appId] = untilMs;
    }
  }
  return next;
};

/**
 * 判断两个项目冷静期映射是否完全一致，用于避免无效状态更新
 */
export const areCooldownMapsEqual = (
  a: ProjectDeleteCooldownMap,
  b: ProjectDeleteCooldownMap
): boolean => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  return keysA.every((key) => a[Number(key)] === b[Number(key)]);
};

/**
 * 计算多项目冷静期中最早的下一次整秒边界延迟（无活跃冷静期时返回 null）
 */
export const getEarliestNextCooldownTickDelayMs = (
  cooldowns: ProjectDeleteCooldownMap,
  now: number = Date.now()
): number | null => {
  const entries = Object.values(cooldowns);
  if (entries.length === 0) {
    return null;
  }
  let earliest = Number.POSITIVE_INFINITY;
  for (const untilMs of entries) {
    const delay = calculateNextCooldownTickDelayMs(untilMs, now);
    if (delay < earliest) {
      earliest = delay;
    }
  }
  return Number.isFinite(earliest) ? earliest : null;
};
