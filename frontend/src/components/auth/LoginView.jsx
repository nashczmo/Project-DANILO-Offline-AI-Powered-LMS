import { useState } from "react";
import { apiRequest } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { BookOpen, AlertCircle, Loader2 } from "lucide-react";

export default function LoginView({ sessionError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      if (err.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError(err.message || "Failed to connect to DANILO. Please check your network.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-danilo-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-danilo-border p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-danilo-primary to-danilo-secondary" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-danilo-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-danilo-primary" />
          </div>
          <h1 className="text-2xl font-bold text-danilo-text tracking-tight">Project DANILO</h1>
          <p className="text-sm text-danilo-text-secondary mt-1">Learning Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-danilo-error-subtle border border-danilo-error/20 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-danilo-error shrink-0 mt-0.5" />
            <p className="text-sm text-danilo-error font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-danilo-text mb-1.5" htmlFor="username">
              Learner ID / Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="dn-input w-full"
              placeholder="e.g. LRN or email"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-danilo-text mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="dn-input w-full"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full dn-btn-primary flex justify-center py-3 text-sm font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
