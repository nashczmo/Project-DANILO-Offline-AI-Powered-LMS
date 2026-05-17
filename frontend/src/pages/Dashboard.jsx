import { memo, useState } from "react";
import {
  BookOpen,
  FileText,
  Sparkles,
  Clock,
  Calendar,
  Bell,
  Zap,
  ArrowRight,
  Users,
  Award,
  Layers,
  TrendingUp,
  Brain,
  ChevronRight,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";
import { cn } from "../lib/utils";
import { SummaryCard, Badge, Empty } from "../components/shared";
import { DashboardSkeleton } from "../components/ui/Skeleton";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };

/* ── Admin: Setup Checklist ───────────────────────────────────────────────── */
function AdminSetupChecklist({ dashboard, onNavigate }) {
  const t = dashboard.totals || {};
  const steps = [
    { done: (t.sections ?? 0) > 0, label: "Create Sections", sub: "Add your school's class sections", nav: "/sections" },
    { done: (t.faculty ?? 0) > 0, label: "Add Faculty", sub: "Create faculty accounts", nav: "/users" },
    { done: (t.classes ?? 0) > 0, label: "Create Subjects", sub: "Set up subject records for each quarter", nav: "/classes" },
    { done: (t.learners ?? 0) > 0, label: "Enroll Learners", sub: "Add learner accounts", nav: "/users" },
  ];
  if (steps.every((s) => s.done)) return null;
  const done = steps.filter((s) => s.done).length;

  return (
    <div className="dn-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-danilo-primary-subtle flex items-center justify-center text-danilo-primary flex-shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-danilo-text">School Setup Checklist</p>
            <span className="text-xs text-danilo-text-muted font-medium">{done}/{steps.length}</span>
          </div>
          <p className="text-xs text-danilo-text-muted mt-0.5">Complete these steps to get DANILO ready for learners</p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-danilo-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-danilo-primary transition-all duration-500"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onNavigate(s.nav)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border",
              s.done
                ? "bg-danilo-success-subtle border-danilo-success/20 cursor-default"
                : "bg-danilo-bg border-danilo-border hover:border-danilo-primary/30 hover:bg-danilo-primary-subtle/20"
            )}
          >
            <span
              className={cn(
                "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-all",
                s.done ? "bg-danilo-success border-danilo-success text-white" : "border-danilo-border text-danilo-text-muted"
              )}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", s.done ? "text-danilo-success line-through" : "text-danilo-text")}>
                {s.label}
              </p>
              <p className="text-[11px] text-danilo-text-muted truncate">{s.sub}</p>
            </div>
            {!s.done && <ArrowRight className="w-4 h-4 text-danilo-text-muted flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Shared: Quick action pill ────────────────────────────────────────────── */
function QuickAction({ icon: Icon, label, onClick, tone = "primary" }) {
  const styles = {
    primary:   "bg-danilo-primary-subtle text-danilo-primary hover:bg-danilo-primary/20 border border-danilo-primary/10",
    secondary: "bg-danilo-secondary-subtle text-danilo-secondary hover:bg-danilo-secondary/20 border border-danilo-secondary/10",
    success:   "bg-danilo-success-subtle text-danilo-success hover:bg-danilo-success/20 border border-danilo-success/10",
    purple:    "bg-danilo-purple-subtle text-danilo-purple hover:bg-danilo-purple/20 border border-danilo-purple/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all", styles[tone] || styles.primary)}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  );
}

/* ── Admin: Summary stat cards ────────────────────────────────────────────── */
function AdminStatCards({ dashboard }) {
  const t = dashboard.totals || {};
  const cards = [
    { label: "Learners",  value: t.learners ?? 0, icon: <Users className="w-4 h-4" />,   tone: "primary" },
    { label: "Faculty",   value: t.faculty  ?? 0, icon: <Award className="w-4 h-4" />,   tone: "success" },
    { label: "Sections",  value: t.sections ?? 0, icon: <Layers className="w-4 h-4" />,  tone: "warning" },
    { label: "Subjects",  value: t.classes  ?? 0, icon: <BookOpen className="w-4 h-4" />, tone: "danger" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <SummaryCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
      ))}
    </div>
  );
}

/* ============================================================
   STUDENT DASHBOARD — AI-NATIVE REDESIGN
   ============================================================ */

/* ── Student: Hero ────────────────────────────────────────────────────────── */
function StudentHero({ user, dashboard, aiProfile, greeting, avgGrade, onNavigate }) {
  const trends    = Array.isArray(aiProfile.learningTrends) ? aiProfile.learningTrends : [];
  const firstName = (user.fullName || "").split(" ")[0] || user.fullName;

  const insightText =
    trends[0]?.message ||
    (avgGrade != null
      ? avgGrade >= 90
        ? `Your current average is ${avgGrade}%. You're doing great — keep it up!`
        : avgGrade >= 75
        ? `Your current average is ${avgGrade}%. You're on track. Let's keep improving.`
        : `Your current average is ${avgGrade}%. DANILO can help you review weak topics.`
      : "DANILO is ready to help you learn today. Ask anything.");

  return (
    <div className="relative overflow-hidden rounded-3xl border border-danilo-border bg-danilo-surface p-6 sm:p-8">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-12 w-72 h-72 rounded-full bg-danilo-primary/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-danilo-secondary/6 blur-3xl translate-y-1/3" />
        <div className="absolute top-1/2 -left-8 w-44 h-44 rounded-full bg-danilo-purple/5 blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative">
        {/* Top row: greeting + AI status pill */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-sm text-danilo-text-muted">{greeting},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-danilo-text tracking-tight mt-0.5 leading-tight">
              {firstName}.
            </h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-danilo-primary/25 bg-danilo-primary-muted px-3 py-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-danilo-primary animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-danilo-primary">AI Active</span>
          </div>
        </div>

        {/* DANILO says card */}
        <div className="mb-6 rounded-2xl border border-danilo-primary/15 bg-danilo-primary-muted px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-danilo-primary-subtle border border-danilo-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-danilo-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-danilo-primary uppercase tracking-widest mb-1.5">DANILO says</p>
              <p className="text-sm text-danilo-text-secondary leading-relaxed">{insightText}</p>
            </div>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {avgGrade != null && (
            <div className="flex items-center gap-2 rounded-xl bg-danilo-bg border border-danilo-border px-3 py-1.5">
              <TrendingUp className="w-3 h-3 text-danilo-success" />
              <span className="text-sm font-bold text-danilo-text">{avgGrade}%</span>
              <span className="text-xs text-danilo-text-muted">avg</span>
            </div>
          )}
          {(dashboard.courses?.length ?? 0) > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-danilo-bg border border-danilo-border px-3 py-1.5">
              <BookOpen className="w-3 h-3 text-danilo-primary" />
              <span className="text-sm font-bold text-danilo-text">{dashboard.courses.length}</span>
              <span className="text-xs text-danilo-text-muted">subjects</span>
            </div>
          )}
          {(aiProfile.totalInteractions ?? 0) > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-danilo-bg border border-danilo-border px-3 py-1.5">
              <MessageSquare className="w-3 h-3 text-danilo-purple" />
              <span className="text-sm font-bold text-danilo-text">{aiProfile.totalInteractions}</span>
              <span className="text-xs text-danilo-text-muted">AI chats</span>
            </div>
          )}
          {dashboard.network && (
            <div className="flex items-center gap-2 rounded-xl bg-danilo-success-subtle border border-danilo-success/20 px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-danilo-success flex-shrink-0" />
              <span className="text-xs font-medium text-danilo-success">
                {dashboard.network.ssid || "DANILO"} · offline-ready
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate("/ai-tutor")} className="dn-btn-primary dn-btn-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Ask DANILO
          </button>
          <button type="button" onClick={() => onNavigate("/my-classes")} className="dn-btn-secondary dn-btn-sm">
            <BookOpen className="w-3.5 h-3.5" />
            My Subjects
          </button>
          {avgGrade != null && (
            <button type="button" onClick={() => onNavigate("/grades")} className="dn-btn-secondary dn-btn-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              Grades
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Student: AI Quick-Ask bar ────────────────────────────────────────────── */
const QUICK_PROMPTS = [
  { label: "Explain my assignment", tone: "primary" },
  { label: "Quiz me",               tone: "secondary" },
  { label: "Generate reviewer",     tone: "success" },
  { label: "Summarize lesson",      tone: "purple" },
  { label: "Practice numeracy",     tone: "primary" },
  { label: "Translate instructions", tone: "secondary" },
];

const PROMPT_TONE_STYLES = {
  primary:   "bg-danilo-primary-subtle   text-danilo-primary   hover:bg-danilo-primary/20   border-danilo-primary/15",
  secondary: "bg-danilo-secondary-subtle text-danilo-secondary hover:bg-danilo-secondary/20 border-danilo-secondary/15",
  success:   "bg-danilo-success-subtle   text-danilo-success   hover:bg-danilo-success/20   border-danilo-success/15",
  purple:    "bg-danilo-purple-subtle    text-danilo-purple    hover:bg-danilo-purple/20    border-danilo-purple/15",
};

function AIQuickAsk({ onNavigate }) {
  const [query, setQuery] = useState("");

  function go(e) {
    e?.preventDefault();
    onNavigate("/ai-tutor");
  }

  return (
    <div className="dn-card p-5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-6 h-6 rounded-lg bg-danilo-primary-subtle flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-danilo-primary" />
        </div>
        <p className="text-sm font-semibold text-danilo-text">Ask DANILO anything</p>
        <span className="hidden sm:inline text-xs text-danilo-text-muted">· your AI learning assistant</span>
      </div>

      <form onSubmit={go} className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to learn today?"
          className="dn-input flex-1"
        />
        <button
          type="submit"
          className="dn-btn-primary flex-shrink-0 rounded-xl px-4 py-2"
          aria-label="Ask DANILO"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={go}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
              PROMPT_TONE_STYLES[p.tone] || PROMPT_TONE_STYLES.primary
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Student: AI Recommendations ─────────────────────────────────────────── */
const TYPE_STYLE = {
  weak:  { Icon: AlertCircle, color: "text-danilo-warning", bg: "bg-danilo-warning-subtle", border: "border-danilo-warning/20" },
  ai:    { Icon: Sparkles,    color: "text-danilo-primary", bg: "bg-danilo-primary-subtle", border: "border-danilo-primary/20" },
  trend: { Icon: TrendingUp,  color: "text-danilo-success", bg: "bg-danilo-success-subtle", border: "border-danilo-success/20" },
};

function AIRecommendations({ recommendations, weakConcepts, trends, onNavigate }) {
  const hasData = recommendations.length > 0 || weakConcepts.length > 0 || trends.length > 0;

  const items = [
    ...weakConcepts.slice(0, 2).map((wc, i) => ({
      key: `wc-${i}`,
      type: "weak",
      text: `Practice ${wc.topic} — you may need more review here.`,
      sub:  wc.subject || null,
    })),
    ...recommendations.slice(0, 2).map((r, i) => ({
      key: `rec-${i}`,
      type: "ai",
      text: typeof r === "string" ? r : r.text || String(r),
      sub:  null,
    })),
    ...trends.slice(0, 1).map((t, i) => ({
      key: `tr-${i}`,
      type: "trend",
      text: t.message || String(t),
      sub:  null,
    })),
  ].slice(0, 4);

  return (
    <div className="dn-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-danilo-primary" />
          <h3 className="text-sm font-semibold text-danilo-text">AI Recommendations</h3>
        </div>
        {hasData ? (
          <button
            type="button"
            onClick={() => onNavigate("/ai-tutor")}
            className="text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
          >
            Ask for more →
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {[0, 120, 240].map((d) => (
              <span
                key={d}
                className="w-1 h-1 rounded-full bg-danilo-primary animate-bounce-dot"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
            <span className="text-[11px] text-danilo-text-muted ml-1">Analyzing…</span>
          </div>
        )}
      </div>

      {hasData ? (
        <div className="space-y-3">
          {items.map((item) => {
            const style = TYPE_STYLE[item.type] || TYPE_STYLE.ai;
            const { Icon } = style;
            return (
              <div
                key={item.key}
                className={cn("flex items-start gap-3 rounded-xl border p-3.5", style.bg, style.border)}
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border", style.bg, style.border)}>
                  <Icon className={cn("w-3.5 h-3.5", style.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-danilo-text-secondary leading-relaxed">{item.text}</p>
                  {item.sub && <p className="text-xs text-danilo-text-muted mt-0.5">{item.sub}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("/ai-tutor")}
                  className="flex-shrink-0 mt-0.5 text-danilo-text-muted hover:text-danilo-text transition-colors"
                  aria-label="Open AI tutor"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="dn-shimmer h-14 w-full" />
          <div className="dn-shimmer h-14 w-11/12" />
          <div className="dn-shimmer h-14 w-10/12" />
          <p className="text-xs text-danilo-text-muted mt-3">
            DANILO is building your personalized learning profile. Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Student: Continue Learning ──────────────────────────────────────────── */
const SUBJECT_COLORS = [
  "bg-danilo-primary-subtle   border-danilo-primary/15   text-danilo-primary",
  "bg-danilo-secondary-subtle border-danilo-secondary/15 text-danilo-secondary",
  "bg-danilo-success-subtle   border-danilo-success/15   text-danilo-success",
  "bg-danilo-purple-subtle    border-danilo-purple/15    text-danilo-purple",
  "bg-danilo-warning-subtle   border-danilo-warning/15   text-danilo-warning",
];

function ContinueLearning({ courses, onNavigate }) {
  if (!courses.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-danilo-text flex items-center gap-2">
          <Play className="w-4 h-4 text-danilo-text-muted" />
          Continue Learning
        </h3>
        <button
          type="button"
          onClick={() => onNavigate("/my-classes")}
          className="text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
        >
          All subjects →
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {courses.slice(0, 4).map((course, i) => (
          <button
            key={course.id}
            type="button"
            onClick={() => onNavigate(`/class/${course.id}/stream`)}
            className="dn-card dn-card-hover p-4 text-left group"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors",
                  SUBJECT_COLORS[i % SUBJECT_COLORS.length]
                )}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-danilo-text truncate leading-snug">
                  {course.title || course.name || `Subject ${i + 1}`}
                </p>
                <p className="text-xs text-danilo-text-muted mt-0.5 truncate">
                  {[course.quarter, course.section].filter(Boolean).join(" · ") || "Tap to continue"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-danilo-text-muted flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Student: Recent Activity (compact) ──────────────────────────────────── */
function RecentActivity({ items, onNavigate }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-danilo-text flex items-center gap-2">
          <Clock className="w-4 h-4 text-danilo-text-muted" />
          Recent Activity
        </h3>
        <button
          type="button"
          onClick={() => onNavigate("/my-classes")}
          className="text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
        >
          View all →
        </button>
      </div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(`/class/${item.courseId}/stream`)}
            className="w-full dn-card dn-card-hover p-3.5 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-danilo-primary-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5 text-danilo-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-danilo-text truncate leading-snug">{item.title}</p>
                <p className="text-xs text-danilo-text-muted mt-0.5 truncate">
                  {item.courseTitle && <span className="font-medium">{item.courseTitle}</span>}
                  {item.authorName && ` · ${item.authorName}`}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Student: Learning Analytics sidebar ─────────────────────────────────── */
function LearningAnalytics({ grades, avgGrade, aiProfile, onNavigate }) {
  const strengths    = Array.isArray(aiProfile.subjectStrengths) ? aiProfile.subjectStrengths : [];
  const interactions = aiProfile.totalInteractions ?? 0;

  const gradeColor =
    avgGrade == null    ? "text-danilo-text-muted"
    : avgGrade >= 90    ? "text-danilo-success"
    : avgGrade >= 75    ? "text-danilo-primary"
    : "text-danilo-warning";

  const gradeLabel =
    avgGrade == null    ? "No grades yet"
    : avgGrade >= 90    ? "Excellent"
    : avgGrade >= 75    ? "Passing"
    : avgGrade >= 60    ? "Needs Work"
    : "At Risk";

  const strokeColor =
    avgGrade == null    ? "#334155"
    : avgGrade >= 90    ? "#22C55E"
    : avgGrade >= 75    ? "#2563EB"
    : "#F59E0B";

  /* SVG ring math: r=32, circumference ≈ 201 */
  const C = 2 * Math.PI * 32;
  const dashOffset = C - (((avgGrade ?? 0) / 100) * C);

  return (
    <div className="space-y-4">

      {/* Grade ring + subject bars */}
      <div className="dn-card p-5">
        <p className="dn-overline mb-4">Learning Progress</p>

        <div className="flex items-center gap-5 mb-5">
          {/* SVG ring */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke={strokeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 1s ease, stroke 0.3s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-lg font-bold leading-none", gradeColor)}>
                {avgGrade ?? "—"}
              </span>
              <span className="text-[9px] text-danilo-text-muted font-medium uppercase tracking-wide mt-0.5">avg</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold", gradeColor)}>{gradeLabel}</p>
            <p className="text-xs text-danilo-text-muted mt-0.5">
              Across {grades.length} subject{grades.length !== 1 ? "s" : ""}
            </p>
            {interactions > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <MessageSquare className="w-3 h-3 text-danilo-purple" />
                <span className="text-xs text-danilo-text-muted">{interactions} AI chats</span>
              </div>
            )}
          </div>
        </div>

        {/* Per-subject grade bars */}
        {grades.length > 0 ? (
          <div className="space-y-3">
            {grades.slice(0, 5).map((g, i) => {
              const grade = g.finalGrade ?? g.grade ?? 0;
              const pct   = Math.min(100, Math.max(0, grade));
              const bar   = pct >= 90 ? "bg-danilo-success" : pct >= 75 ? "bg-danilo-primary" : "bg-danilo-warning";
              const label = g.subject || g.courseTitle || g.title || `Subject ${i + 1}`;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-danilo-text-secondary truncate max-w-[130px]" title={label}>
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-danilo-text ml-2 flex-shrink-0">{grade}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-danilo-bg overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", bar)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-danilo-text-muted text-center py-4">
            Grades will appear here once your teacher submits them.
          </p>
        )}
      </div>

      {/* Subject strengths */}
      {strengths.length > 0 && (
        <div className="dn-card p-5">
          <p className="dn-overline mb-3">Subject Strengths</p>
          <div className="space-y-2">
            {strengths.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-danilo-success flex-shrink-0" />
                <span className="text-xs text-danilo-text-secondary">
                  {typeof s === "string" ? s : s.subject || s.name || String(s)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="dn-card p-4">
        <p className="dn-overline mb-3">Quick Links</p>
        <div className="space-y-0.5">
          {[
            { label: "View all grades",  nav: "/grades",      Icon: TrendingUp },
            { label: "My subjects",      nav: "/my-classes",  Icon: BookOpen   },
            { label: "Assignments",      nav: "/assignments", Icon: FileText   },
          ].map(({ label, nav, Icon }) => (
            <button
              key={nav}
              type="button"
              onClick={() => onNavigate(nav)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-danilo-text-secondary hover:bg-danilo-surface-hover hover:text-danilo-text transition-all text-left"
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0 text-danilo-text-muted" />
              {label}
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-danilo-text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Student: Full assembled dashboard ───────────────────────────────────── */
function StudentDashboard({ user, dashboard, onNavigate }) {
  const aiProfile        = dashboard.aiProfile || {};
  const aiTrends         = Array.isArray(aiProfile.learningTrends)  ? aiProfile.learningTrends  : [];
  const aiWeakConcepts   = Array.isArray(aiProfile.weakConcepts)    ? aiProfile.weakConcepts    : [];
  const aiRecommendations = Array.isArray(aiProfile.recommendations) ? aiProfile.recommendations : [];
  const courses          = Array.isArray(dashboard.courses)         ? dashboard.courses         : [];
  const streamItems      = Array.isArray(dashboard.stream)          ? dashboard.stream          : [];
  const gradeData        = Array.isArray(dashboard.grades)          ? dashboard.grades          : [];

  const hour     = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const avgGrade =
    gradeData.length > 0
      ? Math.round(gradeData.reduce((s, g) => s + (g.finalGrade ?? g.grade ?? 0), 0) / gradeData.length)
      : null;

  return (
    <section className="space-y-5 animate-fade-in">
      <StudentHero
        user={user} dashboard={dashboard} aiProfile={aiProfile}
        greeting={greeting} avgGrade={avgGrade} onNavigate={onNavigate}
      />

      <AIQuickAsk onNavigate={onNavigate} />

      <div className="grid gap-5 lg:grid-cols-[1fr_288px] xl:grid-cols-[1fr_304px]">
        {/* Left column: recommendations → subjects → activity */}
        <div className="space-y-5 min-w-0">
          <AIRecommendations
            recommendations={aiRecommendations}
            weakConcepts={aiWeakConcepts}
            trends={aiTrends}
            onNavigate={onNavigate}
          />
          <ContinueLearning courses={courses} onNavigate={onNavigate} />
          {streamItems.length > 0 && <RecentActivity items={streamItems} onNavigate={onNavigate} />}
        </div>

        {/* Right column: analytics sidebar */}
        <div className="space-y-5">
          <LearningAnalytics
            grades={gradeData} avgGrade={avgGrade}
            aiProfile={aiProfile} onNavigate={onNavigate}
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN DASHBOARD EXPORT — routes by role
   ============================================================ */
export default memo(function Dashboard({ user, dashboard, onNavigate, loading }) {
  if (loading) return <DashboardSkeleton />;

  /* Students get the fully redesigned AI-native experience */
  if (user.role === "student") {
    return <StudentDashboard user={user} dashboard={dashboard} onNavigate={onNavigate} />;
  }

  /* ── Admin / Teacher: unchanged layout ─────────────────────────────────── */
  const courseCount  = Array.isArray(dashboard.courses)               ? dashboard.courses.length               : 0;
  const lessonCount  = Array.isArray(dashboard.contentFolders)        ? dashboard.contentFolders.length        : 0;
  const streamItems  = Array.isArray(dashboard.stream)                ? dashboard.stream                       : [];
  const gradeData    = Array.isArray(dashboard.grades)                ? dashboard.grades                       : [];
  const highlights   = Array.isArray(dashboard.operationsHighlights)  ? dashboard.operationsHighlights         : [];

  const hour     = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isAdmin   = user.role === "admin";
  const isTeacher = user.role === "teacher";

  return (
    <section className="space-y-5 animate-fade-in">

      {/* Welcome card */}
      <div className="dn-card p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-danilo-primary/4 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-danilo-secondary/3 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-sm text-danilo-text-secondary">{greeting},</p>
              <h2 className="text-xl sm:text-2xl font-bold text-danilo-text tracking-tight mt-0.5 leading-tight truncate">
                {user.fullName}
              </h2>
            </div>
            <Badge tone="blue">{ROLE_LABEL[user.role] || user.role}</Badge>
          </div>

          {/* Network pill */}
          {dashboard.network && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-danilo-success-subtle border border-danilo-success/20 text-danilo-success text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-danilo-success" />
                {dashboard.network.ssid || "DANILO"}
              </div>
              <span className="text-xs text-danilo-text-muted">{dashboard.network.mode || "offline-first"}</span>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {isTeacher && (
              <QuickAction icon={Sparkles} label="Ask AI" onClick={() => onNavigate("/ai-tutor")} tone="primary" />
            )}
            <QuickAction icon={BookOpen} label="My Subjects" onClick={() => onNavigate("/my-classes")} tone="secondary" />
            {(isAdmin || isTeacher) && (
              <QuickAction icon={FileText} label="Assessments" onClick={() => onNavigate("/assignments")} tone="success" />
            )}
            {isAdmin && (
              <QuickAction icon={Users} label="Manage Users" onClick={() => onNavigate("/users")} tone="purple" />
            )}
          </div>
        </div>
      </div>

      {/* Admin setup checklist */}
      {isAdmin && <AdminSetupChecklist dashboard={dashboard} onNavigate={onNavigate} />}

      {/* Admin stats */}
      {isAdmin && dashboard.totals && <AdminStatCards dashboard={dashboard} />}

      {/* Non-admin stats */}
      {!isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard label="Subjects" value={courseCount} icon={<BookOpen className="w-4 h-4" />} tone="primary" />
          <SummaryCard label="Modules"  value={lessonCount} icon={<FileText className="w-4 h-4" />} tone="success" />
        </div>
      )}

      {/* AI ops highlights (teacher/admin) */}
      {highlights.length > 0 && (
        <div className="dn-card p-4 border-l-4 border-danilo-primary">
          <p className="text-xs font-semibold text-danilo-text-muted uppercase tracking-wider mb-2">System Highlights</p>
          <ul className="space-y-1">
            {highlights.slice(0, 3).map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-danilo-text-secondary">
                <span className="w-1 h-1 rounded-full bg-danilo-primary mt-1.5 flex-shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-danilo-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-danilo-text-muted" />
            Recent Activity
          </h3>
          {streamItems.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("/my-classes")}
              className="text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
            >
              View all →
            </button>
          )}
        </div>
        {streamItems.length === 0 ? (
          <Empty
            title="No recent activity"
            body="Posts and updates from your subjects will appear here."
            icon={<Calendar className="w-6 h-6 text-danilo-text-muted" />}
          />
        ) : (
          <div className="space-y-2">
            {streamItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(`/class/${item.courseId}/stream`)}
                className="w-full dn-card dn-card-hover p-3.5 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danilo-primary-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5 text-danilo-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-danilo-text truncate leading-snug">{item.title}</p>
                    <p className="text-xs text-danilo-text-muted mt-0.5 truncate">
                      {item.courseTitle && <span className="font-medium">{item.courseTitle}</span>}
                      {item.authorName && ` · ${item.authorName}`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming + Announcements */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="dn-card p-4">
          <h3 className="text-sm font-semibold text-danilo-text mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-danilo-text-muted" />
            Upcoming
          </h3>
          <Empty
            title="No upcoming tasks"
            body="Assignments and quizzes with due dates will appear here."
            icon={<Calendar className="w-5 h-5 text-danilo-text-muted" />}
          />
        </div>
        <div className="dn-card p-4">
          <h3 className="text-sm font-semibold text-danilo-text mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-danilo-text-muted" />
            Announcements
          </h3>
          <Empty
            title="No announcements"
            body="School-wide announcements will appear here."
            icon={<Bell className="w-5 h-5 text-danilo-text-muted" />}
          />
        </div>
      </div>
    </section>
  );
});
