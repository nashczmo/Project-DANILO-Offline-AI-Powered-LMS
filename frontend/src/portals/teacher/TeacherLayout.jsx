import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { LayoutDashboard, Users, BookOpen, Bell, Menu, LogOut, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui";

const navItems = [
  { name: "Overview", path: "/teacher/overview", icon: LayoutDashboard },
  { name: "My Classes", path: "/teacher/classes", icon: Users },
  { name: "Grades", path: "/teacher/grades", icon: BookOpen },
  { name: "Announcements", path: "/teacher/announcements", icon: Bell },
];

export default function TeacherLayout({ children }) {
  const { user, logout } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-danilo-bg-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-danilo-border flex-col hidden md:flex">
        <div className="p-6 border-b border-danilo-border">
          <h2 className="text-xl font-bold text-danilo-primary">DANILO</h2>
          <p className="text-xs text-danilo-text-secondary mt-1">Faculty Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-danilo-primary text-white font-medium shadow-sm"
                    : "text-danilo-text-secondary hover:bg-danilo-bg-secondary hover:text-danilo-text"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-danilo-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" className="p-2 -ml-2">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1" />
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 hover:bg-danilo-bg-secondary p-2 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 bg-danilo-primary/10 rounded-full flex items-center justify-center text-danilo-primary font-bold">
                {user?.name?.charAt(0) || "T"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-danilo-text leading-none">{user?.name || "Teacher"}</p>
                <p className="text-xs text-danilo-text-secondary mt-1 capitalize">{user?.role || "Faculty"}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-danilo-text-secondary" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-danilo-border rounded-xl shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danilo-error hover:bg-danilo-error/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-danilo-bg-primary">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
