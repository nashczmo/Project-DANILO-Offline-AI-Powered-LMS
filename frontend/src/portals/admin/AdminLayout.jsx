import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronDown,
  Menu
} from 'lucide-react';
import { Button } from '../../components/ui';

export default function AdminLayout({ children }) {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '.', icon: LayoutDashboard },
    { name: 'Directory', path: 'directory', icon: Users },
    { name: 'Enrollments', path: 'enrollments', icon: UserPlus },
    { name: 'Reports', path: 'reports', icon: BarChart3 },
    { name: 'System', path: 'system', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-danilo-bg-secondary flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-danilo-border flex flex-col">
        <div className="p-4 border-b border-danilo-border flex items-center justify-between md:justify-start">
          <div className="font-bold text-xl text-danilo-primary">DANILO Admin</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto hidden md:block">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '.'}
              className={({ isActive }) =>
                `dn-nav-item ${isActive ? "active" : ""}`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-danilo-border flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center md:hidden">
            <Menu className="w-6 h-6 text-danilo-text-secondary" />
          </div>
          
          <div className="ml-auto relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-danilo-primary text-white flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="text-sm font-medium text-danilo-text hidden sm:block">
                {user?.name || 'Administrator'}
              </span>
              <ChevronDown className="w-4 h-4 text-danilo-text-secondary" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-danilo-border rounded-xl shadow-sm overflow-hidden z-10">
                <div className="p-3 border-b border-danilo-border">
                  <p className="text-sm font-medium text-danilo-text truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-danilo-text-secondary truncate">{user?.email || 'admin@danilo.local'}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-danilo-error hover:bg-danilo-bg-secondary rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation (simplified for responsive) */}
        <div className="md:hidden flex overflow-x-auto p-2 bg-white border-b border-danilo-border">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '.'}
                className={({ isActive }) =>
                  `dn-nav-item ${isActive ? "active" : ""}`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
