import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { FileText, TrendingUp, GraduationCap } from "lucide-react";

function getScoreColor(score, maxScore) {
  if (!maxScore) return "text-[#202124]";
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return "text-[#188038]";
  if (pct >= 70) return "text-[#1A73E8]";
  if (pct >= 60) return "text-[#E37400]";
  return "text-[#D93025]";
}

export default function StudentGrades() {
  const { data, loading, error, refresh } = useApi("/student/grades", { immediate: true });
  const grades = data || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="My Grades" description="Track your academic performance across all subjects." />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Grades" description="Track your academic performance across all subjects." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FCE8E6] flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-[#D93025]" />
            </div>
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load grades</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <button onClick={refresh} className="dn-btn-secondary">Try Again</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Grades"
        description="Track your academic performance across all subjects."
      />

      {grades.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grades recorded yet"
          description="Your grades will appear here once your teachers record them."
        />
      ) : (
        <div className="space-y-4">
          {grades.map((g) => (
            <Card key={`${g.courseId}-${g.term}`}>
              {/* Course header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-black text-[#202124]">{g.courseTitle}</h3>
                  <p className="text-sm text-[#5F6368] font-bold mt-0.5">{g.subject}</p>
                </div>
                <Badge color="primary">{g.term}</Badge>
              </div>

              {/* Grade components */}
              {g.components?.length > 0 && (
                <div className="overflow-x-auto -mx-6 px-6 mb-4">
                  <table className="dn-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th className="hidden sm:table-cell text-right">Weight</th>
                        <th className="text-right">Score</th>
                        <th className="hidden sm:table-cell text-right">Max</th>
                        <th className="text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.components.map((comp) => (
                        <tr key={comp.component}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#F1F3F4] text-[#5F6368] flex items-center justify-center flex-shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-[#202124]">{comp.component}</span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell text-right text-[#9AA0A6] font-bold">
                            {Math.round(comp.weight * 100)}%
                          </td>
                          <td className={`text-right font-black text-lg ${getScoreColor(comp.score, comp.maxScore)}`}>
                            {comp.score}
                          </td>
                          <td className="hidden sm:table-cell text-right text-[#9AA0A6] font-bold">
                            {comp.maxScore}
                          </td>
                          <td className="text-right">
                            <Badge color={comp.score >= comp.maxScore * 0.75 ? "success" : comp.score >= comp.maxScore * 0.6 ? "primary" : "warning"}>
                              {comp.remarks || "Graded"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Weighted Score footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E0E0E0]">
                <div>
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide">Final Grade</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-black ${
                      g.finalGrade >= 85
                        ? "text-[#188038]"
                        : g.finalGrade >= 70
                        ? "text-[#1A73E8]"
                        : g.finalGrade >= 60
                        ? "text-[#E37400]"
                        : "text-[#D93025]"
                    }`}
                  >
                    {g.finalGrade?.toFixed(1) ?? "N/A"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
