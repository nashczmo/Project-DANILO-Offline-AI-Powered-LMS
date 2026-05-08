import { useEffect, useRef, useState, useCallback } from "react";

const DANILO_ICON = (
  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

function ChatBubbleUser({ content, time }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] sm:max-w-[70%]">
        <div className="rounded-2xl rounded-br-md bg-primary-600 text-white px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {time && <p className="text-[11px] text-slate-400 text-right mt-1 mr-1">{time}</p>}
      </div>
    </div>
  );
}

function ChatBubbleAI({ content, time }) {
  return (
    <div className="flex justify-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        {DANILO_ICON}
      </div>
      <div className="max-w-[85%] sm:max-w-[70%]">
        <div className="dn-card px-4 py-3 border-slate-200">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {time && <p className="text-[11px] text-slate-400 mt-1 ml-1">{time}</p>}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        {DANILO_ICON}
      </div>
      <div className="dn-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

const SESSION_PAGE_SIZE = 40;

export default function TutorView({ token, modules, form, onChange, onSubmit: _onSubmitLegacy, loading: _loadingLegacy, messages: _messagesLegacy }) {
  const hasModules = modules && modules.length > 0;
  const endRef = useRef(null);
  const abortRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [localForm, setLocalForm] = useState({ question: "", moduleId: form?.moduleId || "", responseMode: form?.responseMode || "normal" });
  const [error, setError] = useState("");

  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionOffset, setSessionOffset] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);

  const msgIdCounter = useRef(0);
  function nextId() { return ++msgIdCounter.current; }

  function fmtTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function refreshSessions() {
    fetch("/api/ai/sessions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setSessions(Array.isArray(data.sessions) ? data.sessions : []); setSessionTotal(data.total || 0); })
      .catch(() => {});
  }

  async function loadSession(id, offset = 0, append = false) {
    setSessionLoading(true);
    try {
      const url = `/api/ai/sessions/${id}/messages?offset=${offset}&limit=${SESSION_PAGE_SIZE}`;
      const data = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      const msgs = (data.messages || []).map((m) => ({ ...m, id: m.id || nextId() }));
      if (append) {
        setMessages((prev) => [...msgs, ...prev]);
      } else {
        setMessages(msgs);
      }
      setActiveSessionId(id);
      setSessionOffset(offset + msgs.length);
      setError("");
    } catch (_) {
      setError("Could not load conversation.");
    } finally {
      setSessionLoading(false);
    }
  }

  async function loadOlderMessages() {
    if (!activeSessionId || sessionLoading) return;
    await loadSession(activeSessionId, sessionOffset, true);
  }

  async function newSession() {
    setMessages([]);
    setActiveSessionId(null);
    setStreamingContent(null);
    setQueuePosition(null);
    setError("");
    setLocalForm((f) => ({ ...f, question: "" }));
    setSidebarOpen(false);
  }

  async function deleteSession(id, e) {
    e?.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await fetch(`/api/ai/sessions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (activeSessionId === id) newSession();
    refreshSessions();
  }

  const handleLocalChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = localForm.question.trim();
    if (!question || !token) return;
    const userMsg = { id: nextId(), role: "user", content: question, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLocalForm((f) => ({ ...f, question: "" }));
    setLoading(true);
    setError("");
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/tutor/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question,
          session_id: activeSessionId || null,
          module_id: localForm.moduleId ? Number(localForm.moduleId) : null,
          response_mode: localForm.responseMode || "normal",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnswer = "";
      let receivedSessionId = activeSessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data: ")) {
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const chunk = JSON.parse(payload);
              if (chunk.queue_position !== undefined) {
                setQueuePosition(chunk.queue_position);
                if (chunk.warming_up) setIsWarmingUp(true);
                continue;
              }
              if (chunk.session_id) receivedSessionId = chunk.session_id;
              if (chunk.token) { fullAnswer += chunk.token; setStreamingContent(fullAnswer); }
              if (chunk.error) throw new Error(chunk.error);
            } catch (_) {}
          }
        }
      }

      setQueuePosition(null);
      setIsWarmingUp(false);
      setStreamingContent(null);
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", content: fullAnswer, sessionId: receivedSessionId, createdAt: new Date().toISOString() }]);
      if (receivedSessionId && receivedSessionId !== activeSessionId) {
        setActiveSessionId(receivedSessionId);
        refreshSessions();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to get response.");
        setMessages((prev) => [...prev, { id: nextId(), role: "ai", content: err.message || "Failed to get response.", createdAt: new Date().toISOString() }]);
      }
    } finally {
      setLoading(false);
      setStreamingContent(null);
      setQueuePosition(null);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    if (token) refreshSessions();
  }, [token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex h-[calc(100dvh-56px-2rem)] lg:h-[calc(100dvh-56px)] -mx-4 sm:-mx-6 lg:mx-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "absolute inset-y-0 left-0 z-20 w-[280px] border-r border-slate-200 bg-white shadow-lg lg:static lg:shadow-none" : "hidden lg:block w-[260px] border-r border-slate-200 bg-slate-50/50"} flex flex-col`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
          <div className="flex items-center gap-2">
            <button onClick={newSession} className="h-8 w-8 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition" title="New conversation">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No conversations yet</p>}
          {sessions.map((s) => (
            <button key={s.id} onClick={() => loadSession(s.id)} className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition ${activeSessionId === s.id ? "bg-primary-50 text-primary-700 font-medium" : "text-slate-600 hover:bg-slate-100"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{s.title || `Conversation ${s.id}`}</span>
                <button onClick={(e) => deleteSession(s.id, e)} className="flex-shrink-0 text-slate-400 hover:text-danger-500 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ""}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">{DANILO_ICON}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">DANILO AI Assistant</p>
                <p className="text-[11px] text-slate-400">{queuePosition != null ? `Queue position: ${queuePosition}` : isWarmingUp ? "Warming up AI model..." : loading ? "Thinking..." : "Ready"}</p>
              </div>
            </div>
          </div>
          <button onClick={newSession} className="dn-btn-secondary text-xs py-1.5 px-3">New Chat</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Ask DANILO anything</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Get help with subjects, review concepts, or prepare for assessments.</p>
            </div>
          )}

          {sessionLoading && activeSessionId && (
            <div className="text-center"><span className="text-xs text-slate-400">Loading earlier messages...</span></div>
          )}

          {messages.map((msg) => (
            msg.role === "user"
              ? <ChatBubbleUser key={msg.id} content={msg.content} time={fmtTime(msg.createdAt)} />
              : <ChatBubbleAI key={msg.id} content={msg.content} time={fmtTime(msg.createdAt)} />
          ))}

          {streamingContent != null && <ChatBubbleAI content={streamingContent} />}
          {loading && streamingContent == null && <TypingIndicator />}

          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3">
            {hasModules && (
              <select name="moduleId" value={localForm.moduleId} onChange={handleLocalChange} className="dn-input w-auto hidden sm:block" aria-label="Context module">
                <option value="">All modules</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            )}
            <input
              name="question"
              value={localForm.question}
              onChange={handleLocalChange}
              placeholder="Ask a question..."
              className="dn-input flex-1"
              autoComplete="off"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !localForm.question.trim()} className="dn-btn-primary px-4">
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
