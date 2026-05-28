import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import LoginView from "./components/auth/LoginView";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { apiRequest } from "./api";
import { ErrorBoundary } from "./components/ui";

import StudentOverview from "./portals/student/StudentDashboard";
import StudentClasses from "./portals/student/StudentClasses";
import StudentGrades from "./portals/student/StudentGrades";
import StudentAssignments from "./portals/student/StudentAssignments";
import StudentTutor from "./portals/student/StudentTutor";

import TeacherOverview from "./portals/teacher/TeacherDashboard";
import TeacherClasses from "./portals/teacher/TeacherClasses";
import TeacherGrades from "./portals/teacher/TeacherGrades";
import TeacherAnnouncements from "./portals/teacher/TeacherAnnouncements";
import TeacherInsights from "./portals/teacher/TeacherInsights";
import TeacherAIQuizzes from "./portals/teacher/TeacherAIQuizzes";

import AdminOverview from "./portals/admin/AdminDashboard";
import AdminDirectory from "./portals/admin/AdminDirectory";
import AdminEnrollments from "./portals/admin/AdminEnrollments";
import AdminReports from "./portals/admin/AdminReports";
import AdminSystem from "./portals/admin/AdminSystem";

export default function App() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setDashboard = useAppStore((s) => s.setDashboard);
  const setOffline = useAppStore((s) => s.setOffline);
  const logout = useAppStore((s) => s.logout);
  const [loading, setLoading] = useState(!!token);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOffline]);

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
        if (userData.role !== "admin") {
          const dashData = await apiRequest("/dashboard");
          if (!active) return;
          setDashboard(dashData);
        }
      } catch (err) {
        if (!active) return;
        if (err?.status === 401) logout();
      } finally {
        if (active) setLoading(false);
      }
    }
    initSession();
    return () => { active = false; };
  }, [token, setUser, setDashboard, logout]);

  useEffect(() => {
    if (!loading && user && location.pathname === "/") {
      if (user.role === "admin") navigate("/admin/overview", { replace: true });
      else if (user.role === "teacher") navigate("/teacher/overview", { replace: true });
      else navigate("/student/overview", { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1A73E8] flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl">D</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-[3px] border-[#1A73E8]/20 border-t-[#1A73E8] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#9AA0A6]">Loading your workspace…</p>
          </div>
        </div>
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
    <ErrorBoundary>
      <Routes>
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <AppLayout role="student">
                <Routes>
                  <Route path="/" element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<StudentOverview />} />
                  <Route path="classes/*" element={<StudentClasses />} />
                  <Route path="grades" element={<StudentGrades />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="tutor" element={<StudentTutor />} />
                  <Route path="*" element={<Navigate to="overview" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <AppLayout role="teacher">
                <Routes>
                  <Route path="/" element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<TeacherOverview />} />
                  <Route path="classes/*" element={<TeacherClasses />} />
                  <Route path="grades" element={<TeacherGrades />} />
                  <Route path="announcements" element={<TeacherAnnouncements />} />
                  <Route path="insights" element={<TeacherInsights />} />
                  <Route path="quizzes" element={<TeacherAIQuizzes />} />
                  <Route path="*" element={<Navigate to="overview" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppLayout role="admin">
                <Routes>
                  <Route path="/" element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<AdminOverview />} />
                  <Route path="directory/*" element={<AdminDirectory />} />
                  <Route path="enrollments" element={<AdminEnrollments />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="system" element={<AdminSystem />} />
                  <Route path="*" element={<Navigate to="overview" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
