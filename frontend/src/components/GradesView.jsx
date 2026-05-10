import { memo } from "react";
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Empty } from "./shared";
import { cn } from "../lib/utils";

function gradeStyle(score) {
  if (score >= 90) return { bg: "bg-danilo-success-subtle", text: "text-danilo-success", bar: "bg-danilo-success", ring: "ring-danilo-success/20", icon: TrendingUp };
  if (score >= 75) return { bg: "bg-danilo-primary-subtle", text: "text-danilo-primary", bar: "bg-danilo-primary", ring: "ring-danilo-primary/20", icon: TrendingUp };
  if (score >= 60) return { bg: "bg-danilo-bg", text: "text-danilo-text-secondary", bar: "bg-danilo-text-muted", ring: "ring-danilo-border", icon: Minus };
  return { bg: "bg-danilo-error-subtle", text: "text-danilo-error", bar: "bg-danilo-error", ring: "ring-danilo-error/20", icon: TrendingDown };
}

export default memo(function GradesView({ grades }) {
  return (
    <section aria-label="Progress">
      <div className="mb-5">
        <h2 className="dn-title">Progress</h2>
        <p className="dn-subtitle mt-0.5">Performance summary per subject and quarter.</p>
      </div>
      {!grades || grades.length === 0 ? (
        <Empty title="No grades available" body="Grades will appear after faculty record scores." icon={<Award className="w-6 h-6 text-danilo-text-muted" />} />
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => {
            const gs = gradeStyle(grade.finalGrade);
            const Icon = gs.icon;
            return (
              <article key={`${grade.courseId}-${grade.quarter}`} className="dn-card overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="min-w-0">
                      <p className="dn-overline text-danilo-primary">{grade.subject}</p>
                      <h3 className="text-base font-semibold text-danilo-text tracking-tight mt-1">{grade.courseTitle}</h3>
                      <p className="text-xs text-danilo-text-muted mt-0.5">{grade.courseCode} · Quarter {grade.quarter}</p>
                      {grade.teacher && <p className="text-xs text-danilo-text-muted mt-0.5">Faculty: {grade.teacher}</p>}
                    </div>
                    <div className={cn("rounded-xl ring-1 px-5 py-3 text-center flex-shrink-0", gs.bg, gs.ring)}>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", gs.text)}>Final Grade</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Icon className={cn("w-4 h-4", gs.text)} />
                        <p className={cn("text-3xl font-bold tracking-tight", gs.text)}>{grade.finalGrade}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full h-2 rounded-full bg-danilo-bg overflow-hidden border border-danilo-border/30">
                      <div className={cn("h-full rounded-full transition-all", gs.bar)} style={{ width: `${Math.min(100, grade.finalGrade)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[11px] text-danilo-text-muted">
                      <span>0</span><span>75 passing</span><span>100</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-danilo-border">
                    <table className="min-w-full text-sm" role="table">
                      <thead>
                        <tr className="bg-danilo-bg">
                          <th className="px-4 py-2 text-left dn-overline">Component</th>
                          <th className="px-4 py-2 text-left dn-overline">Score</th>
                          <th className="px-4 py-2 text-left dn-overline">Weight</th>
                          <th className="px-4 py-2 text-left dn-overline hidden sm:table-cell">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-danilo-border/30">
                        {(grade.components || []).map((c) => (
                          <tr key={`${grade.courseId}-${grade.quarter}-${c.component}`} className="hover:bg-danilo-surface-hover/30 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-danilo-text">{c.component}</td>
                            <td className="px-4 py-2.5 font-mono text-danilo-text-secondary text-xs">{c.score}/{c.maxScore} <span className="text-danilo-text-muted">({c.percentage}%)</span></td>
                            <td className="px-4 py-2.5 text-danilo-text-secondary">{Math.round(c.weight * 100)}%</td>
                            <td className="px-4 py-2.5 text-danilo-text-muted italic text-xs hidden sm:table-cell">{c.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
});
