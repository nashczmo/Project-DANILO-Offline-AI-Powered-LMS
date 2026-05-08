import { Empty } from "./shared";

function gradeStyle(score) {
  if (score >= 90) return { bg: "bg-success-50", text: "text-success-700", bar: "bg-success-500", ring: "ring-success-200" };
  if (score >= 75) return { bg: "bg-primary-50",  text: "text-primary-700", bar: "bg-primary-500", ring: "ring-primary-200" };
  if (score >= 60) return { bg: "bg-slate-50",     text: "text-slate-700",    bar: "bg-slate-400",    ring: "ring-slate-200" };
  return                   { bg: "bg-danger-50",   text: "text-danger-700",  bar: "bg-danger-500",  ring: "ring-danger-200" };
}

export default function GradesView({ grades }) {
  return (
    <section aria-label="Progress">
      <div className="mb-5">
        <h2 className="dn-title">Progress</h2>
        <p className="dn-subtitle mt-0.5">Performance summary per subject and quarter.</p>
      </div>
      {!grades || grades.length === 0 ? (
        <Empty title="No grades available" body="Grades will appear after faculty record scores." icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>} />
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => {
            const gs = gradeStyle(grade.finalGrade);
            return (
              <article key={`${grade.courseId}-${grade.quarter}`} className="dn-card overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="min-w-0">
                      <p className="dn-overline text-primary-600">{grade.subject}</p>
                      <h3 className="text-base font-semibold text-slate-900 tracking-tight mt-1">{grade.courseTitle}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{grade.courseCode} &middot; Quarter {grade.quarter}</p>
                      {grade.teacher && <p className="text-xs text-slate-400 mt-0.5">Faculty: {grade.teacher}</p>}
                    </div>
                    <div className={`rounded-xl ${gs.bg} ring-1 ${gs.ring} px-5 py-3 text-center flex-shrink-0`}>
                      <p className={`text-[10px] font-bold ${gs.text} uppercase tracking-widest`}>Final Grade</p>
                      <p className={`text-3xl font-bold ${gs.text} tracking-tight`}>{grade.finalGrade}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${gs.bar} transition-all`} style={{ width: `${Math.min(100, grade.finalGrade)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                      <span>0</span><span>75 passing</span><span>100</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-sm" role="table">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-2 text-left dn-overline">Component</th>
                          <th className="px-4 py-2 text-left dn-overline">Score</th>
                          <th className="px-4 py-2 text-left dn-overline">Weight</th>
                          <th className="px-4 py-2 text-left dn-overline hidden sm:table-cell">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(grade.components || []).map((c) => (
                          <tr key={`${grade.courseId}-${grade.quarter}-${c.component}`} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-slate-700">{c.component}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{c.score}/{c.maxScore} <span className="text-slate-400">({c.percentage}%)</span></td>
                            <td className="px-4 py-2.5 text-slate-500">{Math.round(c.weight * 100)}%</td>
                            <td className="px-4 py-2.5 text-slate-400 italic text-xs hidden sm:table-cell">{c.remarks}</td>
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
}
