import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { ArrowLeft, CheckCircle, Clock, ClipboardList, FileText, Check, X as XIcon } from "lucide-react";

export default function TeacherAssignmentGrader() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  
  // We fetch the submissions using the new backend endpoint
  const { data: submissions, loading: subsLoading, refresh: refreshSubs } = useApi(`/teacher/assignments/${assignmentId}/submissions`, { immediate: true });
  
  // We fetch the classwork to get assignment details
  const { data: classwork, loading: classworkLoading } = useApi(`/classes/${courseId}/classwork`, { immediate: true });
  
  const [selectedSub, setSelectedSub] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const assignment = classwork?.assignments?.find(a => a.id === assignmentId);

  const handleSelect = (sub) => {
    setSelectedSub(sub);
    setScore(sub.score || "");
    setFeedback(sub.feedback || "");
    setError("");
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    
    setSaving(true);
    setError("");
    
    try {
      await apiRequest(`/teacher/submissions/${selectedSub.id}/grade`, {
        method: "POST",
        body: {
          score: parseFloat(score),
          feedback: feedback
        }
      });
      refreshSubs();
      setSelectedSub(null);
    } catch (err) {
      setError(err.message || "Could not save grade.");
    } finally {
      setSaving(false);
    }
  };

  if (classworkLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in flex flex-col h-full">
      <button
        onClick={() => navigate(`/teacher/classes/${courseId}`)}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5F6368] hover:text-[#1A73E8] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Class
      </button>

      {assignment && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-[#202124] leading-tight">{assignment.title}</h1>
              <p className="text-sm text-[#5F6368] mt-2 whitespace-pre-wrap">{assignment.instructions}</p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge color="secondary">{assignment.points} Points Possible</Badge>
                <Badge color={assignment.isActive ? "success" : "warning"}>{assignment.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </Card>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* Submissions List */}
        <Card className="flex-1 lg:w-1/3 flex flex-col overflow-hidden p-0">
          <div className="p-4 border-b border-[#E0E0E0]">
            <h3 className="text-base font-black text-[#202124]">Submissions</h3>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {subsLoading ? <div className="p-4"><Skeleton className="h-16" /></div> : 
             !submissions || submissions.length === 0 ? (
               <div className="p-8 text-center text-[#9AA0A6] text-sm font-bold">No submissions yet</div>
             ) : (
               submissions.map(sub => (
                 <button
                   key={sub.id}
                   onClick={() => handleSelect(sub)}
                   className={`w-full text-left p-3 rounded-xl transition-colors flex justify-between items-center ${
                     selectedSub?.id === sub.id ? "bg-[#E8F0FE] border border-[#1A73E8]/30" : "hover:bg-[#F1F3F4] border border-transparent"
                   }`}
                 >
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-[#202124] truncate">{sub.studentName}</p>
                     <p className="text-xs text-[#5F6368] mt-0.5">
                       {sub.status === 'graded' ? `Graded: ${sub.score}/${assignment?.points}` : "Needs Grading"}
                     </p>
                   </div>
                   {sub.status === 'graded' ? (
                     <CheckCircle className="w-4 h-4 text-[#188038]" />
                   ) : (
                     <Clock className="w-4 h-4 text-[#E37400]" />
                   )}
                 </button>
               ))
             )}
          </div>
        </Card>

        {/* Grading Panel */}
        <Card className="flex-[2] lg:w-2/3 flex flex-col">
          {selectedSub ? (
            <div className="space-y-6 h-full flex flex-col">
              <div className="border-b border-[#E0E0E0] pb-4">
                <h3 className="text-lg font-black text-[#202124]">{selectedSub.studentName}'s Submission</h3>
                <p className="text-sm text-[#9AA0A6] mt-1">Submitted at {selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString() : "Unknown"}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {selectedSub.responseText && (
                  <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E0E0E0] whitespace-pre-wrap text-sm text-[#202124]">
                    <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-2">Written Response</p>
                    {selectedSub.responseText}
                  </div>
                )}

                {(() => {
                  let attachments = [];
                  try { attachments = typeof selectedSub.attachmentsJson === 'string' ? JSON.parse(selectedSub.attachmentsJson) : selectedSub.attachmentsJson; } catch(e){}
                  if (!attachments || attachments.length === 0) return null;
                  return (
                    <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E0E0E0]">
                      <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-2">Attachments</p>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                          <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-sm font-bold text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors">
                            <FileText className="w-4 h-4" /> {att.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const questions = assignment?.questions || [];
                  if (questions.length === 0) return null;
                  let answers = {};
                  try { answers = typeof selectedSub.answersJson === 'string' ? JSON.parse(selectedSub.answersJson) : selectedSub.answersJson; } catch(e){}
                  
                  const sections = {};
                  questions.forEach(q => {
                    const sec = q.sectionName || "";
                    if (!sections[sec]) sections[sec] = [];
                    sections[sec].push(q);
                  });
                  
                  return (
                    <div className="space-y-6">
                      {Object.entries(sections).map(([sec, secQuestions], secIdx) => (
                        <div key={secIdx} className="space-y-4">
                          {sec && <h4 className="text-sm font-black text-[#1A73E8] uppercase tracking-wide border-b border-[#E0E0E0] pb-1">{sec}</h4>}
                          {!sec && Object.keys(sections).length === 1 && <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide">Quiz Answers</p>}
                          {secQuestions.map((q, idx) => {
                             const val = answers[q.id] || "";
                             
                             const isCorrect = (() => {
                                 const given = String(val).trim().toLowerCase();
                                 const expected = String(q.answerKey).trim().toLowerCase();
                                 if (q.type === 'checkbox') {
                                     let expectedList = [];
                                     try { expectedList = JSON.parse(q.answerKey); } catch(e){ expectedList = [q.answerKey]; }
                                     if (!Array.isArray(expectedList)) expectedList = [expectedList];
                                     const expectedSet = new Set(expectedList.map(s => String(s).trim().toLowerCase()));
                                     const givenSet = new Set((Array.isArray(val) ? val : [val]).map(s => String(s).trim().toLowerCase()));
                                     if (expectedSet.size === 0) return false;
                                     if (expectedSet.size !== givenSet.size) return false;
                                     for (let e of expectedSet) if (!givenSet.has(e)) return false;
                                     return true;
                                 }
                                 return given === expected;
                             })();
    
                             return (
                               <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-[#188038] bg-[#E6F4EA]/30' : 'border-[#D93025] bg-[#FCE8E6]/30'}`}>
                                 <div className="flex items-start justify-between mb-2">
                                   <p className="text-sm font-bold text-[#202124]">{secQuestions.length > 1 ? `${idx + 1}. ` : ""}{q.questionText}</p>
                                   <span className="text-xs text-[#9AA0A6] font-bold flex-shrink-0 ml-4">{q.points} pt</span>
                                 </div>
                                 <p className="text-sm text-[#5F6368] mb-2">
                                   <span className="font-bold text-[#202124]">Student's Answer: </span> 
                                   {Array.isArray(val) ? val.join(', ') : val || <span className="italic">No answer</span>}
                                 </p>
                                 <div className="pt-2 border-t border-[#E0E0E0] flex items-center gap-2">
                                   {isCorrect ? <Check className="w-4 h-4 text-[#188038]" /> : <XIcon className="w-4 h-4 text-[#D93025]" />}
                                   <span className={`text-xs font-bold ${isCorrect ? 'text-[#188038]' : 'text-[#D93025]'}`}>
                                     Correct Answer: {q.type === 'checkbox' ? (Array.isArray(q.answerKey) ? q.answerKey.join(', ') : q.answerKey) : q.answerKey}
                                   </span>
                                 </div>
                               </div>
                             );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                
                {(!selectedSub.responseText && !selectedSub.attachmentsJson && !selectedSub.answersJson) && (
                  <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E0E0E0] whitespace-pre-wrap text-sm text-[#202124]">
                    <span className="text-[#9AA0A6] italic">No submission content provided.</span>
                  </div>
                )}
              </div>

              {error && (
                <div role="alert" className="px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]">
                  {error}
                </div>
              )}

              <form onSubmit={handleGrade} className="space-y-4 pt-4 border-t border-[#E0E0E0]">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-black text-[#202124] mb-2">Score (out of {assignment?.points || 100})</label>
                    <input 
                      type="number" 
                      className="dn-input w-full" 
                      value={score} 
                      onChange={e => setScore(e.target.value)} 
                      min="0" 
                      max={assignment?.points || 100} 
                      required 
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-sm font-black text-[#202124] mb-2">Feedback (Optional)</label>
                    <input 
                      type="text" 
                      className="dn-input w-full" 
                      value={feedback} 
                      onChange={e => setFeedback(e.target.value)} 
                      placeholder="Great job!" 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Grade"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-[#9AA0A6] py-12">
               <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-base font-bold">Select a submission to grade</p>
             </div>
          )}
        </Card>
      </div>
    </div>
  );
}
