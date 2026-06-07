import { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button, MathText } from "../../components/ui";
import { ClipboardList, Send, CheckCircle, FileText, AlertCircle, UploadCloud, X as XIcon, Check, ArrowLeft, BookOpen } from "lucide-react";

export default function StudentAssignments() {
  const { data, loading, error, refresh } = useApi("/student/assignments", { immediate: true });
  const assignments = data || [];
  const token = useAppStore((s) => s.token);
  
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [responseText, setResponseText] = useState({});
  const [answersJson, setAnswersJson] = useState({});
  const [submissionAttachmentsJson, setSubmissionAttachmentsJson] = useState({});
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef({});

  const handleAnswerChange = (assignmentId, questionId, value, type) => {
    setAnswersJson(prev => {
      const a = prev[assignmentId] || {};
      if (type === 'checkbox') {
        const current = Array.isArray(a[questionId]) ? a[questionId] : [];
        const checked = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        return { ...prev, [assignmentId]: { ...a, [questionId]: checked } };
      }
      return { ...prev, [assignmentId]: { ...a, [questionId]: value } };
    });
  };

  const handleUpload = async (e, assignmentId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmittingId(assignmentId);
    setSubmitError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(apiUrl(`/student/assignments/${assignmentId}/upload`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || "Upload failed");
      
      setSubmissionAttachmentsJson(prev => {
        const arr = prev[assignmentId] || [];
        return { ...prev, [assignmentId]: [...arr, { filename: resData.filename, url: resData.url }] };
      });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmittingId(null);
      if (fileInputRef.current[assignmentId]) fileInputRef.current[assignmentId].value = "";
    }
  };

  const handleSubmit = async (assignmentId) => {
    setSubmittingId(assignmentId);
    setSubmitError("");
    try {
      await apiRequest(`/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: { 
          responseText: responseText[assignmentId] || "",
          answersJson: answersJson[assignmentId] || {},
          attachmentsJson: submissionAttachmentsJson[assignmentId] || []
        },
      });
      refresh();
      setActiveAssignmentId(null);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit assignment.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleComplete = async (assignmentId) => {
    setSubmittingId(assignmentId);
    try {
      await apiRequest(`/student/assignments/${assignmentId}/complete`, { method: "POST" });
      refresh();
      setActiveAssignmentId(null);
    } catch (err) {
      setSubmitError(err.message || "Failed to mark complete.");
    } finally {
      setSubmittingId(null);
    }
  };

  const renderQuestions = (a, readOnly = false, submittedAnswers = null) => {
    const questions = a.questions || [];
    if (questions.length === 0) return null;
    
    // Group into 3 parts logic (max 25 items)
    const maxQs = questions.slice(0, 25);
    const sections = {};
    maxQs.forEach(q => {
      const sec = q.sectionName || "General";
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(q);
    });

    let sectionsList = [];
    if (Object.keys(sections).length > 1 && !Object.keys(sections).includes("General")) {
       sectionsList = Object.entries(sections).map(([k,v], i) => ({
          title: `Part ${["I", "II", "III"][i] || i+1}: ${k}`,
          questions: v
       })).slice(0, 3);
    } else {
       const p1 = maxQs.slice(0, Math.ceil(maxQs.length / 3));
       const p2 = maxQs.slice(Math.ceil(maxQs.length / 3), Math.ceil((maxQs.length * 2) / 3));
       const p3 = maxQs.slice(Math.ceil((maxQs.length * 2) / 3));
       if (p1.length) sectionsList.push({ title: "Part I: Knowledge & Understanding", questions: p1 });
       if (p2.length) sectionsList.push({ title: "Part II: Application & Analysis", questions: p2 });
       if (p3.length) sectionsList.push({ title: "Part III: Evaluation & Creation", questions: p3 });
    }

    return (
      <div className="space-y-8 mb-4">
        {sectionsList.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-4">
            <h4 className="text-sm font-black text-[#1A73E8] uppercase tracking-wide border-b border-[#E0E0E0] pb-2 mb-4">
              {sec.title}
            </h4>
            
            {sec.questions.map((q, idx) => {
              let choices = [];
              try { choices = typeof q.choicesJson === 'string' ? JSON.parse(q.choicesJson) : q.choicesJson; } catch(e){}
              if (!Array.isArray(choices)) choices = [];
              if (q.type === 'true_false' && choices.length === 0) choices = ["True", "False"];
              
              const val = readOnly ? (submittedAnswers ? submittedAnswers[q.id] : "") : ((answersJson[a.id] || {})[q.id] || "");
              const isCorrect = readOnly && a.status === 'graded' ? (() => {
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
              })() : null;

              return (
                <div key={q.id} className={`p-5 rounded-2xl border ${isCorrect === true ? 'border-[#188038] bg-[#E6F4EA]/30' : isCorrect === false ? 'border-[#D93025] bg-[#FCE8E6]/30' : 'border-[#E0E0E0] bg-white'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-sm font-bold text-[#202124] leading-relaxed">
                      {sec.questions.length > 1 ? `${idx + 1}. ` : ""}<MathText text={q.questionText} />
                    </p>
                    <span className="text-xs text-[#9AA0A6] font-bold flex-shrink-0 ml-4 px-2 py-1 bg-[#F1F3F4] rounded-md">{q.points} pt</span>
                  </div>
                  <div className="space-y-3">
                    {(q.type === 'multiple_choice' || q.type === 'true_false') && choices.map((c, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm text-[#5F6368] cursor-pointer hover:bg-[#F8F9FA] p-2 rounded-lg transition-colors border border-transparent hover:border-[#E0E0E0]">
                        <input type="radio" name={`q-${q.id}`} value={c} checked={val === c} onChange={() => handleAnswerChange(a.id, q.id, c, q.type)} disabled={readOnly} className="w-4 h-4 text-[#1A73E8]" />
                        <MathText text={c} />
                      </label>
                    ))}
                    {q.type === 'checkbox' && choices.map((c, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm text-[#5F6368] cursor-pointer hover:bg-[#F8F9FA] p-2 rounded-lg transition-colors border border-transparent hover:border-[#E0E0E0]">
                        <input type="checkbox" checked={Array.isArray(val) && val.includes(c)} onChange={() => handleAnswerChange(a.id, q.id, c, q.type)} disabled={readOnly} className="w-4 h-4 text-[#1A73E8]" />
                        <MathText text={c} />
                      </label>
                    ))}
                    {(q.type === 'short_answer' || q.type === 'identification') && (
                      <input type="text" className="dn-input w-full" value={val} onChange={(e) => handleAnswerChange(a.id, q.id, e.target.value, q.type)} disabled={readOnly} placeholder="Your answer" />
                    )}
                  </div>
                  {readOnly && a.status === 'graded' && (
                    <div className="mt-4 pt-4 border-t border-[#E0E0E0] flex items-center gap-2">
                      {isCorrect ? <Check className="w-4 h-4 text-[#188038]" /> : <XIcon className="w-4 h-4 text-[#D93025]" />}
                      <span className={`text-xs font-bold ${isCorrect ? 'text-[#188038]' : 'text-[#D93025]'}`}>
                        Correct Answer: <MathText text={q.type === 'checkbox' ? (Array.isArray(q.answerKey) ? q.answerKey.join(', ') : q.answerKey) : q.answerKey} />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="My Assignments" description="View and submit your course assignments." />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignments" description="View and submit your course assignments." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load assignments</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const notStarted = assignments.filter((a) => a.status === "not_started");
  const submitted = assignments.filter((a) => a.status === "submitted" || a.status === "completed" || a.status === "graded");

  // Grouping by Course for the new modular block layout
  const groupedPending = notStarted.reduce((acc, curr) => {
    const course = curr.courseTitle || "Other Assignments";
    if (!acc[course]) acc[course] = [];
    acc[course].push(curr);
    return acc;
  }, {});

  const groupedSubmitted = submitted.reduce((acc, curr) => {
    const course = curr.courseTitle || "Other Assignments";
    if (!acc[course]) acc[course] = [];
    acc[course].push(curr);
    return acc;
  }, {});

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);

  // DETAILED ASSIGNMENT VIEW
  if (activeAssignment) {
    const a = activeAssignment;
    const isReadOnly = a.status !== "not_started";
    let submittedAnswers = {};
    try { submittedAnswers = typeof a.answersJson === 'string' ? JSON.parse(a.answersJson) : a.answersJson; } catch(e){}
    let attachments = [];
    try { attachments = typeof a.assignmentAttachmentsJson === 'string' ? JSON.parse(a.assignmentAttachmentsJson) : a.assignmentAttachmentsJson; } catch(e){}
    const myAttachments = typeof a.submissionAttachmentsJson === 'string' ? JSON.parse(a.submissionAttachmentsJson) : a.submissionAttachmentsJson || [];

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <button
          onClick={() => setActiveAssignmentId(null)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5F6368] hover:text-[#1A73E8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <Card className="border-t-4 border-t-[#1A73E8]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-[#E0E0E0]">
            <div>
              <h1 className="text-2xl font-black text-[#202124]"><MathText text={a.title} /></h1>
              <p className="text-sm font-bold text-[#5F6368] mt-1">{a.courseTitle}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge color="secondary">{a.assignmentType?.replace('_', ' ') || 'Assignment'}</Badge>
                <span className="text-sm font-bold text-[#9AA0A6]">{a.points} Points</span>
                <Badge color={isReadOnly ? (a.status === 'graded' ? 'success' : 'primary') : 'warning'}>
                  {isReadOnly ? (a.status === 'graded' ? 'Graded' : 'Submitted') : 'Pending'}
                </Badge>
              </div>
            </div>
            {isReadOnly && a.score !== null && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#E6F4EA] rounded-xl border border-[#188038]/20 text-[#188038]">
                <FileText className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wide">Final Score</span>
                  <span className="text-lg font-black">{a.score} / {a.points}</span>
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <div role="alert" className="flex items-start gap-3 px-4 py-3 mb-6 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025] animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          {a.instructions && (
            <div className="p-5 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] mb-8">
              <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-2">Instructions</p>
              <p className="text-sm text-[#202124] leading-relaxed whitespace-pre-line"><MathText text={a.instructions} /></p>
              {attachments?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-sm font-bold text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors">
                      <FileText className="w-4 h-4" /> {att.filename}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {renderQuestions(a, isReadOnly, submittedAnswers)}

          {!isReadOnly && (
            <div className="space-y-5 bg-[#F8F9FA] p-5 rounded-2xl border border-[#E0E0E0] mt-8">
              <h3 className="text-sm font-black text-[#202124] uppercase tracking-wide">Submission Area</h3>
              {(a.assignmentType === 'written_response' || a.assignmentType === 'mixed') && (
                <textarea
                  value={responseText[a.id] || ""}
                  onChange={(e) => setResponseText((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  placeholder="Type your response here…"
                  className="dn-textarea w-full bg-white"
                  rows={5}
                  disabled={submittingId === a.id}
                  aria-label={`Response for ${a.title}`}
                />
              )}
              
              {(a.assignmentType === 'file_submission' || a.assignmentType === 'mixed') && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {myAttachments.map((att, i) => (
                      <Badge key={i} color="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0E0E0] text-[#202124]">
                        {att.filename}
                        <button type="button" onClick={() => setSubmissionAttachmentsJson(prev => ({ ...prev, [a.id]: prev[a.id].filter((_, idx) => idx !== i)}))} className="hover:text-[#D93025]"><XIcon className="w-3.5 h-3.5" /></button>
                      </Badge>
                    ))}
                  </div>
                  <input type="file" ref={el => fileInputRef.current[a.id] = el} className="hidden" onChange={(e) => handleUpload(e, a.id)} />
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current[a.id]?.click()} disabled={submittingId === a.id} className="bg-white">
                    <UploadCloud className="w-4 h-4" /> Attach File
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-5 border-t border-[#E0E0E0]">
                <Button
                  onClick={() => handleSubmit(a.id)}
                  disabled={submittingId === a.id || (a.assignmentType === 'written_response' && !(responseText[a.id] || "").trim())}
                >
                  <Send className="w-4 h-4" />
                  {submittingId === a.id ? "Submitting…" : "Submit Assignment"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleComplete(a.id)}
                  disabled={submittingId === a.id}
                  className="bg-white"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </Button>
              </div>
            </div>
          )}

          {isReadOnly && a.responseText && (
            <div className="mt-8 p-5 bg-[#E8F0FE]/30 rounded-2xl border border-[#1A73E8]/20">
              <p className="text-xs font-black text-[#1A73E8] uppercase tracking-wide mb-2">Your Response</p>
              <p className="text-sm text-[#202124] leading-relaxed whitespace-pre-line"><MathText text={a.responseText} /></p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // GLOBAL OVERVIEW BLOCK LAYOUT
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader
        title="Assessments & Tasks"
        description="Select a block below to view or submit an assignment."
      />

      {notStarted.length === 0 && submitted.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="You don't have any assignments assigned to you right now."
        />
      )}

      {/* Pending Blocks */}
      {Object.keys(groupedPending).length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#202124]">To Do</h2>
            <Badge color="warning">{notStarted.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(groupedPending).map(([courseName, tasks]) => (
              <Card key={courseName} className="flex flex-col">
                <div className="flex items-center gap-3 border-b border-[#E0E0E0] pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#202124] leading-tight">{courseName}</h3>
                </div>
                <div className="space-y-2 flex-1">
                  {tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveAssignmentId(t.id)}
                      className="w-full text-left p-3 rounded-xl hover:bg-[#F8F9FA] border border-transparent hover:border-[#E0E0E0] transition-colors group flex items-start gap-3"
                    >
                      <ClipboardList className="w-4 h-4 text-[#E37400] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-[#202124] group-hover:text-[#1A73E8] transition-colors"><MathText text={t.title} /></p>
                        <p className="text-xs font-bold text-[#9AA0A6] mt-0.5">{t.points} pts · {t.assignmentType?.replace('_', ' ') || 'Assignment'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Submitted Blocks */}
      {Object.keys(groupedSubmitted).length > 0 && (
        <section className="space-y-5 pt-4">
          <div className="flex items-center gap-2 border-t border-[#E0E0E0] pt-6">
            <h2 className="text-lg font-black text-[#202124]">Completed</h2>
            <Badge color="success">{submitted.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(groupedSubmitted).map(([courseName, tasks]) => (
              <Card key={courseName} className="opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 border-b border-[#E0E0E0] pb-3 mb-3">
                  <h3 className="text-sm font-black text-[#5F6368] leading-tight flex-1">{courseName}</h3>
                </div>
                <div className="space-y-1">
                  {tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveAssignmentId(t.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle className="w-3.5 h-3.5 text-[#188038] flex-shrink-0" />
                        <p className="text-sm font-bold text-[#5F6368] truncate"><MathText text={t.title} /></p>
                      </div>
                      <span className="text-xs font-bold text-[#9AA0A6] flex-shrink-0">
                        {t.score !== null ? `${t.score}/${t.points}` : 'Submitted'}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
