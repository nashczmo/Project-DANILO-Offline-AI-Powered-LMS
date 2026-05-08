import { Empty } from "./shared";

const SUBJECT_COLORS = {
  English:     { bg: "bg-primary-50",  text: "text-primary-600",  bar: "bg-primary-500" },
  Mathematics: { bg: "bg-slate-50",     text: "text-slate-700",     bar: "bg-slate-400" },
  Science:     { bg: "bg-success-50",   text: "text-success-700",   bar: "bg-success-500" },
  Filipino:    { bg: "bg-slate-50",   text: "text-slate-600",   bar: "bg-slate-400" },
};

function getColor(subject) {
  return SUBJECT_COLORS[subject] || { bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-400" };
}

function LessonCard({ item }) {
  const c = getColor(item.subject);
  return (
    <article className="dn-card dn-card-hover overflow-hidden">
      <div className={`h-1 ${c.bar}`} />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className={`dn-badge ${c.bg} ${c.text}`}>{item.subject}</span>
          <span className="dn-badge bg-slate-100 text-slate-600">{item.quarter} &middot; W{item.week}</span>
          {item.melcCode && <span className="text-[11px] text-slate-400 font-mono">{item.melcCode}</span>}
        </div>
        <p className="dn-overline mb-0.5">{item.folderName}</p>
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-1">{item.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
        {item.essentialQuestion && (
          <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 mb-3 border border-slate-100">
            <p className="dn-overline mb-0.5">Essential Question</p>
            <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{item.essentialQuestion}&rdquo;</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            <span className="font-medium text-slate-600">{item.courseCode}</span> &middot; {item.gradeLevel}
          </div>
          {item.pdfUrl && (
            <a href={item.pdfUrl} target="_blank" rel="noreferrer" className="dn-btn-primary text-xs py-1.5 px-3 min-h-[32px]" aria-label={`Open PDF for ${item.title}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Open PDF
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ContentView({ items, search, onSearchChange, quarter, onQuarterChange, subject, onSubjectChange }) {
  const subjects = [...new Set(items.map((i) => i.subject))];
  const hasFilters = Boolean(search.trim() || quarter || subject);

  return (
    <section aria-label="Learning Materials">
      <div className="mb-5">
        <h2 className="dn-title">Modules & Materials</h2>
        <p className="dn-subtitle mt-0.5">MELC-aligned modules for offline classroom delivery.</p>
      </div>

      <div className="dn-card p-4 mb-5" role="search">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={onSearchChange} placeholder="Search modules..." className="dn-input pl-10" aria-label="Search modules" />
          </div>
          <select value={quarter} onChange={onQuarterChange} className="dn-input" aria-label="Filter by quarter">
            <option value="">All Quarters</option>
            <option value="Q1">Quarter 1</option><option value="Q2">Quarter 2</option><option value="Q3">Quarter 3</option><option value="Q4">Quarter 4</option>
          </select>
          <select value={subject} onChange={onSubjectChange} className="dn-input" aria-label="Filter by subject">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button onClick={() => { onSearchChange({ target: { value: "" } }); onQuarterChange({ target: { value: "" } }); onSubjectChange({ target: { value: "" } }); }}
            className="mt-3 text-xs font-medium text-primary-600 hover:text-primary-700 transition">
            Clear filters
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <Empty title="No modules found" body={search ? "Try adjusting your search filters." : "Your faculty has not uploaded any modules yet."} icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{items.map((item) => <LessonCard key={item.id} item={item} />)}</div>
      )}
    </section>
  );
}
