import { memo } from "react";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

const TABS = [
  { path: "/overview", label: "Overview", icon: LayoutDashboard, page: "overview" },
  { path: "/ai-tutor", label: "AI Tutor", icon: Sparkles, page: "ai-tutor" },
  { path: "/my-classes", label: "My Classes", icon: BookOpen, page: "my-classes" },
  { path: "/grades", label: "Grades", icon: TrendingUp, page: "grades" },
];

function isNavActive(currentPage, tabPage) {
  if (currentPage === tabPage) return true;
  if (currentPage === "class-detail" && tabPage === "my-classes") return true;
  return false;
}

export default memo(function MobileNav({ currentPage, navigate }) {
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-danilo-border">
      <div className="flex items-stretch justify-around pt-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = isNavActive(currentPage, tab.page);
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 flex-1 transition-all duration-150",
                isActive ? "text-danilo-primary" : "text-danilo-text-muted"
              )}
            >
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-danilo-primary" />
              )}
              <Icon className="w-5 h-5" />
              <span className={cn("max-w-[64px] truncate text-[10px] font-medium", isActive ? "text-danilo-primary" : "text-danilo-text-muted")}>
                {tab.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 flex-1 transition-all duration-150 text-danilo-text-muted"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="max-w-[64px] truncate text-[10px] font-medium text-danilo-text-muted">More</span>
        </button>
      </div>
    </nav>
  );
});
