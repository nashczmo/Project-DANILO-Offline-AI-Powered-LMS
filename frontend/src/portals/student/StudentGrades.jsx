import { useMemo, useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, MathText } from "../../components/ui";
import { TrendingUp, GraduationCap, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

function getTermOrder(term) {
  const match = String(term || "").match(/term\s*(\d+)/i);
  return match ? Number(match[1]) : 999;
}

function formatTerm(term) {
  const lower = String(term || "").toLowerCase();
  if (lower.includes("term 1")) return "1st Term";
  if (lower.includes("term 2")) return "2nd Term";
  if (lower.includes("term 3")) return "3rd Term";
  if (lower.includes("term 4")) return "4th Term";
  return term;
}

export default function StudentGrades() {
  const { data, loading, error, refresh } = useApi("/student/grades", { immediate: true });
  const user = useAppStore((state) => state.user);
  const grades = data || [];
  const navigate = useNavigate();
  
  const [expandedTerms, setExpandedTerms] = useState({});

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
    
    let allTerms = [];
    sortedSy.forEach(sy => {
      const terms = bySy[sy];
      const sortedTerms = Object.keys(terms).sort((a, b) => getTermOrder(a) - getTermOrder(b));
      
      sortedTerms.forEach(t => {
        const termGrades = terms[t];
        let totalGradePoints = 0;
        let subjectsWithFinalGrade = 0;

        termGrades.forEach(subj => {
          if (subj.finalGrade !== undefined && subj.finalGrade !== null) {
            totalGradePoints += subj.finalGrade;
            subjectsWithFinalGrade += 1;
          }
        });

        allTerms.push({
          id: `${sy}-${t}`,
          schoolYear: sy,
          term: t,
          formattedTerm: formatTerm(t),
          subjects: termGrades,
          gwa: subjectsWithFinalGrade > 0 ? (totalGradePoints / subjectsWithFinalGrade).toFixed(2) : null
        });
      });
    });
    
    return allTerms;
  }, [grades]);

  // Open the first term by default
  useEffect(() => {
    if (groupedGrades.length > 0 && Object.keys(expandedTerms).length === 0) {
      setExpandedTerms({ [groupedGrades[0].id]: true });
    }
  }, [groupedGrades]);

  const toggleTerm = (termId) => {
    setExpandedTerms(prev => ({
      ...prev,
      [termId]: !prev[termId]
    }));
  };

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
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 flex items-center justify-center text-[#1A73E8]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </div>
        <h1 className="text-xl font-bold text-[#202124]">My Grades</h1>
      </div>

      {groupedGrades.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grades recorded yet"
          description="Your grades will appear here once your teachers record them."
        />
      ) : (
        <div className="space-y-2">
          {groupedGrades.map((group) => {
            const isExpanded = !!expandedTerms[group.id];
            
            return (
              <div key={group.id} className="border border-[#E0E0E0] rounded bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleTerm(group.id)}
                  className="w-full py-4 px-6 flex items-center justify-center bg-white hover:bg-[#F8F9FA] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-2 text-[#495057] font-medium">
                    <span className="text-lg">🗓️</span> 
                    AY {group.schoolYear}, {group.formattedTerm}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-[#E0E0E0] dn-table-responsive">
                    <table className="dn-table dn-table-sticky-col">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057]">Subject<br/>Code</th>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057]">Subject Name</th>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057]">Section</th>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057]">Instructor</th>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057] text-center">Midterm Grade</th>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057] text-center">End Term Grade</th>
                          <th className="py-3 px-4 text-sm font-bold text-[#495057] text-center">Final Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.subjects.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#5F6368] font-medium text-sm">
                              No grades recorded for this term.
                            </td>
                          </tr>
                        ) : (
                          group.subjects.map((subj, idx) => {
                            // Extract actual components from backend data without guessing/approximating
                            const midtermComp = subj.components?.find(c => c.component.toLowerCase().includes('midterm'));
                            const endtermComp = subj.components?.find(c => c.component.toLowerCase().includes('end term') || c.component.toLowerCase().includes('final'));
                            
                            const midtermScore = midtermComp && midtermComp.maxScore ? Math.round((midtermComp.score / midtermComp.maxScore) * 100) : null;
                            const endtermScore = endtermComp && endtermComp.maxScore ? Math.round((endtermComp.score / endtermComp.maxScore) * 100) : null;
                            
                            const finalScore = subj.finalGrade !== undefined && subj.finalGrade !== null ? subj.finalGrade : null;
                            
                            return (
                              <tr 
                                key={subj.courseId || idx}
                                onClick={() => navigate(`/student/classes/${subj.courseId}?tab=grades`)}
                                className="border-b border-[#E0E0E0] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                              >
                                <td className="py-3 px-4 text-sm text-[#495057] whitespace-nowrap">{subj.courseCode}</td>
                                <td className="py-3 px-4 text-sm text-[#202124]"><MathText text={subj.subject} /></td>
                                <td className="py-3 px-4 text-sm text-[#495057] whitespace-nowrap">{user?.sectionName || '—'}</td>
                                <td className="py-3 px-4 text-sm text-[#495057] truncate max-w-[200px]">{subj.teacher || '—'}</td>
                                <td className="py-3 px-4 text-sm font-bold text-center text-[#202124]">{midtermScore !== null ? midtermScore : '—'}</td>
                                <td className="py-3 px-4 text-sm font-bold text-center text-[#202124]">{endtermScore !== null ? endtermScore : '—'}</td>
                                <td className="py-3 px-4 text-sm font-bold text-center bg-[#CCE5FF] text-[#004085]">
                                  {finalScore !== null ? finalScore.toFixed(1) : '—'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    
                    {group.gwa !== null && (
                      <div className="flex justify-end items-center p-4 bg-white border-t border-[#E0E0E0]">
                        <span className="font-bold text-[#202124] mr-2">GWA :</span>
                        <span className="bg-[#28A745] text-white font-bold px-6 py-1 rounded">
                          {group.gwa}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


