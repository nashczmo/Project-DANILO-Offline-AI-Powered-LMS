import React, { memo } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Sparkles,
  Award,
  Users,
  Layers,
  Megaphone,
  Building2,
  Settings,
  Cpu,
  LogOut,
  X,
} from "lucide-react";
import { cn, getInitials } from "../lib/utils";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };
const ROLE_ICON = { admin: "bg-danilo-primary", teacher: "bg-danilo-secondary", student: "bg-danilo-border" };

const NAV = {
  student: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/my-classes", label: "My Subjects", icon: BookOpen, page: "my-classes" },
    { path: "/assignments", label: "Assessments", icon: ClipboardList, page: "assignments" },
    { path: "/ai-tutor", label: "AI Assistant", icon: Sparkles, page: "ai-tutor", shortLabel: "AI" },
    { path: "/grades", label: "Progress", icon: Award, page: "grades" },
  ],
  teacher: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/my-classes", label: "My Subjects", icon: BookOpen, page: "my-classes" },
    { path: "/sections", label: "Sections", icon: Layers, page: "sections" },
    { path: "/announcements", label: "Announcements", icon: Megaphone, page: "announcements" },
    { path: "/ai-tutor", label: "AI Assistant", icon: Sparkles, page: "ai-tutor", shortLabel: "AI" },
    { path: "/grades", label: "Progress", icon: Award, page: "grades" },
  ],
  admin: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/users", label: "People", icon: Users, page: "users", shortLabel: "People" },
    { path: "/classes", label: "Subjects", icon: BookOpen, page: "classes" },
    { path: "/sections", label: "Sections", icon: Layers, page: "sections" },
    { path: "/announcements", label: "Announcements", icon: Megaphone, page: "announcements", shortLabel: "News" },
    { path: "/departments", label: "Departments", icon: Building2, page: "departments" },
    { path: "/system", label: "System", icon: Cpu, page: "system", shortLabel: "System" },
    { path: "/settings", label: "Settings", icon: Settings, page: "settings" },
  ],
};

function isNavActive(currentPage, tabPage) {
  if (currentPage === tabPage) return true;
  if (currentPage === "class-detail" && tabPage === "my-classes") return true;
  return false;
}

export default memo(function MobileDrawer({ open, user, currentPage, navigate, onClose, onLogout }) {
  const tabs = NAV[user.role] || NAV.student;
  const initials = getInitials(user.fullName);

  function choose(path) {
    navigate(path);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close navigation menu" />
      <aside className="absolute inset-y-0 left-0 w-[min(84vw,320px)] bg-danilo-surface shadow-xl border-r border-danilo-border p-4 flex flex-col animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", ROLE_ICON[user.role] || ROLE_ICON.student)}>
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-danilo-text truncate">{user.fullName}</p>
              <p className="text-xs text-danilo-text-muted">{ROLE_LABEL[user.role] || user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-lg text-danilo-text-muted hover:bg-danilo-surface-hover transition" aria-label="Close">
            <X className="h-5 w-5 mx-auto" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isNavActive(currentPage, tab.page);
            return (
              <button key={tab.path} type="button" onClick={() => choose(tab.path)}
                className={cn(
                  "w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 text-sm font-medium active:scale-[0.99] transition",
                  isActive ? "bg-danilo-primary-subtle text-danilo-primary" : "text-danilo-text-secondary active:bg-danilo-surface-hover"
                )}>
                <Icon className={cn("w-5 h-5", isActive ? "text-danilo-primary" : "text-danilo-text-muted")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button type="button" onClick={() => { onClose(); onLogout(); }}
          className="mt-4 min-h-[44px] w-full rounded-xl border border-danilo-border px-4 text-sm font-medium text-danilo-text-secondary active:scale-[0.99] active:bg-danilo-surface-hover transition">
          Sign Out
        </button>
      </aside>
    </div>
  );
});
