import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, apiUpload } from "./api";
import {
  AdminAnnouncementsView, AdminAssignmentsView, AdminClassesView, AdminEnrollmentsView,
  AdminSectionsView, AdminUsersView, DepartmentsView, ReportsView, SystemView, TeacherAnnouncementsView,
} from "./components/AdminPages";
import { ASSESSMENT_TYPES, Badge, Empty, Field, PageHeader, SummaryCard } from "./components/shared";
import ContentView from "./components/ContentView";
import GradesView from "./components/GradesView";
import InstallBanner from "./components/InstallBanner";
import StreamView from "./components/StreamView";
import TutorView from "./components/TutorView";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import ToastContainer from "./components/ui/ToastContainer";
import { usePath, matchRoute } from "./hooks/usePath";
import MobileDrawer from "./layout/MobileDrawer";
import MobileNav from "./layout/MobileNav";
import Sidebar from "./layout/Sidebar";
import TopBar from "./layout/TopBar";
import Dashboard from "./pages/Dashboard";
import LoginView from "./pages/LoginView";
import { useAppStore } from "./store/useAppStore";
import { cn, getInitials } from "./lib/utils";

/* ========================================================================
   CONSTANTS
   ======================================================================== */

const initialLogin = { username: "", password: "" };
const initialTutor = { moduleId: "", question: "", responseMode: "normal" };
let nextMsgId = 1;

function createBootstrapDashboard(user) {
  return { user, stream: [], courses: [], contentFolders: [], grades: [], hints: { hasContent: false, hasCourses: false, hasGrades: false, hasStream: false }, contentWorkflow: null, network: null, operationsHighlights: [] };
}

const ALLOWED = {
  admin:   ["overview", "users", "classes", "sections", "enrollments", "assignments", "grades", "departments", "reports", "settings", "system", "my-classes", "announcements", "not-found"],
  teacher: ["overview", "my-classes", "grades", "announcements", "ai-tutor", "class-detail", "sections", "not-found"],
  student: ["overview", "my-classes", "grades", "ai-tutor", "assignments", "class-detail", "not-found"],
};
const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };

function isAllowed(role, page) {
  return (ALLOWED[role] || ALLOWED.student).includes(page);
}

/* ========================================================================
   CLASS DETAIL SUB-COMPONENTS
   ======================================================================== */

function parseChoices(choicesJson) {
  if (!choicesJson) return [];
  try {
    const parsed = JSON.parse(choicesJson);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.values(parsed);
  } catch (_) {
    return String(choicesJson).split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function AssignmentCard({ token, assignment, canSubmit, onSaved }) {
  const [responseText, setResponseText] = useState(assignment.submission?.responseText || "");
  const [saving, setSaving] = useState(false);
  const status = assignment.submission?.status || "not_started";

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest(`/student/assignments/${assignment.id}/submit`, { method: "POST", token, body: { responseText } });
      await onSaved();
    } finally { setSaving(false); }
  }

  async function complete() {
    setSaving(true);
    try { await apiRequest(`/student/assignments/${assignment.id}/complete`, { method: "POST", token }); await onSaved(); } finally { setSaving(false); }
  }

  return (
    <article className="dn-card p-4 mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-danilo-text">{assignment.title}</p>
          <p className="text-sm text-danilo-text-secondary mt-0.5 whitespace-pre-wrap">{assignment.instructions}</p>
          <p className="text-xs text-danilo-text-muted mt-1">{assignment.points} pts</p>
        </div>
        <Badge tone={status === "submitted" || status === "completed" ? "green" : "yellow"}>{status.replace("_", " ")}</Badge>
      </div>
      {assignment.submission?.feedback && <p className="mt-2 text-xs text-danilo-primary">Feedback: {assignment.submission.feedback}</p>}
      {assignment.submission?.score != null && <p className="mt-1 text-xs text-danilo-text-secondary">Score: {assignment.submission.score}/{assignment.points}</p>}
      {canSubmit && (
        <form onSubmit={submit} className="mt-3 grid gap-2">
          <textarea className="dn-input" rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your answer or completion notes..." required />
          <div className="flex flex-wrap gap-2">
            <button disabled={saving || !responseText.trim()} className="dn-btn-primary text-xs py-1.5">Submit Answer</button>
            <button type="button" disabled={saving} onClick={complete} className="dn-btn-secondary text-xs py-1.5">Mark Complete</button>
          </div>
        </form>
      )}
    </article>
  );
}

function QuizCard({ token, quiz, canSubmit, onSaved }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = await apiRequest(`/student/quizzes/${quiz.id}/submit`, { method: "POST", token, body: { answers } });
      setResult(payload);
      await onSaved();
    } finally { setSaving(false); }
  }

  return (
    <article className="dn-card p-4 mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-medium text-danilo-text">{quiz.title}</p>
          <p className="text-sm text-danilo-text-secondary mt-0.5">{quiz.instructions}</p>
        </div>
        <Badge tone={quiz.attempt ? "green" : "yellow"}>{quiz.attempt ? "Submitted" : "Pending"}</Badge>
      </div>
      {result && <div className="rounded-lg bg-danilo-primary-subtle border border-danilo-primary/20 text-danilo-primary text-sm p-3 mb-3">Score: {result.score}% ({result.earnedPoints}/{result.totalPoints} pts)</div>}
      {canSubmit && !quiz.attempt && (
        <form onSubmit={submit} className="grid gap-3">
          {(quiz.questions || []).map((q, index) => {
            const choices = parseChoices(q.choicesJson);
            return (
              <Field key={q.id} label={`${index + 1}. ${q.questionText}`}>
                {choices.length ? (
                  <select className="dn-input" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} required>
                    <option value="">Choose answer...</option>
                    {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                  </select>
                ) : (
                  <input className="dn-input" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Your answer" required />
                )}
              </Field>
            );
          })}
          <button disabled={saving || !(quiz.questions || []).length} className="dn-btn-primary text-xs py-1.5">Submit Quiz</button>
        </form>
      )}
      {canSubmit && quiz.attempt && <p className="text-xs text-danilo-text-muted">Submitted {quiz.attempt.submittedAt ? new Date(quiz.attempt.submittedAt).toLocaleString() : ""}</p>}
    </article>
  );
}

function TeacherQuickTools({ token, user, course, tab, people, reload }) {
  const [moduleForm, setModuleForm] = useState({ title: "", melcCode: "", learningCompetency: "", lessonObjectives: "", assessmentType: "", quarter: course.quarter || "Q1", week: 1, summary: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", instructions: "", points: 100 });
  const [quizForm, setQuizForm] = useState({ title: "", instructions: "", questionText: "", choicesText: "", answerKey: "", points: 1, isPublished: true });
  const [uploadState, setUploadState] = useState({ file: null, saving: false, error: "", success: "" });

  if (user.role !== "teacher") return null;

  async function createModule(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/modules`, { method: "POST", token, body: moduleForm });
    setModuleForm({ title: "", melcCode: "", learningCompetency: "", lessonObjectives: "", assessmentType: "", quarter: course.quarter || "Q1", week: 1, summary: "" });
    reload();
  }

  async function createAssignment(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/assignments`, { method: "POST", token, body: assignmentForm });
    setAssignmentForm({ title: "", instructions: "", points: 100 });
    reload();
  }

  async function createQuiz(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/quizzes`, {
      method: "POST", token,
      body: { title: quizForm.title, instructions: quizForm.instructions, isPublished: quizForm.isPublished,
        questions: [{ questionText: quizForm.questionText, choicesJson: JSON.stringify(quizForm.choicesText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)), answerKey: quizForm.answerKey, points: quizForm.points }],
      },
    });
    setQuizForm({ title: "", instructions: "", questionText: "", choicesText: "", answerKey: "", points: 1, isPublished: true });
    reload();
  }

  async function generateLesson(e) {
    e.preventDefault();
    if (!uploadState.file) return;
    const formData = new FormData();
    formData.append("material", uploadState.file);
    setUploadState((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      const result = await apiUpload(`/teacher/courses/${course.id}/materials/generate?save=true`, { token, formData });
      setUploadState({ file: null, saving: false, error: "", success: result?.message || "Lesson draft generated and saved." });
      await reload();
    } catch (error) {
      setUploadState((prev) => ({ ...prev, saving: false, error: error?.message || "Material could not be processed.", success: "" }));
    }
  }

  if (tab === "classwork") {
    return (
      <div className="grid gap-4 mb-5 lg:grid-cols-2">
        <form className="dn-card p-5" onSubmit={createModule}>
          <h3 className="font-semibold text-danilo-text mb-3">Add Module</h3>
          <div className="grid gap-3">
            <Field label="Module Title"><input className="dn-input" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required /></Field>
            <Field label="MELC Code"><input className="dn-input" value={moduleForm.melcCode} onChange={(e) => setModuleForm({ ...moduleForm, melcCode: e.target.value })} /></Field>
            <Field label="Learning Competency"><textarea className="dn-input" rows={2} value={moduleForm.learningCompetency} onChange={(e) => setModuleForm({ ...moduleForm, learningCompetency: e.target.value })} /></Field>
            <Field label="Lesson Objectives"><textarea className="dn-input" rows={2} value={moduleForm.lessonObjectives} onChange={(e) => setModuleForm({ ...moduleForm, lessonObjectives: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quarter"><select className="dn-input" value={moduleForm.quarter} onChange={(e) => setModuleForm({ ...moduleForm, quarter: e.target.value })}><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></Field>
              <Field label="Week"><input className="dn-input" type="number" min="1" value={moduleForm.week} onChange={(e) => setModuleForm({ ...moduleForm, week: e.target.value })} /></Field>
            </div>
            <Field label="Assessment Type"><select className="dn-input" value={moduleForm.assessmentType} onChange={(e) => setModuleForm({ ...moduleForm, assessmentType: e.target.value })}><option value="">Optional</option>{ASSESSMENT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Summary"><textarea className="dn-input" rows={2} value={moduleForm.summary} onChange={(e) => setModuleForm({ ...moduleForm, summary: e.target.value })} /></Field>
            <button className="dn-btn-primary">Add Module</button>
          </div>
        </form>
        <form className="dn-card p-5" onSubmit={createAssignment}>
          <h3 className="font-semibold text-danilo-text mb-3">Create Assignment</h3>
          <div className="grid gap-3">
            <Field label="Title"><input className="dn-input" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required /></Field>
            <Field label="Instructions"><textarea className="dn-input" rows={5} value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })} required /></Field>
            <Field label="Points"><input className="dn-input" type="number" min="1" value={assignmentForm.points} onChange={(e) => setAssignmentForm({ ...assignmentForm, points: e.target.value })} /></Field>
            <button className="dn-btn-primary">Create Assignment</button>
          </div>
        </form>
        <form className="dn-card p-5 lg:col-span-2" onSubmit={createQuiz}>
          <h3 className="font-semibold text-danilo-text mb-3">Create Quiz</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Quiz Title"><input className="dn-input" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required /></Field>
            <Field label="Instructions"><input className="dn-input" value={quizForm.instructions} onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })} required /></Field>
            <Field label="Question" className="sm:col-span-2"><textarea className="dn-input" rows={2} value={quizForm.questionText} onChange={(e) => setQuizForm({ ...quizForm, questionText: e.target.value })} required /></Field>
            <Field label="Choices (one per line)"><textarea className="dn-input" rows={4} value={quizForm.choicesText} onChange={(e) => setQuizForm({ ...quizForm, choicesText: e.target.value })} /></Field>
            <div className="grid gap-3">
              <Field label="Answer Key"><input className="dn-input" value={quizForm.answerKey} onChange={(e) => setQuizForm({ ...quizForm, answerKey: e.target.value })} required /></Field>
              <Field label="Points"><input className="dn-input" type="number" min="1" value={quizForm.points} onChange={(e) => setQuizForm({ ...quizForm, points: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                <input type="checkbox" checked={quizForm.isPublished} onChange={(e) => setQuizForm({ ...quizForm, isPublished: e.target.checked })} />
                Publish immediately
              </label>
            </div>
            <button className="dn-btn-primary sm:col-span-2">Create Quiz</button>
          </div>
        </form>
        <form className="dn-card p-5 lg:col-span-2" onSubmit={generateLesson}>
          <h3 className="font-semibold text-danilo-text mb-3">Generate Lesson From Material</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Upload PDF, PPT, PPTX, DOCX, or TXT">
              <input className="dn-input" type="file" accept=".pdf,.ppt,.pptx,.docx,.txt" onChange={(e) => setUploadState({ file: e.target.files?.[0] || null, saving: false, error: "", success: "" })} />
            </Field>
            <button className="dn-btn-primary" disabled={!uploadState.file || uploadState.saving}>{uploadState.saving ? "Generating..." : "Generate Lesson"}</button>
          </div>
          {uploadState.error && <p className="mt-3 text-sm font-medium text-danilo-error">{uploadState.error}</p>}
          {uploadState.success && <p className="mt-3 text-sm font-medium text-danilo-success">{uploadState.success}</p>}
        </form>
      </div>
    );
  }

  return null;
}

function InsightsPanel({ insights, loading, error, token, classId, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try { const data = await apiRequest(`/teacher/insights?class_id=${classId}&include_ai=true`, { token }); onRefresh(data); } catch (_) {}
    setRefreshing(false);
  }

  if (loading && !insights) return <div className="dn-card p-4 text-sm text-danilo-text-muted animate-pulse">Loading learner insights...</div>;
  if (error && !insights) return <div className="rounded-lg border border-danilo-error/20 bg-danilo-error-subtle p-4 text-sm font-medium text-danilo-error">{error}</div>;
  if (!insights || !insights.course) return <Empty icon={<svg className="w-6 h-6 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} title="No insights available" body="Insights will appear once learners have grades, quiz attempts, or assessment submissions." />;

  const stats = insights.stats || {};
  const struggling = insights.strugglingStudents || [];
  const weakTopics = insights.classWeakTopics || [];
  const aiSummary = insights.aiSummary || "";

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-danilo-text">Student Performance Insights</h3>
        <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 text-sm text-danilo-primary font-medium hover:text-danilo-primary-hover transition-colors disabled:opacity-50">
          <svg className={cn("w-4 h-4", refreshing ? "animate-spin" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SummaryCard label="Learners" value={stats.studentCount || 0} />
        <SummaryCard label="Struggling" value={stats.strugglingCount || 0} tone={stats.strugglingCount > 0 ? "danger" : "primary"} />
        <SummaryCard label="At Risk" value={stats.atRiskCount || 0} tone={stats.atRiskCount > 0 ? "danger" : "primary"} />
        <SummaryCard label="Class Average" value={stats.classAverage != null ? `${stats.classAverage}%` : "-"} />
      </div>
      {aiSummary && (
        <div className="dn-card p-4 mb-5 border-l-4 border-danilo-primary">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-danilo-surface-hover flex items-center justify-center flex-shrink-0 mt-0.5 border border-danilo-border">
              <svg className="w-3.5 h-3.5 text-danilo-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-danilo-text-secondary mb-1">DANILO AI Summary</p>
              <p className="text-sm text-danilo-text-secondary leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}
      {struggling.length > 0 && (
        <div className="mb-5">
          <h3 className="font-semibold text-danilo-text mb-3">Struggling Learners</h3>
          <div className="space-y-3">
            {struggling.map((s) => (
              <div key={s.studentId} className="dn-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-danilo-text">{s.studentName}</p>
                    {s.averageScore != null && <p className="text-xs text-danilo-text-muted mt-0.5">Average: {s.averageScore}%</p>}
                  </div>
                  <Badge tone="red">{s.status === "at_risk" ? "At Risk" : "Struggling"}</Badge>
                </div>
                {s.weakestTopic && <p className="text-sm text-danilo-text-secondary mb-1"><span className="font-medium">Weakest area:</span> {s.weakestTopic}{s.weakestTopicScore != null && <span className="text-danilo-text-muted"> ({s.weakestTopicScore}%)</span>}</p>}
                <p className="text-xs text-danilo-text-secondary mb-2">{s.explanation}</p>
                {s.recommendedAction && <p className="text-xs font-medium text-danilo-primary bg-danilo-primary-subtle rounded-lg px-3 py-1.5 inline-block">{s.recommendedAction}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!struggling.length && <Empty icon={<svg className="w-6 h-6 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} title="All students on track" body="No students are currently flagged as struggling or at risk." />}
      {weakTopics.length > 0 && (
        <div className="dn-card p-5 mt-5">
          <h3 className="font-semibold text-danilo-text mb-3">Class Weak Topics</h3>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t, i) => <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-danilo-error-subtle text-danilo-error text-sm font-medium">{t}</span>)}
          </div>
        </div>
      )}
    </section>
  );
}

function ClassDetailView({ classId, tab, courses, dashboard, navigate, token, user, reloadData }) {
  const course = (courses || []).find((c) => c.id === classId);
  const [classData, setClassData] = useState({ loading: false, error: "", stream: null, classwork: null, people: null, grades: null, insights: null });
  const [classSearch, setClassSearch] = useState("");
  const [classQuarter, setClassQuarter] = useState("");
  const [classSubject, setClassSubject] = useState("");

  const TABS = [
    { id: "stream", label: "Stream", path: `/class/${classId}/stream` },
    { id: "classwork", label: "Materials", path: `/class/${classId}/classwork` },
    { id: "people", label: "Learners", path: `/class/${classId}/people` },
    { id: "grades", label: "Grades", path: `/class/${classId}/grades` },
    ...(user.role === "teacher" ? [{ id: "insights", label: "Insights", path: `/class/${classId}/insights` }] : []),
  ];

  useEffect(() => {
    if (!course || !token) return;
    let active = true;
    async function loadClassTab() {
      try {
        const [tabPayload, peoplePayload] = await Promise.all([
          apiRequest(`/classes/${classId}/${tab}`, { token }),
          apiRequest(`/classes/${classId}/people`, { token }).catch(() => null),
        ]);
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: "", [tab]: tabPayload, people: peoplePayload || prev.people }));
      } catch (error) {
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: error?.message || "Class data could not be loaded." }));
      }
    }
    setClassData((prev) => ({ ...prev, loading: true, error: "" }));
    loadClassTab();
    return () => { active = false; };
  }, [classId, tab, course, token]);

  useEffect(() => {
    if (tab !== "insights" || !token || user.role !== "teacher") return;
    let active = true;
    async function loadInsights() {
      try {
        const data = await apiRequest(`/teacher/insights?class_id=${classId}&include_ai=true`, { token });
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: "", insights: data }));
      } catch (error) {
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: error?.message || "Insights could not be loaded.", insights: null }));
      }
    }
    loadInsights();
    return () => { active = false; };
  }, [tab, classId, token, user.role]);

  async function refreshClass() {
    await reloadData();
    const payload = await apiRequest(`/classes/${classId}/${tab}`, { token });
    const peoplePayload = await apiRequest(`/classes/${classId}/people`, { token }).catch(() => classData.people);
    setClassData((prev) => ({ ...prev, [tab]: payload, people: peoplePayload }));
  }

  if (!course) {
    return (
      <section className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-danilo-bg flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
        </div>
        <h2 className="text-lg font-semibold text-danilo-text">Subject not found</h2>
        <p className="text-sm text-danilo-text-muted mt-1">This subject does not exist or you are not enrolled.</p>
        <button onClick={() => navigate("/my-classes")} className="mt-4 dn-btn-primary">Back to My Subjects</button>
      </section>
    );
  }

  const stream = Array.isArray(classData.stream) ? classData.stream : (dashboard?.stream || []).filter((s) => s.courseId === classId);
  const classwork = classData.classwork || {};
  const content = classwork.modules || (dashboard?.contentFolders || []).filter((f) => f.courseId === classId);
  const assignments = classwork.assignments || [];
  const quizzes = classwork.quizzes || [];
  const grades = normalizeGradeRows(classData.grades?.grades || (dashboard?.grades || []).filter((g) => g.courseId === classId));
  const people = classData.people || { teacher: course.teacherName ? { fullName: course.teacherName } : null, students: [] };

  return (
    <section>
      <button onClick={() => navigate("/my-classes")} className="flex items-center gap-1 text-sm text-danilo-primary font-medium mb-4 hover:text-danilo-primary-hover transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        My Subjects
      </button>
      <div className="dn-card p-4 mb-4">
        <h2 className="text-base font-semibold text-danilo-text tracking-tight">{course.title}</h2>
        <p className="text-sm text-danilo-text-muted mt-0.5">{course.code} · {course.subject} · {course.gradeLevel}</p>
      </div>
      <div className="mb-4 overflow-x-auto rounded-xl border border-danilo-border bg-danilo-bg p-1">
        <div className="flex min-w-max gap-1 sm:min-w-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => navigate(t.path)}
              className={cn("min-h-[40px] min-w-[96px] flex-1 rounded-xl px-4 text-center text-sm font-medium transition-all active:scale-[0.98]", tab === t.id ? "bg-danilo-surface text-danilo-text shadow-sm border border-danilo-border" : "text-danilo-text-muted hover:text-danilo-text-secondary")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {classData.loading && <div className="dn-card p-4 mb-4 text-sm text-danilo-text-muted animate-pulse">Loading class data...</div>}
      {classData.error && <div className="rounded-xl border border-danilo-error/20 bg-danilo-error-subtle p-4 mb-4 text-sm font-medium text-danilo-error">{classData.error}</div>}
      <TeacherQuickTools token={token} user={user} course={course} tab={tab} people={people} reload={refreshClass} />
      {tab === "stream" && <StreamView items={stream} />}
      {tab === "classwork" && (
        <>
          <ContentView items={content} search={classSearch} onSearchChange={(e) => setClassSearch(e.target.value)} quarter={classQuarter} onQuarterChange={(e) => setClassQuarter(e.target.value)} subject={classSubject} onSubjectChange={(e) => setClassSubject(e.target.value)} />
          <div className="mt-4 dn-card p-5">
            <h3 className="font-semibold text-danilo-text mb-3">Assessments</h3>
            {assignments.length ? assignments.map((a) => <AssignmentCard key={a.id} token={token} assignment={a} canSubmit={user.role === "student"} onSaved={refreshClass} />) : <Empty title="No assessments" body="Assessments for this subject will appear here." />}
          </div>
          <div className="mt-4 dn-card p-5">
            <h3 className="font-semibold text-danilo-text mb-3">Quizzes</h3>
            {quizzes.length ? quizzes.map((q) => <QuizCard key={q.id} token={token} quiz={q} canSubmit={user.role === "student"} onSaved={refreshClass} />) : <Empty title="No quizzes" body="Published quizzes for this subject will appear here." />}
          </div>
        </>
      )}
      {tab === "people" && (
        <div className="dn-card p-5">
          <h3 className="font-semibold text-danilo-text mb-3">Faculty</h3>
          <p className="rounded-xl bg-danilo-bg border border-danilo-border p-3 text-sm text-danilo-text">{people.teacher?.fullName || "Unassigned"}</p>
          <h3 className="font-semibold text-danilo-text mt-5 mb-3">Learners</h3>
          {people.students?.length ? (
            <div className="divide-y divide-danilo-border/40 rounded-xl border border-danilo-border overflow-hidden">
              {people.students.map((s) => <div key={s.id} className="p-3 text-sm"><p className="font-medium text-danilo-text">{s.fullName}</p><p className="text-xs text-danilo-text-muted">{s.username}</p></div>)}
            </div>
          ) : <Empty title="No enrolled learners" body="Learners will appear here after enrollment." />}
        </div>
      )}
      {tab === "grades" && <GradesView grades={grades} />}
      {tab === "insights" && <InsightsPanel insights={classData.insights} loading={classData.loading} error={classData.error} token={token} classId={classId} onRefresh={(data) => setClassData((prev) => ({ ...prev, insights: data }))} />}
    </section>
  );
}

/* ========================================================================
   ERROR VIEWS
   ======================================================================== */

function ForbiddenView({ navigate }) {
  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danilo-error-subtle flex items-center justify-center mx-auto mb-5 border border-danilo-error/20">
        <svg className="w-8 h-8 text-danilo-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      </div>
      <h2 className="text-xl font-semibold text-danilo-text">Access Denied</h2>
      <p className="text-sm text-danilo-text-secondary mt-2 max-w-sm">You do not have permission to view this page.</p>
      <button onClick={() => navigate("/overview")} className="mt-5 dn-btn-primary">Go to Dashboard</button>
    </section>
  );
}

function NotFoundView({ navigate }) {
  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danilo-bg flex items-center justify-center mx-auto mb-5 border border-danilo-border">
        <svg className="w-8 h-8 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
      </div>
      <h2 className="text-xl font-semibold text-danilo-text">Page Not Found</h2>
      <p className="text-sm text-danilo-text-secondary mt-2 max-w-sm">The page you are looking for does not exist.</p>
      <button onClick={() => navigate("/overview")} className="mt-5 dn-btn-primary">Go to Dashboard</button>
    </section>
  );
}

/* ========================================================================
   GRADE HELPERS
   ======================================================================== */

function normalizeGradeRows(grades) {
  return (grades || []).map((grade, index) => {
    const finalGrade = Number(grade.finalGrade ?? grade.score ?? 0);
    return { ...grade, courseId: grade.courseId ?? grade.id ?? index, quarter: grade.quarter || "", subject: grade.subject || grade.courseTitle || "Class", courseTitle: grade.courseTitle || grade.studentName || "Grade record", courseCode: grade.courseCode || "", finalGrade, components: grade.components || [{ component: grade.component || "Recorded score", score: grade.score ?? finalGrade, maxScore: grade.maxScore ?? 100, weight: grade.weight ?? 1, percentage: grade.percentage ?? finalGrade, remarks: grade.remarks || "" }] };
  });
}

/* ========================================================================
   MY CLASSES
   ======================================================================== */

function MyClassesView({ courses, navigate }) {
  return (
    <section aria-label="My Subjects">
      <PageHeader title="My Subjects" subtitle="Your enrolled subjects. Tap a card to open." />
      {!courses || courses.length === 0 ? (
        <Empty title="No subjects yet" body="You will see your enrolled subjects here once assigned." icon={<svg className="w-6 h-6 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <button key={c.id} onClick={() => navigate(`/class/${c.id}/stream`)}
              className="group text-left dn-card overflow-hidden dn-card-hover">
              <div className="h-16 bg-danilo-bg relative border-b border-danilo-border">
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-semibold text-sm truncate drop-shadow-sm" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{c.title}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-danilo-text-muted uppercase tracking-wider">{c.code}</p>
                <p className="text-sm text-danilo-text-secondary mt-0.5">{c.subject} · {c.gradeLevel}</p>
                {c.teacherName && <p className="text-xs text-danilo-text-muted mt-0.5">{c.teacherName}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ========================================================================
   MAIN APP
   ======================================================================== */

export default function App() {
  const [path, navigate] = usePath();

  const token = useAppStore((s) => s.token);
  const setToken = useAppStore((s) => s.setToken);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const dashboard = useAppStore((s) => s.dashboard);
  const setDashboard = useAppStore((s) => s.setDashboard);
  const isOffline = useAppStore((s) => s.isOffline);
  const setOffline = useAppStore((s) => s.setOffline);
  const mobileMenuOpen = useAppStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);
  const promptEvent = useAppStore((s) => s.promptEvent);
  const setPromptEvent = useAppStore((s) => s.setPromptEvent);
  const toasts = useAppStore((s) => s.toasts);
  const addToast = useAppStore((s) => s.addToast);
  const dismissToast = useAppStore((s) => s.dismissToast);
  const logout = useAppStore((s) => s.logout);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminAssignments, setAdminAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [tutorForm, setTutorForm] = useState(initialTutor);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorMessages, setTutorMessages] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null, confirmLabel: "Confirm", variant: "default" });

  const route = useMemo(() => matchRoute(path), [path]);

  const confirm = useCallback((title, message, onConfirm, opts = {}) => {
    setConfirmState({ open: true, title, message, onConfirm, confirmLabel: opts.confirmLabel || "Confirm", variant: opts.variant || "default" });
  }, []);
  const closeConfirm = useCallback(() => setConfirmState((c) => ({ ...c, open: false })), []);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    const handler = (event) => { event.preventDefault(); setPromptEvent(event); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [setOffline, setPromptEvent]);

  async function loadRoleData(authToken, profile) {
    const mergeDash = (incoming) => setDashboard((prev) => ({ ...(prev || {}), ...incoming }));
    if (profile.role === "admin") {
      const results = await Promise.allSettled([
        apiRequest("/admin/overview", { token: authToken }), apiRequest("/admin/users", { token: authToken }),
        apiRequest("/admin/courses", { token: authToken }), apiRequest("/admin/assignments", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminUsers(results[1].value);
      if (results[2].status === "fulfilled") setAdminCourses(results[2].value);
      if (results[3].status === "fulfilled") setAdminAssignments(results[3].value);
    } else if (profile.role === "teacher") {
      const results = await Promise.allSettled([
        apiRequest("/teacher/dashboard", { token: authToken }), apiRequest("/teacher/courses", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminCourses(results[1].value);
    } else {
      const results = await Promise.allSettled([
        apiRequest("/dashboard", { token: authToken }), apiRequest("/student/assignments", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminAssignments(results[1].value);
    }
  }

  async function reloadData() {
    if (!token || !user) return;
    try { await loadRoleData(token, user); } catch { /* silent */ }
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    setSessionLoading(true);
    setDashboardError("");
    async function restoreSession() {
      try {
        const profile = await apiRequest("/me", { token });
        if (!active) return;
        setUser(profile);
        setDashboard((c) => c || createBootstrapDashboard(profile));
        try { await loadRoleData(token, profile); } catch (error) {
          if (!active) return;
          if (error?.status === 401) { logout(); setLoginError("Your session expired. Please sign in again."); return; }
          setDashboard(createBootstrapDashboard(profile));
          setDashboardError(error?.message || "Dashboard data could not be loaded yet.");
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) { logout(); setLoginError("Your session expired. Please sign in again."); return; }
        setDashboardError(error?.message || "Unable to restore your session.");
      } finally { if (active) setSessionLoading(false); }
    }
    restoreSession();
    return () => { active = false; };
  }, [token]);

  const handleLoginChange = (e) => { const { name, value } = e.target; setLoginForm((c) => ({ ...c, [name]: value })); };
  const handleTutorChange = (e) => { const { name, value } = e.target; setTutorForm((c) => ({ ...c, [name]: value })); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    setDashboardError("");
    try {
      const response = await apiRequest("/auth/login", { method: "POST", body: { username: loginForm.username.trim(), password: loginForm.password } });
      if (!response?.accessToken || !response?.user) throw new Error("Invalid username or password");
      setToken(response.accessToken);
      setUser(response.user);
      setDashboard(createBootstrapDashboard(response.user));
      navigate("/overview");
      loadRoleData(response.accessToken, response.user).catch((error) => {
        if (error?.status === 401) { logout(); setLoginError("Your session expired. Please sign in again."); return; }
        setDashboard(createBootstrapDashboard(response.user));
        setDashboardError(error?.message || "Dashboard data could not be loaded yet.");
      });
    } catch (error) {
      if (error?.status === 401) logout();
      setLoginError(error?.message || "Invalid username or password");
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    confirm("Sign Out", "Are you sure you want to sign out of DANILO?", () => {
      logout();
      setAdminUsers([]); setAdminCourses([]); setAdminAssignments([]);
      setTutorMessages([]);
      navigate("/");
    }, { confirmLabel: "Sign Out", variant: "danger" });
  };

  const handleTutorSubmit = async (e, activeSessionId = null, sessionMessages = null) => {
    e.preventDefault();
    if (!token || !tutorForm.question.trim()) return;
    const userMsg = { id: nextMsgId++, role: "user", content: tutorForm.question };
    if (sessionMessages !== null) setTutorMessages([...(sessionMessages || []), userMsg]);
    else setTutorMessages((prev) => [...prev, userMsg]);
    setTutorForm((f) => ({ ...f, question: "" }));
    setTutorLoading(true);
    try {
      const response = await apiRequest("/ai/tutor", {
        method: "POST", token,
        body: { question: userMsg.content, session_id: activeSessionId || null, module_id: tutorForm.moduleId ? Number(tutorForm.moduleId) : null, response_mode: tutorForm.responseMode || "normal" },
      });
      setTutorMessages((prev) => [...prev, { id: nextMsgId++, role: "ai", content: response.answer, context: response.context, sessionId: response.sessionId }]);
    } catch (error) {
      setTutorMessages((prev) => [...prev, { id: nextMsgId++, role: "ai", content: error.message, context: {} }]);
    } finally { setTutorLoading(false); }
  };

  const installApp = async () => { if (!promptEvent) return; await promptEvent.prompt(); setPromptEvent(null); };

  /* Loading state */
  if (token && sessionLoading && (!user || !dashboard)) {
    return (
      <div className="min-h-screen bg-danilo-bg flex items-center justify-center px-4">
        <div className="dn-card p-8 w-full max-w-xs text-center shadow-lg">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-danilo-border" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-danilo-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold text-danilo-text">Opening DANILO</p>
          <p className="text-xs text-danilo-text-muted mt-1">Restoring your session...</p>
        </div>
      </div>
    );
  }

  /* Dashboard error fallback */
  if (token && dashboardError && (!user || !dashboard)) {
    return (
      <div className="min-h-screen bg-danilo-bg flex items-center justify-center px-4">
        <div className="dn-card p-8 w-full max-w-xs text-center border-danilo-border shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-danilo-bg flex items-center justify-center mx-auto mb-4 border border-danilo-border">
            <svg className="w-5 h-5 text-danilo-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <p className="text-sm font-semibold text-danilo-text">Unable to load dashboard</p>
          <p className="text-xs text-danilo-warning mt-1.5 leading-relaxed">{dashboardError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 dn-btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  /* Login screen */
  if (!token || !dashboard || !user) {
    return <LoginView form={loginForm} onChange={handleLoginChange} onSubmit={handleLoginSubmit} loading={loading} error={loginError} />;
  }

  /* Authenticated layout */
  const { page } = route;
  const forbidden = page !== "not-found" && !isAllowed(user.role, page);

  function renderPage() {
    if (forbidden) return <ForbiddenView navigate={navigate} />;
    switch (page) {
      case "overview": return <Dashboard user={user} dashboard={dashboard} onNavigate={navigate} loading={sessionLoading && !dashboard?.courses} />;
      case "my-classes": return <MyClassesView courses={dashboard.courses} navigate={navigate} />;
      case "class-detail": return <ClassDetailView classId={route.classId} tab={route.tab} courses={dashboard.courses} dashboard={dashboard} navigate={navigate} token={token} user={user} reloadData={reloadData} />;
      case "grades": return <GradesView grades={normalizeGradeRows(dashboard.grades)} />;
      case "ai-tutor": return <TutorView token={token} modules={dashboard.contentFolders} />;
      case "users": return <AdminUsersView token={token} users={adminUsers} reload={reloadData} />;
      case "classes": return <AdminClassesView token={token} users={adminUsers} courses={adminCourses} reload={reloadData} />;
      case "sections": return <AdminSectionsView token={token} users={adminUsers} reload={reloadData} />;
      case "enrollments": return <AdminEnrollmentsView token={token} users={adminUsers} courses={adminCourses} reload={reloadData} />;
      case "departments": return <DepartmentsView token={token} reload={reloadData} />;
      case "assignments": return <AdminAssignmentsView assignments={adminAssignments} />;
      case "reports": return <ReportsView token={token} dashboard={dashboard} />;
      case "system": case "settings": return <SystemView token={token} addToast={addToast} />;
      case "announcements": return user.role === "admin" ? <AdminAnnouncementsView token={token} reload={reloadData} /> : <TeacherAnnouncementsView token={token} courses={adminCourses} reload={reloadData} />;
      case "not-found": default: return <NotFoundView navigate={navigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-danilo-bg">
      <Sidebar user={user} currentPage={page} navigate={navigate} onLogout={handleLogout} />
      <div className="md:hidden">
        <header className="fixed top-0 inset-x-0 z-40 border-b border-danilo-border bg-danilo-bg/95 backdrop-blur-md" role="banner">
          <div className="flex items-center justify-between px-2 h-[56px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-danilo-text-muted hover:bg-danilo-surface-hover transition"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-danilo-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                </div>
                <p className="text-sm font-semibold text-danilo-text tracking-tight truncate">
                  {page === "overview" ? "DANILO" : (
                    { "my-classes": "My Subjects", assignments: "Assessments", "ai-tutor": "AI Assistant",
                      grades: "Progress", users: "People", classes: "Subjects", sections: "Sections",
                      announcements: "Announcements", departments: "Departments", system: "System",
                      settings: "Settings", "class-detail": "Class", }[page] || "DANILO"
                  )}
                </p>
              </div>
            </div>
            <div
              className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-1", { admin: "bg-danilo-primary", teacher: "bg-danilo-secondary", student: "bg-danilo-border" }[user.role] || "bg-danilo-border")}
              aria-hidden="true"
            >
              <span className="text-[11px] font-bold text-white">{getInitials(user.fullName)}</span>
            </div>
          </div>
        </header>
      </div>
      <MobileDrawer open={mobileMenuOpen} user={user} currentPage={page} navigate={navigate} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} />

      <main
        className={cn(
          "main-transition",
          sidebarCollapsed ? "md:pl-[72px]" : "md:pl-[256px]"
        )}
      >
        <TopBar user={user} currentPage={page} />
        <div className="min-h-screen pt-[56px] md:pt-0 pb-[80px] md:pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
            <InstallBanner promptEvent={promptEvent} onInstall={installApp} onDismiss={() => setPromptEvent(null)} />

            {isOffline && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-danilo-error/20 bg-danilo-error-subtle px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danilo-bg flex items-center justify-center flex-shrink-0 border border-danilo-border">
                    <svg className="w-4 h-4 text-danilo-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-danilo-text">Disconnected from DANILO</p>
                    <p className="text-xs text-danilo-error mt-0.5">Please check your Wi-Fi connection.</p>
                  </div>
                </div>
              </div>
            )}

            {dashboardError && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-danilo-border bg-danilo-surface px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-danilo-bg flex items-center justify-center flex-shrink-0 mt-0.5 border border-danilo-border">
                  <svg className="w-4 h-4 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-danilo-text">Live data unavailable</p>
                  <p className="text-xs text-danilo-text-secondary mt-0.5">{dashboardError}</p>
                </div>
              </div>
            )}

            {renderPage()}
          </div>
        </div>
      </main>

      <MobileNav currentPage={page} navigate={navigate} role={user.role} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} onConfirm={() => { closeConfirm(); confirmState.onConfirm && confirmState.onConfirm(); }} onCancel={closeConfirm} confirmLabel={confirmState.confirmLabel} variant={confirmState.variant} />
    </div>
  );
}
