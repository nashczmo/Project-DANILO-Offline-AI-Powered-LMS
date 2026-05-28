import { useState, useRef, useEffect } from "react";
import { Card, PageHeader, Button } from "../../components/ui";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Paperclip,
  X,
  FileText,
  Loader2,
  ChevronLeft,
  MessageSquarePlus,
  Trash2,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { apiUrl, apiRequest } from "../../api";

function MarkdownPreview({ content }) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\*|\n- .*)/g);
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith("```") && part.endsWith("```")) {
          return (
            <pre key={index} className="bg-[#202124] text-[#E8EAED] p-4 rounded-xl overflow-x-auto text-xs font-mono my-3">
              {part.slice(3, -3).replace(/^[a-z]+\n/, "")}
            </pre>
          );
        } else if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
        } else if (part.startsWith("\n- ")) {
          return (
            <div key={index} className="flex gap-2.5 my-1 ml-2">
              <span className="text-current opacity-60 mt-0.5 text-xs">{String.fromCharCode(8226)}</span>
              <span>{part.slice(3)}</span>
            </div>
          );
        }
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
}

export default function StudentTutor() {
  const token = useAppStore((s) => s.token);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your DANILO AI Tutor. Ask me anything about your lessons, upload a file to analyze, or choose a quick action below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    fetchFiles();
    fetchSessions();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setShowSessions(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch(apiUrl("/ai/files"), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFiles(await res.json());
    } catch (e) {
      console.error("Failed to load files", e);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await apiRequest("/ai/sessions");
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    setUploadError("");
    try {
      const res = await fetch(apiUrl("/ai/files/upload"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        await fetchFiles();
      } else {
        setUploadError("Upload failed. Ensure the file type is supported and readable.");
      }
    } catch (err) {
      console.error(err);
      setUploadError("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      const res = await fetch(apiUrl(`/ai/files/${fileId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewSession = async () => {
    try {
      const data = await apiRequest("/ai/sessions", { method: "POST", body: { title: "New Conversation" } });
      setCurrentSessionId(data.id);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I am your DANILO AI Tutor. Ask me anything about your lessons, upload a file to analyze, or choose a quick action below.",
        },
      ]);
      await fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const data = await apiRequest(`/ai/sessions/${sessionId}/messages`);
      setCurrentSessionId(sessionId);
      const msgs = (data.messages || []).map((m) => ({ id: m.id, role: m.role, content: m.content }));
      if (msgs.length === 0) {
        msgs.push({
          id: "welcome",
          role: "assistant",
          content: "Continue your conversation...",
        });
      }
      setMessages(msgs);
      setShowSessions(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await apiRequest(`/ai/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hello! I am your DANILO AI Tutor. Ask me anything about your lessons, upload a file to analyze, or choose a quick action below.",
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const quickActions = [
    { label: "Simplify", mode: "simplify" },
    { label: "Step-by-Step", mode: "step_by_step" },
    { label: "In Filipino", mode: "filipino" },
    { label: "Quiz Me", mode: "quiz_me" },
    { label: "Practice", mode: "practice" },
    { label: "Real-Life Example", mode: "real_life" },
  ];

  const handleSend = async (text, mode = "normal") => {
    if (!text.trim()) return;
    const userMessage = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const assistantMessageId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      const response = await fetch(apiUrl("/ai/tutor/stream"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: text, response_mode: mode, session_id: currentSessionId }),
      });

      if (!response.ok) throw new Error("Failed to connect to AI");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      setIsTyping(false);
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let appendedText = "";
          let newIndex;
          while ((newIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newIndex);
            buffer = buffer.slice(newIndex + 1);
            if (line.startsWith("event: error")) {
              // The next line should be data: {"detail": "..."}
              continue;
            }
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6);
              if (dataStr.trim() === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.detail) {
                   throw new Error(parsed.detail);
                }
                if (parsed.done) {
                  if (parsed.sessionId) setCurrentSessionId(parsed.sessionId);
                } else if (parsed.content) {
                  appendedText += parsed.content;
                }
              } catch (e) {
                if (e.message !== "Unexpected end of JSON input" && !e.message.includes("is not valid JSON")) {
                   throw e;
                }
                if (!dataStr.startsWith("{")) appendedText += dataStr;
              }
            }
          }
          if (appendedText) {
            appendedText = appendedText.replace(/\\n/g, "\n");
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === assistantMessageId) {
                  return { ...msg, content: msg.content + appendedText };
                }
                return msg;
              })
            );
          }
        }
      }
      await fetchSessions();
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      const errorMessage = error.message && error.message !== "Failed to fetch" && error.message !== "Failed to connect to AI" 
        ? error.message 
        : "DANILO Tutor is offline or still getting ready. Please check the local AI runtime and try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: errorMessage,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        title="AI Tutor"
        description="Your personal learning assistant. Ask questions, upload files, and get help with any subject."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowSessions(!showSessions)}>
              <MessageSquarePlus className="w-4 h-4" />
              Sessions
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNewSession}>
              <Sparkles className="w-4 h-4" />
              New
            </Button>
          </div>
        }
      />

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden p-0 rounded-2xl relative">
        {/* Sessions Sidebar Overlay */}
        {showSessions && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex">
            <div ref={sidebarRef} className="w-full max-w-sm border-r border-[#E0E0E0] bg-white flex flex-col">
              <div className="p-4 border-b border-[#E0E0E0] flex items-center justify-between">
                <h3 className="text-base font-black text-[#202124]">Conversations</h3>
                <button onClick={() => setShowSessions(false)} className="p-1.5 rounded-lg hover:bg-[#F1F3F4]">
                  <ChevronLeft className="w-4 h-4 text-[#5F6368]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sessions.length === 0 && (
                  <p className="text-sm text-[#9AA0A6] font-bold text-center py-8">No conversations yet.</p>
                )}
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      currentSessionId === s.id
                        ? "bg-[#E8F0FE] border-[#1A73E8]/20"
                        : "bg-white border-[#E0E0E0] hover:bg-[#F8F9FA]"
                    }`}
                    onClick={() => loadSession(s.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#202124] truncate">{s.title}</p>
                      <p className="text-xs text-[#9AA0A6] font-bold">{s.messageCount} messages</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#FCE8E6] hover:text-[#D93025] text-[#9AA0A6] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setShowSessions(false)} />
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-[#1A73E8] text-white" : "bg-[#E8F0FE] text-[#1A73E8]"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[85%] sm:max-w-[75%] group ${
                  msg.role === "user"
                    ? "bg-[#1A73E8] text-white rounded-2xl rounded-tr-sm px-5 py-3.5 text-[15px] shadow-sm leading-relaxed"
                    : "bg-white border border-[#E0E0E0] rounded-2xl rounded-tl-sm px-5 py-3.5 text-[15px] shadow-sm leading-relaxed text-[#202124]"
                }`}
              >
                <MarkdownPreview content={msg.content} />
                {msg.role === "assistant" && !isTyping && msg.content && (
                  <div className="flex justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 text-[#9AA0A6] hover:text-[#1A73E8] hover:bg-[#E8F0FE] rounded-md transition-colors"
                      title="Copy"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#E0E0E0] rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-10 px-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#E0E0E0] bg-white">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F0FE] border border-[#1A73E8]/20 text-[#1A73E8] rounded-full text-xs font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">{f.filename}</span>
                  <button onClick={() => handleRemoveFile(f.id)} className="hover:text-[#1557B0] ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]">
              {uploadError}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action) => (
              <button
                key={action.mode}
                onClick={() => {
                  const text = input.trim() || "Explain this topic";
                  handleSend(text, action.mode);
                }}
                className="dn-chip hover:bg-[#E8F0FE] hover:text-[#1A73E8] hover:border-[#1A73E8]/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
                {action.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input, "normal");
            }}
            className="flex gap-2 items-end"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.pptx,.txt" />
            <Button type="button" variant="secondary" className="px-3 py-2.5" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isUploading ? "Processing file..." : "Ask DANILO anything..."}
              className="dn-input flex-1"
              disabled={isUploading || isTyping}
            />
            <Button type="submit" disabled={!input.trim() || isTyping || isUploading} className="px-4 py-2.5">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
