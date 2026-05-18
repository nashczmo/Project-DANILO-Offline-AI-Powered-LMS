import { memo } from "react";
import { Download, X } from "lucide-react";

export default memo(function InstallBanner({ promptEvent, onInstall, onDismiss }) {
  if (!promptEvent) return null;
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-danilo-primary/20 bg-danilo-primary-subtle px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-danilo-border shadow-xs">
          <Download className="w-4 h-4 text-danilo-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-danilo-text truncate">Install DANILO</p>
          <p className="text-xs text-danilo-text-secondary">Add to your home screen for offline access.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onInstall} className="dn-btn-primary dn-btn-sm">
          Install
        </button>
        <button onClick={onDismiss} className="dn-btn-icon dn-btn-icon-sm" aria-label="Dismiss install banner">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
