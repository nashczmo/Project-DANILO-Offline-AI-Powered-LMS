import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import LoginView from "./components/auth/LoginView";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StudentPortal from "./portals/student/StudentPortal";
import TeacherPortal from "./portals/teacher/TeacherPortal";
import AdminPortal from "./portals/admin/AdminPortal";
import { apiRequest } from "./api";
import { Loader2 } from "lucide-react";

export default function App() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setDashboard = useAppStore((s) => s.setDashboard);
  const logout = useAppStore((s) => s.logout);
  const [loading, setLoading] = useState(!!token);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function initSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await apiRequest("/me");
        if (!active) return;
        setUser(userData);
        
        // Fetch universal dashboard state if not admin (admin fetches independently)
        if (userData.role !== "admin") {
          const dashData = await apiRequest("/dashboard");
          if (!active) return;
          setDashboard(dashData);
        }
      } catch (err) {
        if (!active) return;
        if (err?.status === 401) {
          logout();
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    initSession();
    return () => { active = false; };
  }, [token, setUser, setDashboard, logout]);

  // Root redirection logic based on role
  useEffect(() => {
    if (!loading && user && location.pathname === "/") {
      if (user.role === "admin") navigate("/admin/overview", { replace: true });
      else if (user.role === "teacher") navigate("/teacher/overview", { replace: true });
      else navigate("/student/overview", { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-danilo-bg flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-danilo-primary animate-spin mb-4" />
        <p className="text-sm font-medium text-danilo-text-muted">Loading your workspace...</p>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/*" 
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPortal />
          </ProtectedRoute>
        } 
      />
      {/* Fallback for authenticated users trying to access root or unknown paths */}
      <Route path="*" element={
        <div className="min-h-screen bg-danilo-bg flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold text-danilo-text">404 - Page Not Found</h1>
          <p className="text-danilo-text-muted">The page you are looking for does not exist.</p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-danilo-primary text-white rounded shadow hover:bg-danilo-primary-dark">
            Go Back
          </button>
        </div>
      } />
    </Routes>
  );
}
