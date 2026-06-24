import { reactive, readonly } from "vue";
import type { Feedback } from "./types";

export interface Toast {
  id: number;
  type: Feedback;
  message: string;
}

const state = reactive<{ toasts: Toast[] }>({ toasts: [] });
let seq = 0;

function push(type: Feedback, message: string, timeout = 3200): number {
  const id = ++seq;
  state.toasts.push({ id, type, message });
  if (timeout > 0) {
    window.setTimeout(() => dismiss(id), timeout);
  }
  return id;
}

function dismiss(id: number): void {
  const i = state.toasts.findIndex((t) => t.id === id);
  if (i !== -1) state.toasts.splice(i, 1);
}

/**
 * Composable de toasts. Renderize <OrenToaster /> uma vez na raiz do app
 * e dispare mensagens de qualquer lugar:
 *
 *   const toast = useToast()
 *   toast.success('Salvo!')
 */
export function useToast() {
  return {
    toasts: readonly(state.toasts),
    success: (msg: string, timeout?: number) => push("success", msg, timeout),
    error: (msg: string, timeout?: number) => push("error", msg, timeout),
    warning: (msg: string, timeout?: number) => push("warning", msg, timeout),
    info: (msg: string, timeout?: number) => push("info", msg, timeout),
    dismiss,
  };
}
