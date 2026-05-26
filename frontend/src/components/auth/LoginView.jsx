import { useState } from "react";
import { apiRequest } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { AlertCircle, Loader2, BookOpen, Eye, EyeOff } from "lucide-react";

export default function LoginView({ sessionError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(sessionError || "");
  const [loading, setLoading] = useState(false);

  const setToken = useAppStore((s) => s.setToken);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      if (data.accessToken) {
        setToken(data.accessToken);
      }
    } catch (err) {
      if (err.status === 401) {
        setError("Invalid username or password. Please try again.");
      } else {
        setError(err.message || "Failed to connect to DANILO. Please check your network.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-[#E0E0E0] overflow-hidden"
           style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* Top stripe — Google color bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05]" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          {/* Product icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E8F0FE] mb-5">
            <BookOpen className="w-8 h-8 text-[#1A73E8]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-[#202124] tracking-tight">Sign in</h1>
          <p className="text-sm text-[#5F6368] mt-1.5 font-bold">
            to continue to <span className="text-[#202124]">DANILO LMS</span>
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/15 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-[#D93025] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm font-bold text-[#D93025]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-bold text-[#202124] mb-2"
              >
                Learner ID / Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="dn-input"
                placeholder="Enter your username or LRN"
                autoComplete="username"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-[#202124] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dn-input pr-11"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#5F6368] transition-colors p-0.5 rounded"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full dn-btn-primary py-3 text-sm font-bold rounded-xl mt-2 justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#9AA0A6] font-bold text-center">
        Project DANILO · Offline-First LMS for DepEd Schools
      </p>
    </div>
  );
}
