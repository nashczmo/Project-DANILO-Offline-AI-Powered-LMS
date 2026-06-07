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
                  <div className="border-t border-danilo-border bg-danilo-bg-secondary/30">
                    <div className="dn-table-responsive hidden md:block">
                      <table className="dn-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Section</th>
                            <th>Instructor</th>
                            <th className="text-center">Midterm</th>
                            <th className="text-center">End Term</th>
                            <th className="text-center">Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.subjects.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-danilo-text-muted font-medium">
                                No grades recorded for this term.
                              </td>
                            </tr>
                          ) : (
                            group.subjects.map((subj, idx) => {
                              const midtermScore = subj.midtermGrade !== undefined && subj.midtermGrade !== null ? subj.midtermGrade : null;
                              const endtermScore = subj.endtermGrade !== undefined && subj.endtermGrade !== null ? subj.endtermGrade : null;
                              const finalScore = subj.finalGrade !== undefined && subj.finalGrade !== null ? subj.finalGrade : null;
                              
                              return (
                                <tr 
                                  key={subj.courseId || idx}
                                  onClick={() => navigate(`/student/classes/${subj.courseId}?tab=grades`)}
                                  className="cursor-pointer"
                                >
                                  <td>
                                    <div className="font-bold text-danilo-text">{subj.courseCode}</div>
                                    <div className="text-sm text-danilo-text-secondary"><MathText text={subj.subject} /></div>
                                  </td>
                                  <td>{user?.sectionName || '—'}</td>
                                  <td>{subj.teacher || '—'}</td>
                                  <td className="text-center font-bold text-danilo-text-secondary">{midtermScore !== null ? midtermScore : '—'}</td>
                                  <td className="text-center font-bold text-danilo-text-secondary">{endtermScore !== null ? endtermScore : '—'}</td>
                                  <td className="text-center font-black text-danilo-primary bg-danilo-blue-light/30">
                                    {finalScore !== null ? finalScore.toFixed(1) : '—'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col p-4 gap-4">
                      {group.subjects.length === 0 ? (
                        <div className="py-8 text-center text-danilo-text-muted font-medium text-sm">
                          No grades recorded for this term.
                        </div>
                      ) : (
                        group.subjects.map((subj, idx) => {
                          const midtermScore = subj.midtermGrade !== undefined && subj.midtermGrade !== null ? subj.midtermGrade : null;
                          const endtermScore = subj.endtermGrade !== undefined && subj.endtermGrade !== null ? subj.endtermGrade : null;
                          const finalScore = subj.finalGrade !== undefined && subj.finalGrade !== null ? subj.finalGrade : null;
                          
                          return (
                            <div 
                              key={subj.courseId || idx}
                              onClick={() => navigate(`/student/classes/${subj.courseId}?tab=grades`)}
                              className="bg-white border border-danilo-border rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex flex-col gap-3"
                            >
                              <div>
                                <div className="font-black text-danilo-text text-lg leading-tight">{subj.courseCode}</div>
                                <div className="text-sm text-danilo-text-secondary font-medium mt-0.5"><MathText text={subj.subject} /></div>
                              </div>
                              
                              <div className="flex items-center text-xs text-danilo-text-muted gap-2">
                                <span>{user?.sectionName || '—'}</span>
                                <span>•</span>
                                <span>{subj.teacher || '—'}</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div className="bg-danilo-bg-tertiary rounded-lg p-2 text-center flex flex-col justify-center">
                                  <div className="text-[10px] uppercase font-bold text-danilo-text-muted mb-0.5">Midterm</div>
                                  <div className="font-bold text-danilo-text">{midtermScore !== null ? midtermScore : '—'}</div>
                                </div>
                                <div className="bg-danilo-bg-tertiary rounded-lg p-2 text-center flex flex-col justify-center">
                                  <div className="text-[10px] uppercase font-bold text-danilo-text-muted mb-0.5">End Term</div>
                                  <div className="font-bold text-danilo-text">{endtermScore !== null ? endtermScore : '—'}</div>
                                </div>
                                <div className="bg-danilo-blue-light/50 border border-danilo-primary/20 rounded-lg p-2 text-center flex flex-col justify-center">
                                  <div className="text-[10px] uppercase font-bold text-danilo-primary mb-0.5">Final</div>
                                  <div className="font-black text-danilo-primary text-lg leading-none mt-1">{finalScore !== null ? finalScore.toFixed(1) : '—'}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {group.gwa !== null && (
                      <div className="flex justify-between items-center p-4 bg-white border-t border-danilo-border mx-0 md:justify-end md:gap-4">
                        <span className="font-bold text-danilo-text-secondary uppercase tracking-wider text-sm">Gen. Weighted Average</span>
                        <span className="bg-danilo-primary text-white font-black px-4 py-1.5 rounded-lg text-lg shadow-sm">
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


