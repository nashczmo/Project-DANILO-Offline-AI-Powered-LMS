import { useCallback, useEffect, useState } from "react";

export function usePath() {
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

export function matchRoute(path) {
  const p = path.replace(/\/+$/, "") || "/";
  const classMatch = p.match(/^\/class\/(\d+)\/(stream|classwork|people|grades|insights)$/);
  if (classMatch) return { page: "class-detail", classId: Number(classMatch[1]), tab: classMatch[2] };
  const classBase = p.match(/^\/class\/(\d+)$/);
  if (classBase) return { page: "class-detail", classId: Number(classBase[1]), tab: "stream" };
  const routes = {
    "/": "overview",
    "/overview": "overview",
    "/my-classes": "my-classes",
    "/users": "users",
    "/classes": "classes",
    "/sections": "sections",
    "/enrollments": "enrollments",
    "/assignments": "assignments",
    "/grades": "grades",
    "/reports": "reports",
    "/settings": "settings",
    "/system": "system",
    "/ai-tutor": "ai-tutor",
    "/announcements": "announcements",
    "/departments": "departments",
  };
  return { page: routes[p] || "not-found" };
}
