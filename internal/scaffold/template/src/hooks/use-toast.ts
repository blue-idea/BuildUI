import { useSyncExternalStore, type ReactNode } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToastItem = Omit<ToastProps, "title"> & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};

let toasts: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function setToasts(next: ToastItem[]) {
  toasts = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

function dismiss(id?: string) {
  setToasts(id ? toasts.filter((item) => item.id !== id) : []);
}

export function toast(input: Omit<ToastItem, "id">) {
  const id = String(++nextId);
  setToasts([{ ...input, id, open: true, onOpenChange: (open) => {
    input.onOpenChange?.(open);
    if (!open) dismiss(id);
  } }, ...toasts]);
  return { id, dismiss: () => dismiss(id) };
}

export function useToast() {
  return { toasts: useSyncExternalStore(subscribe, () => toasts), toast, dismiss };
}
