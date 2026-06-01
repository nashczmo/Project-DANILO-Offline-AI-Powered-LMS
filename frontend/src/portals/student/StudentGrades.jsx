import { useMemo } from "react";
import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, MathText } from "../../components/ui";
import { TrendingUp, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Group grades for Global Overview Table
  const overviewData = useMemo(() => {
    const map = {};
    grades.forEach(g => {
      if (!map[g.courseId]) {
        map[g.courseId] = {
          courseId: g.courseId,
          code: g.courseTitle?.split(' ')[0] || "SBJ",
          subjectName: g.subject || "Subject",
          section: g.courseTitle || "Section",
          teacher: g.teacherName || "TBA",
          terms: { "Term 1": null, "Term 2": null, "Term 3": null },
        };
      }
      // Map API terms to exact 1,2,3 for DepEd table format
      const tMap = { "Term 1": "Term 1", "Term 2": "Term 2", "Term 3": "Term 3", "Q1": "Term 1", "Q2": "Term 2", "Q3": "Term 3" };
      const termKey = tMap[g.term] || "Term 1";
      map[g.courseId].terms[termKey] = g.finalGrade;
    });

    return Object.values(map).map(c => {
      const validGrades = Object.values(c.terms).filter(v => v !== null);
      c.finalGrade = validGrades.length ? validGrades.reduce((a,b)=>a+b, 0) / validGrades.length : null;
      return c;
    });
  }, [grades]);

  const gwa = useMemo(() => {
    const valid = overviewData.filter(d => d.finalGrade !== null);
    if (!valid.length) return null;
    return valid.reduce((acc, curr) => acc + curr.finalGrade, 0) / valid.length;
  }, [overviewData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="My Grades" description="Track your academic performance across all subjects." />
        <Skeleton className="h-96" />
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

  // GLOBAL OVERVIEW TABLE ONLY
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="My Grades"
        description="Global summary of your academic performance across all terms."
      />

      {overviewData.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grades recorded yet"
          description="Your grades will appear here once your teachers record them."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E0E0E0]">
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide whitespace-nowrap">Subject Code</th>
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide">Subject Name</th>
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide hidden sm:table-cell">Section</th>
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide hidden lg:table-cell">Teacher</th>
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide text-right whitespace-nowrap">1st Term</th>
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide text-right whitespace-nowrap">2nd Term</th>
                  <th className="p-4 text-xs font-black text-[#5F6368] uppercase tracking-wide text-right whitespace-nowrap">3rd Term</th>
                  <th className="p-4 text-xs font-black text-[#1A73E8] uppercase tracking-wide text-right whitespace-nowrap bg-[#E8F0FE]/30">Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {overviewData.map((row) => (
                  <tr 
                    key={row.courseId}
                    onClick={() => navigate(`/student/classes/${row.courseId}?tab=grades`)}
                    className="hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                    title="Click to view subject details"
                  >
                    <td className="p-4">
                      <span className="font-mono text-xs font-black text-[#1A73E8] bg-[#E8F0FE] px-2 py-1 rounded-md">{row.code}</span>
                    </td>
                    <td className="p-4 font-bold text-[#202124] group-hover:text-[#1A73E8] transition-colors"><MathText text={row.subjectName} /></td>
                    <td className="p-4 text-sm font-bold text-[#5F6368] hidden sm:table-cell"><MathText text={row.section} /></td>
                    <td className="p-4 text-sm font-bold text-[#5F6368] hidden lg:table-cell">{row.teacher}</td>
                    <td className={`p-4 text-right font-black text-[15px] ${getScoreColor(row.terms["Term 1"], 100)}`}>
                      {row.terms["Term 1"] ?? "—"}
                    </td>
                    <td className={`p-4 text-right font-black text-[15px] ${getScoreColor(row.terms["Term 2"], 100)}`}>
                      {row.terms["Term 2"] ?? "—"}
                    </td>
                    <td className={`p-4 text-right font-black text-[15px] ${getScoreColor(row.terms["Term 3"], 100)}`}>
                      {row.terms["Term 3"] ?? "—"}
                    </td>
                    <td className={`p-4 text-right font-black text-lg bg-[#E8F0FE]/10 ${getScoreColor(row.finalGrade, 100)}`}>
                      {row.finalGrade ? row.finalGrade.toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GWA Footer */}
          <div className="bg-[#F8F9FA] p-5 flex items-center justify-end border-t border-[#E0E0E0]">
            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-[#E0E0E0] shadow-sm">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide">General Weighted Average</span>
                <span className="text-sm font-bold text-[#5F6368]">Current S.Y.</span>
              </div>
              <div className={`text-3xl font-black ${getScoreColor(gwa, 100)}`}>
                {gwa ? gwa.toFixed(2) : "N/A"}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
