import { Loader2 } from "lucide-react";

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div className={`dn-card ${hover ? "dn-card-hover" : ""} p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

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
    <button className={`dn-btn ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`dn-shimmer ${className}`} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-danilo-border rounded-2xl bg-danilo-bg-secondary">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-danilo-border mb-4">
        <Icon className="w-8 h-8 text-danilo-text-placeholder" />
      </div>
      <h3 className="text-lg font-bold text-danilo-text mb-2">{title}</h3>
      <p className="text-sm text-danilo-text-secondary max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="dn-heading-lg">{title}</h1>
        {description && <p className="dn-subtitle mt-2">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return <Loader2 className={`animate-spin text-danilo-primary ${className}`} />;
}

export function Badge({ children, color = "primary" }) {
  const colors = {
    primary: "bg-danilo-primary-subtle text-danilo-primary border-danilo-primary/10",
    success: "bg-danilo-success-subtle text-danilo-success border-danilo-success/10",
    warning: "bg-danilo-warning-subtle text-danilo-warning border-danilo-warning/10",
    error: "bg-danilo-error-subtle text-danilo-error border-danilo-error/10",
    secondary: "bg-danilo-bg-tertiary text-danilo-text-secondary border-danilo-border",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

export function StatusPill({ status }) {
  const map = {
    active: { color: "success", label: "Active" },
    inactive: { color: "secondary", label: "Inactive" },
    pending: { color: "warning", label: "Pending" },
    completed: { color: "success", label: "Completed" },
    submitted: { color: "primary", label: "Submitted" },
    not_started: { color: "secondary", label: "Not Started" },
    graded: { color: "success", label: "Graded" },
    published: { color: "success", label: "Published" },
    draft: { color: "warning", label: "Draft" },
  };
  const config = map[status?.toLowerCase()] || { color: "secondary", label: status };
  return <Badge color={config.color}>{config.label}</Badge>;
}

export function SectionTitle({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="dn-title">{title}</h2>
      {action}
    </div>
  );
}

export function ErrorRetry({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-danilo-error-subtle flex items-center justify-center mb-4 border border-danilo-error/20">
        <svg className="w-6 h-6 text-danilo-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-danilo-text mb-2">Something went wrong</h3>
      <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{message || "Unable to load data. Please try again."}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  );
}

export { ErrorBoundary } from "./ErrorBoundary";
