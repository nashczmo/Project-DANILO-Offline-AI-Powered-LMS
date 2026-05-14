import { memo } from "react";
import { cn, getInitials } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };
const ROLE_ICON = { admin: "bg-danilo-primary", teacher: "bg-danilo-secondary", student: "bg-danilo-border" };

const NAV_LABELS = {
  student: {
    overview: "Dashboard", "my-classes": "My Subjects", assignments: "Assessments",
    "ai-tutor": "AI Assistant", grades: "Progress", "class-detail": "Class",
  },
  teacher: {
    overview: "Dashboard", "my-classes": "My Subjects", sections: "Sections",
    announcements: "Announcements", "ai-tutor": "AI Assistant", grades: "Progress",
    "class-detail": "Class",
  },
  admin: {
    overview: "Dashboard", users: "People", classes: "Subjects", sections: "Sections",
    announcements: "Announcements", departments: "Departments", system: "System",
    settings: "Settings", enrollments: "Enrollments", assignments: "Assignments",
    grades: "Grades", reports: "Reports",
  },
};

function getPageLabel(role, page) {
  return (NAV_LABELS[role] || NAV_LABELS.student)[page] || "DANILO";
}

export default memo(function TopBar({ user, currentPage }) {
  const isOffline = useAppStore((s) => s.isOffline);
  const pageLabel = getPageLabel(user.role, currentPage);
  const initials = getInitials(user.fullName);

  return (
    <header className="dn-topbar" role="banner">
      {/* Current page label */}
      <div className="flex items-center min-w-0">
        <h1 className="text-sm font-semibold text-danilo-text tracking-tight truncate">{pageLabel}</h1>
      </div>

      {/* Right side: status + user */}
      <div className="flex items-center gap-2.5">
        {/* Online/offline indicator */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border",
            isOffline
              ? "bg-danilo-warning-subtle border-danilo-warning/20 text-danilo-warning"
              : "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success"
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isOffline ? "bg-danilo-warning" : "bg-danilo-success")}
          />
          {isOffline ? "Offline" : "Online"}
        </div>

        {/* User avatar + info */}
        <div className="flex items-center gap-2">
          <div
            className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", ROLE_ICON[user.role] || ROLE_ICON.student)}
            aria-hidden="true"
          >
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-danilo-text leading-none">{user.fullName}</p>
            <p className="text-[11px] text-danilo-text-muted mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
});
