import { Loader2 } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-danilo-border p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center font-medium transition-colors rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1";
  const variants = {
    primary: "bg-danilo-primary text-white hover:bg-danilo-primary-hover focus:ring-danilo-primary",
    secondary: "bg-danilo-bg-tertiary text-danilo-text hover:bg-danilo-border focus:ring-danilo-border",
    danger: "bg-danilo-error text-white hover:bg-danilo-error-hover focus:ring-danilo-error",
    ghost: "bg-transparent text-danilo-text-secondary hover:bg-danilo-bg-secondary hover:text-danilo-text focus:ring-danilo-border",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-danilo-bg-tertiary rounded-lg ${className}`} />;
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-danilo-text tracking-tight">{title}</h1>
        {description && <p className="text-sm text-danilo-text-secondary mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return <Loader2 className={`animate-spin text-danilo-primary ${className}`} />;
}
