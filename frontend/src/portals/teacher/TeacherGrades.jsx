import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Button } from "../../components/ui";
import { FileText, GraduationCap, Plus } from "lucide-react";

export default function TeacherGrades() {
  const { data: courses, loading: coursesLoading } = useApi("/teacher/courses", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const {
    data: gradebook,
    loading: gradebookLoading,
    refresh: refreshGradebook,
  } = useApi(
    selectedCourseId ? `/teacher/courses/${selectedCourseId}/gradebook` : null,
    { immediate: !!selectedCourseId }
  );
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const activeCourses = courses || [];

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !formData.studentId || !formData.component) return;
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest(`/teacher/courses/${selectedCourseId}/grades`, {
        method: "POST",
        body: {
          studentId: formData.studentId,
          quarter: formData.quarter || "Q1",
          component: formData.component,
          score: parseFloat(formData.score) || 0,
          maxScore: parseFloat(formData.maxScore) || 100,
          weight: parseFloat(formData.weight) || 1,
          remarks: formData.remarks || "",
        },
      });
      setFormData({});
      refreshGradebook();
      setNoticeType("success");
      setNotice("Grade recorded successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not record grade.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Grades"
        description="Manage and record student grades for your classes."
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

      {/* Class Selector */}
      <Card>
        <label htmlFor="grade-course-select" className="block text-sm font-black text-[#202124] mb-2">
          Select Class
        </label>
        {coursesLoading ? (
          <Skeleton className="h-10" />
        ) : (
          <select
            id="grade-course-select"
            className="dn-input"
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value || null)}
          >
            <option value="">Choose a class…</option>
            {activeCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subject} — {c.gradeLevel} {c.quarter}
              </option>
            ))}
          </select>
        )}
      </Card>

      {selectedCourseId && gradebookLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}

      {selectedCourseId && !gradebookLoading && gradebook && (
        <div className="space-y-6 animate-fade-in">
          {/* Record New Grade */}
          <Card>
            <h3 className="text-base font-black text-[#202124] mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1A73E8]" />
              Record New Grade
            </h3>
            <form onSubmit={handleAddGrade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select
                className="dn-input"
                value={formData.studentId || ""}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
                aria-label="Select student"
              >
                <option value="">Select student *</option>
                {gradebook.students?.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
              <input
                className="dn-input"
                placeholder="Component (e.g. Written Work) *"
                value={formData.component || ""}
                onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                required
                aria-label="Grade component"
              />
              <select
                className="dn-input"
                value={formData.quarter || "Q1"}
                onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                aria-label="Quarter"
              >
                <option>Q1</option>
                <option>Q2</option>
                <option>Q3</option>
                <option>Q4</option>
              </select>
              <input
                className="dn-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Score *"
                value={formData.score || ""}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                required
                aria-label="Score"
              />
              <input
                className="dn-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Max Score *"
                value={formData.maxScore || ""}
                onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                required
                aria-label="Max score"
              />
              <input
                className="dn-input"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="Weight (0-1) *"
                value={formData.weight || ""}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
                aria-label="Weight"
              />
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : "Record Grade"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Grade Entries Table */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap className="w-5 h-5 text-[#1A73E8]" />
              <h3 className="text-base font-black text-[#202124]">Grade Entries</h3>
              {gradebook.entries?.length > 0 && (
                <span className="text-sm text-[#9AA0A6] font-bold ml-auto">
                  {gradebook.entries.length} entries
                </span>
              )}
            </div>
            {gradebook.entries?.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="dn-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th className="hidden sm:table-cell">Quarter</th>
                      <th>Component</th>
                      <th className="text-right">Score</th>
                      <th className="text-right hidden sm:table-cell">Max</th>
                      <th className="text-right hidden md:table-cell">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.entries.map((entry) => {
                      const pct = entry.maxScore ? (entry.score / entry.maxScore) * 100 : null;
                      return (
                        <tr key={entry.id}>
                          <td className="font-bold text-[#202124]">{entry.studentName}</td>
                          <td className="hidden sm:table-cell text-[#5F6368]">{entry.quarter}</td>
                          <td className="text-[#5F6368]">{entry.component}</td>
                          <td className={`text-right font-black ${
                            pct >= 85 ? "text-[#188038]" : pct >= 70 ? "text-[#1A73E8]" : pct >= 60 ? "text-[#E37400]" : "text-[#D93025]"
                          }`}>
                            {entry.score}
                          </td>
                          <td className="text-right hidden sm:table-cell text-[#9AA0A6] font-bold">
                            {entry.maxScore}
                          </td>
                          <td className="text-right hidden md:table-cell text-[#9AA0A6] font-bold">
                            {entry.weight}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No grade entries yet"
                description="Record grades using the form above."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
