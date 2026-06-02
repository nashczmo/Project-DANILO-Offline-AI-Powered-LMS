import { Loader2, AlertTriangle } from "lucide-react";

/* ── Card ────────────────────────────────────────────────── */
export function Card({ children, className = "", hover = false, onClick, ...props }) {
  return (
    <div
      className={`dn-card p-6 ${hover ? "dn-card-hover" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────── */
export function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const variants = {
    primary: "dn-btn-primary",
    secondary: "dn-btn-secondary",
    danger: "dn-btn-danger",
    ghost: "dn-btn-ghost",
  };
  const sizes = {
    sm: "dn-btn-sm",
    md: "",
    lg: "dn-btn-lg",
  };
  return (
    <button
      className={`dn-btn ${variants[variant] || variants.primary} ${sizes[size] || ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Skeleton Loader ─────────────────────────────────────── */
export function Skeleton({ className = "" }) {
  return <div className={`dn-shimmer ${className}`} aria-hidden="true" />;
}

/* ── Empty State ─────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
      <div className="w-16 h-16 bg-[#F1F3F4] rounded-2xl flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-[#BDC1C6]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-[#202124] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#5F6368] max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

/* ── Page Header ─────────────────────────────────────────── */
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-black text-[#202124] tracking-tight leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-[#5F6368] mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────── */
export function Spinner({ className = "" }) {
  return (
    <Loader2
      className={`animate-spin text-[#1A73E8] ${className}`}
      aria-label="Loading"
    />
  );
}

/* ── Badge ───────────────────────────────────────────────── */
export function Badge({ children, color = "primary" }) {
  const colors = {
    primary:   "bg-[#E8F0FE] text-[#1A73E8]",
    success:   "bg-[#E6F4EA] text-[#188038]",
    warning:   "bg-[#FEF7E0] text-[#E37400]",
    error:     "bg-[#FCE8E6] text-[#D93025]",
    secondary: "bg-[#F1F3F4] text-[#5F6368]",
    purple:    "bg-[#F3E8FD] text-[#7B1FA2]",
    orange:    "bg-[#FEE8D6] text-[#E8710A]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        colors[color] || colors.secondary
      }`}
    >
      {children}
    </span>
  );
}

/* ── Status Pill ─────────────────────────────────────────── */
export function StatusPill({ status }) {
  const map = {
    active:      { color: "success",   label: "Active" },
    inactive:    { color: "secondary", label: "Inactive" },
    pending:     { color: "warning",   label: "Pending" },
    completed:   { color: "success",   label: "Completed" },
    submitted:   { color: "primary",   label: "Submitted" },
    not_started: { color: "secondary", label: "Not Started" },
    graded:      { color: "success",   label: "Graded" },
    published:   { color: "success",   label: "Published" },
    draft:       { color: "warning",   label: "Draft" },
  };
  const config = map[status?.toLowerCase()] || { color: "secondary", label: status };
  return <Badge color={config.color}>{config.label}</Badge>;
}

/* ── Section Title ───────────────────────────────────────── */
export function SectionTitle({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-base font-black text-[#202124] tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/* ── Error Retry ─────────────────────────────────────────── */
export function ErrorRetry({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FCE8E6] flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-[#D93025]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-[#202124] mb-2">Something went wrong</h3>
      <p className="text-sm text-[#5F6368] max-w-sm mb-6 leading-relaxed">
        {message || "Unable to load data. Please try again."}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try again
        </Button>
      )}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, trendLabel, description, linkLabel, onClick }) {
  return (
    <Card hover={!!onClick} onClick={onClick} className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex-1">
        {value !== null && value !== undefined && (
          <p className="text-3xl font-black text-[#202124] leading-none">{value}</p>
        )}
        <p className="text-sm font-black text-[#202124] mt-2">{label}</p>
        {description && (
          <p className="text-xs text-[#9AA0A6] font-bold mt-0.5 leading-relaxed">{description}</p>
        )}
        {trendLabel && (
          <p className={`text-xs font-bold mt-0.5 ${trend === "up" ? "text-[#188038]" : trend === "down" ? "text-[#D93025]" : "text-[#9AA0A6]"}`}>
            {trendLabel}
          </p>
        )}
      </div>
      {linkLabel && (
        <div className="flex items-center gap-1 text-sm font-black text-[#1A73E8] border-t border-[#E0E0E0] pt-3 mt-auto">
          {linkLabel} <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      )}
    </Card>
  );
}

/* ── Input ───────────────────────────────────────────────── */
export function Input({ label, id, helper, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-[#202124]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`dn-input ${error ? "border-[#D93025] focus:border-[#D93025]" : ""}`}
        aria-describedby={helper || error ? `${id}-helper` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {(helper || error) && (
        <p
          id={`${id}-helper`}
          className={`text-xs font-bold ${error ? "text-[#D93025]" : "text-[#9AA0A6]"}`}
        >
          {error || helper}
        </p>
      )}
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────── */
export function Select({ label, id, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-[#202124]">
          {label}
        </label>
      )}
      <select id={id} className="dn-input appearance-none" {...props}>
        {children}
      </select>
    </div>
  );
}

/* ── Alert / Toast Banner ────────────────────────────────── */
export function Alert({ type = "info", children }) {
  const styles = {
    info:    "bg-[#E8F0FE] border-[#1A73E8]/20 text-[#1A73E8]",
    success: "bg-[#E6F4EA] border-[#188038]/20 text-[#188038]",
    warning: "bg-[#FEF7E0] border-[#E37400]/20 text-[#E37400]",
    error:   "bg-[#FCE8E6] border-[#D93025]/20 text-[#D93025]",
  };
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
        styles[type] || styles.info
      }`}
    >
      {children}
    </div>
  );
}

export { ErrorBoundary } from "./ErrorBoundary";
export { MathText } from "./MathText";
