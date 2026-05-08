import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, apiUpload } from "./api";
import { AdminAnnouncementsView, AdminAssignmentsView, AdminClassesView, AdminEnrollmentsView, AdminSectionsView, AdminUsersView, DepartmentsView, ReportsView, SystemView, TeacherAnnouncementsView } from "./components/AdminPages";
import { ASSESSMENT_TYPES, Badge, Empty, Field, Modal, PageHeader, SummaryCard } from "./components/shared";
import GradesView from "./components/GradesView";
import InstallBanner from "./components/InstallBanner";
import LoginView from "./components/LoginView";
import StreamView from "./components/StreamView";
import TutorView from "./components/TutorView";

function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback((to) => {
    if (to !== window.location.pathname) {
      window.history.pushState(null, "", to);
      setPath(to);
    }
  }, []);
  return [path, navigate];
}

function matchRoute(path) {
  const p = path.replace(/\/+$/, "") || "/";
  const classMatch = p.match(/^\/class\/(\d+)\/(stream|classwork|people|grades|insights)$/);
  if (classMatch) return { page: "class-detail", classId: Number(classMatch[1]), tab: classMatch[2] };
  const classBase = p.match(/^\/class\/(\d+)$/);
  if (classBase) return { page: "class-detail", classId: Number(classBase[1]), tab: "stream" };
  const routes = {
    "/": "overview", "/overview": "overview", "/my-classes": "my-classes",
    "/users": "users", "/classes": "classes", "/sections": "sections",
    "/enrollments": "enrollments", "/assignments": "assignments",
    "/grades": "grades", "/reports": "reports", "/settings": "settings",
    "/system": "system", "/ai-tutor": "ai-tutor", "/announcements": "announcements",
    "/departments": "departments",
  };
  return { page: routes[p] || "not-found" };
}

function getInitials(name) {
  return (name || "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

/* ========================================================================
   ICONS
   ======================================================================== */

const I = (d, sw = 1.5) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const Icons = {
  home:       I("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"),
  subjects:   I("M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"),
  progress:   I("M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"),
  ai:         I("M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"),
  logout:     I("M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75", 2),
  learners:   I("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"),
  faculty:    I("M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"),
  sections:   I("M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"),
  departments:I("M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"),
  system:     I("M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"),
  assessments:I("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"),
  materials:  I("M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"),
  lessons:    I("M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"),
  sync:       I("M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"),
  settings:   I("M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"),
  announce:   I("M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 008.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"),
};

/* ========================================================================
   ROLE-BASED NAVIGATION
   ======================================================================== */

const NAV = {
  student: [
    { path: "/overview",    label: "Dashboard",     icon: Icons.home,       page: "overview" },
    { path: "/my-classes",  label: "My Subjects",   icon: Icons.subjects,   page: "my-classes" },
    { path: "/assignments", label: "Assessments",   icon: Icons.assessments,page: "assignments" },
    { path: "/ai-tutor",    label: "AI Assistant",  icon: Icons.ai,         page: "ai-tutor", shortLabel: "AI" },
    { path: "/grades",      label: "Progress",      icon: Icons.progress,   page: "grades" },
  ],
  teacher: [
    { path: "/overview",      label: "Dashboard",      icon: Icons.home,       page: "overview" },
    { path: "/my-classes",    label: "My Subjects",    icon: Icons.subjects,   page: "my-classes" },
    { path: "/sections",      label: "Sections",       icon: Icons.sections,   page: "sections" },
    { path: "/announcements", label: "Announcements",  icon: Icons.announce,   page: "announcements" },
    { path: "/ai-tutor",      label: "AI Assistant",   icon: Icons.ai,         page: "ai-tutor", shortLabel: "AI" },
    { path: "/grades",        label: "Progress",       icon: Icons.progress,   page: "grades" },
  ],
  admin: [
    { path: "/overview",      label: "Dashboard",          icon: Icons.home,        page: "overview" },
    { path: "/users",         label: "Learners & Faculty", icon: Icons.learners,    page: "users", shortLabel: "People" },
    { path: "/classes",       label: "Subjects",           icon: Icons.subjects,    page: "classes" },
    { path: "/sections",      label: "Sections",           icon: Icons.sections,    page: "sections" },
    { path: "/announcements", label: "Announcements",      icon: Icons.announce,    page: "announcements", shortLabel: "News" },
    { path: "/departments",   label: "Departments",        icon: Icons.departments, page: "departments" },
    { path: "/system",        label: "System Status",      icon: Icons.system,      page: "system", shortLabel: "System" },
    { path: "/settings",      label: "Settings",           icon: Icons.settings,    page: "settings" },
  ],
};
const getNav = (role) => NAV[role] || NAV.student;

const ALLOWED = {
  admin:   ["overview", "users", "classes", "sections", "enrollments", "assignments", "grades", "departments", "reports", "settings", "system", "my-classes", "announcements", "not-found"],
  teacher: ["overview", "my-classes", "grades", "announcements", "ai-tutor", "class-detail", "sections", "not-found"],
  student: ["overview", "my-classes", "grades", "ai-tutor", "assignments", "class-detail", "not-found"],
};
const ROLE_LABEL = { admin: "School Admin", teacher: "Faculty", student: "Learner" };

function isAllowed(role, page) {
  return (ALLOWED[role] || ALLOWED.student).includes(page);
}

function isNavActive(currentPage, tabPage) {
  if (currentPage === tabPage) return true;
  if (currentPage === "class-detail" && tabPage === "my-classes") return true;
  return false;
}

function findCurrentTab(role, currentPage) {
  return getNav(role).find((tab) => isNavActive(currentPage, tab.page));
}

const initialLogin = { username: "", password: "" };
const initialTutor = { moduleId: "", question: "", responseMode: "normal" };
let nextMsgId = 1;

function createBootstrapDashboard(user) {
  return { user, stream: [], courses: [], contentFolders: [], grades: [], hints: { hasContent: false, hasCourses: false, hasGrades: false, hasStream: false }, contentWorkflow: null, network: null, operationsHighlights: [] };
}

/* ========================================================================
   SIDEBAR
   ======================================================================== */

function Sidebar({ user, currentPage, navigate, onLogout }) {
  const tabs = getNav(user.role);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-slate-600", student: "bg-slate-500" };

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-[72px] lg:w-[256px] md:border-r md:border-slate-200 bg-white">
      <div className="flex flex-col h-full px-2 lg:px-3 pt-6 pb-4">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="hidden lg:block">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em]">Project</p>
            <p className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">DANILO</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = isNavActive(currentPage, tab.page);
            return (
              <button key={tab.path} type="button" onClick={() => navigate(tab.path)} title={tab.label}
                className={`group w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                <span className={`transition-colors ${isActive ? "text-primary-500" : "text-slate-400 group-hover:text-slate-500"}`}>{tab.icon}</span>
                <span className="hidden lg:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 pt-3 mt-2">
          <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-3 px-2">
            <div className={`w-8 h-8 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center flex-shrink-0`}>
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-400">{ROLE_LABEL[user.role] || user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout} title="Sign Out"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            {Icons.logout}
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ========================================================================
   TOPBAR
   ======================================================================== */

function TopBar({ user, currentPage }) {
  const currentTab = findCurrentTab(user.role, currentPage);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-slate-600", student: "bg-slate-500" };

  return (
    <header className="dn-topbar">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 tracking-tight">{currentTab ? currentTab.label : "DANILO"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-success-50 border border-success-200">
          <span className="dn-status-dot" style={{ width: 5, height: 5 }} />
          <span className="text-[11px] font-medium text-success-600">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center`}>
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-slate-900 leading-none">{user.fullName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ========================================================================
   MOBILE TOP BAR
   ======================================================================== */

function MobileTopBar({ user, currentPage, onMenuOpen }) {
  const currentTab = findCurrentTab(user.role, currentPage);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-slate-600", student: "bg-slate-500" };

  return (
    <header className="md:hidden fixed top-0 inset-x-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-3 h-[56px]">
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onMenuOpen} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 active:bg-slate-100 transition" aria-label="Open navigation menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900 tracking-tight">{currentTab ? currentTab.label : "DANILO"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onMenuOpen} className={`w-8 h-8 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center`} title={`Open menu (${user.fullName})`}>
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ========================================================================
   MOBILE DRAWER
   ======================================================================== */

function MobileDrawer({ open, user, currentPage, navigate, onClose, onLogout }) {
  const tabs = getNav(user.role);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-slate-600", student: "bg-slate-500" };

  function choose(path) {
    navigate(path);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Close navigation menu" />
      <aside className="absolute inset-y-0 left-0 w-[min(84vw,320px)] bg-white shadow-xl border-r border-slate-100 p-4 flex flex-col animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center flex-shrink-0`}>
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[user.role] || user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-lg text-slate-500 active:bg-slate-100 transition" aria-label="Close">
            <svg className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {tabs.map((tab) => {
            const isActive = isNavActive(currentPage, tab.page);
            return (
              <button key={tab.path} type="button" onClick={() => choose(tab.path)}
                className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 text-sm font-medium active:scale-[0.99] transition ${
                  isActive ? "bg-primary-50 text-primary-700" : "text-slate-600 active:bg-slate-50"
                }`}>
                <span className={isActive ? "text-primary-500" : "text-slate-400"}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button type="button" onClick={() => { onClose(); onLogout(); }}
          className="mt-4 min-h-[44px] w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 active:scale-[0.99] active:bg-slate-50 transition">
          Sign Out
        </button>
      </aside>
    </div>
  );
}

/* ========================================================================
   MOBILE BOTTOM NAV
   ======================================================================== */

function MobileBottomNav({ currentPage, navigate, role }) {
  const tabs = getNav(role).slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom,0px)] pt-1">
        {tabs.map((tab) => {
          const isActive = isNavActive(currentPage, tab.page);
          return (
            <button key={tab.path} type="button" onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 flex-1 transition-all duration-150 ${
                isActive ? "text-primary-600" : "text-slate-400"
              }`}>
              {isActive && <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary-600" />}
              <span className="transition-transform">{tab.icon}</span>
              <span className={`max-w-[64px] truncate text-[10px] font-medium ${isActive ? "text-primary-600" : "text-slate-400"}`}>{tab.shortLabel || tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ========================================================================
   DASHBOARD
   ======================================================================== */

function AdminSetupChecklist({ dashboard, onNavigate }) {
  const t = dashboard.totals || {};
  const learners = t.learners ?? 0;
  const faculty  = t.faculty  ?? 0;
  const sections = t.sections ?? 0;
  const subjects = t.classes  ?? 0;

  const steps = [
    { done: sections > 0, label: "Create Sections",    sub: "Add your school's class sections",          nav: "/sections" },
    { done: faculty > 0,  label: "Add Faculty",         sub: "Create faculty accounts",                   nav: "/users" },
    { done: subjects > 0, label: "Create Subjects",      sub: "Set up subject records for each quarter",   nav: "/classes" },
    { done: learners > 0, label: "Enroll Learners",      sub: "Add learner accounts",                      nav: "/users" },
  ];
  const allDone = steps.every((s) => s.done);
  if (allDone) return null;

  return (
    <div className="dn-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">School Setup Checklist</p>
          <p className="text-xs text-slate-400">Complete these steps to get DANILO ready for learners</p>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <button key={i} onClick={() => onNavigate(s.nav)}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${s.done ? "bg-success-50 border-success-200" : "bg-white border-slate-200 hover:border-primary-200 hover:bg-primary-50/50"}`}>
            <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${s.done ? "bg-success-500 border-success-500 text-white" : "border-slate-300 text-slate-400"}`}>
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-success-700 line-through" : "text-slate-800"}`}>{s.label}</p>
              <p className="text-[11px] text-slate-400 truncate">{s.sub}</p>
            </div>
            {!s.done && <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeView({ user, dashboard, onNavigate }) {
  const courseCount = Array.isArray(dashboard.courses) ? dashboard.courses.length : 0;
  const lessonCount = Array.isArray(dashboard.contentFolders) ? dashboard.contentFolders.length : 0;
  const streamCount = Array.isArray(dashboard.stream) ? dashboard.stream.length : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className="space-y-5">
      <div className="dn-card p-5 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-slate-500 text-sm">{greeting},</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{user.fullName}</h2>
          </div>
          <span className="dn-badge bg-primary-50 text-primary-700 capitalize">{user.displayRole || ROLE_LABEL[user.role] || user.role}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="dn-status-dot" />
            <span className="text-success-600 font-medium text-xs">{dashboard.network?.ssid || "DANILO"}</span>
          </div>
          <span className="text-slate-300">&middot;</span>
          <span className="text-xs">{dashboard.network?.mode || "offline-first"}</span>
        </div>
      </div>

      {user.role === "admin" && <AdminSetupChecklist dashboard={dashboard} onNavigate={onNavigate} />}

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Subjects" value={courseCount} icon={Icons.subjects} tone="primary" />
        <SummaryCard label="Modules" value={lessonCount} icon={Icons.materials} tone="success" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          {streamCount > 0 && (
            <button onClick={() => onNavigate("/my-classes")} className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">View all &rarr;</button>
          )}
        </div>
        {streamCount === 0 ? (
          <Empty title="No recent activity" body="Posts from your faculty will appear here" icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        ) : (
          <div className="space-y-2">
            {dashboard.stream.slice(0, 4).map((item) => (
              <div key={item.id} className="dn-card p-3.5 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.courseTitle} &middot; {item.authorName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   MY SUBJECTS
   ======================================================================== */

function MyClassesView({ courses, navigate }) {
  return (
    <section aria-label="My Subjects">
      <PageHeader title="My Subjects" subtitle="Your enrolled subjects. Tap a card to open." />
      {!courses || courses.length === 0 ? (
        <Empty title="No subjects yet" body="You will see your enrolled subjects here once assigned." icon={Icons.subjects} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <button key={c.id} onClick={() => navigate(`/class/${c.id}/stream`)}
              className="group text-left dn-card overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="h-16 bg-slate-100 relative border-b border-slate-100">
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-semibold text-sm truncate drop-shadow-sm" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{c.title}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{c.code}</p>
                <p className="text-sm text-slate-400 mt-0.5">{c.subject} &middot; {c.gradeLevel}</p>
                {c.teacherName && <p className="text-xs text-slate-400 mt-0.5">{c.teacherName}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ========================================================================
   CLASS DETAIL
   ======================================================================== */

function parseChoices(choicesJson) {
  if (!choicesJson) return [];
  try {
    const parsed = JSON.parse(choicesJson);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.values(parsed);
  } catch (_) {
    return String(choicesJson).split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function AssignmentCard({ token, assignment, canSubmit, onSaved }) {
  const [responseText, setResponseText] = useState(assignment.submission?.responseText || "");
  const [saving, setSaving] = useState(false);
  const status = assignment.submission?.status || "not_started";

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest(`/student/assignments/${assignment.id}/submit`, { method: "POST", token, body: { responseText } });
      await onSaved();
    } finally { setSaving(false); }
  }

  async function complete() {
    setSaving(true);
    try { await apiRequest(`/student/assignments/${assignment.id}/complete`, { method: "POST", token }); await onSaved(); } finally { setSaving(false); }
  }

  return (
    <article className="dn-card p-4 mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{assignment.title}</p>
          <p className="text-sm text-slate-500 mt-0.5 whitespace-pre-wrap">{assignment.instructions}</p>
          <p className="text-xs text-slate-400 mt-1">{assignment.points} pts</p>
        </div>
        <Badge tone={status === "submitted" || status === "completed" ? "green" : "yellow"}>{status.replace("_", " ")}</Badge>
      </div>
      {assignment.submission?.feedback && <p className="mt-2 text-xs text-primary-600">Feedback: {assignment.submission.feedback}</p>}
      {assignment.submission?.score != null && <p className="mt-1 text-xs text-slate-500">Score: {assignment.submission.score}/{assignment.points}</p>}
      {canSubmit && (
        <form onSubmit={submit} className="mt-3 grid gap-2">
          <textarea className="dn-input" rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your answer or completion notes..." required />
          <div className="flex flex-wrap gap-2">
            <button disabled={saving || !responseText.trim()} className="dn-btn-primary text-xs py-1.5">Submit Answer</button>
            <button type="button" disabled={saving} onClick={complete} className="dn-btn-secondary text-xs py-1.5">Mark Complete</button>
          </div>
        </form>
      )}
    </article>
  );
}

function QuizCard({ token, quiz, canSubmit, onSaved }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = await apiRequest(`/student/quizzes/${quiz.id}/submit`, { method: "POST", token, body: { answers } });
      setResult(payload);
      await onSaved();
    } finally { setSaving(false); }
  }

  return (
    <article className="dn-card p-4 mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-medium text-slate-900">{quiz.title}</p>
          <p className="text-sm text-slate-500 mt-0.5">{quiz.instructions}</p>
        </div>
        <Badge tone={quiz.attempt ? "green" : "yellow"}>{quiz.attempt ? "Submitted" : "Pending"}</Badge>
      </div>
      {result && <div className="rounded-lg bg-primary-50 border border-primary-100 text-primary-700 text-sm p-3 mb-3">Score: {result.score}% ({result.earnedPoints}/{result.totalPoints} pts)</div>}
      {canSubmit && !quiz.attempt && (
        <form onSubmit={submit} className="grid gap-3">
          {(quiz.questions || []).map((q, index) => {
            const choices = parseChoices(q.choicesJson);
            return (
              <Field key={q.id} label={`${index + 1}. ${q.questionText}`}>
                {choices.length ? (
                  <select className="dn-input" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} required>
                    <option value="">Choose answer...</option>
                    {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                  </select>
                ) : (
                  <input className="dn-input" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Your answer" required />
                )}
              </Field>
            );
          })}
          <button disabled={saving || !(quiz.questions || []).length} className="dn-btn-primary text-xs py-1.5">Submit Quiz</button>
        </form>
      )}
      {canSubmit && quiz.attempt && <p className="text-xs text-slate-400">Submitted {quiz.attempt.submittedAt ? new Date(quiz.attempt.submittedAt).toLocaleString() : ""}</p>}
    </article>
  );
}

function TeacherQuickTools({ token, user, course, tab, people, reload }) {
  const [moduleForm, setModuleForm] = useState({ title: "", melcCode: "", learningCompetency: "", lessonObjectives: "", assessmentType: "", quarter: course.quarter || "Q1", week: 1, summary: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", instructions: "", points: 100 });
  const [quizForm, setQuizForm] = useState({ title: "", instructions: "", questionText: "", choicesText: "", answerKey: "", points: 1, isPublished: true });
  const [uploadState, setUploadState] = useState({ file: null, saving: false, error: "", success: "" });

  if (user.role !== "teacher") return null;

  async function createModule(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/modules`, { method: "POST", token, body: moduleForm });
    setModuleForm({ title: "", melcCode: "", learningCompetency: "", lessonObjectives: "", assessmentType: "", quarter: course.quarter || "Q1", week: 1, summary: "" });
    reload();
  }

  async function createAssignment(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/assignments`, { method: "POST", token, body: assignmentForm });
    setAssignmentForm({ title: "", instructions: "", points: 100 });
    reload();
  }

  async function createQuiz(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/quizzes`, {
      method: "POST", token,
      body: { title: quizForm.title, instructions: quizForm.instructions, isPublished: quizForm.isPublished,
        questions: [{ questionText: quizForm.questionText, choicesJson: JSON.stringify(quizForm.choicesText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)), answerKey: quizForm.answerKey, points: quizForm.points }],
      },
    });
    setQuizForm({ title: "", instructions: "", questionText: "", choicesText: "", answerKey: "", points: 1, isPublished: true });
    reload();
  }

  async function generateLesson(e) {
    e.preventDefault();
    if (!uploadState.file) return;
    const formData = new FormData();
    formData.append("material", uploadState.file);
    setUploadState((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      const result = await apiUpload(`/teacher/courses/${course.id}/materials/generate?save=true`, { token, formData });
      setUploadState({ file: null, saving: false, error: "", success: result?.message || "Lesson draft generated and saved." });
      await reload();
    } catch (error) {
      setUploadState((prev) => ({ ...prev, saving: false, error: error?.message || "Material could not be processed.", success: "" }));
    }
  }

  if (tab === "classwork") {
    return (
      <div className="grid gap-4 mb-5 lg:grid-cols-2">
        <form className="dn-card p-5" onSubmit={createModule}>
          <h3 className="font-semibold text-slate-900 mb-3">Add Module</h3>
          <div className="grid gap-3">
            <Field label="Module Title"><input className="dn-input" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required /></Field>
            <Field label="MELC Code"><input className="dn-input" value={moduleForm.melcCode} onChange={(e) => setModuleForm({ ...moduleForm, melcCode: e.target.value })} /></Field>
            <Field label="Learning Competency"><textarea className="dn-input" rows={2} value={moduleForm.learningCompetency} onChange={(e) => setModuleForm({ ...moduleForm, learningCompetency: e.target.value })} /></Field>
            <Field label="Lesson Objectives"><textarea className="dn-input" rows={2} value={moduleForm.lessonObjectives} onChange={(e) => setModuleForm({ ...moduleForm, lessonObjectives: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quarter"><select className="dn-input" value={moduleForm.quarter} onChange={(e) => setModuleForm({ ...moduleForm, quarter: e.target.value })}><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></Field>
              <Field label="Week"><input className="dn-input" type="number" min="1" value={moduleForm.week} onChange={(e) => setModuleForm({ ...moduleForm, week: e.target.value })} /></Field>
            </div>
            <Field label="Assessment Type"><select className="dn-input" value={moduleForm.assessmentType} onChange={(e) => setModuleForm({ ...moduleForm, assessmentType: e.target.value })}><option value="">Optional</option>{ASSESSMENT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Summary"><textarea className="dn-input" rows={2} value={moduleForm.summary} onChange={(e) => setModuleForm({ ...moduleForm, summary: e.target.value })} /></Field>
            <button className="dn-btn-primary">Add Module</button>
          </div>
        </form>
        <form className="dn-card p-5" onSubmit={createAssignment}>
          <h3 className="font-semibold text-slate-900 mb-3">Create Assignment</h3>
          <div className="grid gap-3">
            <Field label="Title"><input className="dn-input" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required /></Field>
            <Field label="Instructions"><textarea className="dn-input" rows={5} value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })} required /></Field>
            <Field label="Points"><input className="dn-input" type="number" min="1" value={assignmentForm.points} onChange={(e) => setAssignmentForm({ ...assignmentForm, points: e.target.value })} /></Field>
            <button className="dn-btn-primary">Create Assignment</button>
          </div>
        </form>
        <form className="dn-card p-5 lg:col-span-2" onSubmit={createQuiz}>
          <h3 className="font-semibold text-slate-900 mb-3">Create Quiz</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Quiz Title"><input className="dn-input" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required /></Field>
            <Field label="Instructions"><input className="dn-input" value={quizForm.instructions} onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })} required /></Field>
            <Field label="Question" className="sm:col-span-2"><textarea className="dn-input" rows={2} value={quizForm.questionText} onChange={(e) => setQuizForm({ ...quizForm, questionText: e.target.value })} required /></Field>
            <Field label="Choices (one per line)"><textarea className="dn-input" rows={4} value={quizForm.choicesText} onChange={(e) => setQuizForm({ ...quizForm, choicesText: e.target.value })} /></Field>
            <div className="grid gap-3">
              <Field label="Answer Key"><input className="dn-input" value={quizForm.answerKey} onChange={(e) => setQuizForm({ ...quizForm, answerKey: e.target.value })} required /></Field>
              <Field label="Points"><input className="dn-input" type="number" min="1" value={quizForm.points} onChange={(e) => setQuizForm({ ...quizForm, points: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={quizForm.isPublished} onChange={(e) => setQuizForm({ ...quizForm, isPublished: e.target.checked })} />
                Publish immediately
              </label>
            </div>
            <button className="dn-btn-primary sm:col-span-2">Create Quiz</button>
          </div>
        </form>
        <form className="dn-card p-5 lg:col-span-2" onSubmit={generateLesson}>
          <h3 className="font-semibold text-slate-900 mb-3">Generate Lesson From Material</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Upload PDF, PPT, PPTX, DOCX, or TXT">
              <input className="dn-input" type="file" accept=".pdf,.ppt,.pptx,.docx,.txt" onChange={(e) => setUploadState({ file: e.target.files?.[0] || null, saving: false, error: "", success: "" })} />
            </Field>
            <button className="dn-btn-primary" disabled={!uploadState.file || uploadState.saving}>{uploadState.saving ? "Generating..." : "Generate Lesson"}</button>
          </div>
          {uploadState.error && <p className="mt-3 text-sm font-medium text-danger-600">{uploadState.error}</p>}
          {uploadState.success && <p className="mt-3 text-sm font-medium text-success-600">{uploadState.success}</p>}
        </form>
      </div>
    );
  }

  return null;
}

function InsightsPanel({ insights, loading, error, token, classId, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try { const data = await apiRequest(`/teacher/insights?class_id=${classId}&include_ai=true`, { token }); onRefresh(data); } catch (_) {}
    setRefreshing(false);
  }

  if (loading && !insights) return <div className="dn-card p-4 text-sm text-slate-500 animate-pulse">Loading learner insights...</div>;
  if (error && !insights) return <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-600">{error}</div>;
  if (!insights || !insights.course) return <Empty icon={Icons.subjects} title="No insights available" body="Insights will appear once learners have grades, quiz attempts, or assessment submissions." />;

  const stats = insights.stats || {};
  const struggling = insights.strugglingStudents || [];
  const weakTopics = insights.classWeakTopics || [];
  const aiSummary = insights.aiSummary || "";

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Student Performance Insights</h3>
        <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors disabled:opacity-50">
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SummaryCard label="Learners" value={stats.studentCount || 0} />
        <SummaryCard label="Struggling" value={stats.strugglingCount || 0} tone={stats.strugglingCount > 0 ? "danger" : "primary"} />
        <SummaryCard label="At Risk" value={stats.atRiskCount || 0} tone={stats.atRiskCount > 0 ? "danger" : "primary"} />
        <SummaryCard label="Class Average" value={stats.classAverage != null ? `${stats.classAverage}%` : "-"} />
      </div>
      {aiSummary && (
        <div className="dn-card p-4 mb-5 border-l-4 border-primary-400">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">{Icons.ai}</div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">DANILO AI Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}
      {struggling.length > 0 && (
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900 mb-3">Struggling Learners</h3>
          <div className="space-y-3">
            {struggling.map((s) => (
              <div key={s.studentId} className="dn-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{s.studentName}</p>
                    {s.averageScore != null && <p className="text-xs text-slate-400 mt-0.5">Average: {s.averageScore}%</p>}
                  </div>
                  <Badge tone="red">{s.status === "at_risk" ? "At Risk" : "Struggling"}</Badge>
                </div>
                {s.weakestTopic && <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Weakest area:</span> {s.weakestTopic}{s.weakestTopicScore != null && <span className="text-slate-400"> ({s.weakestTopicScore}%)</span>}</p>}
                <p className="text-xs text-slate-500 mb-2">{s.explanation}</p>
                {s.recommendedAction && <p className="text-xs font-medium text-primary-600 bg-primary-50 rounded-lg px-3 py-1.5 inline-block">{s.recommendedAction}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!struggling.length && <Empty icon={Icons.subjects} title="All students on track" body="No students are currently flagged as struggling or at risk." />}
      {weakTopics.length > 0 && (
        <div className="dn-card p-5 mt-5">
          <h3 className="font-semibold text-slate-900 mb-3">Class Weak Topics</h3>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t, i) => <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-danger-50 text-danger-700 text-sm font-medium">{t}</span>)}
          </div>
        </div>
      )}
    </section>
  );
}

function ClassDetailView({ classId, tab, courses, dashboard, navigate, token, user, reloadData }) {
  const course = (courses || []).find((c) => c.id === classId);
  const [classData, setClassData] = useState({ loading: false, error: "", stream: null, classwork: null, people: null, grades: null, insights: null });
  const [classSearch, setClassSearch] = useState("");
  const [classQuarter, setClassQuarter] = useState("");
  const [classSubject, setClassSubject] = useState("");

  const TABS = [
    { id: "stream", label: "Stream", path: `/class/${classId}/stream` },
    { id: "classwork", label: "Materials", path: `/class/${classId}/classwork` },
    { id: "people", label: "Learners", path: `/class/${classId}/people` },
    { id: "grades", label: "Grades", path: `/class/${classId}/grades` },
    ...(user.role === "teacher" ? [{ id: "insights", label: "Insights", path: `/class/${classId}/insights` }] : []),
  ];

  useEffect(() => {
    if (!course || !token) return;
    let active = true;
    async function loadClassTab() {
      try {
        const [tabPayload, peoplePayload] = await Promise.all([
          apiRequest(`/classes/${classId}/${tab}`, { token }),
          apiRequest(`/classes/${classId}/people`, { token }).catch(() => null),
        ]);
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: "", [tab]: tabPayload, people: peoplePayload || prev.people }));
      } catch (error) {
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: error?.message || "Class data could not be loaded." }));
      }
    }
    setClassData((prev) => ({ ...prev, loading: true, error: "" }));
    loadClassTab();
    return () => { active = false; };
  }, [classId, tab, course, token]);

  useEffect(() => {
    if (tab !== "insights" || !token || user.role !== "teacher") return;
    let active = true;
    async function loadInsights() {
      try {
        const data = await apiRequest(`/teacher/insights?class_id=${classId}&include_ai=true`, { token });
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: "", insights: data }));
      } catch (error) {
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: error?.message || "Insights could not be loaded.", insights: null }));
      }
    }
    loadInsights();
    return () => { active = false; };
  }, [tab, classId, token, user.role]);

  async function refreshClass() {
    await reloadData();
    const payload = await apiRequest(`/classes/${classId}/${tab}`, { token });
    const peoplePayload = await apiRequest(`/classes/${classId}/people`, { token }).catch(() => classData.people);
    setClassData((prev) => ({ ...prev, [tab]: payload, people: peoplePayload }));
  }

  if (!course) {
    return (
      <section className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">{Icons.subjects}</div>
        <h2 className="text-lg font-semibold text-slate-900">Subject not found</h2>
        <p className="text-sm text-slate-400 mt-1">This subject does not exist or you are not enrolled.</p>
        <button onClick={() => navigate("/my-classes")} className="mt-4 dn-btn-primary">Back to My Subjects</button>
      </section>
    );
  }

  const stream = Array.isArray(classData.stream) ? classData.stream : (dashboard?.stream || []).filter((s) => s.courseId === classId);
  const classwork = classData.classwork || {};
  const content = classwork.modules || (dashboard?.contentFolders || []).filter((f) => f.courseId === classId);
  const assignments = classwork.assignments || [];
  const quizzes = classwork.quizzes || [];
  const grades = normalizeGradeRows(classData.grades?.grades || (dashboard?.grades || []).filter((g) => g.courseId === classId));
  const people = classData.people || { teacher: course.teacherName ? { fullName: course.teacherName } : null, students: [] };

  return (
    <section>
      <button onClick={() => navigate("/my-classes")} className="flex items-center gap-1 text-sm text-primary-600 font-medium mb-4 hover:text-primary-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        My Subjects
      </button>
      <div className="dn-card p-4 mb-4">
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{course.title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{course.code} &middot; {course.subject} &middot; {course.gradeLevel}</p>
      </div>
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
        <div className="flex min-w-max gap-1 sm:min-w-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => navigate(t.path)}
              className={`min-h-[40px] min-w-[96px] flex-1 rounded-md px-4 text-center text-sm font-medium transition-all active:scale-[0.98] ${
                tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {classData.loading && <div className="dn-card p-4 mb-4 text-sm text-slate-500">Loading class data...</div>}
      {classData.error && <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 mb-4 text-sm font-medium text-danger-600">{classData.error}</div>}
      <TeacherQuickTools token={token} user={user} course={course} tab={tab} people={people} reload={refreshClass} />
      {tab === "stream" && <StreamView items={stream} />}
      {tab === "classwork" && (
        <>
          <ContentView items={content} search={classSearch} onSearchChange={(e) => setClassSearch(e.target.value)} quarter={classQuarter} onQuarterChange={(e) => setClassQuarter(e.target.value)} subject={classSubject} onSubjectChange={(e) => setClassSubject(e.target.value)} />
          <div className="mt-4 dn-card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Assessments</h3>
            {assignments.length ? assignments.map((a) => <AssignmentCard key={a.id} token={token} assignment={a} canSubmit={user.role === "student"} onSaved={refreshClass} />) : <Empty title="No assessments" body="Assessments for this subject will appear here." />}
          </div>
          <div className="mt-4 dn-card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Quizzes</h3>
            {quizzes.length ? quizzes.map((q) => <QuizCard key={q.id} token={token} quiz={q} canSubmit={user.role === "student"} onSaved={refreshClass} />) : <Empty title="No quizzes" body="Published quizzes for this subject will appear here." />}
          </div>
        </>
      )}
      {tab === "people" && (
        <div className="dn-card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Faculty</h3>
          <p className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">{people.teacher?.fullName || "Unassigned"}</p>
          <h3 className="font-semibold text-slate-900 mt-5 mb-3">Learners</h3>
          {people.students?.length ? (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
              {people.students.map((s) => <div key={s.id} className="p-3 text-sm"><p className="font-medium text-slate-700">{s.fullName}</p><p className="text-xs text-slate-400">{s.username}</p></div>)}
            </div>
          ) : <Empty title="No enrolled learners" body="Learners will appear here after enrollment." />}
        </div>
      )}
      {tab === "grades" && <GradesView grades={grades} />}
      {tab === "insights" && <InsightsPanel insights={classData.insights} loading={classData.loading} error={classData.error} token={token} classId={classId} onRefresh={(data) => setClassData((prev) => ({ ...prev, insights: data }))} />}
    </section>
  );
}

/* ========================================================================
   ERROR VIEWS
   ======================================================================== */

function ForbiddenView({ navigate }) {
  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">You do not have permission to view this page.</p>
      <button onClick={() => navigate("/overview")} className="mt-5 dn-btn-primary">Go to Dashboard</button>
    </section>
  );
}

function NotFoundView({ navigate }) {
  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Page Not Found</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">The page you are looking for does not exist.</p>
      <button onClick={() => navigate("/overview")} className="mt-5 dn-btn-primary">Go to Dashboard</button>
    </section>
  );
}

/* ========================================================================
   TOASTS & CONFIRM
   ======================================================================== */

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" role="alert" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md pointer-events-auto text-sm ${
          t.type === "success" ? "bg-success-50/90 border-success-200 text-success-800" :
          t.type === "error"   ? "bg-danger-50/90 border-danger-200 text-danger-800" :
          t.type === "danger"  ? "bg-red-600/90 border-red-700 text-white shadow-red-600/20" :
          "bg-white/90 border-slate-200 text-slate-800"
        }`}>
          <div className="flex-1 font-medium">{t.message}</div>
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, variant }) {
  if (!open) return null;
  const isDestructive = variant === "danger";
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} aria-label="Cancel" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition ${isDestructive ? "bg-danger-600 hover:bg-danger-700" : "bg-primary-600 hover:bg-primary-700"}`}>{confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

function normalizeGradeRows(grades) {
  return (grades || []).map((grade, index) => {
    const finalGrade = Number(grade.finalGrade ?? grade.score ?? 0);
    return { ...grade, courseId: grade.courseId ?? grade.id ?? index, quarter: grade.quarter || "", subject: grade.subject || grade.courseTitle || "Class", courseTitle: grade.courseTitle || grade.studentName || "Grade record", courseCode: grade.courseCode || "", finalGrade, components: grade.components || [{ component: grade.component || "Recorded score", score: grade.score ?? finalGrade, maxScore: grade.maxScore ?? 100, weight: grade.weight ?? 1, percentage: grade.percentage ?? finalGrade, remarks: grade.remarks || "" }] };
  });
}

/* ========================================================================
   MAIN APP
   ======================================================================== */

export default function App() {
  const [path, navigate] = usePath();
  const [token, setToken] = useState(() => localStorage.getItem("danilo.token") || "");
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminAssignments, setAdminAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [promptEvent, setPromptEvent] = useState(null);
  const [tutorForm, setTutorForm] = useState(initialTutor);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorMessages, setTutorMessages] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null, confirmLabel: "Confirm", variant: "default" });
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    if (type !== "danger") setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
    return id;
  }, []);
  const dismissToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const confirm = useCallback((title, message, onConfirm, opts = {}) => { setConfirmState({ open: true, title, message, onConfirm, confirmLabel: opts.confirmLabel || "Confirm", variant: opts.variant || "default" }); }, []);
  const closeConfirm = useCallback(() => setConfirmState((c) => ({ ...c, open: false })), []);

  const route = useMemo(() => matchRoute(path), [path]);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    const handler = (event) => { event.preventDefault(); setPromptEvent(event); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function loadRoleData(authToken, profile) {
    const mergeDash = (incoming) => setDashboard((prev) => ({ ...(prev || {}), ...incoming }));
    if (profile.role === "admin") {
      const results = await Promise.allSettled([
        apiRequest("/admin/overview", { token: authToken }), apiRequest("/admin/users", { token: authToken }),
        apiRequest("/admin/courses", { token: authToken }), apiRequest("/admin/assignments", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminUsers(results[1].value);
      if (results[2].status === "fulfilled") setAdminCourses(results[2].value);
      if (results[3].status === "fulfilled") setAdminAssignments(results[3].value);
    } else if (profile.role === "teacher") {
      const results = await Promise.allSettled([
        apiRequest("/teacher/dashboard", { token: authToken }), apiRequest("/teacher/courses", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminCourses(results[1].value);
    } else {
      const results = await Promise.allSettled([
        apiRequest("/dashboard", { token: authToken }), apiRequest("/student/assignments", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminAssignments(results[1].value);
    }
  }

  async function reloadData() {
    if (!token || !user) return;
    try { await loadRoleData(token, user); } catch { /* silent */ }
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    setSessionLoading(true);
    setDashboardError("");
    async function restoreSession() {
      try {
        const profile = await apiRequest("/me", { token });
        if (!active) return;
        setUser(profile);
        setDashboard((c) => c || createBootstrapDashboard(profile));
        try { await loadRoleData(token, profile); } catch (error) {
          if (!active) return;
          if (error?.status === 401) { localStorage.removeItem("danilo.token"); setToken(""); setUser(null); setDashboard(null); setLoginError("Your session expired. Please sign in again."); return; }
          setDashboard(createBootstrapDashboard(profile));
          setDashboardError(error?.message || "Dashboard data could not be loaded yet.");
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) { localStorage.removeItem("danilo.token"); setToken(""); setUser(null); setDashboard(null); setLoginError("Your session expired. Please sign in again."); return; }
        setDashboardError(error?.message || "Unable to restore your session.");
      } finally { if (active) setSessionLoading(false); }
    }
    restoreSession();
    return () => { active = false; };
  }, [token]);

  const handleLoginChange = (e) => { const { name, value } = e.target; setLoginForm((c) => ({ ...c, [name]: value })); };
  const handleTutorChange = (e) => { const { name, value } = e.target; setTutorForm((c) => ({ ...c, [name]: value })); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    setDashboardError("");
    try {
      const response = await apiRequest("/auth/login", { method: "POST", body: { username: loginForm.username.trim(), password: loginForm.password } });
      if (!response?.accessToken || !response?.user) throw new Error("Invalid username or password");
      localStorage.setItem("danilo.token", response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      setDashboard(createBootstrapDashboard(response.user));
      navigate("/overview");
      loadRoleData(response.accessToken, response.user).catch((error) => {
        if (error?.status === 401) { localStorage.removeItem("danilo.token"); setToken(""); setUser(null); setDashboard(null); setLoginError("Your session expired. Please sign in again."); return; }
        setDashboard(createBootstrapDashboard(response.user));
        setDashboardError(error?.message || "Dashboard data could not be loaded yet.");
      });
    } catch (error) {
      if (error?.status === 401) localStorage.removeItem("danilo.token");
      setToken(""); setUser(null); setDashboard(null);
      setLoginError(error?.message || "Invalid username or password");
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    confirm("Sign Out", "Are you sure you want to sign out of DANILO?", () => {
      localStorage.removeItem("danilo.token");
      setToken(""); setUser(null); setDashboard(null); setDashboardError("");
      setAdminUsers([]); setAdminCourses([]); setAdminAssignments([]);
      setTutorMessages([]);
      navigate("/");
    }, { confirmLabel: "Sign Out", variant: "danger" });
  };

  const handleTutorSubmit = async (e, activeSessionId = null, sessionMessages = null) => {
    e.preventDefault();
    if (!token || !tutorForm.question.trim()) return;
    const userMsg = { id: nextMsgId++, role: "user", content: tutorForm.question };
    if (sessionMessages !== null) setTutorMessages([...(sessionMessages || []), userMsg]);
    else setTutorMessages((prev) => [...prev, userMsg]);
    setTutorForm((f) => ({ ...f, question: "" }));
    setTutorLoading(true);
    try {
      const response = await apiRequest("/ai/tutor", {
        method: "POST", token,
        body: { question: userMsg.content, session_id: activeSessionId || null, module_id: tutorForm.moduleId ? Number(tutorForm.moduleId) : null, response_mode: tutorForm.responseMode || "normal" },
      });
      setTutorMessages((prev) => [...prev, { id: nextMsgId++, role: "ai", content: response.answer, context: response.context, sessionId: response.sessionId }]);
    } catch (error) {
      setTutorMessages((prev) => [...prev, { id: nextMsgId++, role: "ai", content: error.message, context: {} }]);
    } finally { setTutorLoading(false); }
  };

  const installApp = async () => { if (!promptEvent) return; await promptEvent.prompt(); setPromptEvent(null); };

  /* Loading state */
  if (token && sessionLoading && (!user || !dashboard)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="dn-card p-8 w-full max-w-xs text-center shadow-lg">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Opening DANILO</p>
          <p className="text-xs text-slate-400 mt-1">Restoring your session...</p>
        </div>
      </div>
    );
  }

  /* Dashboard error fallback */
  if (token && dashboardError && (!user || !dashboard)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="dn-card p-8 w-full max-w-xs text-center border-warm-200 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-warm-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <p className="text-sm font-semibold text-slate-900">Unable to load dashboard</p>
          <p className="text-xs text-warm-600 mt-1.5 leading-relaxed">{dashboardError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 dn-btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  /* Login screen */
  if (!token || !dashboard || !user) {
    return <LoginView form={loginForm} onChange={handleLoginChange} onSubmit={handleLoginSubmit} loading={loading} error={loginError} />;
  }

  /* Authenticated layout */
  const { page } = route;
  const forbidden = page !== "not-found" && !isAllowed(user.role, page);

  function renderPage() {
    if (forbidden) return <ForbiddenView navigate={navigate} />;
    switch (page) {
      case "overview": return <HomeView user={user} dashboard={dashboard} onNavigate={navigate} />;
      case "my-classes": return <MyClassesView courses={dashboard.courses} navigate={navigate} />;
      case "class-detail": return <ClassDetailView classId={route.classId} tab={route.tab} courses={dashboard.courses} dashboard={dashboard} navigate={navigate} token={token} user={user} reloadData={reloadData} />;
      case "grades": return <GradesView grades={normalizeGradeRows(dashboard.grades)} />;
      case "ai-tutor": return <TutorView token={token} modules={dashboard.contentFolders} />;
      case "users": return <AdminUsersView token={token} users={adminUsers} reload={reloadData} />;
      case "classes": return <AdminClassesView token={token} users={adminUsers} courses={adminCourses} reload={reloadData} />;
      case "sections": return <AdminSectionsView token={token} users={adminUsers} reload={reloadData} />;
      case "enrollments": return <AdminEnrollmentsView token={token} users={adminUsers} courses={adminCourses} reload={reloadData} />;
      case "departments": return <DepartmentsView token={token} reload={reloadData} />;
      case "assignments": return <AdminAssignmentsView assignments={adminAssignments} />;
      case "reports": return <ReportsView token={token} dashboard={dashboard} />;
      case "system": case "settings": return <SystemView token={token} addToast={addToast} />;
      case "announcements": return user.role === "admin" ? <AdminAnnouncementsView token={token} reload={reloadData} /> : <TeacherAnnouncementsView token={token} courses={adminCourses} reload={reloadData} />;
      case "not-found": default: return <NotFoundView navigate={navigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} currentPage={page} navigate={navigate} onLogout={handleLogout} />
      <MobileTopBar user={user} currentPage={page} onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawer open={mobileMenuOpen} user={user} currentPage={page} navigate={navigate} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} />

      <main className="md:pl-[72px] lg:pl-[256px]">
        <TopBar user={user} currentPage={page} />
        <div className="min-h-screen pt-[56px] md:pt-0 pb-[80px] md:pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
            <InstallBanner promptEvent={promptEvent} onInstall={installApp} onDismiss={() => setPromptEvent(null)} />

            {isOffline && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-danger-200">
                    <svg className="w-4 h-4 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Disconnected from DANILO</p>
                    <p className="text-xs text-danger-600 mt-0.5">Please check your Wi-Fi connection.</p>
                  </div>
                </div>
              </div>
            )}

            {dashboardError && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Live data unavailable</p>
                  <p className="text-xs text-slate-500 mt-0.5">{dashboardError}</p>
                </div>
              </div>
            )}

            {renderPage()}
          </div>
        </div>
      </main>

      <MobileBottomNav currentPage={page} navigate={navigate} role={user.role} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} onConfirm={() => { closeConfirm(); confirmState.onConfirm && confirmState.onConfirm(); }} onCancel={closeConfirm} confirmLabel={confirmState.confirmLabel} variant={confirmState.variant} />
    </div>
  );
}
