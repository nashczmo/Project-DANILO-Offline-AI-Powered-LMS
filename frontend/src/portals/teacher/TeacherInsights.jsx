import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { AlertTriangle, Users, Cpu } from "lucide-react";

export default function TeacherInsights() {
  const { data: courses } = useApi("/teacher/courses", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const { data: insights, loading, error, refresh } = useApi(
    selectedCourseId ? `/teacher/insights?class_id=${selectedCourseId}&include_ai=true` : null,
    { immediate: !!selectedCourseId }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="AI-powered analysis of student performance, struggling learners, and class-wide recommendations."
      />

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
              {c.subject} {c.gradeLevel} {c.quarter}
            </option>
          ))}
        </select>
      </Card>

      {selectedCourseId && loading && (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {selectedCourseId && !loading && insights && (
        <div className="space-y-6">
          {/* AI Summary */}
          <Card className="border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 bg-danilo-primary/10 text-danilo-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="dn-heading-md text-danilo-text mb-2">AI Summary</h3>
                <p className="text-sm text-danilo-text-secondary leading-relaxed whitespace-pre-line">
                  {insights.aiSummary || "No AI summary available."}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge color={insights.aiStatus === "ready" ? "success" : insights.aiStatus === "offline" ? "warning" : "secondary"}>
                    {insights.aiStatus === "ready" ? "AI Ready" : insights.aiStatus === "offline" ? "AI Offline" : "Skipped"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          {insights.stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <p className="dn-caption mb-1">Students</p>
                <p className="text-2xl font-bold text-danilo-text">{insights.stats.studentCount}</p>
              </Card>
              <Card>
                <p className="dn-caption mb-1">Class Average</p>
                <p className="text-2xl font-bold text-danilo-text">{insights.stats.classAverage ?? "N/A"}</p>
              </Card>
              <Card>
                <p className="dn-caption mb-1">Struggling</p>
                <p className="text-2xl font-bold text-danilo-error">{insights.stats.strugglingCount}</p>
              </Card>
              <Card>
                <p className="dn-caption mb-1">At Risk</p>
                <p className="text-2xl font-bold text-danilo-warning">{insights.stats.atRiskCount}</p>
              </Card>
            </div>
          )}

          {/* Struggling Students */}
          <Card>
            <h3 className="dn-title mb-4">Struggling Students</h3>
            {insights.strugglingStudents?.length > 0 ? (
              <div className="space-y-3">
                {insights.strugglingStudents.map((s, idx) => (
                  <div key={idx} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-danilo-error-subtle text-danilo-error flex items-center justify-center font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-danilo-text">{s.studentName || "Student"}</p>
                        <p className="dn-caption">{s.reason || "Needs attention"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No struggling students" description="Great news! All students are performing well." />
            )}
          </Card>

          {/* Weak Topics */}
          <Card>
            <h3 className="dn-title mb-4">Class Weak Topics</h3>
            {insights.classWeakTopics?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {insights.classWeakTopics.map((topic, idx) => (
                  <Badge key={idx} color="warning">{topic}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-danilo-text-secondary">No weak topics identified.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
