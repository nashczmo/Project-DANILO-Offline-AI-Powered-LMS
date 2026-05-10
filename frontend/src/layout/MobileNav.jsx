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
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV = {
  student: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/my-classes", label: "Subjects", icon: BookOpen, page: "my-classes" },
    { path: "/assignments", label: "Tasks", icon: ClipboardList, page: "assignments" },
    { path: "/ai-tutor", label: "AI", icon: Sparkles, page: "ai-tutor" },
    { path: "/grades", label: "Grades", icon: Award, page: "grades" },
  ],
  teacher: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/my-classes", label: "Subjects", icon: BookOpen, page: "my-classes" },
    { path: "/sections", label: "Sections", icon: Layers, page: "sections" },
    { path: "/announcements", label: "News", icon: Megaphone, page: "announcements" },
    { path: "/ai-tutor", label: "AI", icon: Sparkles, page: "ai-tutor" },
  ],
  admin: [
    { path: "/overview", label: "Dashboard", icon: LayoutDashboard, page: "overview" },
    { path: "/users", label: "People", icon: Users, page: "users" },
    { path: "/classes", label: "Subjects", icon: BookOpen, page: "classes" },
    { path: "/announcements", label: "News", icon: Megaphone, page: "announcements" },
    { path: "/system", label: "System", icon: Cpu, page: "system" },
  ],
};

function isNavActive(currentPage, tabPage) {
  if (currentPage === tabPage) return true;
  if (currentPage === "class-detail" && tabPage === "my-classes") return true;
  return false;
}

export default memo(function MobileNav({ currentPage, navigate, role }) {
  const tabs = (NAV[role] || NAV.student).slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-danilo-border bg-danilo-surface/90 backdrop-blur-md">
      <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom,0px)] pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isNavActive(currentPage, tab.page);
          return (
            <button key={tab.path} type="button" onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 flex-1 transition-all duration-150",
                isActive ? "text-danilo-primary" : "text-danilo-text-muted"
              )}>
              {isActive && <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-danilo-primary" />}
              <Icon className="w-5 h-5" />
              <span className={cn("max-w-[64px] truncate text-[10px] font-medium", isActive ? "text-danilo-primary" : "text-danilo-text-muted")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
