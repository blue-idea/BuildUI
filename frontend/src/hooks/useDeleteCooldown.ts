import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PROJECT_DELETE_COOLDOWN_SECONDS,
  ProjectDeleteCooldownMap,
  areCooldownMapsEqual,
  calculateRemainingCooldownSeconds,
  createDeleteCooldownUntil,
  getEarliestNextCooldownTickDelayMs,
  pruneProjectDeleteCooldowns,
} from '../config/projectDelete';

const COOLDOWN_INTERVAL_MS = 1000;

export interface UseProjectDeleteCooldownsOptions {
  /** 当前列表中存在的项目 ID 集合，项目被移除时将自动取消其冷静期 */
  appIds: number[];
  /** 冷静期时长（秒），默认读取集中配置 20 秒 */
  cooldownSeconds?: number;
  /** 可选受控冷静期映射，用于在跨页签切换时保持各项目的冷静期 */
  cooldowns?: ProjectDeleteCooldownMap;
  /** 受控模式下冷静期映射变更回调 */
  onCooldownsChange?: (next: ProjectDeleteCooldownMap) => void;
}

export interface UseProjectDeleteCooldownsResult {
  /** 获取指定项目当前剩余冷静期秒数（0 表示不在冷静期内） */
  getRemainingSeconds: (appId: number) => number;
  /** 判断指定项目当前是否处于冷静期内 */
  isProjectCoolingDown: (appId: number) => boolean;
  /** 仅启动指定项目的删除冷静期 */
  startProjectCooldown: (appId: number) => void;
  /** 手动取消指定项目的删除冷静期 */
  cancelProjectCooldown: (appId: number) => void;
}

/**
 * 按项目 ID 独立管理的删除冷静期 Hook：
 * 1. 仅限制触发删除的当前项目按钮，不影响其他项目
 * 2. 若目标项目已从列表中删除，则自动取消该项目的冷静期
 * 3. 支持受控（跨视图保持）与非受控（组件独立）两种模式
 */
export const useProjectDeleteCooldowns = (
  options: UseProjectDeleteCooldownsOptions
): UseProjectDeleteCooldownsResult => {
  const {
    appIds,
    cooldownSeconds = PROJECT_DELETE_COOLDOWN_SECONDS,
    cooldowns: controlledCooldowns,
    onCooldownsChange,
  } = options;

  const isControlled = controlledCooldowns !== undefined;
  const [internalCooldowns, setInternalCooldowns] = useState<ProjectDeleteCooldownMap>({});
  const effectiveCooldowns = isControlled ? controlledCooldowns : internalCooldowns;

  // 仅在倒计时边界回调中更新当前时钟，保持渲染纯度并精准递减秒数
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const existingAppIds = useMemo(() => new Set(appIds), [appIds]);
  const effectiveCooldownsRef = useRef(effectiveCooldowns);
  const existingAppIdsRef = useRef(existingAppIds);

  useEffect(() => {
    effectiveCooldownsRef.current = effectiveCooldowns;
    existingAppIdsRef.current = existingAppIds;
  }, [effectiveCooldowns, existingAppIds]);

  const updateCooldowns = useCallback(
    (next: ProjectDeleteCooldownMap) => {
      if (!isControlled) {
        setInternalCooldowns(next);
      }
      onCooldownsChange?.(next);
    },
    [isControlled, onCooldownsChange]
  );

  const startProjectCooldown = useCallback(
    (appId: number) => {
      const now = Date.now();
      const until = createDeleteCooldownUntil(cooldownSeconds, now);
      setNowMs(now);
      const base = pruneProjectDeleteCooldowns(
        effectiveCooldownsRef.current,
        existingAppIdsRef.current,
        now
      );
      if (until > now && existingAppIdsRef.current.has(appId)) {
        updateCooldowns({ ...base, [appId]: until });
      } else if (!areCooldownMapsEqual(effectiveCooldownsRef.current, base)) {
        updateCooldowns(base);
      }
    },
    [cooldownSeconds, updateCooldowns]
  );

  const cancelProjectCooldown = useCallback(
    (appId: number) => {
      if (!(appId in effectiveCooldownsRef.current)) {
        return;
      }
      const next: ProjectDeleteCooldownMap = { ...effectiveCooldownsRef.current };
      delete next[appId];
      setNowMs(Date.now());
      updateCooldowns(next);
    },
    [updateCooldowns]
  );

  // 若列表发生变化导致某些处于冷静期的项目已被删除，自动取消这些项目的冷静期
  useEffect(() => {
    const hasDeletedProjectCooldown = Object.keys(effectiveCooldowns).some(
      (rawId) => !existingAppIds.has(Number(rawId))
    );
    if (!hasDeletedProjectCooldown) {
      return;
    }
    const pruned = pruneProjectDeleteCooldowns(effectiveCooldowns, existingAppIds, Date.now());
    if (isControlled) {
      onCooldownsChange?.(pruned);
    } else {
      const timer = window.setTimeout(() => {
        setInternalCooldowns(pruned);
        onCooldownsChange?.(pruned);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [effectiveCooldowns, existingAppIds, isControlled, onCooldownsChange]);

  // 针对所有仍在列表中的活跃冷静期项目，按最早的整秒边界精准推进倒计时
  useEffect(() => {
    const activeCooldowns = pruneProjectDeleteCooldowns(
      effectiveCooldowns,
      existingAppIds,
      Date.now()
    );
    const firstDelayMs = getEarliestNextCooldownTickDelayMs(activeCooldowns, Date.now());
    if (firstDelayMs === null) {
      return;
    }

    let intervalId: number | null = null;

    const syncClock = () => {
      const tickNow = Date.now();
      setNowMs(tickNow);
      const pruned = pruneProjectDeleteCooldowns(
        effectiveCooldownsRef.current,
        existingAppIdsRef.current,
        tickNow
      );
      if (!areCooldownMapsEqual(effectiveCooldownsRef.current, pruned)) {
        updateCooldowns(pruned);
      }
      if (Object.keys(pruned).length === 0 && intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const timeoutId = window.setTimeout(() => {
      syncClock();
      const remaining = pruneProjectDeleteCooldowns(
        effectiveCooldownsRef.current,
        existingAppIdsRef.current,
        Date.now()
      );
      if (Object.keys(remaining).length > 0) {
        intervalId = window.setInterval(syncClock, COOLDOWN_INTERVAL_MS);
      }
    }, firstDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [effectiveCooldowns, existingAppIds, updateCooldowns]);

  const getRemainingSeconds = useCallback(
    (appId: number): number => {
      if (!existingAppIds.has(appId)) {
        return 0;
      }
      return calculateRemainingCooldownSeconds(effectiveCooldowns[appId], nowMs);
    },
    [effectiveCooldowns, existingAppIds, nowMs]
  );

  const isProjectCoolingDown = useCallback(
    (appId: number): boolean => getRemainingSeconds(appId) > 0,
    [getRemainingSeconds]
  );

  return {
    getRemainingSeconds,
    isProjectCoolingDown,
    startProjectCooldown,
    cancelProjectCooldown,
  };
};
