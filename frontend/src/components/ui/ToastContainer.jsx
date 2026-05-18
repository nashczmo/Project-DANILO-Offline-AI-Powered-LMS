import { memo, useEffect, useState } from "react";
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success",
  error: "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error",
  danger: "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error",
  warning: "bg-danilo-warning-subtle border-danilo-warning/20 text-danilo-warning",
  info: "bg-danilo-primary-subtle border-danilo-primary/20 text-danilo-primary",
};

const PROGRESS_COLORS = {
  success: "bg-danilo-success",
  error: "bg-danilo-error",
  danger: "bg-danilo-error",
  warning: "bg-danilo-warning",
  info: "bg-danilo-primary",
};

const TOAST_DURATION = 4500;

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const Icon = ICONS[toast.type] || Info;
  const isAutoDismiss = toast.type !== "danger";

  useEffect(() => {
    if (!isAutoDismiss) return;
    const start = Date.now();
    let raf;
    function tick() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [toast.id, toast.type, isAutoDismiss, onDismiss]);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg border pointer-events-auto text-sm overflow-hidden animate-slide-up",
        STYLES[toast.type] || STYLES.info
      )}
      role="alert"
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 font-medium pr-2">{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
      {isAutoDismiss && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
          <div
            className={cn("h-full transition-none", PROGRESS_COLORS[toast.type] || PROGRESS_COLORS.info)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" role="region" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
});
