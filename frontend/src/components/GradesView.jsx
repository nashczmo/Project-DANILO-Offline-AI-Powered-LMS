import { memo, useState, useMemo } from "react";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Empty, Badge } from "./shared";
import { cn } from "../lib/utils";

function gradeStyle(score) {
  if (score >= 90) return { tone: "green", text: "text-danilo-success", bg: "bg-danilo-success-subtle", bar: "bg-danilo-success", icon: TrendingUp };
  if (score >= 75) return { tone: "green", text: "text-danilo-success", bg: "bg-danilo-success-subtle", bar: "bg-danilo-success", icon: TrendingUp };
  if (score >= 60) return { tone: "yellow", text: "text-danilo-warning", bg: "bg-danilo-warning-subtle", bar: "bg-danilo-warning", icon: Minus };
  return { tone: "red", text: "text-danilo-error", bg: "bg-danilo-error-subtle", bar: "bg-danilo-error", icon: TrendingDown };
}

function cellStyle(score) {
  if (score == null || Number.isNaN(score)) return "text-danilo-text-muted";
  if (score >= 90) return "text-danilo-success font-semibold";
  if (score >= 75) return "text-danilo-success";
  if (score >= 60) return "text-danilo-warning";
  return "text-danilo-error font-semibold";
}

function cellBg(score) {
  if (score == null || Number.isNaN(score)) return "";
  if (score >= 90) return "bg-danilo-success-subtle/40";
  if (score >= 75) return "bg-danilo-success-subtle/20";
  if (score >= 60) return "bg-danilo-warning-subtle/30";
  return "bg-danilo-error-subtle/30";
}

function SummaryCard({ label, value, icon, tone }) {
  const toneMap = {
    primary: "text-danilo-primary bg-danilo-primary-subtle",
    success: "text-danilo-success bg-danilo-success-subtle",
    danger: "text-danilo-error bg-danilo-error-subtle",
    warning: "text-danilo-warning bg-danilo-warning-subtle",
  };
  return (
    <div className="dn-card p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", toneMap[tone] || toneMap.primary)}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-danilo-text tracking-tight">{value ?? "0"}</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-danilo-text-muted">{label}</p>
      </div>
    </div>
  );
}

function aggregateGrades(grades) {
  const bySubject = {};
  (grades || []).forEach((g) => {
    const key = g.subject || g.courseTitle || "Unknown";
    if (!bySubject[key]) {
      bySubject[key] = {
        subject: key,
        courseCode: g.courseCode || "",
        courseTitle: g.courseTitle || key,
        quarters: {},
        records: [],
      };
    }
    const gradeValue = g.finalGrade ?? g.score ?? 0;
    bySubject[key].quarters[g.quarter || "Q1"] = gradeValue;
    bySubject[key].records.push(g);
  });

  const rows = Object.values(bySubject).map((row) => {
    const q1 = row.quarters["Q1"];
    const q2 = row.quarters["Q2"];
    const q3 = row.quarters["Q3"];
    const q4 = row.quarters["Q4"];
    const values = [q1, q2, q3, q4].filter((v) => v != null && !Number.isNaN(v));
    const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return { ...row, q1, q2, q3, q4, average };
  });

  return rows;
}

const SubjectDetail = memo(function SubjectDetail({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-danilo-border/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-danilo-bg-secondary transition-colors"
      >
        <span className="text-xs font-medium text-danilo-text-secondary">View assessments &amp; recommendations</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-danilo-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-danilo-text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {row.records.map((rec) => (
            <div key={`${rec.courseId}-${rec.quarter}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-danilo-text">Quarter {rec.quarter || "—"}</span>
                <span className={cn("text-sm font-bold", gradeStyle(rec.finalGrade).text)}>{rec.finalGrade}</span>
              </div>
              <div className="dn-progress">
                <div
                  className={cn("dn-progress-bar", gradeStyle(rec.finalGrade).bar)}
                  style={{ width: `${Math.min(100, rec.finalGrade)}%` }}
                />
              </div>
              {(rec.components || []).map((c) => (
                <div key={c.component} className="flex items-center justify-between text-xs py-1">
                  <span className="text-danilo-text-secondary">{c.component}</span>
                  <span className="text-danilo-text-muted">{c.score}/{c.maxScore} ({c.percentage}%)</span>
                </div>
              ))}
            </div>
          ))}

          {/* AI Recommendations placeholder */}
          {row.average < 75 && (
            <div className="rounded-xl bg-danilo-primary-subtle border border-danilo-primary/10 p-3 flex items-start gap-2">
              <BrainCircuit className="w-4 h-4 text-danilo-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-danilo-primary">AI Recommendation</p>
                <p className="text-xs text-danilo-text-secondary mt-0.5 leading-relaxed">
                  Focus on strengthening fundamentals in {row.subject}. Review past quarterly assessments and consider additional practice for topics scoring below passing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default memo(function GradesView({ grades, loading }) {
  const rows = useMemo(() => aggregateGrades(grades), [grades]);

  const summary = useMemo(() => {
    const averages = rows.map((r) => r.average).filter((v) => v > 0);
    const overall = averages.length ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length) : 0;
    const passing = rows.filter((r) => r.average >= 75).length;
    const atRisk = rows.filter((r) => r.average > 0 && r.average < 75).length;
    const highest = rows.length ? rows.reduce((max, r) => (r.average > max.average ? r : max), rows[0]) : null;
    const lowest = rows.length ? rows.reduce((min, r) => (r.average < min.average && r.average > 0 ? r : min), rows[0]) : null;
    return { overall, subjects: rows.length, passing, atRisk, highest, lowest };
  }, [rows]);

  if (loading) {
    return (
      <section className="space-y-4" aria-label="Grades loading">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="dn-card p-4 space-y-2">
            <div className="h-8 w-16 dn-shimmer" />
            <div className="h-2 w-20 dn-shimmer" />
          </div>
          <div className="dn-card p-4 space-y-2">
            <div className="h-8 w-16 dn-shimmer" />
            <div className="h-2 w-20 dn-shimmer" />
          </div>
          <div className="dn-card p-4 space-y-2">
            <div className="h-8 w-16 dn-shimmer" />
            <div className="h-2 w-20 dn-shimmer" />
          </div>
          <div className="dn-card p-4 space-y-2">
            <div className="h-8 w-16 dn-shimmer" />
            <div className="h-2 w-20 dn-shimmer" />
          </div>
        </div>
        <div className="dn-card p-5 space-y-3">
          <div className="h-4 w-full dn-shimmer" />
          <div className="h-4 w-full dn-shimmer" />
          <div className="h-4 w-full dn-shimmer" />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Progress">
      <div className="mb-5">
        <h2 className="dn-title">Progress</h2>
        <p className="dn-subtitle mt-0.5">Performance summary per subject and quarter.</p>
      </div>

      {!grades || grades.length === 0 ? (
        <Empty
          title="No grades available"
          body="Grades will appear after faculty record scores."
          icon={<Award className="w-6 h-6 text-danilo-text-muted" />}
        />
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              label="Current Average"
              value={summary.overall}
              icon={<Award className="w-5 h-5" />}
              tone={summary.overall >= 75 ? "success" : "danger"}
            />
            <SummaryCard
              label="Subjects"
              value={summary.subjects}
              icon={<BookOpen className="w-5 h-5" />}
              tone="primary"
            />
            <SummaryCard
              label="Passing"
              value={summary.passing}
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="success"
            />
            <SummaryCard
              label="At Risk"
              value={summary.atRisk}
              icon={<AlertTriangle className="w-5 h-5" />}
              tone={summary.atRisk > 0 ? "warning" : "success"}
            />
          </div>

          {/* Grade table */}
          <div className="dn-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-danilo-bg-secondary">
                    <th className="px-4 py-3 text-left dn-overline">Subject</th>
                    <th className="px-4 py-3 text-center dn-overline">Q1</th>
                    <th className="px-4 py-3 text-center dn-overline">Q2</th>
                    <th className="px-4 py-3 text-center dn-overline">Q3</th>
                    <th className="px-4 py-3 text-center dn-overline">Q4</th>
                    <th className="px-4 py-3 text-center dn-overline">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-danilo-border/30">
                  {rows.map((row) => {
                    const avgStyle = gradeStyle(row.average);
                    return (
                      <tr
                        key={row.subject}
                        className="hover:bg-danilo-bg-secondary/50 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-danilo-text">{row.subject}</p>
                            <p className="text-xs text-danilo-text-muted">{row.courseCode}</p>
                          </div>
                        </td>
                        {["q1", "q2", "q3", "q4"].map((q) => {
                          const val = row[q];
                          return (
                            <td
                              key={q}
                              className={cn(
                                "px-4 py-3 text-center transition-colors",
                                cellBg(val)
                              )}
                            >
                              <span className={cellStyle(val)}>
                                {val != null ? val : "—"}
                              </span>
                            </td>
                          );
                        })}
                        <td className={cn("px-4 py-3 text-center", avgStyle.bg)}>
                          <span className={cn("font-bold", avgStyle.text)}>{row.average}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subject detail rows */}
            {rows.map((row) => (
              <SubjectDetail key={`detail-${row.subject}`} row={row} />
            ))}
          </div>

          {/* Highest / Lowest */}
          {(summary.highest || summary.lowest) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.highest && (
                <div className="dn-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-danilo-success-subtle text-danilo-success flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-danilo-text-muted">Highest</p>
                    <p className="text-sm font-semibold text-danilo-text">{summary.highest.subject}</p>
                    <p className="text-xs text-danilo-success font-bold">{summary.highest.average}</p>
                  </div>
                </div>
              )}
              {summary.lowest && summary.lowest.average > 0 && summary.lowest.average < 75 && (
                <div className="dn-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-danilo-error-subtle text-danilo-error flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-danilo-text-muted">Needs Attention</p>
                    <p className="text-sm font-semibold text-danilo-text">{summary.lowest.subject}</p>
                    <p className="text-xs text-danilo-error font-bold">{summary.lowest.average}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
});
