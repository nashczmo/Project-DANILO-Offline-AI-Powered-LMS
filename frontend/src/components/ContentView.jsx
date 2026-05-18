import { memo, useState } from "react";
import {
  Search,
  Download,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GraduationCap,
  Target,
} from "lucide-react";
import { Empty, Badge } from "./shared";
import { cn } from "../lib/utils";

const SUBJECT_COLORS = {
  English:     { bar: "bg-danilo-primary", badge: "bg-danilo-primary-subtle text-danilo-primary" },
  Mathematics: { bar: "bg-danilo-secondary", badge: "bg-danilo-secondary-subtle text-danilo-secondary" },
  Science:     { bar: "bg-danilo-success", badge: "bg-danilo-success-subtle text-danilo-success" },
  Filipino:    { bar: "bg-danilo-warning", badge: "bg-danilo-warning-subtle text-danilo-warning" },
};

function getColor(subject) {
  return SUBJECT_COLORS[subject] || {
    bar: "bg-danilo-text-muted",
    badge: "bg-danilo-bg-tertiary text-danilo-text-secondary border border-danilo-border",
  };
}

const ModuleCard = memo(function ModuleCard({ item }) {
  const [open, setOpen] = useState(false);
  const c = getColor(item.subject);

  return (
    <article className="dn-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-danilo-bg-secondary transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0 text-left">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", c.badge)}>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge tone="default">{item.subject}</Badge>
              <Badge tone="default">
                {item.quarter} · W{item.week}
              </Badge>
              {item.melcCode && (
                <span className="dn-badge bg-danilo-bg-tertiary text-danilo-text-muted border border-danilo-border font-mono">
                  {item.melcCode}
                </span>
              )}
              {item.assessmentType && (
                <Badge tone="blue">{item.assessmentType}</Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-danilo-text tracking-tight truncate">
              {item.title}
            </p>
            <p className="text-xs text-danilo-text-muted mt-0.5">
              {item.courseCode}
              {item.gradeLevel && ` · ${item.gradeLevel}`}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {open ? (
            <ChevronUp className="w-4 h-4 text-danilo-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-danilo-text-muted" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-danilo-border/40 space-y-4">
          {item.learningCompetency && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3.5 h-3.5 text-danilo-primary" />
                <span className="dn-overline">Learning Competency</span>
              </div>
              <p className="text-sm text-danilo-text-secondary leading-relaxed">
                {item.learningCompetency}
              </p>
            </div>
          )}

          {item.lessonObjectives && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-danilo-success" />
                <span className="dn-overline">Lesson Objectives</span>
              </div>
              <p className="text-sm text-danilo-text-secondary leading-relaxed whitespace-pre-line">
                {item.lessonObjectives}
              </p>
            </div>
          )}

          {item.summary && (
            <div>
              <span className="dn-overline">Summary</span>
              <p className="text-sm text-danilo-text-secondary leading-relaxed mt-1">
                {item.summary}
              </p>
            </div>
          )}

          {item.essentialQuestion && (
            <div className="bg-danilo-bg-secondary rounded-xl px-4 py-3 border border-danilo-border">
              <span className="dn-overline">Essential Question</span>
              <p className="text-sm text-danilo-text-secondary italic leading-relaxed mt-1">
                &ldquo;{item.essentialQuestion}&rdquo;
              </p>
            </div>
          )}

          {/* Files / Materials */}
          {(item.files?.length > 0 || item.pdfUrl || item.attachments?.length > 0) && (
            <div>
              <span className="dn-overline">Materials</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.pdfUrl && (
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 dn-btn-secondary dn-btn-sm"
                    aria-label={`Open PDF for ${item.title}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Open PDF
                  </a>
                )}
                {(item.files || item.attachments || []).map((f) => (
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
            </div>
          )}
        </div>
      )}
    </article>
  );
});

export default memo(function ContentView({
  items,
  modules,
  search,
  onSearchChange,
  quarter,
  onQuarterChange,
  subject,
  onSubjectChange,
  token,
  course,
  loading,
  onNavigate,
  reload,
  user,
}) {
  const data = modules ?? items ?? [];
  const isFullPage = !!course;

  const subjects = [...new Set(data.map((i) => i.subject))].sort();
  const hasFilters = Boolean(search?.trim?.() || quarter || subject);

  function clearFilters() {
    onSearchChange?.({ target: { value: "" } });
    onQuarterChange?.({ target: { value: "" } });
    onSubjectChange?.({ target: { value: "" } });
  }

  if (loading) {
    return (
      <section className="space-y-4" aria-label="Content loading">
        <div className="dn-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg dn-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-40 dn-shimmer" />
              <div className="h-2 w-24 dn-shimmer" />
            </div>
          </div>
          <div className="h-3 w-full dn-shimmer" />
          <div className="h-3 w-3/4 dn-shimmer" />
        </div>
        <div className="dn-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg dn-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-48 dn-shimmer" />
              <div className="h-2 w-20 dn-shimmer" />
            </div>
          </div>
          <div className="h-3 w-full dn-shimmer" />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Learning Materials">
      {/* Header */}
      {isFullPage && (
        <div className="dn-card p-4 mb-4">
          <h1 className="dn-heading-md">{course.title}</h1>
          <p className="dn-subtitle mt-1">
            {course.code} · {course.subject} · {course.gradeLevel}
          </p>
        </div>
      )}

      {!isFullPage && (
        <div className="mb-5">
          <h2 className="dn-title">Modules &amp; Materials</h2>
          <p className="dn-subtitle mt-0.5">
            MELC-aligned modules for offline classroom delivery.
          </p>
        </div>
      )}

      {/* Filters */}
      {onSearchChange && (
        <div className="dn-card p-4 mb-5" role="search" aria-label="Filter modules">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-danilo-text-muted pointer-events-none"
                aria-hidden="true"
              />
              <input
                value={search || ""}
                onChange={onSearchChange}
                placeholder="Search modules…"
                className="dn-input pl-10"
                aria-label="Search modules"
              />
            </div>
            <select
              value={quarter || ""}
              onChange={onQuarterChange}
              className="dn-input"
              aria-label="Filter by quarter"
            >
              <option value="">All Quarters</option>
              <option value="Q1">Quarter 1</option>
              <option value="Q2">Quarter 2</option>
              <option value="Q3">Quarter 3</option>
              <option value="Q4">Quarter 4</option>
            </select>
            <select
              value={subject || ""}
              onChange={onSubjectChange}
              className="dn-input"
              aria-label="Filter by subject"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {data.length === 0 ? (
        <Empty
          title="No modules found"
          body={
            search || quarter || subject
              ? "Try adjusting your search or filters."
              : "Your faculty has not uploaded any modules yet."
          }
          icon={<BookOpen className="w-6 h-6 text-danilo-text-muted" />}
        />
      ) : (
        <>
          <p className="text-xs text-danilo-text-muted mb-3">
            {data.length} module{data.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((item) => (
              <ModuleCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </section>
  );
});
