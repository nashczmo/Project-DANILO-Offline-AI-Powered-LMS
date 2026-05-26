import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[DANILO] app render error", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl border border-[#E0E0E0] p-8 w-full max-w-md text-center"
               style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div className="w-14 h-14 rounded-2xl bg-[#FCE8E6] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#D93025]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-lg font-black text-[#202124]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[#5F6368] leading-relaxed">
              DANILO encountered an error. Please refresh or run installer verification.
            </p>
            <button
              className="mt-6 dn-btn-primary px-6 py-2.5 rounded-xl text-sm font-bold"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

console.info("[DANILO] frontend mount starting");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.info("[DANILO] service worker registered"))
      .catch((error) => console.error("[DANILO] service worker registration failed", error));
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
