import { memo } from "react";
import { cn } from "../../lib/utils";

export default memo(function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, variant }) {
  if (!open) return null;
  const isDestructive = variant === "danger";
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onCancel} aria-label="Cancel" />
      <div className="relative bg-danilo-surface rounded-2xl shadow-xl border border-danilo-border p-6 w-full max-w-sm animate-slide-up">
        <h3 className="text-base font-semibold text-danilo-text mb-2">{title}</h3>
        <p className="text-sm text-danilo-text-secondary mb-5 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-xl border border-danilo-border text-danilo-text-secondary hover:bg-danilo-surface-hover transition">Cancel</button>
          <button type="button" onClick={onConfirm} className={cn("px-4 py-2 text-sm font-medium rounded-xl text-white transition", isDestructive ? "bg-danilo-error hover:brightness-110" : "bg-danilo-primary hover:bg-danilo-primary-hover")}>{confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
});
