import { useState } from "react";
import { apiUrl } from "../api";
import { cn } from "../lib/utils";

export const GRADES = {
  Kinder: ["Kinder"],
  Elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};
export const STRANDS = ["STEM", "ABM", "HUMSS", "GAS", "TVL", "Arts and Design", "Sports"];
export const DEPED_SUBJECTS = [
  "Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "MAPEH", "TLE", "ESP",
  "Mother Tongue", "Oral Communication", "Reading and Writing", "General Mathematics",
  "Statistics and Probability", "Earth and Life Science", "Physical Science", "Biology",
  "Chemistry", "Physics", "Practical Research", "Media and Information Literacy",
  "Empowerment Technologies", "Personal Development", "Contemporary Arts",
  "Understanding Culture, Society, and Politics", "Philosophy",
];
export const ASSESSMENT_TYPES = ["Written Work", "Performance Task", "Quarterly Assessment", "Quiz", "Assignment", "Project", "Recitation", "Portfolio"];

export function Field({ label, children, className = "" }) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-medium text-danilo-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export function Stat({ label, value, accent }) {
  const displayValue = value === undefined || value === null ? "—" : value;
  return (
    <div className="dn-card p-4 text-center">
      <p className={cn("text-2xl font-bold tracking-tight", accent ? "text-danilo-primary" : "text-danilo-text")}>{displayValue}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-danilo-text-muted">{label}</p>
    </div>
  );
}

export function Empty({ icon, title, body }) {
  return (
    <div className="dn-card p-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-danilo-bg flex items-center justify-center mx-auto mb-4 border border-danilo-border">
        {icon || (
          <svg className="w-6 h-6 text-danilo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        )}
      </div>
      <p className="font-semibold text-danilo-text tracking-tight">{title}</p>
      {body && <p className="text-sm text-danilo-text-secondary mt-1.5 max-w-xs mx-auto leading-relaxed">{body}</p>}
    </div>
  );
}

export function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-danilo-bg text-danilo-text-secondary border border-danilo-border",
    blue:    "bg-danilo-primary-subtle text-danilo-primary",
    green:   "bg-danilo-success-subtle text-danilo-success",
    red:     "bg-danilo-error-subtle text-danilo-error",
    yellow:  "bg-danilo-warning-subtle text-danilo-warning",
  };
  return <span className={cn("dn-badge", tones[tone] || tones.default)}>{children}</span>;
}

export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="dn-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-danilo-text-secondary">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function GradeCascade({ value, onChange }) {
  const edu = value.educationLevel || "Junior High School";
  const gs = GRADES[edu];
  function patch(next) {
    const e = next.educationLevel || edu;
    const gl = GRADES[e].includes(next.gradeLevel || value.gradeLevel) ? (next.gradeLevel || value.gradeLevel) : GRADES[e][0];
    onChange({ ...value, ...next, educationLevel: e, gradeLevel: gl, strand: e === "Senior High School" ? (next.strand || value.strand || STRANDS[0]) : "" });
  }
  return (
    <>
      <Field label="Education Level">
        <select className="dn-input" value={edu} onChange={(e) => patch({ educationLevel: e.target.value })}>
          {Object.keys(GRADES).map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="Grade Level">
        <select className="dn-input" value={value.gradeLevel || gs[0]} onChange={(e) => patch({ gradeLevel: e.target.value })}>
          {gs.map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      {edu === "Senior High School" && (
        <Field label="Strand">
          <select className="dn-input" value={value.strand || STRANDS[0]} onChange={(e) => patch({ strand: e.target.value })}>
            {STRANDS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
      )}
    </>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-bold text-danilo-text tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-danilo-text-secondary">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function DataTable({ columns, rows, keyField = "id", emptyTitle = "No data", emptyBody = "" }) {
  if (!rows || rows.length === 0) return <Empty title={emptyTitle} body={emptyBody} />;
  return (
    <div className="dn-table-wrap">
      <table className="dn-table">
        <thead><tr>{columns.map((col) => <th key={col.key} style={col.width ? { width: col.width } : undefined}>{col.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField] ?? row._key}>
              {columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaginatedTable({ columns, rows, keyField = "id", pageSize = 10, searchFields = [], emptyTitle = "No data", emptyBody = "" }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q))) : rows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="space-y-3">
      {searchFields.length > 0 && (
        <div className="flex items-center gap-3">
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search..." className="dn-search max-w-xs" aria-label="Search table" />
          <span className="text-xs text-danilo-text-muted">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}
      <DataTable columns={columns} rows={pageRows} keyField={keyField} emptyTitle={emptyTitle} emptyBody={emptyBody} />
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-danilo-text-muted">Page {currentPage + 1} of {totalPages}</span>
          <div className="dn-pagination">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} aria-label="Previous page">&larr;</button>
            {Array.from({ length: totalPages }, (_, i) => <button key={i} onClick={() => setPage(i)} className={i === currentPage ? "active" : ""} aria-label={`Page ${i + 1}`}>{i + 1}</button>)}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} aria-label="Next page">&rarr;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="dn-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dn-modal-header">
          <h3 className="text-base font-semibold text-danilo-text">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg text-danilo-text-muted hover:bg-danilo-surface-hover hover:text-danilo-text flex items-center justify-center transition" aria-label="Close">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="dn-modal-body">{children}</div>
        {footer && <div className="dn-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function SummaryCard({ label, value, icon, tone = "primary" }) {
  const toneMap = {
    primary: "text-danilo-primary bg-danilo-primary-subtle",
    success: "text-danilo-success bg-danilo-success-subtle",
    danger:  "text-danilo-error bg-danilo-error-subtle",
    warning: "text-danilo-warning bg-danilo-warning-subtle",
  };
  return (
    <div className="dn-card p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", toneMap[tone] || toneMap.primary)}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-danilo-text tracking-tight">{value ?? "0"}</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-danilo-text-muted">{label}</p>
      </div>
    </div>
  );
}

export function InlineError({ message }) {
  if (!message) return null;
  return <p className="text-sm text-danilo-error mt-1">{message}</p>;
}

export async function downloadReport(path, filename, token) {
  const response = await fetch(apiUrl(path), { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Report export failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
