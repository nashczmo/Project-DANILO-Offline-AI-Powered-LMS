import { memo, useState, useRef, useEffect } from "react";
import {
  Menu,
  WifiOff,
  Wifi,
  Bell,
  Download,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };
const ROLE_ICON = { admin: "bg-danilo-primary", teacher: "bg-danilo-secondary", student: "bg-danilo-border" };

const NAV_LABELS = {
  student: {
    overview: "Dashboard", "my-classes": "My Classes", assignments: "Assessments",
    "ai-tutor": "AI Tutor", grades: "Grades", "class-detail": "Class",
  },
  teacher: {
    overview: "Dashboard", "my-classes": "My Classes", sections: "Sections",
    announcements: "Announcements", "ai-tutor": "AI Tutor", grades: "Grades",
    "class-detail": "Class",
  },
  admin: {
    overview: "Dashboard", users: "Users", classes: "Classes", sections: "Sections",
    announcements: "Announcements", departments: "Departments", system: "System",
    settings: "Settings", enrollments: "Enrollments", assignments: "Assignments",
    grades: "Grades", reports: "Reports",
  },
};

function getPageLabel(role, page) {
  return (NAV_LABELS[role] || NAV_LABELS.student)[page] || "DANILO";
}

export default memo(function TopBar({ user: userProp, currentPage, onLogout }) {
  const storeUser = useAppStore((s) => s.user);
  const isOffline = useAppStore((s) => s.isOffline);
  const promptEvent = useAppStore((s) => s.promptEvent);
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);
  const notifications = useAppStore((s) => s.notifications);
  const storeLogout = useAppStore((s) => s.logout);
  const user = userProp || storeUser;
  const logout = onLogout || storeLogout;
  if (!user) return null;

  const pageLabel = getPageLabel(user.role, currentPage);
  const initials = getInitials(user.fullName);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  function handleInstall() {
    if (promptEvent) {
      promptEvent.prompt();
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6",
        "h-16 bg-white border-b border-danilo-border"
      )}
      role="banner"
    >
      {/* Left: mobile hamburger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden dn-btn-icon"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="dn-heading-md truncate">{pageLabel}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Offline indicator */}
        {isOffline ? (
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border bg-danilo-error-subtle border-danilo-error/20 text-danilo-error">
            <WifiOff className="w-3 h-3" />
            Offline
          </div>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border bg-danilo-success-subtle border-danilo-success/20 text-danilo-success">
            <Wifi className="w-3 h-3" />
            Online
          </div>
        )}

        {/* Notification bell */}
        <button type="button" className="dn-btn-icon relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danilo-error ring-2 ring-white" />
          )}
        </button>

        {/* PWA install button */}
        {promptEvent && (
          <button type="button" onClick={handleInstall} className="dn-btn-primary dn-btn-sm gap-1.5 hidden sm:inline-flex">
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}

        {/* User avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-danilo-bg-tertiary transition"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
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
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-danilo-text leading-none">{user.fullName}</p>
              <p className="text-[11px] text-danilo-text-muted mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>
            </div>
            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-danilo-text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-danilo-border bg-white shadow-lg py-2 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-danilo-border mb-1">
                <p className="text-sm font-medium text-danilo-text truncate">{user.fullName}</p>
                <p className="text-xs text-danilo-text-muted">{ROLE_LABEL[user.role] || user.role}</p>
              </div>
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); /* Profile action handled by parent */ }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danilo-text-secondary hover:bg-danilo-bg-tertiary hover:text-danilo-text transition"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); /* Settings action handled by parent */ }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danilo-text-secondary hover:bg-danilo-bg-tertiary hover:text-danilo-text transition"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="dn-divider my-1" />
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danilo-error hover:bg-danilo-error-subtle transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
