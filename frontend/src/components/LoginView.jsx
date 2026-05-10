import { BookOpen } from "lucide-react";

export default function LoginView({ form, onChange, onSubmit, loading, error }) {
  return (
    <div className="min-h-screen flex bg-danilo-bg" role="main">
      {/* Form panel */}
      <div className="w-full lg:w-[42%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-10 bg-danilo-surface border-r border-danilo-border shadow-xl">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-danilo-primary flex items-center justify-center flex-shrink-0 shadow-glow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-danilo-text-muted uppercase tracking-[0.14em]">Project</p>
            <p className="text-sm font-bold text-danilo-text tracking-tight">DANILO</p>
          </div>
        </div>

        {/* Form */}
        <div className="my-auto w-full max-w-[360px] mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-danilo-text tracking-tight">Welcome back</h2>
            <p className="text-sm text-danilo-text-secondary mt-1.5">Sign in to your learning portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" aria-label="Sign in form">
            <div className="space-y-1">
              <label htmlFor="login-username" className="text-xs font-semibold text-danilo-text-muted uppercase tracking-wide sr-only">
                Username
              </label>
              <input
                id="login-username"
                name="username"
                value={form.username}
                onChange={onChange}
                className="dn-input py-3 text-center font-medium text-base"
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-required="true"
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="login-password" className="sr-only">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                className="dn-input py-3 text-center font-medium text-base"
                placeholder="Password"
                autoComplete="current-password"
                aria-required="true"
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>

            {error && (
              <div
                id="login-error"
                className="rounded-xl bg-danilo-error-subtle border border-danilo-error/20 px-4 py-3 text-center"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-danilo-error">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full dn-btn-primary py-3 text-sm font-semibold mt-2 rounded-xl"
              style={{ minHeight: 48 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="dn-spinner" />
                  Authenticating…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-danilo-border text-center">
          <p className="text-[10px] font-semibold text-danilo-text-muted uppercase tracking-widest mb-3">System Roles</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="dn-badge bg-danilo-primary-subtle text-danilo-primary border border-danilo-primary/20">
              School Admin
            </span>
            <span className="dn-badge bg-danilo-bg text-danilo-text-secondary border border-danilo-border">
              Faculty
            </span>
            <span className="dn-badge bg-danilo-success-subtle text-danilo-success border border-danilo-success/20">
              Learner
            </span>
          </div>
        </footer>
      </div>

      {/* Hero panel */}
      <div
        className="hidden lg:flex lg:flex-1 relative overflow-hidden items-center justify-center bg-danilo-bg"
        aria-hidden="true"
      >
        {/* Background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(37,99,235,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(6,182,212,0.06),transparent_55%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danilo-primary/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 text-center flex flex-col items-center px-8 max-w-lg">
          <div className="w-20 h-20 rounded-3xl bg-danilo-surface border border-danilo-border shadow-xl flex items-center justify-center mb-8">
            <BookOpen className="w-10 h-10 text-danilo-primary" />
          </div>
          <h1 className="text-5xl font-bold text-danilo-text tracking-tight mb-4">DANILO</h1>
          <p className="text-base font-medium text-danilo-text-secondary mb-2">
            DepEd-Aligned Networked Instruction and Learning Offline
          </p>
          <p className="text-sm text-danilo-text-muted leading-relaxed max-w-sm">
            AI-powered learning management system built for Filipino schools — works without internet.
          </p>

          <div className="mt-10 flex items-center gap-6">
            {[
              { label: "Offline-first", dot: "bg-danilo-success" },
              { label: "AI-powered", dot: "bg-danilo-primary" },
              { label: "DepEd-aligned", dot: "bg-danilo-secondary" },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-danilo-text-muted">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
