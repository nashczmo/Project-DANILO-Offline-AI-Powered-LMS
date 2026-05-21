import { useState, useRef, useEffect } from "react";
import { Card, Button, PageHeader } from "../../components/ui";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export default function StudentTutor() {
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hello! I am your DANILO AI Tutor. How can I help you with your lessons today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const token = useAppStore((s) => s.token);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickActions = [
    { label: "Simplify", hiddenInstruction: "Please provide a simplified explanation." }, 
    { label: "Explain Step-by-Step", hiddenInstruction: "Please break down the explanation step-by-step." }, 
    { label: "Explain in Filipino", hiddenInstruction: "Please explain the answer in Tagalog/Filipino." }, 
    { label: "Quiz Me", hiddenInstruction: "Please give me a short quiz about the topic." }, 
    { label: "Practice More", hiddenInstruction: "Please give me some practice exercises." }, 
    { label: "Give Real-Life Localized Example", hiddenInstruction: "Please provide a real-life example localized to the Philippines." }
  ];

  const handleSend = async (text, hiddenInstruction = null) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const assistantMessageId = Date.now() + 1;
      setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      let query = text;
      if (hiddenInstruction) {
        query = `${text}\n\n[System Instruction: ${hiddenInstruction}]`;
      }

      const response = await fetch('/api/ai/tutor/stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error("Failed to connect to AI");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      setIsTyping(false);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          const lines = chunkString.split('\n');
          let appendedText = "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr.trim() === "[DONE]") continue;
              appendedText += dataStr;
            }
          }
          
          if (appendedText) {
            // Unescape newlines if the server sends \n literal
            appendedText = appendedText.replace(/\\n/g, '\n');
            setMessages(prev => prev.map(msg => {
              if (msg.id === assistantMessageId) {
                return { ...msg, content: msg.content + appendedText };
              }
              return msg;
            }));
          }
        }
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 2, role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader 
        title="AI Tutor" 
        description="Ask questions, get explanations, and practice your lessons."
      />

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden p-0 rounded-2xl">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-danilo-primary text-white" : "bg-danilo-bg-tertiary text-danilo-primary"
              }`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user" 
                  ? "bg-danilo-primary text-white rounded-tr-none" 
                  : "bg-danilo-bg-secondary border border-danilo-border text-danilo-text rounded-tl-none"
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-danilo-bg-tertiary text-danilo-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-danilo-bg-secondary border border-danilo-border rounded-tl-none flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-danilo-text-placeholder animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-danilo-text-placeholder animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-danilo-text-placeholder animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-danilo-border bg-white">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action.label, action.hiddenInstruction)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 px-4 py-2 border border-danilo-border rounded-xl focus:outline-none focus:ring-2 focus:ring-danilo-primary focus:border-transparent text-sm"
            />
            <Button type="submit" disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
