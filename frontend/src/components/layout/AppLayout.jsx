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
  const portalLabel = { student: "Student Portal", teacher: "Faculty Portal", admin: "Admin Portal" }[role] || "Portal";

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
    <div className="flex h-screen bg-danilo-bg-secondary overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-danilo-border flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-danilo-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-danilo-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-danilo-text tracking-tight leading-none">DANILO</h2>
              <p className="text-[10px] text-danilo-text-muted leading-none mt-0.5">{portalLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `dn-nav-item ${isActive ? "active" : ""} ${link.highlight ? "relative" : ""}`
              }
            >
              <link.icon className="w-[18px] h-[18px]" />
              <span>{link.label}</span>
              {link.highlight && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-danilo-secondary" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-danilo-border">
          <div className="flex items-center gap-2 text-xs text-danilo-text-muted">
            {isOffline ? <WifiOff className="w-3.5 h-3.5 text-danilo-warning" /> : <Wifi className="w-3.5 h-3.5 text-danilo-success" />}
            <span>{isOffline ? "Offline Mode" : "Connected"}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-danilo-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -ml-2 text-danilo-text-secondary hover:text-danilo-text rounded-lg hover:bg-danilo-bg-tertiary transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-danilo-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="text-sm font-bold text-danilo-text">DANILO</span>
            </div>
          </div>

          <div className="hidden md:block">
            <h1 className="text-sm font-medium text-danilo-text-secondary">
              Welcome back, <span className="text-danilo-text font-semibold">{user?.fullName || user?.name || "User"}</span>
            </h1>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-danilo-bg-tertiary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-danilo-primary/10 flex items-center justify-center text-danilo-primary font-bold text-sm">
                {(user?.fullName || user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-danilo-text leading-none">{user?.fullName || user?.name || "User"}</p>
                <p className="text-xs text-danilo-text-muted capitalize leading-none mt-1">{user?.displayRole || user?.role || "User"}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-danilo-text-muted hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-danilo-border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-danilo-border">
                  <p className="text-sm font-medium text-danilo-text truncate">{user?.fullName || user?.name || "User"}</p>
                  <p className="text-xs text-danilo-text-muted truncate">{user?.email || user?.username || ""}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danilo-error hover:bg-danilo-error-subtle rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-danilo-border">
            <nav className="p-3 space-y-1">
              {navItems.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `dn-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <link.icon className="w-[18px] h-[18px]" />
                  {link.label}
                  {link.highlight && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-danilo-secondary" />
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-danilo-border flex items-center gap-2 text-xs text-danilo-text-muted">
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-danilo-warning" /> : <Wifi className="w-3.5 h-3.5 text-danilo-success" />}
              <span>{isOffline ? "Offline Mode" : "Connected to LAN"}</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
