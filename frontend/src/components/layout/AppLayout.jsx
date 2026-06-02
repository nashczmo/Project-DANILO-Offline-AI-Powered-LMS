import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Users,
  Bell,
  Settings,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";

const NAV_CONFIG = {
  student: [
    { to: "/student/overview", icon: LayoutDashboard, label: "Overview" },
    { to: "/student/classes", icon: BookOpen, label: "My Classes" },
    { to: "/student/grades", icon: GraduationCap, label: "Grades" },
    { to: "/student/assignments", icon: ClipboardList, label: "Assignments" },
    { to: "/student/tutor", icon: Bot, label: "AI Tutor", highlight: true },
    { to: "/student/profile", icon: User, label: "Profile" },
  ],
  teacher: [
    { to: "/teacher/overview", icon: LayoutDashboard, label: "Overview" },
    { to: "/teacher/classes", icon: BookOpen, label: "My Classes" },
    { to: "/teacher/grades", icon: GraduationCap, label: "Grades" },
    { to: "/teacher/announcements", icon: Bell, label: "Announcements" },
    { to: "/teacher/insights", icon: Sparkles, label: "AI Insights", highlight: true },
    { to: "/teacher/profile", icon: User, label: "Profile" },
  ],
  admin: [
    { to: "/admin/overview", icon: LayoutDashboard, label: "Overview" },
    { to: "/admin/directory", icon: Users, label: "Directory" },
    { to: "/admin/enrollments", icon: BookOpen, label: "Enrollments" },
    { to: "/admin/reports", icon: Shield, label: "Reports" },
    { to: "/admin/system", icon: Settings, label: "System" },
    { to: "/admin/profile", icon: User, label: "Profile" },
  ],
};

// Role-specific sidebar accent colors (Google-inspired)
const ROLE_COLORS = {
  student: { dot: "bg-[#1A73E8]", badge: "text-[#1A73E8] bg-[#E8F0FE]" },
  teacher: { dot: "bg-[#188038]", badge: "text-[#188038] bg-[#E6F4EA]" },
  admin:   { dot: "bg-[#E37400]", badge: "text-[#E37400] bg-[#FEF7E0]" },
};

export default function AppLayout({ children, role }) {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const isOffline = useAppStore((s) => s.isOffline);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = NAV_CONFIG[role] || [];
  const portalLabel = {
    student: "Student Portal",
    teacher: "Faculty Portal",
    admin: "Admin Portal",
  }[role] || "Portal";

  const roleColors = ROLE_COLORS[role] || ROLE_COLORS.student;

  const initials = (user?.fullName || user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();



  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-[#E0E0E0] flex-shrink-0 transition-all duration-300 ease-in-out z-20 ${
          isSidebarCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-[#E0E0E0]">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 mr-2 text-[#5F6368] hover:text-[#202124] rounded-full hover:bg-[#F1F3F4] transition-colors flex-shrink-0"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap animate-fade-in-fast">
              <div className="w-8 h-8 rounded-xl bg-[#1A73E8] flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-black text-sm leading-none">D</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-[#202124] tracking-tight leading-none truncate">DANILO</h2>
                <p className="text-[10px] font-bold text-[#9AA0A6] leading-none mt-0.5 uppercase tracking-wide truncate">
                  {portalLabel}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center rounded-full transition-all duration-150 relative group ${
                  isSidebarCollapsed ? "justify-center h-12 w-12 mx-auto" : "px-4 h-12 gap-4"
                } ${
                  isActive
                    ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                    : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124] font-medium"
                }`
              }
              title={isSidebarCollapsed ? link.label : undefined}
            >
              <link.icon
                className={`flex-shrink-0 ${isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"}`}
              />
              {!isSidebarCollapsed && (
                <span className="flex-1 text-[15px] truncate">{link.label}</span>
              )}
              {!isSidebarCollapsed && link.highlight && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${roleColors.dot}`} />
              )}
              {isSidebarCollapsed && link.highlight && (
                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${roleColors.dot}`} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Offline Status */}
        <div className="p-3 border-t border-[#E0E0E0] space-y-2">
          {/* Offline Status */}
          <div
            className={`flex items-center justify-center rounded-full text-xs font-bold transition-all ${
              isSidebarCollapsed ? "w-10 h-10 mx-auto" : "px-3 py-2 gap-2 w-full"
            } ${
              isOffline
                ? "bg-[#FEF7E0] text-[#E37400]"
                : "bg-[#E6F4EA] text-[#188038]"
            }`}
            title={isOffline ? "Offline Mode" : "Connected"}
          >
            {isOffline ? <WifiOff className="w-4 h-4 flex-shrink-0" /> : <Wifi className="w-4 h-4 flex-shrink-0" />}
            {!isSidebarCollapsed && <span className="truncate">{isOffline ? "Offline Mode" : "Connected"}</span>}
          </div>

          {/* User Profile Block */}
          <div 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto' : 'gap-3 px-2 py-2 w-full rounded-xl hover:bg-[#F1F3F4] transition-colors cursor-default'}`}
            title={isSidebarCollapsed ? `${user?.fullName || user?.name || "User"} (${user?.displayRole || user?.role || "User"})` : undefined}
          >
            <div className="w-9 h-9 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              {initials}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#202124] leading-tight truncate">
                  {user?.fullName || user?.name || "User"}
                </p>
                <p className="text-[11px] text-[#5F6368] capitalize leading-none mt-1 truncate">
                  {user?.displayRole || user?.role || "User"}
                </p>
              </div>
            )}
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-full transition-all w-full text-[#5F6368] hover:bg-[#FCE8E6] hover:text-[#D93025] ${
              isSidebarCollapsed ? "justify-center h-10 mx-auto" : "px-3 py-2 gap-2"
            }`}
            title={isSidebarCollapsed ? "Sign out" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-[13px] font-bold">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
        {/* ── Top Header Bar ─────────────────────────────── */}
        <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 sticky top-0 shadow-sm border-b border-[#E0E0E0]">
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -ml-2 text-[#5F6368] hover:text-[#202124] rounded-full hover:bg-[#F1F3F4] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1A73E8] flex items-center justify-center">
                <span className="text-white font-black text-xs">D</span>
              </div>
              <span className="text-sm font-black text-[#202124]">DANILO</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1">
            <p className="text-[15px] text-[#5F6368]">
              Welcome back, <span className="font-bold text-[#202124]">{user?.fullName || user?.name || "User"}</span>
            </p>
          </div>
        </header>

        {/* ── Mobile Nav Drawer ──────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-[#E0E0E0] animate-slide-down shadow-md z-10">
            <nav className="px-3 py-3 space-y-1">
              {navItems.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-full px-5 py-3 text-[15px] transition-all duration-150 ${
                      isActive
                        ? "bg-[#E8F0FE] text-[#1A73E8] font-bold"
                        : "text-[#5F6368] font-medium hover:bg-[#F1F3F4]"
                    }`
                  }
                >
                  <link.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1">{link.label}</span>
                  {link.highlight && (
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${roleColors.dot}`} />
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-[#E0E0E0] flex flex-col gap-4">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold self-start ${
                  isOffline
                    ? "bg-[#FEF7E0] text-[#E37400]"
                    : "bg-[#E6F4EA] text-[#188038]"
                }`}
              >
                {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>{isOffline ? "Offline Mode" : "Connected"}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    {initials}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[14px] font-bold text-[#202124] leading-tight truncate">
                      {user?.fullName || user?.name || "User"}
                    </p>
                    <p className="text-[12px] text-[#5F6368] capitalize leading-none mt-1 truncate">
                      {user?.displayRole || user?.role || "User"}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 ml-2 text-[#5F6368] hover:bg-[#FCE8E6] hover:text-[#D93025] rounded-full transition-colors flex-shrink-0"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Page Content ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
