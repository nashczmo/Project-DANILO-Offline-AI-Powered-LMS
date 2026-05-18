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
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
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
        "dn-nav-item w-full relative",
        collapsed && "justify-center px-0 py-2.5",
        isActive && "active"
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-danilo-primary" />
      )}
      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-danilo-primary" : "text-danilo-text-muted")} />
      {!collapsed && <span className="truncate">{tab.label}</span>}
    </button>
  );
});

export default memo(function Sidebar({ user: userProp, currentPage, navigate, onLogout }) {
  const storeUser = useAppStore((s) => s.user);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const activePage = useAppStore((s) => s.activePage);
  const user = userProp || storeUser;
  if (!user) return null;
  const tabs = getNav(user.role);
  const initials = getInitials(user.fullName);
  const page = currentPage || activePage;

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40",
        "bg-white border-r border-danilo-border transition-all duration-300 ease-smooth",
        sidebarCollapsed ? "md:w-[72px]" : "md:w-[260px]"
      )}
    >
      <div className="flex flex-col h-full px-2 pt-5 pb-4 overflow-hidden">
        {/* Logo + collapse toggle */}
        <div
          className={cn(
            "flex items-center mb-5 px-1",
            sidebarCollapsed ? "justify-center" : "justify-between gap-2"
          )}
        >
          <button
            type="button"
            onClick={() => navigate("/overview")}
            className={cn("flex items-center gap-3 rounded-xl p-1 transition hover:bg-danilo-bg-tertiary", sidebarCollapsed && "justify-center")}
            aria-label="Go to dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-danilo-primary flex items-center justify-center flex-shrink-0 shadow-glow-sm">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-2xs font-semibold text-danilo-text-muted uppercase tracking-[0.15em] leading-none">Project</p>
                <p className="text-sm font-bold text-danilo-text tracking-tight mt-0.5 leading-none">DANILO</p>
              </div>
            )}
          </button>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="dn-btn-icon flex-shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button (collapsed state) */}
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-white border border-danilo-border text-danilo-text-muted hover:text-danilo-text flex items-center justify-center shadow-md transition z-50"
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
              collapsed={sidebarCollapsed}
              isActive={isNavActive(page, tab.page)}
              onClick={() => navigate(tab.path)}
            />
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-danilo-border pt-3 mt-2">
          <div
            className={cn(
              "flex items-center gap-2.5 mb-3 px-1",
              sidebarCollapsed ? "justify-center" : "justify-start"
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
            {!sidebarCollapsed && (
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
              "text-xs font-medium text-danilo-text-muted hover:bg-danilo-bg-tertiary hover:text-danilo-text transition-colors",
              sidebarCollapsed ? "justify-center" : "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
});
