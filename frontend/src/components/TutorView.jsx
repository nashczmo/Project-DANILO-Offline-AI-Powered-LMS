import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  Sparkles,
  Send,
  Plus,
  Menu,
  X,
  Trash2,
  Copy,
  RotateCcw,
  Square,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { apiUrl } from "../api";
import { cn, formatTime } from "../lib/utils";
import MarkdownRenderer from "./ui/MarkdownRenderer";

const SESSION_PAGE_SIZE = 40;

const SUGGESTED_PROMPTS = [
  { icon: "🔬", text: "Explain photosynthesis step by step" },
  { icon: "📐", text: "Help me solve this math problem" },
  { icon: "📋", text: "Summarize the key points of this lesson" },
  { icon: "📝", text: "Give me practice quiz questions" },
];

const AI_AVATAR = (
  <div className="w-7 h-7 rounded-full bg-danilo-primary-subtle flex items-center justify-center flex-shrink-0 mt-0.5 border border-danilo-primary/20">
    <Sparkles className="w-3.5 h-3.5 text-danilo-primary" />
  </div>
);

function ChatBubbleUser({ content, time }) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div className="max-w-[85%] sm:max-w-[72%]">
        <div className="dn-chat-user">
          <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {time && (
          <p className="text-[10px] text-danilo-text-muted text-right mt-1 mr-1">{time}</p>
        )}
      </div>
    </div>
  );
}

function ChatBubbleAI({ content, time, onCopy, onRegenerate, isStreaming }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex justify-start gap-2.5 animate-fade-in">
      {AI_AVATAR}
      <div className="max-w-[88%] sm:max-w-[74%]">
        <div className="dn-card px-4 py-3 text-sm">
          <MarkdownRenderer content={content} />
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-danilo-primary ml-0.5 animate-pulse align-text-bottom" aria-hidden="true" />
          )}
          {!isStreaming && content && (
            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-danilo-border/30">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-danilo-text-muted hover:text-danilo-text transition-colors"
                title="Copy response"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 text-[11px] text-danilo-text-muted hover:text-danilo-text transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3 h-3" />
                  Regenerate
                </button>
              )}
            </div>
          )}
        </div>
        {time && (
          <p className="text-[10px] text-danilo-text-muted mt-1 ml-1">{time}</p>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ warmingUp, queuePosition }) {
  return (
    <div className="flex justify-start gap-2.5 animate-fade-in">
      {AI_AVATAR}
      <div className="dn-card px-4 py-3">
        {queuePosition != null ? (
          <p className="text-xs text-danilo-text-muted">Queued (position {queuePosition})...</p>
        ) : warmingUp ? (
          <p className="text-xs text-danilo-text-muted animate-pulse">Warming up AI model...</p>
        ) : (
          <div className="flex items-center gap-1.5" aria-label="AI is thinking">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-danilo-text-muted animate-bounce-dot"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionItem({ session, isActive, onSelect, onDelete }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={cn(
        "w-full text-left rounded-xl px-3 py-2.5 text-sm transition group relative",
        isActive
          ? "bg-danilo-primary-subtle text-danilo-primary font-medium"
          : "text-danilo-text-secondary hover:bg-danilo-surface-hover"
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="truncate leading-snug">{session.title || `Chat ${session.id}`}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
          className="flex-shrink-0 text-danilo-text-muted hover:text-danilo-error transition opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-0.5 rounded"
          title="Delete conversation"
          aria-label={`Delete conversation: ${session.title || `Chat ${session.id}`}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {session.updatedAt && (
        <p className="text-[10px] text-danilo-text-muted mt-0.5">
          {new Date(session.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      )}
    </button>
  );
}

export default memo(function TutorView({ token, modules }) {
  const hasModules = Array.isArray(modules) && modules.length > 0;
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localForm, setLocalForm] = useState({ question: "", moduleId: "", responseMode: "normal" });
  const [error, setError] = useState("");

  const [sessionOffset, setSessionOffset] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);

  const msgIdCounter = useRef(0);
  function nextId() { return ++msgIdCounter.current; }

  function refreshSessions() {
    fetch(apiUrl("/ai/sessions"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setSessions(Array.isArray(data.sessions) ? data.sessions : []))
      .catch(() => {});
  }

  async function loadSession(id, offset = 0, append = false) {
    setSessionLoading(true);
    try {
      const url = apiUrl(`/ai/sessions/${id}/messages?offset=${offset}&limit=${SESSION_PAGE_SIZE}`);
      const data = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : Promise.reject(new Error("Could not load conversation.")));
      const msgs = (data.messages || []).map((m) => ({ ...m, id: m.id || nextId() }));
      setMessages(append ? (prev) => [...msgs, ...prev] : msgs);
      setActiveSessionId(id);
      setSessionOffset(offset + msgs.length);
      setError("");
    } catch (err) {
      setError(err?.message || "Could not load conversation.");
    } finally {
      setSessionLoading(false);
      setSidebarOpen(false);
    }
  }

  async function newSession() {
    setMessages([]);
    setActiveSessionId(null);
    setStreamingContent(null);
    setQueuePosition(null);
    setError("");
    setLocalForm((f) => ({ ...f, question: "" }));
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function deleteSession(id) {
    if (!window.confirm("Delete this conversation?")) return;
    await fetch(apiUrl(`/ai/sessions/${id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (activeSessionId === id) newSession();
    refreshSessions();
  }

  const handleLocalChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(null);
    }
  }

  async function handleSubmit(e, presetQuestion) {
    if (e) e.preventDefault();
    const question = (presetQuestion || localForm.question).trim();
    if (!question || !token || loading) return;

    const userMsg = { id: nextId(), role: "user", content: question, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLocalForm((f) => ({ ...f, question: "" }));
    setLoading(true);
    setError("");
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(apiUrl("/ai/tutor/stream"), {
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

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6).trim();
          if (payload === "[DONE]") break outer;
          try {
            const chunk = JSON.parse(payload);
            const position = chunk.queue_position ?? chunk.position;
            if (position != null) {
              setQueuePosition(position);
              if (chunk.warming_up) setIsWarmingUp(true);
              continue;
            }
            if (chunk.thinking) {
              setQueuePosition(null);
              setIsWarmingUp(Boolean(chunk.warming_up));
              continue;
            }
            setQueuePosition(null);
            setIsWarmingUp(false);
            if (chunk.session_id || chunk.sessionId) receivedSessionId = chunk.session_id || chunk.sessionId;
            const content = chunk.token ?? chunk.content;
            if (content) { fullAnswer += content; setStreamingContent(fullAnswer); }
            if (chunk.done) break outer;
            if (chunk.error) throw new Error(chunk.error);
          } catch (_) {}
        }
      }

      setStreamingContent(null);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "ai", content: fullAnswer, sessionId: receivedSessionId, createdAt: new Date().toISOString() },
      ]);
      if (receivedSessionId && receivedSessionId !== activeSessionId) {
        setActiveSessionId(receivedSessionId);
        refreshSessions();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to get a response. Please try again.");
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "ai", content: err.message || "Something went wrong.", createdAt: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
      setStreamingContent(null);
      setQueuePosition(null);
      setIsWarmingUp(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setStreamingContent(null);
    setQueuePosition(null);
    setIsWarmingUp(false);
  }

  useEffect(() => { if (token) refreshSessions(); }, [token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !loading;
  const statusText = loading
    ? queuePosition != null ? `Queued (#${queuePosition})` : isWarmingUp ? "Warming up..." : "Thinking..."
    : "Ready";

  return (
    <div className="flex h-[calc(100dvh-64px)] md:h-[calc(100dvh-56px-2rem)] lg:h-[calc(100dvh-56px)] -mx-4 sm:-mx-6 lg:mx-0 overflow-hidden rounded-none lg:rounded-2xl border-y lg:border border-danilo-border bg-danilo-surface">

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-10 bg-black/50"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Session sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-danilo-border bg-danilo-bg transition-all duration-250 z-20",
          sidebarOpen
            ? "fixed inset-y-0 left-0 w-[min(85vw,288px)] shadow-xl"
            : "hidden lg:block w-[256px]"
        )}
        aria-label="Conversations"
      >
        <div className="px-3 py-3.5 border-b border-danilo-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-xs font-semibold text-danilo-text uppercase tracking-wider">Conversations</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={newSession}
              className="h-7 w-7 rounded-lg bg-danilo-primary text-white flex items-center justify-center hover:bg-danilo-primary-hover transition"
              title="New conversation"
              aria-label="New conversation"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-7 w-7 rounded-lg text-danilo-text-muted hover:bg-danilo-surface-hover flex items-center justify-center transition"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-xs text-danilo-text-muted text-center py-6 px-3">
              Start chatting to see your conversation history here.
            </p>
          )}
          {sessions.map((s) => (
            <SessionItem
              key={s.id}
              session={s}
              isActive={activeSessionId === s.id}
              onSelect={(id) => loadSession(id)}
              onDelete={deleteSession}
            />
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="h-14 border-b border-danilo-border flex items-center justify-between px-4 flex-shrink-0 bg-danilo-bg/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg text-danilo-text-muted hover:bg-danilo-surface-hover flex items-center justify-center transition flex-shrink-0"
              aria-label="Open conversation list"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-danilo-primary-subtle flex items-center justify-center flex-shrink-0 border border-danilo-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-danilo-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-danilo-text truncate">DANILO AI</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      loading ? "bg-danilo-warning animate-pulse" : "bg-danilo-success"
                    )}
                  />
                  <p className="text-[11px] text-danilo-text-muted">{statusText}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={newSession}
            className="dn-btn-secondary dn-btn-sm flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-label="Conversation">

          {/* Empty state */}
          {isEmpty && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-danilo-primary-subtle flex items-center justify-center mb-5 border border-danilo-primary/20">
                <Sparkles className="w-7 h-7 text-danilo-primary" />
              </div>
              <p className="text-base font-semibold text-danilo-text">Ask DANILO anything</p>
              <p className="text-sm text-danilo-text-muted mt-1.5 max-w-xs leading-relaxed">
                Get help with subjects, review concepts, or prepare for assessments. Your AI tutor is ready.
              </p>

              {hasModules && (
                <div className="flex items-center gap-2 mt-4 text-xs text-danilo-text-muted bg-danilo-bg px-3 py-1.5 rounded-full border border-danilo-border">
                  <BookOpen className="w-3 h-3 flex-shrink-0" />
                  Context-aware answers from your modules
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSubmit(null, p.text)}
                    className="flex items-start gap-2.5 text-left px-3.5 py-3 rounded-xl bg-danilo-bg border border-danilo-border text-sm text-danilo-text-secondary hover:border-danilo-primary/30 hover:bg-danilo-primary-muted transition-colors"
                  >
                    <span className="text-base leading-none flex-shrink-0 mt-px">{p.icon}</span>
                    <span className="leading-snug">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Load older */}
          {!isEmpty && activeSessionId && sessionOffset >= SESSION_PAGE_SIZE && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => loadSession(activeSessionId, sessionOffset, true)}
                disabled={sessionLoading}
                className="flex items-center gap-1.5 text-xs text-danilo-text-muted hover:text-danilo-text transition-colors disabled:opacity-50"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                {sessionLoading ? "Loading..." : "Load earlier messages"}
              </button>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) =>
            msg.role === "user"
              ? <ChatBubbleUser key={msg.id} content={msg.content} time={formatTime(msg.createdAt)} />
              : <ChatBubbleAI key={msg.id} content={msg.content} time={formatTime(msg.createdAt)} isStreaming={false} />
          )}

          {/* Streaming bubble */}
          {streamingContent != null && (
            <ChatBubbleAI content={streamingContent} isStreaming={true} />
          )}

          {/* Typing indicator (waiting, no content yet) */}
          {loading && streamingContent == null && (
            <TypingIndicator warmingUp={isWarmingUp} queuePosition={queuePosition} />
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-danilo-error-subtle border border-danilo-error/20 px-4 py-3 text-sm text-danilo-error" role="alert">
              {error}
            </div>
          )}

          <div ref={endRef} aria-hidden="true" />
        </div>

        {/* Input area */}
        <div className="border-t border-danilo-border p-3 flex-shrink-0 bg-danilo-bg/30">
          {hasModules && (
            <div className="mb-2">
              <select
                name="moduleId"
                value={localForm.moduleId}
                onChange={handleLocalChange}
                className="dn-input dn-input-sm text-xs w-full sm:w-auto sm:max-w-[260px]"
                aria-label="Module context"
              >
                <option value="">All modules</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                name="question"
                value={localForm.question}
                onChange={handleLocalChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="dn-input resize-none leading-relaxed"
                style={{ minHeight: "42px", maxHeight: "160px", overflowY: "auto" }}
                disabled={loading}
                aria-label="Message input"
                autoComplete="off"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
              />
            </div>
            {loading ? (
              <button
                type="button"
                onClick={handleStop}
                className="dn-btn-danger h-[42px] w-[42px] p-0 flex-shrink-0"
                title="Stop generation"
                aria-label="Stop AI response"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!localForm.question.trim()}
                className="dn-btn-primary h-[42px] w-[42px] p-0 flex-shrink-0"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
          <p className="text-[10px] text-danilo-text-muted mt-1.5 pl-1 hidden sm:block">
            Press <kbd className="px-1 py-px rounded bg-danilo-bg border border-danilo-border text-[10px]">Enter</kbd> to send
            &nbsp;·&nbsp;
            <kbd className="px-1 py-px rounded bg-danilo-bg border border-danilo-border text-[10px]">Shift+Enter</kbd> for newline
          </p>
        </div>
      </div>
    </div>
  );
});
