import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import TeacherLayout from "./TeacherLayout";
import TeacherDashboard from "./TeacherDashboard";
import TeacherClasses from "./TeacherClasses";
import TeacherGrades from "./TeacherGrades";
import TeacherAnnouncements from "./TeacherAnnouncements";

export default function TeacherPortal() {
  const user = useAppStore((s) => s.user);
  if (user.role !== "teacher") return <Navigate to="/" replace />;

  return (
    <TeacherLayout>
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<TeacherDashboard />} />
        <Route path="classes/*" element={<TeacherClasses />} />
        <Route path="grades" element={<TeacherGrades />} />
        <Route path="announcements" element={<TeacherAnnouncements />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </TeacherLayout>
  );
}
