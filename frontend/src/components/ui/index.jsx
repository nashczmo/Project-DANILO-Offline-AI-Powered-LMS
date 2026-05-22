import { Loader2 } from "lucide-react";

export function Card({ children, className = "", glass = false, hover = false }) {
  const base = glass ? "dn-card-glass" : "dn-card";
  const hoverClass = hover ? "dn-card-hover" : "";
  return (
    <div className={`${base} ${hoverClass} p-6 ${className}`}>
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
    icon: "dn-btn-icon",
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

export { ErrorBoundary } from "./ErrorBoundary";
