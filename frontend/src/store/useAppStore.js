import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  token: localStorage.getItem("danilo.token") || "",
  user: null,
  dashboard: null,
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  mobileMenuOpen: false,
  sidebarCollapsed: localStorage.getItem("danilo.sidebar.collapsed") === "true",
  promptEvent: null,
  toasts: [],

  setToken: (token) => {
    if (token) localStorage.setItem("danilo.token", token);
    else localStorage.removeItem("danilo.token");
    set({ token });
  },
  setUser: (user) => set({ user }),
  setDashboard: (dashboard) => set({ dashboard }),
  setOffline: (isOffline) => set({ isOffline }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    localStorage.setItem("danilo.sidebar.collapsed", String(next));
    set({ sidebarCollapsed: next });
  },
  setPromptEvent: (promptEvent) => set({ promptEvent }),

  addToast: (message, type = "info") => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts.slice(-4), { id, message, type }] }));
    if (type !== "danger") setTimeout(() => get().dismissToast(id), 4500);
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  logout: () => {
    localStorage.removeItem("danilo.token");
    set({ token: "", user: null, dashboard: null, toasts: [] });
  },
}));
