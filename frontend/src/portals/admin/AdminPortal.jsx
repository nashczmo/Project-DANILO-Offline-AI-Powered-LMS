import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminDirectory from "./AdminDirectory";
import AdminEnrollments from "./AdminEnrollments";
import AdminReports from "./AdminReports";
import AdminSystem from "./AdminSystem";

export default function AdminPortal() {
  const user = useAppStore((s) => s.user);
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminDashboard />} />
        <Route path="directory/*" element={<AdminDirectory />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </AdminLayout>
  );
}
