import { memo, useState } from "react";
import {
  Megaphone,
  FileText,
  Bell,
  ExternalLink,
  Send,
  Users,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Heart,
  FileUp,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api";
import { Empty, Badge, Field } from "./shared";
import { cn, getInitials, formatDateTime } from "../lib/utils";

/* =======================================================================
   Types & helpers
   ======================================================================= */

const TYPE_CONFIG = {
  announcement: {
    icon: Megaphone,
    badgeTone: "blue",
    tone: "text-danilo-primary bg-danilo-primary-subtle border border-danilo-primary/10",
  },
  assignment: {
    icon: FileText,
    badgeTone: "default",
    tone: "text-danilo-text-secondary bg-danilo-bg-secondary border border-danilo-border",
  },
  reminder: {
    icon: Bell,
    badgeTone: "default",
    tone: "text-danilo-text-muted bg-danilo-bg border border-danilo-border",
  },
};

function getStreamItems(input) {
  if (Array.isArray(input)) return input;
  return [];
}

function avatarFallback(name) {
  const initials = getInitials(name);
  return (
    <div className="w-9 h-9 rounded-full bg-danilo-primary-subtle text-danilo-primary flex items-center justify-center text-xs font-bold border border-danilo-primary/10 flex-shrink-0">
      {initials}
    </div>
  );
}

/* =======================================================================
   Sub-components
   ======================================================================= */

const StreamItemCard = memo(function StreamItemCard({ item }) {
  const cfg = TYPE_CONFIG[item.postType] || TYPE_CONFIG.reminder;
  const Icon = cfg.icon;
  const time = formatDateTime(item.createdAt);

  return (
    <article className="dn-card p-4 dn-card-hover">
      <div className="flex items-start gap-3">
        {item.authorAvatar ? (
          <img
            src={item.authorAvatar}
            alt={item.authorName || "Author"}
            className="w-9 h-9 rounded-full object-cover border border-danilo-border flex-shrink-0"
          />
        ) : (
          avatarFallback(item.authorName)
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-danilo-text">
              {item.authorName || "Faculty"}
            </span>
            {time && (
              <time dateTime={item.createdAt} className="text-xs text-danilo-text-muted">
                {time}
              </time>
            )}
          </div>
          <p className="text-sm font-medium text-danilo-text leading-snug">{item.title}</p>
          {item.body && (
            <p className="text-sm text-danilo-text-secondary mt-1.5 leading-relaxed whitespace-pre-wrap">
              {item.body}
            </p>
          )}
          {item.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.attachments.map((a) => (
                <a
                  key={a.url || a.name}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-danilo-border bg-danilo-bg-secondary px-2.5 py-1.5 text-xs font-medium text-danilo-text-secondary hover:bg-danilo-bg-tertiary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-danilo-text-muted flex-shrink-0" />
                  {a.name || "Attachment"}
                </a>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4">
            <button className="inline-flex items-center gap-1 text-xs text-danilo-text-muted hover:text-danilo-primary transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {item.commentCount ?? 0}
            </button>
            <button className="inline-flex items-center gap-1 text-xs text-danilo-text-muted hover:text-danilo-error transition-colors">
              <Heart className="w-3.5 h-3.5" />
              {item.likeCount ?? 0}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

function AnnouncementComposer({ token, course, reload }) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || !course?.id) return;
    setSaving(true);
    try {
      await apiRequest("/teacher/announcements", {
        method: "POST",
        token,
        body: { courseId: course.id, title: "Announcement", body: body.trim() },
      });
      setBody("");
      reload?.();
    } catch (_) {
      /* fail silently or rely on caller */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dn-card p-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Post an announcement">
          <textarea
            className="dn-textarea"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share something with your class..."
          />
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-xs text-danilo-text-muted">
            This will be visible to all enrolled learners.
          </span>
          <button
            type="submit"
            disabled={saving || !body.trim()}
            className="dn-btn-primary dn-btn-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ClassworkPanel({ modules, assignments, quizzes }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});

  const counts = {
    all: (modules?.length || 0) + (assignments?.length || 0) + (quizzes?.length || 0),
    assignments: assignments?.length || 0,
    quizzes: quizzes?.length || 0,
    modules: modules?.length || 0,
  };

  function toggle(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "assignments", label: "Assignments" },
    { key: "quizzes", label: "Quizzes" },
    { key: "modules", label: "Modules" },
  ];

  const showAssignments = filter === "all" || filter === "assignments";
  const showQuizzes = filter === "all" || filter === "quizzes";
  const showModules = filter === "all" || filter === "modules";

  const hasItems = counts.all > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-danilo-text-muted" />
        <div className="dn-tabs">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn("dn-tab", filter === f.key && "active")}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className="ml-1.5 text-[10px] text-danilo-text-muted">
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!hasItems && (
        <Empty
          title="No classwork yet"
          body="Assignments, quizzes, and modules will appear here."
          icon={<BookOpen className="w-6 h-6 text-danilo-text-muted" />}
        />
      )}

      {showAssignments &&
        assignments?.map((a) => (
          <div key={a.id} className="dn-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center flex-shrink-0 border border-danilo-warning/10">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-danilo-text truncate">{a.title}</p>
                  <p className="text-xs text-danilo-text-secondary mt-0.5 line-clamp-2">{a.instructions}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge tone={a.submission?.status === "submitted" ? "green" : "yellow"}>
                      {a.submission?.status?.replace("_", " ") || "Pending"}
                    </Badge>
                    <span className="text-xs text-danilo-text-muted">{a.points ?? "—"} pts</span>
                    {a.dueDate && (
                      <span className="text-xs text-danilo-text-muted">
                        Due {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

      {showQuizzes &&
        quizzes?.map((q) => (
          <div key={q.id} className="dn-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-danilo-purple-subtle text-danilo-purple flex items-center justify-center flex-shrink-0 border border-danilo-purple/10">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-danilo-text truncate">{q.title}</p>
                  <p className="text-xs text-danilo-text-secondary mt-0.5 line-clamp-2">{q.instructions}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge tone={q.attempt ? "green" : "yellow"}>
                      {q.attempt ? "Submitted" : "Pending"}
                    </Badge>
                    <span className="text-xs text-danilo-text-muted">
                      {q.questions?.length ?? 0} question{q.questions?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

      {showModules &&
        modules?.map((m) => {
          const isOpen = !!expanded[m.id];
          return (
            <div key={m.id} className="dn-card overflow-hidden">
              <button
                onClick={() => toggle(m.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-danilo-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-danilo-success-subtle text-danilo-success flex items-center justify-center flex-shrink-0 border border-danilo-success/10">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-danilo-text truncate">{m.title}</p>
                    <p className="text-xs text-danilo-text-muted mt-0.5">
                      {m.quarter} · Week {m.week} {m.melcCode ? `· ${m.melcCode}` : ""}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-danilo-text-muted flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-danilo-text-muted flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-danilo-border/40">
                  {m.learningCompetency && (
                    <p className="text-sm text-danilo-text-secondary mt-3">{m.learningCompetency}</p>
                  )}
                  {m.summary && (
                    <p className="text-sm text-danilo-text-secondary mt-2 leading-relaxed">{m.summary}</p>
                  )}
                  {m.files?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.files.map((f) => (
                        <a
                          key={f.url || f.name}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-danilo-border bg-danilo-bg-secondary px-2.5 py-1.5 text-xs font-medium text-danilo-text-secondary hover:bg-danilo-bg-tertiary transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-danilo-text-muted" />
                          {f.name || "File"}
                        </a>
                      ))}
                    </div>
                  )}
                  {m.pdfUrl && (
                    <a
                      href={m.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 dn-btn-secondary dn-btn-sm mt-3"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      Open PDF
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

function PeoplePanel({ people }) {
  const teacher = people?.teacher;
  const students = people?.students || [];

  return (
    <div className="space-y-4">
      {teacher && (
        <div className="dn-card p-4">
          <p className="dn-overline mb-2">Faculty</p>
          <div className="flex items-center gap-3">
            {teacher.avatar ? (
              <img
                src={teacher.avatar}
                alt={teacher.fullName}
                className="w-10 h-10 rounded-full object-cover border border-danilo-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-danilo-primary-subtle text-danilo-primary flex items-center justify-center text-sm font-bold border border-danilo-primary/10">
                {getInitials(teacher.fullName)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-danilo-text">{teacher.fullName}</p>
              <p className="text-xs text-danilo-text-muted">Teacher</p>
            </div>
          </div>
        </div>
      )}

      <div className="dn-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="dn-overline">Learners</p>
          <Badge tone="default">{students.length} enrolled</Badge>
        </div>
        {students.length === 0 ? (
          <Empty
            title="No learners"
            body="Learners will appear after enrollment."
            icon={<Users className="w-6 h-6 text-danilo-text-muted" />}
          />
        ) : (
          <div className="divide-y divide-danilo-border/30 rounded-xl border border-danilo-border overflow-hidden">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-danilo-bg-secondary transition-colors">
                {s.avatar ? (
                  <img
                    src={s.avatar}
                    alt={s.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-danilo-border flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-danilo-bg-tertiary text-danilo-text-secondary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {getInitials(s.fullName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-danilo-text truncate">{s.fullName}</p>
                  <p className="text-xs text-danilo-text-muted">{s.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherQuickTools({ token, course, reload }) {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState("module");

  const [moduleForm, setModuleForm] = useState({
    title: "",
    melcCode: "",
    learningCompetency: "",
    lessonObjectives: "",
    assessmentType: "",
    quarter: course?.quarter || "Q1",
    week: 1,
    summary: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    instructions: "",
    points: 100,
  });

  const [quizForm, setQuizForm] = useState({
    title: "",
    instructions: "",
    questionText: "",
    choicesText: "",
    answerKey: "",
    points: 1,
    isPublished: true,
  });

  const [uploadState, setUploadState] = useState({ file: null, saving: false, error: "", success: "" });

  async function createModule(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/modules`, {
      method: "POST",
      token,
      body: moduleForm,
    });
    setModuleForm({
      title: "",
      melcCode: "",
      learningCompetency: "",
      lessonObjectives: "",
      assessmentType: "",
      quarter: course?.quarter || "Q1",
      week: 1,
      summary: "",
    });
    reload?.();
  }

  async function createAssignment(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/assignments`, {
      method: "POST",
      token,
      body: assignmentForm,
    });
    setAssignmentForm({ title: "", instructions: "", points: 100 });
    reload?.();
  }

  async function createQuiz(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/quizzes`, {
      method: "POST",
      token,
      body: {
        title: quizForm.title,
        instructions: quizForm.instructions,
        isPublished: quizForm.isPublished,
        questions: [
          {
            questionText: quizForm.questionText,
            choicesJson: JSON.stringify(
              quizForm.choicesText
                .split(/\r?\n/)
                .map((x) => x.trim())
                .filter(Boolean)
            ),
            answerKey: quizForm.answerKey,
            points: quizForm.points,
          },
        ],
      },
    });
    setQuizForm({
      title: "",
      instructions: "",
      questionText: "",
      choicesText: "",
      answerKey: "",
      points: 1,
      isPublished: true,
    });
    reload?.();
  }

  async function generateLesson(e) {
    e.preventDefault();
    if (!uploadState.file) return;
    const formData = new FormData();
    formData.append("material", uploadState.file);
    setUploadState((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      await fetch(`/api/teacher/courses/${course.id}/generate-lesson`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      setUploadState((prev) => ({ ...prev, success: "Lesson generated successfully.", file: null }));
      reload?.();
    } catch (_) {
      setUploadState((prev) => ({ ...prev, error: "Generation failed. Please try again." }));
    } finally {
      setUploadState((prev) => ({ ...prev, saving: false }));
    }
  }

  return (
    <div className="dn-card p-4 mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-danilo-primary" />
          <span className="text-sm font-semibold text-danilo-text">Teacher Quick Tools</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-danilo-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-danilo-text-muted" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-danilo-border/40 pt-4">
          <div className="flex flex-wrap gap-1">
            {[
              { key: "module", label: "Module" },
              { key: "assignment", label: "Assignment" },
              { key: "quiz", label: "Quiz" },
              { key: "upload", label: "AI Lesson" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveForm(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  activeForm === t.key
                    ? "bg-danilo-primary text-white"
                    : "bg-danilo-bg-tertiary text-danilo-text-secondary hover:text-danilo-text"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeForm === "module" && (
            <form onSubmit={createModule} className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <input className="dn-input" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required />
              </Field>
              <Field label="MELC Code">
                <input className="dn-input" value={moduleForm.melcCode} onChange={(e) => setModuleForm({ ...moduleForm, melcCode: e.target.value })} />
              </Field>
              <Field label="Quarter">
                <select className="dn-input" value={moduleForm.quarter} onChange={(e) => setModuleForm({ ...moduleForm, quarter: e.target.value })}>
                  <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                </select>
              </Field>
              <Field label="Week">
                <input type="number" min={1} max={10} className="dn-input" value={moduleForm.week} onChange={(e) => setModuleForm({ ...moduleForm, week: Number(e.target.value) })} />
              </Field>
              <Field label="Learning Competency" className="sm:col-span-2">
                <input className="dn-input" value={moduleForm.learningCompetency} onChange={(e) => setModuleForm({ ...moduleForm, learningCompetency: e.target.value })} />
              </Field>
              <Field label="Lesson Objectives" className="sm:col-span-2">
                <textarea className="dn-textarea" rows={3} value={moduleForm.lessonObjectives} onChange={(e) => setModuleForm({ ...moduleForm, lessonObjectives: e.target.value })} />
              </Field>
              <Field label="Assessment Type">
                <input className="dn-input" value={moduleForm.assessmentType} onChange={(e) => setModuleForm({ ...moduleForm, assessmentType: e.target.value })} />
              </Field>
              <Field label="Summary" className="sm:col-span-2">
                <textarea className="dn-textarea" rows={3} value={moduleForm.summary} onChange={(e) => setModuleForm({ ...moduleForm, summary: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <button className="dn-btn-primary dn-btn-sm">Create Module</button>
              </div>
            </form>
          )}

          {activeForm === "assignment" && (
            <form onSubmit={createAssignment} className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <input className="dn-input" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required />
              </Field>
              <Field label="Points">
                <input type="number" min={1} className="dn-input" value={assignmentForm.points} onChange={(e) => setAssignmentForm({ ...assignmentForm, points: Number(e.target.value) })} />
              </Field>
              <Field label="Instructions" className="sm:col-span-2">
                <textarea className="dn-textarea" rows={3} value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <button className="dn-btn-primary dn-btn-sm">Create Assignment</button>
              </div>
            </form>
          )}

          {activeForm === "quiz" && (
            <form onSubmit={createQuiz} className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <input className="dn-input" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required />
              </Field>
              <Field label="Points">
                <input type="number" min={1} className="dn-input" value={quizForm.points} onChange={(e) => setQuizForm({ ...quizForm, points: Number(e.target.value) })} />
              </Field>
              <Field label="Instructions" className="sm:col-span-2">
                <textarea className="dn-textarea" rows={2} value={quizForm.instructions} onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })} />
              </Field>
              <Field label="Question" className="sm:col-span-2">
                <input className="dn-input" value={quizForm.questionText} onChange={(e) => setQuizForm({ ...quizForm, questionText: e.target.value })} required />
              </Field>
              <Field label="Choices (one per line)" className="sm:col-span-2">
                <textarea className="dn-textarea" rows={3} value={quizForm.choicesText} onChange={(e) => setQuizForm({ ...quizForm, choicesText: e.target.value })} placeholder="A. Option 1&#10;B. Option 2" required />
              </Field>
              <Field label="Answer Key">
                <input className="dn-input" value={quizForm.answerKey} onChange={(e) => setQuizForm({ ...quizForm, answerKey: e.target.value })} required />
              </Field>
              <Field label="Published">
                <select className="dn-input" value={quizForm.isPublished ? "true" : "false"} onChange={(e) => setQuizForm({ ...quizForm, isPublished: e.target.value === "true" })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <button className="dn-btn-primary dn-btn-sm">Create Quiz</button>
              </div>
            </form>
          )}

          {activeForm === "upload" && (
            <form onSubmit={generateLesson} className="space-y-3">
              <Field label="Upload Material for AI Lesson Generation">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="dn-input py-2"
                  onChange={(e) => setUploadState((prev) => ({ ...prev, file: e.target.files[0], error: "", success: "" }))}
                />
              </Field>
              {uploadState.error && <p className="text-sm text-danilo-error">{uploadState.error}</p>}
              {uploadState.success && <p className="text-sm text-danilo-success">{uploadState.success}</p>}
              <button disabled={!uploadState.file || uploadState.saving} className="dn-btn-primary dn-btn-sm">
                {uploadState.saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Lesson
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/* =======================================================================
   Main component
   ======================================================================= */

export default memo(function StreamView({
  items,
  stream,
  token,
  course,
  people,
  loading,
  onNavigate,
  reload,
  user,
  tab = "stream",
  modules,
  assignments,
  quizzes,
  grades,
}) {
  const streamItems = getStreamItems(stream ?? items);
  const isTeacher = user?.role === "teacher";
  const showFullPage = !!course;

  const TABS = [
    { id: "stream", label: "Stream" },
    { id: "classwork", label: "Classwork" },
    { id: "people", label: "People" },
    { id: "grades", label: "Grades" },
    ...(isTeacher ? [{ id: "insights", label: "Insights" }] : []),
  ];

  if (loading) {
    return (
      <section className="space-y-3" aria-label="Activity stream loading">
        <div className="dn-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full dn-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 dn-shimmer" />
              <div className="h-2 w-20 dn-shimmer" />
            </div>
          </div>
          <div className="h-3 w-full dn-shimmer" />
          <div className="h-3 w-2/3 dn-shimmer" />
        </div>
        <div className="dn-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full dn-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 dn-shimmer" />
              <div className="h-2 w-20 dn-shimmer" />
            </div>
          </div>
          <div className="h-3 w-full dn-shimmer" />
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------------
     Compact mode (backward compat with App.jsx class-detail stream tab)
     ------------------------------------------------------------------ */
  if (!showFullPage) {
    if (!streamItems || streamItems.length === 0) {
      return (
        <Empty
          title="No activity"
          body="Posts and announcements from faculty will appear here."
          icon={<Bell className="w-6 h-6 text-danilo-text-muted" />}
        />
      );
    }
    return (
      <section className="space-y-3" aria-label="Activity stream">
        {isTeacher && token && course && (
          <AnnouncementComposer token={token} course={course} reload={reload} />
        )}
        {streamItems.map((item) => (
          <StreamItemCard key={item.id} item={item} />
        ))}
      </section>
    );
  }

  /* ------------------------------------------------------------------
     Full page mode
     ------------------------------------------------------------------ */
  return (
    <section aria-label="Class stream">
      {/* Header */}
      <div className="dn-card p-4 mb-4">
        <h1 className="dn-heading-md">{course.title}</h1>
        <p className="dn-subtitle mt-1">
          {course.code} · {course.subject} · {course.gradeLevel}
          {course.teacherName && ` · ${course.teacherName}`}
        </p>
      </div>

      {/* Tabs */}
      {onNavigate ? (
        <div className="mb-4 overflow-x-auto rounded-xl border border-danilo-border bg-danilo-bg-tertiary p-1">
          <div className="flex min-w-max gap-1 sm:min-w-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => onNavigate(`/class/${course.id}/${t.id}`)}
                className={cn(
                  "min-h-[40px] min-w-[96px] flex-1 rounded-xl px-4 text-center text-sm font-medium transition-all active:scale-[0.98]",
                  tab === t.id
                    ? "bg-white text-danilo-text shadow-sm border border-danilo-border"
                    : "text-danilo-text-muted hover:text-danilo-text-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          {TABS.map((t) => (
            <span
              key={t.id}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium",
                tab === t.id
                  ? "bg-danilo-primary text-white"
                  : "bg-danilo-bg-tertiary text-danilo-text-muted"
              )}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* Teacher quick tools */}
      {isTeacher && token && <TeacherQuickTools token={token} course={course} reload={reload} />}

      {/* Tab content */}
      {tab === "stream" && (
        <div className="space-y-3">
          {isTeacher && token && <AnnouncementComposer token={token} course={course} reload={reload} />}
          {!streamItems || streamItems.length === 0 ? (
            <Empty
              title="No activity"
              body="Posts and announcements from faculty will appear here."
              icon={<Bell className="w-6 h-6 text-danilo-text-muted" />}
            />
          ) : (
            streamItems.map((item) => <StreamItemCard key={item.id} item={item} />)
          )}
        </div>
      )}

      {tab === "classwork" && (
        <ClassworkPanel modules={modules} assignments={assignments} quizzes={quizzes} />
      )}

      {tab === "people" && <PeoplePanel people={people} />}

      {tab === "grades" && (
        <div className="space-y-4">
          {!grades || grades.length === 0 ? (
            <Empty
              title="No grades yet"
              body="Grades will appear after faculty records scores."
              icon={<ClipboardList className="w-6 h-6 text-danilo-text-muted" />}
            />
          ) : (
            grades.map((g) => (
              <div key={`${g.courseId}-${g.quarter}`} className="dn-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-danilo-text">{g.courseTitle}</p>
                    <p className="text-xs text-danilo-text-muted">{g.subject} · Q{g.quarter}</p>
                  </div>
                  <Badge tone={g.finalGrade >= 75 ? "green" : "red"}>{g.finalGrade}</Badge>
                </div>
                <div className="mt-3 dn-progress">
                  <div
                    className={cn(
                      "dn-progress-bar",
                      g.finalGrade >= 75 ? "bg-danilo-success" : "bg-danilo-error"
                    )}
                    style={{ width: `${Math.min(100, g.finalGrade)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "insights" && isTeacher && (
        <Empty
          title="Insights"
          body="Class insights will appear here."
          icon={<Sparkles className="w-6 h-6 text-danilo-text-muted" />}
        />
      )}
    </section>
  );
});
