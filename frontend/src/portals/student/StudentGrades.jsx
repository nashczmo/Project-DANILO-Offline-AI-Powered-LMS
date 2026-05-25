import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { FileText, TrendingUp } from "lucide-react";

export default function StudentGrades() {
  const { data, loading, error, refresh } = useApi("/student/grades", { immediate: true });
  const grades = data || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Grades" description="Track your academic performance across all subjects." />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Grades" description="Track your academic performance across all subjects." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-danilo-error-subtle flex items-center justify-center mb-4 border border-danilo-error/20">
              <TrendingUp className="w-6 h-6 text-danilo-error" />
            </div>
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load grades</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <button onClick={refresh} className="dn-btn-secondary">Try Again</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Grades" description="Track your academic performance across all subjects." />

      {grades.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No grades recorded"
          description="Your grades will appear here once your teachers record them."
        />
      ) : (
        <div className="space-y-6">
          {grades.map((g) => (
            <Card key={`${g.courseId}-${g.quarter}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="dn-heading-md">{g.courseTitle}</h3>
                  <p className="dn-subtitle">{g.subject} {g.quarter}</p>
                </div>
                <Badge color="primary">{g.quarter}</Badge>
              </div>

              <div className="space-y-3">
                {g.components?.map((comp) => (
                  <div
                    key={comp.component}
                    className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-danilo-bg-tertiary flex items-center justify-center text-danilo-text-secondary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-danilo-text">{comp.component}</p>
                        <p className="dn-caption">Weight: {Math.round(comp.weight * 100)}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-danilo-text">
                        {comp.score} <span className="text-sm text-danilo-text-muted font-normal">/ {comp.maxScore}</span>
                      </p>
                      <p className="dn-caption">{comp.remarks || "Graded"}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-danilo-border flex items-center justify-between">
                <span className="text-sm font-medium text-danilo-text-secondary">Weighted Score</span>
                <span className="text-xl font-bold text-danilo-primary">{g.weightedScore?.toFixed(1) || "N/A"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
