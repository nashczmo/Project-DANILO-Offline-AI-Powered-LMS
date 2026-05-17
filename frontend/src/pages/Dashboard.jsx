import { memo } from "react";
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
} from "lucide-react";
import { cn } from "../lib/utils";
import { SummaryCard, Badge, Empty } from "../components/shared";
import { DashboardSkeleton } from "../components/ui/Skeleton";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };

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

function QuickAction({ icon: Icon, label, onClick, tone = "primary" }) {
  const styles = {
    primary: "bg-danilo-primary-subtle text-danilo-primary hover:bg-danilo-primary/20 border border-danilo-primary/10",
    secondary: "bg-danilo-secondary-subtle text-danilo-secondary hover:bg-danilo-secondary/20 border border-danilo-secondary/10",
    success: "bg-danilo-success-subtle text-danilo-success hover:bg-danilo-success/20 border border-danilo-success/10",
    purple: "bg-danilo-purple-subtle text-danilo-purple hover:bg-danilo-purple/20 border border-danilo-purple/10",
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

function AdminStatCards({ dashboard }) {
  const t = dashboard.totals || {};
  const cards = [
    { label: "Learners", value: t.learners ?? 0, icon: <Users className="w-4 h-4" />, tone: "primary" },
    { label: "Faculty", value: t.faculty ?? 0, icon: <Award className="w-4 h-4" />, tone: "success" },
    { label: "Sections", value: t.sections ?? 0, icon: <Layers className="w-4 h-4" />, tone: "warning" },
    { label: "Subjects", value: t.classes ?? 0, icon: <BookOpen className="w-4 h-4" />, tone: "danger" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <SummaryCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
      ))}
    </div>
  );
}

export default memo(function Dashboard({ user, dashboard, onNavigate, loading }) {
  if (loading) return <DashboardSkeleton />;

  const courseCount = Array.isArray(dashboard.courses) ? dashboard.courses.length : 0;
  const lessonCount = Array.isArray(dashboard.contentFolders) ? dashboard.contentFolders.length : 0;
  const streamItems = Array.isArray(dashboard.stream) ? dashboard.stream : [];
  const gradeData = Array.isArray(dashboard.grades) ? dashboard.grades : [];
  const highlights = Array.isArray(dashboard.operationsHighlights) ? dashboard.operationsHighlights : [];
  const aiProfile = dashboard.aiProfile || {};
  const aiTrends = Array.isArray(aiProfile.learningTrends) ? aiProfile.learningTrends : [];
  const aiWeakConcepts = Array.isArray(aiProfile.weakConcepts) ? aiProfile.weakConcepts : [];
  const aiRecommendations = Array.isArray(aiProfile.recommendations) ? aiProfile.recommendations : [];

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isAdmin = user.role === "admin";
  const isTeacher = user.role === "teacher";
  const isStudent = user.role === "student";

  /* Compute student average grade for the stat badge */
  const avgGrade = gradeData.length > 0
    ? Math.round(gradeData.reduce((sum, g) => sum + (g.finalGrade ?? g.grade ?? 0), 0) / gradeData.length)
    : null;

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
            {(isStudent || isTeacher) && (
              <QuickAction icon={Sparkles} label="Ask AI" onClick={() => onNavigate("/ai-tutor")} tone="primary" />
            )}
            <QuickAction icon={BookOpen} label="My Subjects" onClick={() => onNavigate("/my-classes")} tone="secondary" />
            {(isAdmin || isTeacher) && (
              <QuickAction icon={FileText} label="Assessments" onClick={() => onNavigate("/assignments")} tone="success" />
            )}
            {isStudent && avgGrade != null && (
              <QuickAction icon={TrendingUp} label={`Avg: ${avgGrade}%`} onClick={() => onNavigate("/grades")} tone="purple" />
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
          <SummaryCard label="Modules" value={lessonCount} icon={<FileText className="w-4 h-4" />} tone="success" />
          {isStudent && avgGrade != null && (
            <SummaryCard label="Average" value={`${avgGrade}%`} icon={<TrendingUp className="w-4 h-4" />} tone="warning" />
          )}
        </div>
      )}

      {/* Student AI learning profile */}
      {isStudent && (
        <div className="dn-card p-4 border-l-4 border-danilo-primary">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-danilo-text-muted uppercase tracking-wider">DANILO Learning Profile</p>
              <h3 className="text-sm font-semibold text-danilo-text mt-1">Personalized next step</h3>
            </div>
            <Sparkles className="w-4 h-4 text-danilo-primary flex-shrink-0" />
          </div>
          <div className="space-y-2 text-sm text-danilo-text-secondary">
            {aiTrends[0]?.message && <p>{aiTrends[0].message}</p>}
            {aiWeakConcepts[0]?.topic && <p>You may need more practice with {aiWeakConcepts[0].topic}.</p>}
            <p>{aiRecommendations[0] || "Ask DANILO for a worked example from today's lesson."}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/ai-tutor")}
            className="mt-3 text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
          >
            Ask DANILO for help →
          </button>
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
