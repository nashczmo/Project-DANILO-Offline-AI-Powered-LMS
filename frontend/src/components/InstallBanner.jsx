export default function InstallBanner({ promptEvent, onInstall, onDismiss }) {
  if (!promptEvent) return null;
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-primary-100">
          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" /></svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Install DANILO</p>
          <p className="text-xs text-slate-500">Add to your home screen for offline access.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onInstall} className="dn-btn-primary text-xs py-1.5 px-3">Install</button>
        <button onClick={onDismiss} className="dn-btn-ghost text-xs py-1.5 px-3">Dismiss</button>
      </div>
    </div>
  );
}
