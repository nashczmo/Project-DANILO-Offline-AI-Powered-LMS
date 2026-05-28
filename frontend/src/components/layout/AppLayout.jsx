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
  ],
  teacher: [
    { to: "/teacher/overview", icon: LayoutDashboard, label: "Overview" },
    { to: "/teacher/classes", icon: BookOpen, label: "My Classes" },
    { to: "/teacher/grades", icon: GraduationCap, label: "Grades" },
    { to: "/teacher/announcements", icon: Bell, label: "Announcements" },

    { to: "/teacher/insights", icon: Sparkles, label: "AI Insights", highlight: true },
  ],
  admin: [
    { to: "/admin/overview", icon: LayoutDashboard, label: "Overview" },
    { to: "/admin/directory", icon: Users, label: "Directory" },
    { to: "/admin/enrollments", icon: BookOpen, label: "Enrollments" },
    { to: "/admin/reports", icon: Shield, label: "Reports" },
    { to: "/admin/system", icon: Settings, label: "System" },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const navItems = NAV_CONFIG[role] || [];
  const portalLabel = {
    student: "Student Portal",
    teacher: "Faculty Portal",
    admin: "Admin Portal",
  }[role] || "Portal";

  const roleColors = ROLE_COLORS[role] || ROLE_COLORS.student;

  // User initials for avatar
  const initials = (user?.fullName || user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E0E0E0] flex-shrink-0">
        {/* Logo / Brand */}
        <div className="h-16 flex items-center px-5 border-b border-[#E0E0E0]">
          <div className="flex items-center gap-3">
            {/* Google-style product icon */}
            <div className="w-9 h-9 rounded-xl bg-[#1A73E8] flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-black text-base leading-none">D</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-[#202124] tracking-tight leading-none">DANILO</h2>
              <p className="text-[10px] font-bold text-[#9AA0A6] leading-none mt-0.5 uppercase tracking-wide">
                {portalLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `dn-nav-item ${isActive ? "active" : ""}`
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

        {/* Offline Status Footer */}
        <div className="px-4 py-4 border-t border-[#E0E0E0]">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold ${
              isOffline
                ? "bg-[#FEF7E0] text-[#E37400]"
                : "bg-[#E6F4EA] text-[#188038]"
            }`}
          >
            {isOffline
              ? <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
              : <Wifi className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{isOffline ? "Offline Mode" : "Connected"}</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Header Bar ─────────────────────────────── */}
        <header className="h-16 bg-white border-b border-[#E0E0E0] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">

          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
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

          {/* Desktop: Page context */}
          <div className="hidden md:flex items-center gap-2">
            <p className="text-sm text-[#5F6368]">
              Welcome back,{" "}
              <span className="font-bold text-[#202124]">
                {user?.fullName || user?.name || "User"}
              </span>
            </p>
          </div>

          {/* Right: User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-label="User menu"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#F1F3F4] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-[#202124] leading-none">
                  {user?.fullName || user?.name || "User"}
                </p>
                <p className="text-[11px] text-[#9AA0A6] capitalize leading-none mt-0.5 font-bold">
                  {user?.displayRole || user?.role || "User"}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#9AA0A6] hidden sm:block transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E0E0E0] rounded-2xl shadow-elevation-2 overflow-hidden z-50 animate-scale-in">
                {/* User info */}
                <div className="p-4 border-b border-[#E0E0E0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#202124] truncate">
                        {user?.fullName || user?.name || "User"}
                      </p>
                      <p className="text-xs text-[#9AA0A6] truncate font-bold">
                        {user?.email || user?.username || ""}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-[#D93025] hover:bg-[#FCE8E6] rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Mobile Nav Drawer ──────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-[#E0E0E0] animate-slide-down shadow-md z-10">
            <nav className="px-3 py-3 space-y-0.5">
              {navItems.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `dn-nav-item ${isActive ? "active" : ""}`
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
            {/* Offline status in drawer */}
            <div className="px-4 py-3 border-t border-[#E0E0E0]">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                  isOffline
                    ? "bg-[#FEF7E0] text-[#E37400]"
                    : "bg-[#E6F4EA] text-[#188038]"
                }`}
              >
                {isOffline
                  ? <WifiOff className="w-3.5 h-3.5" />
                  : <Wifi className="w-3.5 h-3.5" />}
                <span>{isOffline ? "Offline Mode" : "Connected to LAN"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Page Content ──────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
