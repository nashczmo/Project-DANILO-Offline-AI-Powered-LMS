import { NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { LayoutDashboard, Bot, BookOpen, GraduationCap, LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui";

export default function StudentLayout({ children }) {
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "overview", icon: LayoutDashboard, label: "Overview" },
    { to: "tutor", icon: Bot, label: "AI Tutor" },
    { to: "classes", icon: BookOpen, label: "My Classes" },
    { to: "grades", icon: GraduationCap, label: "Grades" },
  ];

  return (
    <div className="flex h-screen bg-danilo-bg-primary overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-danilo-border">
        <div className="p-6 border-b border-danilo-border">
          <h2 className="text-2xl font-bold text-danilo-primary tracking-tight">DANILO</h2>
          <p className="text-xs text-danilo-text-secondary mt-1">Student Portal</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `dn-nav-item ${isActive ? "active" : ""}`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-danilo-border flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-danilo-text-secondary hover:text-danilo-text focus:outline-none">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-danilo-primary ml-2">DANILO</h2>
          </div>
          
          <div className="hidden md:block">
             <h1 className="text-sm font-medium text-danilo-text-secondary">Welcome back, {user?.name || "Student"}!</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-danilo-bg-secondary flex items-center justify-center border border-danilo-border hover:bg-danilo-bg-tertiary transition-colors">
                <User className="w-5 h-5 text-danilo-text-secondary" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-danilo-text">{user?.name || "Student"}</p>
                <p className="text-xs text-danilo-text-secondary capitalize">{user?.role || "student"}</p>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-danilo-border rounded-xl shadow-sm overflow-hidden z-20">
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danilo-error hover:bg-danilo-bg-secondary rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-danilo-border">
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `dn-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
