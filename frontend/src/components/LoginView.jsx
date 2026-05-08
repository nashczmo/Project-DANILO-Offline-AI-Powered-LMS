export default function LoginView({ form, onChange, onSubmit, loading, error }) {
  return (
    <div className="min-h-screen flex bg-slate-50" role="main">
      <div className="w-full lg:w-[40%] flex flex-col justify-between p-8 sm:p-12 relative z-10 bg-white shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)] border-r border-slate-100">
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">DANILO</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Localized &middot; Offline</p>
        </div>

        <div className="my-auto w-full max-w-[380px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to your learning portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" aria-label="Login form">
            <div>
              <input
                id="login-username" name="username" value={form.username} onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-center font-medium"
                placeholder="Username"
                autoComplete="username" autoCapitalize="none" aria-required="true"
              />
            </div>
            <div>
              <input
                id="login-password" type="password" name="password" value={form.password} onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-center font-medium"
                placeholder="Password"
                autoComplete="current-password" aria-required="true"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-danger-50 border border-danger-200 px-4 py-3 text-center" role="alert">
                <p className="text-sm font-medium text-danger-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary-600 text-white font-semibold py-3.5 text-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-white animate-spin" />
                  Authenticating...
                </span>
              ) : "Sign In"}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">System Roles</p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold tracking-wide">School Admin</span>
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold tracking-wide">Faculty</span>
            <span className="px-3 py-1 rounded-full bg-success-50 border border-success-200 text-success-700 text-xs font-semibold tracking-wide">Learner</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden items-center justify-center bg-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-100/60 via-slate-50 to-white opacity-80" />
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white border border-primary-100 shadow-xl flex items-center justify-center mb-8">
            <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-3">DANILO</h1>
          <p className="text-lg font-medium text-slate-500">Localized. Offline. Empowered.</p>
        </div>
      </div>
    </div>
  );
}
