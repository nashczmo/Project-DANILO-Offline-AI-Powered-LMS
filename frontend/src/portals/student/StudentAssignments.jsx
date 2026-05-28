import { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { ClipboardList, Send, CheckCircle, FileText, AlertCircle, UploadCloud, X as XIcon, Check } from "lucide-react";

export default function StudentAssignments() {
  const { data, loading, error, refresh } = useApi("/student/assignments", { immediate: true });
  const assignments = data || [];
  const token = useAppStore((s) => s.token);
  const [submittingId, setSubmittingId] = useState(null);
  const [responseText, setResponseText] = useState({});
  const [answersJson, setAnswersJson] = useState({});
  const [attachmentsJson, setAttachmentsJson] = useState({});
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      
      setAttachmentsJson(prev => {
        const arr = prev[assignmentId] || [];
        return { ...prev, [assignmentId]: [...arr, { filename: data.filename, url: data.url }] };
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
          attachmentsJson: attachmentsJson[assignmentId] || []
        },
      });
      refresh();
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
    } catch (err) {
      setSubmitError(err.message || "Failed to mark complete.");
    } finally {
      setSubmittingId(null);
    }
  };

  const renderQuestions = (a, readOnly = false, submittedAnswers = null) => {
    const questions = a.questions || [];
    if (questions.length === 0) return null;
    
    const sections = {};
    questions.forEach(q => {
      const sec = q.sectionName || "";
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(q);
    });

    return (
      <div className="space-y-6 mb-4">
        {Object.entries(sections).map(([sec, secQuestions], secIdx) => (
          <div key={secIdx} className="space-y-4">
            {sec && <h4 className="text-sm font-black text-[#1A73E8] uppercase tracking-wide border-b border-[#E0E0E0] pb-1 mb-3">{sec}</h4>}
            {!sec && Object.keys(sections).length === 1 && <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide">Questions</p>}
            
            {secQuestions.map((q, idx) => {
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
                <div key={q.id} className={`p-4 rounded-xl border ${isCorrect === true ? 'border-[#188038] bg-[#E6F4EA]/30' : isCorrect === false ? 'border-[#D93025] bg-[#FCE8E6]/30' : 'border-[#E0E0E0] bg-white'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-bold text-[#202124]">{secQuestions.length > 1 ? `${idx + 1}. ` : ""}{q.questionText}</p>
                    <span className="text-xs text-[#9AA0A6] font-bold flex-shrink-0 ml-4">{q.points} pt</span>
                  </div>
                  <div className="space-y-2">
                    {(q.type === 'multiple_choice' || q.type === 'true_false') && choices.map((c, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-[#5F6368]">
                        <input type="radio" name={`q-${q.id}`} value={c} checked={val === c} onChange={() => handleAnswerChange(a.id, q.id, c, q.type)} disabled={readOnly} className="w-4 h-4 text-[#1A73E8]" />
                        {c}
                      </label>
                    ))}
                    {q.type === 'checkbox' && choices.map((c, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-[#5F6368]">
                        <input type="checkbox" checked={Array.isArray(val) && val.includes(c)} onChange={() => handleAnswerChange(a.id, q.id, c, q.type)} disabled={readOnly} className="w-4 h-4 text-[#1A73E8]" />
                        {c}
                      </label>
                    ))}
                    {(q.type === 'short_answer' || q.type === 'identification') && (
                      <input type="text" className="dn-input w-full" value={val} onChange={(e) => handleAnswerChange(a.id, q.id, e.target.value, q.type)} disabled={readOnly} placeholder="Your answer" />
                    )}
                  </div>
                  {readOnly && a.status === 'graded' && (
                    <div className="mt-3 pt-3 border-t border-[#E0E0E0] flex items-center gap-2">
                      {isCorrect ? <Check className="w-4 h-4 text-[#188038]" /> : <XIcon className="w-4 h-4 text-[#D93025]" />}
                      <span className={`text-xs font-bold ${isCorrect ? 'text-[#188038]' : 'text-[#D93025]'}`}>
                        Correct Answer: {q.type === 'checkbox' ? (Array.isArray(q.answerKey) ? q.answerKey.join(', ') : q.answerKey) : q.answerKey}
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="My Assignments"
        description="View and submit your course assignments."
      />

      {submitError && (
        <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025] animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      {notStarted.length === 0 && submitted.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="You don't have any assignments right now."
        />
      )}

      {/* ── Pending Assignments ── */}
      {notStarted.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#202124]">Pending</h2>
            <Badge color="warning">{notStarted.length}</Badge>
          </div>
          {notStarted.map((a) => {
            let attachments = [];
            try { attachments = typeof a.attachmentsJson === 'string' ? JSON.parse(a.attachmentsJson) : a.attachmentsJson; } catch(e){}
            const myAttachments = attachmentsJson[a.id] || [];

            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#202124]">{a.title}</h4>
                      <p className="text-xs text-[#9AA0A6] font-bold mt-0.5">
                        {a.courseTitle} · {a.points} pts
                      </p>
                      <Badge color="secondary" className="mt-1">{a.assignmentType?.replace('_', ' ') || 'Assignment'}</Badge>
                    </div>
                  </div>
                  <Badge color="warning">Pending</Badge>
                </div>

                {a.instructions && (
                  <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] mb-4">
                    <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-1.5">Instructions</p>
                    <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-line">{a.instructions}</p>
                    {attachments?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                          <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-sm font-bold text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors">
                            <FileText className="w-4 h-4" /> {att.filename}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {renderQuestions(a, false)}

                <div className="space-y-3">
                  {(a.assignmentType === 'written_response' || a.assignmentType === 'mixed') && (
                    <textarea
                      value={responseText[a.id] || ""}
                      onChange={(e) => setResponseText((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      placeholder="Type your response here…"
                      className="dn-textarea w-full"
                      rows={4}
                      disabled={submittingId === a.id}
                      aria-label={`Response for ${a.title}`}
                    />
                  )}
                  
                  {(a.assignmentType === 'file_submission' || a.assignmentType === 'mixed') && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {myAttachments.map((att, i) => (
                          <Badge key={i} color="secondary" className="flex items-center gap-1">
                            {att.filename}
                            <button type="button" onClick={() => setAttachmentsJson(prev => ({ ...prev, [a.id]: prev[a.id].filter((_, idx) => idx !== i)}))}><XIcon className="w-3 h-3" /></button>
                          </Badge>
                        ))}
                      </div>
                      <input type="file" ref={el => fileInputRef.current[a.id] = el} className="hidden" onChange={(e) => handleUpload(e, a.id)} />
                      <Button variant="secondary" size="sm" onClick={() => fileInputRef.current[a.id]?.click()} disabled={submittingId === a.id}>
                        <UploadCloud className="w-4 h-4" /> Attach File
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-[#E0E0E0]">
                    <Button
                      onClick={() => handleSubmit(a.id)}
                      disabled={submittingId === a.id || (a.assignmentType === 'written_response' && !(responseText[a.id] || "").trim())}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                      {submittingId === a.id ? "Submitting…" : "Submit Assignment"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleComplete(a.id)}
                      disabled={submittingId === a.id}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {/* ── Submitted Assignments ── */}
      {submitted.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#202124]">Submitted</h2>
            <Badge color="success">{submitted.length}</Badge>
          </div>
          {submitted.map((a) => {
            let submittedAnswers = {};
            try { submittedAnswers = typeof a.answersJson === 'string' ? JSON.parse(a.answersJson) : a.answersJson; } catch(e){}
            let attachments = [];
            try { attachments = typeof a.attachmentsJson === 'string' ? JSON.parse(a.attachmentsJson) : a.attachmentsJson; } catch(e){}
            
            return (
              <Card key={a.id} className="opacity-95">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#188038] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#202124]">{a.title}</h4>
                      <p className="text-xs text-[#9AA0A6] font-bold mt-0.5">{a.courseTitle}</p>
                    </div>
                  </div>
                  <Badge color={a.status === "graded" ? "success" : "primary"}>
                    {a.status === "graded" ? "Graded" : (a.status === "completed" ? "Completed" : "Submitted")}
                  </Badge>
                </div>

                {renderQuestions(a, true, submittedAnswers)}

                {a.responseText && (
                  <div className="mt-4 p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-1.5">Your response</p>
                    <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-line">{a.responseText}</p>
                  </div>
                )}
                
                {attachments?.length > 0 && (
                  <div className="mt-4 p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-1.5">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-lg text-sm font-bold text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors">
                          <FileText className="w-4 h-4" /> {att.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {a.score !== null && (
                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-[#E0E0E0]">
                    <FileText className="w-4 h-4 text-[#1A73E8]" />
                    <span className="text-sm font-black text-[#202124]">
                      Score: {a.score} / {a.points}
                    </span>
                    <Badge color={a.score >= a.points * 0.75 ? "success" : "warning"}>
                      {Math.round((a.score / a.points) * 100)}%
                    </Badge>
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
