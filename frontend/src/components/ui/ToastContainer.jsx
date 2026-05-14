import { memo } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  danger: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success",
  error: "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error",
  danger: "bg-danilo-error border-danilo-error text-white",
  info: "bg-danilo-surface border-danilo-border text-danilo-text",
};

export default memo(function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" role="alert" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto text-sm animate-slide-up", STYLES[t.type] || STYLES.info)}>
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{t.message}</div>
            <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
});
