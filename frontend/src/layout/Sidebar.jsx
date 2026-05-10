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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn, getInitials } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };
const ROLE_ICON = { admin: "bg-danilo-primary", teacher: "bg-danilo-secondary", student: "bg-danilo-border" };

const NAV = {
  student: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/my-classes", label: "My Subjects", icon: BookOpen, page: "my-classes" },
    { path: "/assignments", label: "Assessments", icon: ClipboardList, page: "assignments" },
    { path: "/ai-tutor", label: "AI Assistant", icon: Sparkles, page: "ai-tutor" },
    { path: "/grades", label: "Progress", icon: Award, page: "grades" },
  ],
  teacher: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/my-classes", label: "My Subjects", icon: BookOpen, page: "my-classes" },
    { path: "/sections", label: "Sections", icon: Layers, page: "sections" },
    { path: "/announcements", label: "Announcements", icon: Megaphone, page: "announcements" },
    { path: "/ai-tutor", label: "AI Assistant", icon: Sparkles, page: "ai-tutor" },
    { path: "/grades", label: "Progress", icon: Award, page: "grades" },
  ],
  admin: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/users", label: "People", icon: Users, page: "users" },
    { path: "/classes", label: "Subjects", icon: BookOpen, page: "classes" },
    { path: "/sections", label: "Sections", icon: Layers, page: "sections" },
    { path: "/announcements", label: "Announcements", icon: Megaphone, page: "announcements" },
    { path: "/departments", label: "Departments", icon: Building2, page: "departments" },
    { path: "/system", label: "System", icon: Cpu, page: "system" },
    { path: "/settings", label: "Settings", icon: Settings, page: "settings" },
  ],
};

function isNavActive(currentPage, tabPage) {
  if (currentPage === tabPage) return true;
  if (currentPage === "class-detail" && tabPage === "my-classes") return true;
  return false;
}

const SidebarItem = memo(function SidebarItem({ tab, isActive, collapsed, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? tab.label : undefined}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-colors duration-150 relative",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
        isActive
          ? "bg-danilo-primary-subtle text-danilo-primary"
          : "text-danilo-text-muted hover:bg-danilo-surface-hover hover:text-danilo-text-secondary"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-danilo-primary" />
      )}
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive ? "text-danilo-primary" : "text-danilo-text-muted group-hover:text-danilo-text-secondary"
        )}
      />
      {!collapsed && <span className="truncate">{tab.label}</span>}
    </button>
  );
});

export default memo(function Sidebar({ user, currentPage, navigate, onLogout }) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const tabs = NAV[user.role] || NAV.student;
  const initials = getInitials(user.fullName);

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40",
        "md:border-r md:border-danilo-border bg-danilo-bg sidebar-transition",
        collapsed ? "md:w-[72px]" : "md:w-[256px]"
      )}
    >
      <div className="flex flex-col h-full px-2 pt-5 pb-4 overflow-hidden">
        {/* Logo + collapse toggle */}
        <div
          className={cn(
            "flex items-center mb-5 px-1",
            collapsed ? "justify-center" : "justify-between gap-2"
          )}
        >
          <button
            type="button"
            onClick={() => navigate("/overview")}
            className={cn("flex items-center gap-3 rounded-xl p-1 transition hover:bg-danilo-surface-hover", collapsed && "justify-center")}
            aria-label="Go to dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-danilo-primary flex items-center justify-center flex-shrink-0 shadow-glow">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-danilo-text-muted uppercase tracking-[0.15em] leading-none">Project</p>
                <p className="text-sm font-bold text-danilo-text tracking-tight mt-0.5 leading-none">DANILO</p>
              </div>
            )}
          </button>

          {!collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-danilo-text-muted hover:bg-danilo-surface-hover transition flex-shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button (collapsed state) */}
        {collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-danilo-surface border border-danilo-border text-danilo-text-muted hover:text-danilo-text flex items-center justify-center shadow-md transition z-50"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-3 h-3" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden" aria-label="Primary navigation">
          {tabs.map((tab) => (
            <SidebarItem
              key={tab.path}
              tab={tab}
              collapsed={collapsed}
              isActive={isNavActive(currentPage, tab.page)}
              onClick={() => navigate(tab.path)}
            />
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-danilo-border pt-3 mt-2">
          <div
            className={cn(
              "flex items-center gap-2.5 mb-3 px-1",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                ROLE_ICON[user.role] || ROLE_ICON.student
              )}
              aria-hidden="true"
            >
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-danilo-text truncate leading-none">{user.fullName}</p>
                <p className="text-[11px] text-danilo-text-muted mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            className={cn(
              "w-full flex items-center gap-1.5 rounded-xl border border-danilo-border px-3 py-2",
              "text-xs font-medium text-danilo-text-muted hover:bg-danilo-surface-hover hover:text-danilo-text transition-colors",
              collapsed ? "justify-center" : "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
});
