import { memo } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export default memo(function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, variant }) {
  if (!open) return null;
  const isDestructive = variant === "danger";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-label="Cancel" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl border border-danilo-border shadow-xl p-6 animate-scale-in">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-semibold text-danilo-text">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="dn-btn-icon dn-btn-icon-sm flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-danilo-text-secondary mb-5 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="dn-btn-secondary dn-btn-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn("dn-btn-primary dn-btn-sm", isDestructive && "dn-btn-danger")}
          >
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
});
