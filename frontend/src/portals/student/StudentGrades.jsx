import { useMemo } from "react";
import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, MathText, Badge } from "../../components/ui";
import { TrendingUp, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getScoreColor(score, maxScore) {
  if (score === null || score === undefined || !maxScore) return "text-[#202124]";
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return "text-[#188038]";
  if (pct >= 70) return "text-[#1A73E8]";
  if (pct >= 60) return "text-[#E37400]";
  return "text-[#D93025]";
}

function getTermOrder(term) {
  const match = String(term || "").match(/term\s*(\d+)/i);
  return match ? Number(match[1]) : 999;
}

export default function StudentGrades() {
  const { data, loading, error, refresh } = useApi("/student/grades", { immediate: true });
  const grades = data || [];
  const navigate = useNavigate();

  const groupedGrades = useMemo(() => {
    const bySy = {};
    grades.forEach(g => {
      const sy = g.schoolYear || "School Year Not Specified";
      const term = g.term || "Term 1";
      if (!bySy[sy]) bySy[sy] = {};
      if (!bySy[sy][term]) bySy[sy][term] = [];
      bySy[sy][term].push(g);
    });

    // Sort school years descending
    const sortedSy = Object.keys(bySy).sort((a, b) => b.localeCompare(a));
    
    return sortedSy.map(sy => {
      const terms = bySy[sy];
      const sortedTerms = Object.keys(terms).sort((a, b) => getTermOrder(a) - getTermOrder(b));
      
      return {
        schoolYear: sy,
        terms: sortedTerms.map(t => {
          const termGrades = terms[t];
          let totalScore = 0;
          let totalPossible = 0;
          let validFinalGrades = 0;
          let sumFinalGrades = 0;
          let entryCount = 0;

          termGrades.forEach(subj => {
            if (subj.finalGrade !== undefined && subj.finalGrade !== null) {
              validFinalGrades++;
              sumFinalGrades += subj.finalGrade;
            }
            if (subj.components) {
              entryCount += subj.components.length;
              subj.components.forEach(comp => {
                if (comp.score !== null && comp.maxScore) {
                   totalScore += comp.score;
                   totalPossible += comp.maxScore;
                }
              });
            }
          });

          return {
            term: t,
            subjects: termGrades,
            subjectCount: termGrades.length,
            entryCount,
            average: validFinalGrades ? (sumFinalGrades / validFinalGrades) : null,
            totalScore,
            totalPossible
          };
        })
      };
    });
  }, [grades]);

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

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader
        title="My Grades"
        description="View your grades organized by school year and term."
      />

      {groupedGrades.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grades recorded yet"
          description="Your grades will appear here once your teachers record them."
        />
      ) : (
        groupedGrades.map(syGroup => (
          <div key={syGroup.schoolYear} className="space-y-6">
            <h2 className="text-xl font-black text-[#202124] border-b border-[#E0E0E0] pb-2">
              S.Y. {syGroup.schoolYear}
            </h2>
            
            {syGroup.terms.map(termGroup => (
              <Card key={termGroup.term} className="p-0 overflow-hidden">
                <div className="p-5 border-b border-[#E0E0E0] bg-[#F8F9FA] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-black text-[#202124]">{termGroup.term} <span className="text-sm font-bold text-[#5F6368] ml-2">(S.Y. {syGroup.schoolYear})</span></h3>
                    <p className="text-sm text-[#5F6368] font-bold mt-1">
                      {termGroup.subjectCount} {termGroup.subjectCount === 1 ? 'subject' : 'subjects'} &bull; {termGroup.entryCount} grade {termGroup.entryCount === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  {termGroup.average !== null && (
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E0E0E0] shadow-sm">
                      <span className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide">Average</span>
                      <span className={`text-xl font-black ${getScoreColor(termGroup.average, 100)}`}>
                        {termGroup.average.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>

                {termGroup.subjects.length === 0 ? (
                  <div className="p-8 text-center text-[#5F6368] font-bold text-sm">
                    No grades for this term.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="dn-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Component</th>
                          <th className="text-right">Score</th>
                          <th className="text-right hidden sm:table-cell">Max</th>
                          <th className="text-right hidden lg:table-cell">Weight</th>
                          <th className="text-right">Percentage</th>
                          <th className="hidden md:table-cell">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termGroup.subjects.map(subj => (
                          (subj.components && subj.components.length > 0) ? (
                            subj.components.map((comp, idx) => (
                              <tr 
                                key={`${subj.courseId}-${comp.id || idx}`}
                                onClick={() => navigate(`/student/classes/${subj.courseId}?tab=grades`)}
                                className="cursor-pointer group"
                              >
                                <td>
                                  {idx === 0 && (
                                    <div>
                                      <div className="font-bold group-hover:text-[#1A73E8] transition-colors"><MathText text={subj.subject} /></div>
                                      <div className="text-xs font-black text-[#5F6368] mt-1">{subj.courseCode}</div>
                                    </div>
                                  )}
                                </td>
                                <td className="text-sm font-bold text-[#202124]"><MathText text={comp.component} /></td>
                                <td className={`text-sm font-black text-right ${getScoreColor(comp.score, comp.maxScore)}`}>{comp.score}</td>
                                <td className="text-sm font-bold text-[#5F6368] text-right hidden sm:table-cell">{comp.maxScore}</td>
                                <td className="text-sm font-bold text-[#5F6368] text-right hidden lg:table-cell">{comp.weight ? (comp.weight * 100).toFixed(0) + '%' : '—'}</td>
                                <td className="text-sm font-black text-right">
                                  {comp.percentage !== undefined ? `${comp.percentage.toFixed(1)}%` : '—'}
                                </td>
                                <td className="text-xs text-[#5F6368] hidden md:table-cell max-w-[200px] truncate" title={comp.remarks}>
                                  {comp.remarks || "—"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr 
                              key={`${subj.courseId}-empty`}
                              onClick={() => navigate(`/student/classes/${subj.courseId}?tab=grades`)}
                              className="cursor-pointer group"
                            >
                              <td>
                                <div>
                                  <div className="font-bold group-hover:text-[#1A73E8] transition-colors"><MathText text={subj.subject} /></div>
                                  <div className="text-xs font-black text-[#5F6368] mt-1">{subj.courseCode}</div>
                                </div>
                              </td>
                              <td colSpan={6} className="text-sm font-bold text-[#9AA0A6] italic text-center">
                                No grades recorded yet
                              </td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

