import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import StudentLayout from "./StudentLayout";
import StudentDashboard from "./StudentDashboard";
import StudentTutor from "./StudentTutor";
import StudentClasses from "./StudentClasses";
import StudentGrades from "./StudentGrades";

export default function StudentPortal() {
  const user = useAppStore((s) => s.user);
  if (user.role !== "student") return <Navigate to="/" replace />;

  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<StudentDashboard />} />
        <Route path="tutor" element={<StudentTutor />} />
        <Route path="classes/*" element={<StudentClasses />} />
        <Route path="grades" element={<StudentGrades />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </StudentLayout>
  );
}
