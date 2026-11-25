import * as React from "react";
import type { ToastItem, ToastVariant } from "@/components/ui/toast";
import { mapFriendlyError } from "@/lib/errorMapper";

const TOAST_LIMIT = 1;

export type ToasterToast = ToastItem;

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST": {
      // Clear existing timeouts since newer replaces older
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();

      return {
        ...state,
        toasts: [action.toast].slice(0, TOAST_LIMIT),
      };
    }

    case "DISMISS_TOAST":
    case "REMOVE_TOAST": {
      const { toastId } = action;
      if (toastId) {
        const timeout = toastTimeouts.get(toastId);
        if (timeout) {
          clearTimeout(timeout);
          toastTimeouts.delete(toastId);
        }
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        };
      }
      toastTimeouts.forEach((t) => clearTimeout(t));
      toastTimeouts.clear();
      return { ...state, toasts: [] };
    }
  }
}

export function toast(props: ToastOptions) {
  const id = genId();

  let { title, description, variant = "default", duration } = props;

  // If error/destructive, pass through human error mapping if needed
  if (variant === "destructive" || variant === "error") {
    variant = "error";
    if (typeof description === "string") {
      const mapped = mapFriendlyError(description, typeof title === "string" ? title : "Something went wrong");
      // If description was a raw technical error, replace with friendly text
      if (
        description.toLowerCase().includes("failed to fetch") ||
        description.toLowerCase().includes("network") ||
        description.toLowerCase().includes("cors")
      ) {
        title = mapped.title;
        description = mapped.message;
      }
    }
  }

  // Auto-dismiss duration: 5s for errors, 4s for others
  const effectiveDuration = duration ?? (variant === "error" ? 5000 : 4000);

  const newToast: ToasterToast = {
    id,
    title,
    description,
    variant,
    duration: effectiveDuration,
  };

  dispatch({ type: "ADD_TOAST", toast: newToast });

  const timeout = setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id });
  }, effectiveDuration);

  toastTimeouts.set(id, timeout);

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
  };
}

/**
 * Convenience helper to map and display any caught error gracefully.
 */
export function toastError(error: any, fallbackTitle: string = "Something went wrong") {
  const friendly = mapFriendlyError(error, fallbackTitle);
  return toast({
    title: friendly.title,
    description: friendly.message,
    variant: "error",
  });
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    toastError,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
