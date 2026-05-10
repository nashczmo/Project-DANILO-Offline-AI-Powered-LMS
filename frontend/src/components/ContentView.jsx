import { memo } from "react";
import { Search, Download, X, BookOpen } from "lucide-react";
import { Empty } from "./shared";
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
    badge: "bg-danilo-bg text-danilo-text-secondary border border-danilo-border",
  };
}

const LessonCard = memo(function LessonCard({ item }) {
  const c = getColor(item.subject);
  return (
    <article className="dn-card dn-card-hover overflow-hidden">
      <div className={cn("h-1", c.bar)} />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className={cn("dn-badge", c.badge)}>{item.subject}</span>
          <span className="dn-badge bg-danilo-bg text-danilo-text-secondary border border-danilo-border">
            {item.quarter} · W{item.week}
          </span>
          {item.melcCode && (
            <span className="text-[11px] text-danilo-text-muted font-mono">{item.melcCode}</span>
          )}
        </div>
        <p className="dn-overline mb-0.5">{item.folderName}</p>
        <h3 className="text-sm font-semibold text-danilo-text tracking-tight mb-1">{item.title}</h3>
        <p className="text-sm text-danilo-text-secondary leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
        {item.essentialQuestion && (
          <div className="bg-danilo-bg rounded-xl px-3.5 py-2.5 mb-3 border border-danilo-border">
            <p className="dn-overline mb-0.5">Essential Question</p>
            <p className="text-sm text-danilo-text-secondary italic leading-relaxed">
              &ldquo;{item.essentialQuestion}&rdquo;
            </p>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-danilo-border/40">
          <div className="text-xs text-danilo-text-muted">
            <span className="font-medium text-danilo-text">{item.courseCode}</span>
            {item.gradeLevel && ` · ${item.gradeLevel}`}
          </div>
          {item.pdfUrl && (
            <a
              href={item.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="dn-btn-primary dn-btn-sm"
              aria-label={`Open PDF for ${item.title}`}
            >
              <Download className="w-3.5 h-3.5" />
              Open PDF
            </a>
          )}
        </div>
      </div>
    </article>
  );
});

export default memo(function ContentView({ items, search, onSearchChange, quarter, onQuarterChange, subject, onSubjectChange }) {
  const subjects = [...new Set(items.map((i) => i.subject))].sort();
  const hasFilters = Boolean(search.trim() || quarter || subject);

  function clearFilters() {
    onSearchChange({ target: { value: "" } });
    onQuarterChange({ target: { value: "" } });
    onSubjectChange({ target: { value: "" } });
  }

  return (
    <section aria-label="Learning Materials">
      <div className="mb-5">
        <h2 className="dn-title">Modules &amp; Materials</h2>
        <p className="dn-subtitle mt-0.5">MELC-aligned modules for offline classroom delivery.</p>
      </div>

      {/* Filters */}
      <div className="dn-card p-4 mb-5" role="search" aria-label="Filter modules">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-danilo-text-muted pointer-events-none" aria-hidden="true" />
            <input
              value={search}
              onChange={onSearchChange}
              placeholder="Search modules…"
              className="dn-input pl-10"
              aria-label="Search modules"
            />
          </div>
          <select
            value={quarter}
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
            value={subject}
            onChange={onSubjectChange}
            className="dn-input"
            aria-label="Filter by subject"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {items.length === 0 ? (
        <Empty
          title="No modules found"
          body={search || quarter || subject ? "Try adjusting your search or filters." : "Your faculty has not uploaded any modules yet."}
          icon={<BookOpen className="w-6 h-6 text-danilo-text-muted" />}
        />
      ) : (
        <>
          <p className="text-xs text-danilo-text-muted mb-3">{items.length} module{items.length !== 1 ? "s" : ""}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => <LessonCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </section>
  );
});
