import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Button } from "../../components/ui";
import { FileText } from "lucide-react";

export default function TeacherGrades() {
  const { data: courses, loading: coursesLoading } = useApi("/teacher/courses", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const { data: gradebook, loading: gradebookLoading, refresh: refreshGradebook } = useApi(
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
    <div className="space-y-6">
      <PageHeader title="Grades" description="Manage and record student grades for your classes." />

      <Card>
        <label className="dn-label mb-2 block">Select Class</label>
        <select
          className="dn-input"
          value={selectedCourseId || ""}
          onChange={(e) => setSelectedCourseId(e.target.value || null)}
        >
          <option value="">Choose a class...</option>
          {activeCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.subject} {c.gradeLevel} {c.quarter}
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

      {selectedCourseId && gradebookLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}

      {selectedCourseId && !gradebookLoading && gradebook && (
        <div className="space-y-6">
          <Card>
            <h3 className="dn-title mb-4">Record New Grade</h3>
            <form onSubmit={handleAddGrade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select className="dn-input" value={formData.studentId || ""} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required>
                <option value="">Select student</option>
                {gradebook.students?.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
              <input className="dn-input" placeholder="Component (e.g. Written Work)" value={formData.component || ""} onChange={(e) => setFormData({ ...formData, component: e.target.value })} required />
              <select className="dn-input" value={formData.quarter || "Q1"} onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}>
                <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
              </select>
              <input className="dn-input" type="number" step="0.01" placeholder="Score" value={formData.score || ""} onChange={(e) => setFormData({ ...formData, score: e.target.value })} required />
              <input className="dn-input" type="number" step="0.01" placeholder="Max Score" value={formData.maxScore || ""} onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })} required />
              <input className="dn-input" type="number" step="0.01" placeholder="Weight" value={formData.weight || ""} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} required />
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving..." : "Record Grade"}</Button>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="dn-title mb-4">Grade Entries</h3>
            {gradebook.entries?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-danilo-border">
                      <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Student</th>
                      <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Quarter</th>
                      <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Component</th>
                      <th className="text-right py-2 px-3 font-medium text-danilo-text-muted">Score</th>
                      <th className="text-right py-2 px-3 font-medium text-danilo-text-muted">Max</th>
                      <th className="text-right py-2 px-3 font-medium text-danilo-text-muted">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-danilo-border/50 hover:bg-danilo-bg-secondary">
                        <td className="py-2 px-3 text-danilo-text font-medium">{entry.studentName}</td>
                        <td className="py-2 px-3 text-danilo-text-secondary">{entry.quarter}</td>
                        <td className="py-2 px-3 text-danilo-text-secondary">{entry.component}</td>
                        <td className="py-2 px-3 text-right font-semibold text-danilo-text">{entry.score}</td>
                        <td className="py-2 px-3 text-right text-danilo-text-muted">{entry.maxScore}</td>
                        <td className="py-2 px-3 text-right text-danilo-text-muted">{entry.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={FileText} title="No entries" description="Record grades using the form above." />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
