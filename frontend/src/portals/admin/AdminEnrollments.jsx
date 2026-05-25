import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Users, Plus, Minus } from "lucide-react";

export default function AdminEnrollments() {
  const { data: courses, loading: coursesLoading } = useApi("/admin/courses", { immediate: true });
  const { data: users } = useApi("/admin/users?role=student", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const { data: courseDetail, loading: detailLoading, refresh: refreshDetail } = useApi(
    selectedCourseId ? `/classes/${selectedCourseId}/people` : null,
    { immediate: !!selectedCourseId }
  );
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !enrollStudentId) return;
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest(`/admin/courses/${selectedCourseId}/enroll`, {
        method: "POST",
        body: { studentId: parseInt(enrollStudentId) },
      });
      setEnrollStudentId("");
      refreshDetail();
      setNoticeType("success");
      setNotice("Student enrolled successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not enroll student.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenroll = async (studentId) => {
    if (!confirm("Are you sure you want to remove this student from the class?")) return;
    try {
      await apiRequest(`/admin/courses/${selectedCourseId}/enroll/${studentId}`, { method: "DELETE" });
      refreshDetail();
      setNoticeType("success");
      setNotice("Student removed from class.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not remove student.");
    }
  };

  const availableStudents = (users || []).filter(
    (u) => u.role === "student" && !(courseDetail?.students || []).some((s) => s.id === u.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Enrollments" description="Manage student enrollments in classes." />

      <Card>
        <label className="dn-label mb-2 block">Select Class</label>
        <select
          className="dn-input"
          value={selectedCourseId || ""}
          onChange={(e) => setSelectedCourseId(e.target.value || null)}
        >
          <option value="">Choose a class...</option>
          {(courses || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} {c.subject} {c.gradeLevel}
            </option>
          ))}
        </select>
      </Card>

      {notice && (
        <div className={`p-3 rounded-xl border text-sm font-medium ${
          noticeType === "success"
            ? "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success"
            : "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error"
        }`}>
          {notice}
        </div>
      )}

      {selectedCourseId && detailLoading && <Skeleton className="h-48" />}

      {selectedCourseId && !detailLoading && courseDetail && (
        <div className="space-y-6">
          <Card>
            <h3 className="dn-title mb-4">Enroll Student</h3>
            {availableStudents.length === 0 ? (
              <p className="text-sm text-danilo-text-secondary">All available students are already enrolled.</p>
            ) : (
              <form onSubmit={handleEnroll} className="flex items-end gap-2">
                <select
                  className="dn-input flex-1"
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  required
                >
                  <option value="">Select student</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.email || s.username})</option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={submitting}><Plus className="w-4 h-4" /> Enroll</Button>
              </form>
            )}
          </Card>

          <Card>
            <h3 className="dn-title mb-4">Enrolled Students ({courseDetail.students?.length || 0})</h3>
            {courseDetail.students?.length > 0 ? (
              <div className="space-y-2">
                {courseDetail.students.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-danilo-bg-tertiary text-danilo-text-secondary flex items-center justify-center font-bold text-xs">{s.fullName?.charAt(0) || "S"}</div>
                      <div>
                        <p className="text-sm font-medium text-danilo-text">{s.fullName}</p>
                        <p className="dn-caption">{s.email || s.username}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleUnenroll(s.id)}><Minus className="w-3.5 h-3.5 text-danilo-error" /> Remove</Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No students enrolled" description="Enroll students using the form above." />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
