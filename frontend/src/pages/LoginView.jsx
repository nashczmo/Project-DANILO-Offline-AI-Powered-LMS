import { memo, useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, WifiOff } from "lucide-react";
import { apiRequest } from "../api";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";

function createBootstrapDashboard(user) {
  return {
    user,
    stream: [],
    courses: [],
    contentFolders: [],
    grades: [],
    hints: { hasContent: false, hasCourses: false, hasGrades: false, hasStream: false },
    contentWorkflow: null,
    network: null,
    operationsHighlights: [],
  };
}

export default memo(function LoginView({ sessionError = "" }) {
  const setToken = useAppStore((s) => s.setToken);
  const setUser = useAppStore((s) => s.setUser);
  const setDashboard = useAppStore((s) => s.setDashboard);
  const addToast = useAppStore((s) => s.addToast);

  const [form, setForm] = useState({ username: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionError) setError(sessionError);
  }, [sessionError]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          body: {
            username: form.username.trim(),
            password: form.password,
          },
        });

        if (!response?.accessToken || !response?.user) {
          throw new Error("Invalid username or password");
        }

        setToken(response.accessToken);
        setUser(response.user);
        setDashboard(createBootstrapDashboard(response.user));
        addToast(`Welcome back, ${response.user.fullName || response.user.username}!`, "success");
      } catch (err) {
        const msg = err?.message || "Invalid username or password";
        setError(msg);
        addToast(msg, "danger");
      } finally {
        setLoading(false);
      }
    },
    [form, setToken, setUser, setDashboard, addToast]
  );

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-danilo-bg-secondary" role="main">
      {/* Login panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-danilo-primary flex items-center justify-center flex-shrink-0 shadow-glow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="dn-overline">Project</p>
            <p className="text-sm font-bold text-danilo-text tracking-tight">DANILO</p>
          </div>
        </div>

        {/* Login card */}
        <div className="my-auto w-full max-w-sm mx-auto">
          <div className="dn-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="dn-heading-lg">Welcome back</h2>
              <p className="dn-subtitle mt-1">Sign in to your learning portal</p>
            </div>

            {isOffline && (
              <div
                className="flex items-center gap-2 rounded-xl bg-danilo-warning-subtle border border-danilo-warning/20 px-4 py-3 mb-4"
                role="alert"
              >
                <WifiOff className="w-4 h-4 text-danilo-warning flex-shrink-0" />
                <p className="text-xs font-medium text-danilo-warning">
                  You are offline. Some features may be limited.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in form">
              <div>
                <label htmlFor="login-username" className="sr-only">
                  Username
                </label>
                <input
                  id="login-username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="dn-input"
                  placeholder="Username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-required="true"
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="sr-only">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="dn-input"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-danilo-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-danilo-border text-danilo-primary focus:ring-danilo-primary"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="dn-btn-primary dn-btn-lg w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-danilo-border text-center">
          <p className="dn-overline mb-3">System Roles</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="dn-badge bg-danilo-primary-subtle text-danilo-primary border border-danilo-primary/20">
              School Admin
            </span>
            <span className="dn-badge bg-danilo-bg-tertiary text-danilo-text-secondary border border-danilo-border">
              Faculty
            </span>
            <span className="dn-badge bg-danilo-success-subtle text-danilo-success border border-danilo-success/20">
              Learner
            </span>
          </div>
        </footer>
      </div>

      {/* Brand panel - desktop only */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center dn-gradient-hero"
        aria-hidden="true"
      >
        {/* Soft decorative blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-danilo-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-danilo-purple/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-danilo-success/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danilo-primary/20 to-transparent" />

        <div className="relative z-10 text-center flex flex-col items-center px-8 max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-white border border-danilo-border shadow-lg flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-danilo-primary" />
          </div>
          <h1 className="text-5xl font-bold text-danilo-text tracking-tight mb-3">DANILO</h1>
          <p className="text-base font-medium text-danilo-text-secondary mb-2">
            AI-Powered Learning Management System
          </p>
          <p className="text-sm text-danilo-text-muted leading-relaxed max-w-sm">
            DepEd-Aligned Networked Instruction and Learning Offline — built for Filipino schools,
            works without internet.
          </p>

          <div className="mt-8 flex items-center gap-6 flex-wrap justify-center">
            {[
              { label: "Offline-first", dot: "bg-danilo-success" },
              { label: "AI-powered", dot: "bg-danilo-primary" },
              { label: "DepEd-aligned", dot: "bg-danilo-secondary" },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-danilo-text-muted">
                <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
