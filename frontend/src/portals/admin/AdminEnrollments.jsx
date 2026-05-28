import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Users, Plus, Minus, BookOpen, ChevronRight } from "lucide-react";

export default function AdminEnrollments() {
  const { data: courses, loading: coursesLoading, refresh: refreshCourses } = useApi("/admin/courses", { immediate: true });
  const { data: users } = useApi("/admin/users?role=student", { immediate: true });
  const { data: teachers } = useApi("/admin/users?role=teacher", { immediate: true });
  const { data: sections } = useApi("/admin/sections", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const { data: courseDetail, loading: detailLoading, refresh: refreshDetail } = useApi(
    selectedCourseId ? `/classes/${selectedCourseId}/people` : null,
    { immediate: !!selectedCourseId }
  );
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");
  const [classForm, setClassForm] = useState({});

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !enrollStudentId) return;
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest(`/admin/courses/${selectedCourseId}/enroll`, {
        method: "POST",
        body: { studentId: enrollStudentId },
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

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const section = (sections || []).find((s) => s.id === classForm.sectionId);
    if (!classForm.title?.trim() || !classForm.subject?.trim() || !section) {
      setNoticeType("error");
      setNotice("Class name, subject, and section are required.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiRequest("/admin/courses", {
        method: "POST",
        body: {
          code: classForm.code || `${classForm.subject.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-5)}`,
          title: classForm.title,
          subject: classForm.subject,
          educationLevel: section.educationLevel,
          gradeLevel: section.gradeLevel,
          strand: section.strand || undefined,
          teacherId: classForm.teacherId || undefined,
          schoolYear: classForm.schoolYear || section.schoolYear || "2026-2027",
          term: classForm.term || "Term 1",
        },
      });
      if (classForm.enrollSection) {
        await apiRequest(`/admin/courses/${created.id}/enroll-section`, {
          method: "POST",
          body: { sectionId: section.id },
        });
      }
      setClassForm({});
      refreshCourses();
      setSelectedCourseId(created.id);
      setNoticeType("success");
      setNotice("Class created successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not create class.");
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

  const selectedCourse = (courses || []).find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Enrollments"
        description="Create classes and manage student enrollments."
      />

      {/* Notice */}
      {notice && (
        <div
          role="alert"
          className={`px-4 py-3 rounded-xl border text-sm font-bold animate-fade-in ${
            noticeType === "success"
              ? "bg-[#E6F4EA] border-[#188038]/20 text-[#188038]"
              : "bg-[#FCE8E6] border-[#D93025]/20 text-[#D93025]"
          }`}
        >
          {notice}
        </div>
      )}

      {/* ── Create Class Form ── */}
      <Card>
        <h3 className="text-base font-black text-[#202124] mb-5 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1A73E8]" />
          Create Class
        </h3>
        <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            className="dn-input"
            placeholder="Class name *"
            value={classForm.title || ""}
            onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
            required
            aria-label="Class name"
          />
          <input
            className="dn-input"
            placeholder="Subject *"
            value={classForm.subject || ""}
            onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
            required
            aria-label="Subject"
          />
          <select
            className="dn-input"
            value={classForm.sectionId || ""}
            onChange={(e) => setClassForm({ ...classForm, sectionId: e.target.value })}
            required
            aria-label="Section"
          >
            <option value="">Section *</option>
            {(sections || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.gradeLevel}
              </option>
            ))}
          </select>
          <select
            className="dn-input"
            value={classForm.teacherId || ""}
            onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
            aria-label="Assign teacher"
          >
            <option value="">Assign teacher (optional)</option>
            {(teachers || []).map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
          <input
            className="dn-input"
            placeholder="School year (e.g. 2026-2027)"
            value={classForm.schoolYear || ""}
            onChange={(e) => setClassForm({ ...classForm, schoolYear: e.target.value })}
            aria-label="School year"
          />
          <select
            className="dn-input"
            value={classForm.term || "Term 1"}
            onChange={(e) => setClassForm({ ...classForm, term: e.target.value })}
            aria-label="Term"
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <label className="flex items-center gap-2.5 text-sm font-bold text-[#5F6368] cursor-pointer col-span-full sm:col-span-1">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#1A73E8] rounded"
              checked={!!classForm.enrollSection}
              onChange={(e) => setClassForm({ ...classForm, enrollSection: e.target.checked })}
            />
            Enroll all students in selected section
          </label>
          <div className="col-span-full flex gap-2 pt-1">
            <Button type="submit" disabled={submitting}>
              <Plus className="w-4 h-4" />
              {submitting ? "Creating…" : "Create Class"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Class Selector ── */}
      <Card>
        <label htmlFor="course-select" className="block text-sm font-black text-[#202124] mb-2">
          Select Class to Manage
        </label>
        {coursesLoading ? (
          <Skeleton className="h-10" />
        ) : (
          <select
            id="course-select"
            className="dn-input"
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value || null)}
          >
            <option value="">Choose a class…</option>
            {(courses || []).map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.subject} — {c.gradeLevel}
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* ── Enrollment Panel ── */}
      {selectedCourseId && detailLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </div>
      )}

      {selectedCourseId && !detailLoading && courseDetail && (
        <div className="space-y-4 animate-fade-in">
          {/* Enroll student */}
          <Card>
            <h3 className="text-base font-black text-[#202124] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1A73E8]" />
              Enroll Student
              {selectedCourse && (
                <span className="text-sm font-bold text-[#9AA0A6] ml-1">
                  — {selectedCourse.subject}
                </span>
              )}
            </h3>
            {availableStudents.length === 0 ? (
              <p className="text-sm text-[#9AA0A6] font-bold">
                All available students are already enrolled.
              </p>
            ) : (
              <form onSubmit={handleEnroll} className="flex items-end gap-2">
                <select
                  className="dn-input flex-1"
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  required
                  aria-label="Select student"
                >
                  <option value="">Select a student…</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.email || s.username})
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={submitting}>
                  <Plus className="w-4 h-4" />
                  Enroll
                </Button>
              </form>
            )}
          </Card>

          {/* Enrolled students */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-[#202124] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1A73E8]" />
                Enrolled Students
              </h3>
              <span className="text-sm font-bold text-[#9AA0A6]">
                {courseDetail.students?.length || 0} student{courseDetail.students?.length !== 1 ? "s" : ""}
              </span>
            </div>
            {courseDetail.students?.length > 0 ? (
              <div className="space-y-2">
                {courseDetail.students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-black text-xs flex-shrink-0">
                        {s.fullName?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#202124]">{s.fullName}</p>
                        <p className="text-xs text-[#9AA0A6] font-bold">{s.email || s.username}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnenroll(s.id)}
                      title="Remove from class"
                    >
                      <Minus className="w-3.5 h-3.5 text-[#D93025]" />
                      <span className="hidden sm:inline text-[#D93025]">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No students enrolled"
                description="Use the form above to enroll students into this class."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
