import { memo } from "react";
import { Download, X } from "lucide-react";

export default memo(function InstallBanner({ promptEvent, onInstall, onDismiss }) {
  if (!promptEvent) return null;
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-danilo-primary/20 bg-danilo-primary-subtle px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-danilo-bg flex items-center justify-center flex-shrink-0 border border-danilo-border">
          <Download className="w-4 h-4 text-danilo-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-danilo-text">Install DANILO</p>
          <p className="text-xs text-danilo-text-secondary">Add to your home screen for offline access.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onInstall} className="dn-btn-primary text-xs py-1.5 px-3">Install</button>
        <button onClick={onDismiss} className="dn-btn-ghost text-xs py-1.5 px-2 min-h-0"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
});
