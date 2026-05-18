import { memo } from "react";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  TrendingUp,
  Users,
  Layers,
  Grid3x3,
  UserCheck,
  FileText,
  Building2,
  BarChart3,
  Settings,
  Megaphone,
  X,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };
const ROLE_ICON = { admin: "bg-danilo-primary", teacher: "bg-danilo-secondary", student: "bg-danilo-border" };

const ALL_NAV = [
  { path: "/overview", label: "Overview", icon: LayoutDashboard, page: "overview" },
  { path: "/ai-tutor", label: "AI Tutor", icon: Sparkles, page: "ai-tutor" },
  { path: "/my-classes", label: "My Classes", icon: BookOpen, page: "my-classes" },
  { path: "/grades", label: "Grades", icon: TrendingUp, page: "grades" },
];

const ADMIN_NAV = [
  { path: "/users", label: "Users", icon: Users, page: "users" },
  { path: "/classes", label: "Classes", icon: Layers, page: "classes" },
  { path: "/sections", label: "Sections", icon: Grid3x3, page: "sections" },
  { path: "/enrollments", label: "Enrollments", icon: UserCheck, page: "enrollments" },
  { path: "/assignments", label: "Assignments", icon: FileText, page: "assignments" },
  { path: "/departments", label: "Departments", icon: Building2, page: "departments" },
  { path: "/reports", label: "Reports", icon: BarChart3, page: "reports" },
  { path: "/system", label: "System", icon: Settings, page: "system" },
];

const TEACHER_NAV = [
  { path: "/announcements", label: "Announcements", icon: Megaphone, page: "announcements" },
];

function getNav(role) {
  if (role === "admin") return [...ALL_NAV, ...ADMIN_NAV];
  if (role === "teacher") return [...ALL_NAV, ...TEACHER_NAV];
  return ALL_NAV;
}

function isNavActive(currentPage, tabPage) {
  if (currentPage === tabPage) return true;
  if (currentPage === "class-detail" && tabPage === "my-classes") return true;
  return false;
}

export default memo(function MobileDrawer({ open, user: userProp, currentPage, navigate, onClose, onLogout }) {
  const storeUser = useAppStore((s) => s.user);
  const user = userProp || storeUser;
  if (!user) return null;

  const tabs = getNav(user.role);
  const initials = getInitials(user.fullName);

  function choose(path) {
    navigate(path);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close navigation menu"
      />

      {/* Drawer */}
      <aside className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl border-r border-danilo-border flex flex-col animate-slide-in-left">
        {/* Header with close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-danilo-border">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                ROLE_ICON[user.role] || ROLE_ICON.student
              )}
              aria-hidden="true"
            >
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-danilo-text truncate">{user.fullName}</p>
              <p className="text-xs text-danilo-text-muted">{ROLE_LABEL[user.role] || user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dn-btn-icon"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isNavActive(currentPage, tab.page);
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => choose(tab.path)}
                className={cn(
                  "dn-nav-item w-full min-h-[44px]",
                  isActive && "active"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-danilo-primary" : "text-danilo-text-muted")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-danilo-border">
          <button
            type="button"
            onClick={() => { onClose(); onLogout(); }}
            className="dn-btn-secondary w-full gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
});
