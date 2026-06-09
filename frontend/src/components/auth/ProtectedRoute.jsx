import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);

  if (!token || !user) {
    // This will be caught by App.jsx routing logic to redirect to Login
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-danilo-bg">
        <div className="w-16 h-16 rounded-full bg-danilo-error-subtle flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-danilo-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-danilo-text mb-2">Access Restricted</h1>
        <p className="text-sm text-danilo-text-secondary text-center max-w-md">
          Your account role ({user.role}) does not have permission to view this portal.
        </p>
      </div>
    );
  }

  return children;
}
