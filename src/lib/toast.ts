type ToastEntry = { id: string; message: string; type: "add" | "remove" };
type Listener = (toasts: ToastEntry[]) => void;

let toasts: ToastEntry[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: "add" | "remove" = "add") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

export function subscribeToast(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export type { ToastEntry };
