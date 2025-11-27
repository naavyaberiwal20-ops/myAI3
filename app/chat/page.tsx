// app/chat/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Square, Archive, Plus } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { MessageWall } from "@/components/messages/message-wall";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
import { UIMessage } from "ai";

/* ---------------- schema + storage ---------------- */
const formSchema = z.object({ message: z.string().min(1).max(2000) });
const STORAGE_KEY = "chat-messages";
const HISTORY_KEY = "chat-history-v1";

const loadStorage = () => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { messages: parsed.messages || [], durations: parsed.durations || {} };
  } catch { return { messages: [], durations: {} }; }
};
const loadHistory = () => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
const saveHistory = (h: any[]) => { if (typeof window === "undefined") return; localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); };
const saveStorage = (messages: UIMessage[], durations: any) => { if (typeof window === "undefined") return; localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, durations })); };

/* ---------------- page ---------------- */
export default function ChatPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeSeen = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const stored = typeof window !== "undefined" ? loadStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({ messages: initialMessages });

  const [history, setHistory] = useState<any[]>(loadHistory());
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  /* init */
  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);

  useEffect(() => { if (isClient) saveStorage(messages, durations); }, [messages, durations, isClient]);

  /* welcome */
  useEffect(() => {
    if (!isClient || welcomeSeen.current || initialMessages.length > 0) return;
    const welcomeMsg: UIMessage = { id: "welcome-" + Date.now(), role: "assistant", parts: [{ type: "text", text: WELCOME_MESSAGE }] };
    setMessages([welcomeMsg]);
    saveStorage([welcomeMsg], {});
    welcomeSeen.current = true;
  }, [isClient]);

  /* form */
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { message: "" } });

  const onSubmit = (vals: any) => {
    sendMessage({ text: vals.message });
    form.reset();
    if (inputRef.current) inputRef.current.style.height = "44px";
  };

  function clearChat() {
    setMessages([]);
    setDurations({});
    saveStorage([], {});
    setSelectedHistoryId(null);
    toast.success("Chat cleared");
  }

  /* sidebar actions */
  const newChat = () => {
    clearChat();
    const starter: UIMessage = { id: `assistant-${Date.now()}`, role: "assistant", parts: [{ type: "text", text: WELCOME_MESSAGE }] };
    setMessages([starter]);
    saveStorage([starter], {});
    setSelectedHistoryId(null);
  };

  const insertPlanPrompt = () => {
    const planPrompt =
      "Create a concise 30/60/90 day sustainability action plan for a small business focused on reducing waste and sourcing better materials. Prioritise quick wins first.";
    sendMessage({ text: planPrompt });
  };

  const loadHistoryItem = (id: string) => {
    const h = loadHistory();
    const item = h.find((x: any) => x.id === id);
    if (!item) { toast.error("History not found"); return; }
    setMessages(item.messages);
    saveStorage(item.messages, {});
    setSelectedHistoryId(id);
    toast.success(`Loaded "${item.title}"`);
  };

  const saveCurrentToHistory = () => {
    if (!isClient) return;
    const existing = loadHistory();
    const title = `Saved ${new Date().toLocaleString()}`;
    const id = "h-" + Date.now();
    const newItem = { id, title, messages };
    const next = [newItem, ...existing].slice(0, 12);
    saveHistory(next);
    setHistory(next);
    toast.success("Saved conversation");
  };

  const deleteHistoryItem = (id: string) => {
    const existing = loadHistory();
    const next = existing.filter((x: any) => x.id !== id);
    saveHistory(next);
    setHistory(next);
    if (selectedHistoryId === id) setSelectedHistoryId(null);
    toast.success("Deleted");
  };

  useEffect(() => {
    const handler = () => setHistory(loadHistory());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* layout constants */
  const HEADER_HEIGHT = 84; // ensures enough top padding so first message isn't hidden

  return (
    <div className="greanly-shell">
      <div className="page-grid">
        {/* SIDEBAR */}
        <aside className="sidebar" aria-label="App sidebar">
          <div className="brand">
            <div className="brand-badge"><Image src="/logo.png" width={40} height={40} alt="Greanly" /></div>
            <div className="brand-info">
              <div className="brand-title">Greanly</div>
              <div className="brand-sub">AI + practical sustainability</div>
            </div>
          </div>

          <div className="sidebar-actions">
            {/* NEW CHAT: moved here and styled to be clearly visible (not blank) */}
            <button className="btn new-left" onClick={newChat} aria-label="New Chat">
              <Plus size={14} /> <span>New Chat</span>
            </button>

            {/* 30/60/90 plan */}
            <button className="btn ghost" onClick={insertPlanPrompt}><Archive size={14} /> <span>30/60/90 plan</span></button>
          </div>

          <div className="history-head">
            <div>History</div>
            <div className="history-controls">
              <button className="mini" onClick={() => { setHistory(loadHistory()); toast.success("History refreshed"); }}>Refresh</button>
              <button className="mini" onClick={saveCurrentToHistory}>Save</button>
            </div>
          </div>

          <nav className="history-list" aria-label="Saved conversations">
            {history.length === 0 && <div className="empty">No saved conversations yet</div>}
            {history.map((h: any) => (
              <div key={h.id} className={`history-item ${selectedHistoryId === h.id ? "active" : ""}`}>
                <div className="history-main" role="button" onClick={() => loadHistoryItem(h.id)}>
                  <div className="history-title">{h.title}</div>
                  <div className="history-meta">{(h.messages?.length || 0)} msgs</div>
                </div>
                <div className="history-actions">
                  <button className="tiny" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(h.messages || [])); toast.success("Copied"); }}>Copy</button>
                  <button className="tiny danger" onClick={() => deleteHistoryItem(h.id)}>Del</button>
                </div>
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">Pro tip: save chats you want to revisit</div>
        </aside>

        {/* MAIN */}
        <main className="main">
          {/* top header */}
          <header className="topbar" style={{ height: HEADER_HEIGHT }}>
            <div className="top-left">
              <div className="logo-wrap"><Image src="/logo.png" width={44} height={44} alt="Greanly" /></div>
              <div>
                <div className="title">Chat with Greanly</div>
                <div className="subtitle">Ask about plans, suppliers and practical steps</div>
              </div>
            </div>

            <div className="top-controls">
              <ThemeToggle />
              {/* removed New & Save from top controls as requested */}
              <Button variant="outline" size="sm" onClick={clearChat}>{CLEAR_CHAT_TEXT}</Button>
            </div>
          </header>

          {/* card container */}
          <section className="chat-card" style={{ paddingTop: HEADER_HEIGHT - 10 }}>
            <div className="messages-wrap" role="log" aria-live="polite">
              <div className="messages-inner">
                <MessageWall messages={messages} status={status} durations={durations} onDurationChange={(k, d) => setDurations((p) => ({ ...p, [k]: d }))} />
                {status === "submitted" && <div className="loading"><Loader2 className="spin" /></div>}
              </div>
            </div>

            {/* input bar */}
            <div className="composer">
              <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(); }} style={{ width: "100%" }}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel className="sr-only">Message</FieldLabel>
                        <div className="composer-row">
                          <textarea
                            {...field}
                            ref={(el) => { field.ref(el); inputRef.current = el; }}
                            placeholder="Type your message..."
                            disabled={status === "streaming"}
                            onInput={(e) => {
                              const ta = e.currentTarget; ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px";
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.handleSubmit(onSubmit)(); }
                            }}
                            className="composer-input"
                            aria-label="Type your message"
                          />
                          <div className="composer-actions">
                            {(status === "ready" || status === "error") && <Button type="submit" className="send" size="icon" disabled={!field.value.trim()}><ArrowUp /></Button>}
                            {(status === "streaming" || status === "submitted") && <Button className="stop" size="icon" onClick={() => stop()}><Square /></Button>}
                          </div>
                        </div>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </div>
          </section>

          <footer className="main-footer">© {new Date().getFullYear()} {OWNER_NAME} · <Link href="/terms" className="link">Terms of Use</Link></footer>
        </main>
      </div>

      {/* scoped styles */}
      <style jsx>{`
        :root {
          --bg: #F6FFF8;
          --card: #FFFFFF;
          --muted: rgba(13,59,42,0.55);
          --accent: #0D3B2A;
          --accent-2: #14503B;
        }
        .greanly-shell { background: linear-gradient(180deg,var(--bg), #F2FFF6); min-height:100vh; padding:22px 20px; }

        .page-grid { max-width:1400px; margin:0 auto; display:grid; grid-template-columns: 300px 1fr; gap:24px; align-items:start; }

        /* SIDEBAR */
        .sidebar { position:sticky; top:20px; height: calc(100vh - 40px); overflow:auto; background: linear-gradient(180deg,#FBFFF9,#F2FBF4); border-radius:12px; padding:16px; border:1px solid rgba(13,59,42,0.04); box-shadow:0 18px 60px rgba(13,59,42,0.04); }
        .brand { display:flex; gap:12px; align-items:center; margin-bottom:12px; }
        .brand-badge { width:54px; height:54px; border-radius:12px; background:linear-gradient(180deg,#E8F7E8,#DFF6E6); display:flex; align-items:center; justify-content:center; }
        .brand-title { font-weight:800; font-size:16px; color:var(--accent); }
        .brand-sub { font-size:12px; color:var(--muted); }

        .sidebar-actions { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
        .btn { display:inline-flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; font-weight:700; border:1px solid rgba(13,59,42,0.04); }
        /* NEW (left) style - visible and contrasted on light/dark */
        .btn.new-left { background: linear-gradient(180deg,#fff,#F6FFF6); color: var(--accent); border: 1px solid rgba(13,59,42,0.08); box-shadow: 0 8px 20px rgba(13,59,42,0.03); }
        .btn.primary { background: linear-gradient(135deg,var(--accent),var(--accent-2)); color:white; box-shadow: 0 12px 36px rgba(13,59,42,0.12); }
        .btn.ghost { background: #fff; color: var(--accent); }

        .history-head { display:flex; align-items:center; justify-content:space-between; gap:12px; font-weight:700; color:var(--accent); margin-bottom:6px; }
        .history-controls { display:flex; gap:8px; }
        .mini { padding:6px 8px; border-radius:8px; background:white; border:1px solid rgba(13,59,42,0.04); cursor:pointer; font-size:12px; }

        .history-list { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .history-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px; border-radius:8px; }
        .history-item .history-main { cursor:pointer; flex:1; }
        .history-item.active { background: rgba(13,59,42,0.04); }
        .history-title { font-weight:700; color:var(--accent); }
        .history-meta { font-size:12px; color:var(--muted); }
        .history-actions { display:flex; gap:6px; }
        .tiny { padding:6px 8px; border-radius:8px; background:white; border:1px solid rgba(13,59,42,0.04); cursor:pointer; font-size:12px; }
        .tiny.danger { color: #B52525; border-color: rgba(181,37,37,0.06); }

        .sidebar-footer { margin-top:14px; font-size:12px; color:var(--muted); }

        /* MAIN */
        .main { min-height: 60vh; display:flex; flex-direction:column; gap:12px; }
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:10px 6px; background: transparent; }
        .top-left { display:flex; gap:12px; align-items:center; }
        .logo-wrap { width:56px; height:56px; border-radius:12px; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 26px rgba(13,59,42,0.04); }
        .title { font-weight:800; color:var(--accent); font-size:18px; }
        .subtitle { font-size:13px; color:var(--muted); }

        .top-controls { display:flex; gap:8px; align-items:center; }

        .chat-card { background: linear-gradient(180deg, #fff, #FBFFF9); border-radius:12px; padding:18px; border:1px solid rgba(13,59,42,0.04); box-shadow:0 18px 60px rgba(13,59,42,0.04); }

        .messages-wrap { max-height: calc(70vh - 80px); overflow:auto; padding:6px; }
        .messages-inner { display:flex; justify-content:center; }
        .messages-inner > :global(*) { width:100%; max-width:820px; } /* keep MessageWall same width */

        .composer { margin-top:12px; }
        .composer-row { display:flex; gap:10px; align-items:flex-end; }
        .composer-input { width:100%; min-height:48px; max-height:220px; padding:12px 14px; border-radius:10px; border:1px solid rgba(13,59,42,0.06); resize:none; font-size:14px; }
        .composer-actions { display:flex; align-items:center; gap:8px; }
        .send { background: linear-gradient(135deg,var(--accent),var(--accent-2)); color:white; border-radius:999px; padding:10px; box-shadow: 0 12px 36px rgba(13,59,42,0.12); }
        .stop { background:#F3F3F3; border-radius:10px; padding:8px; }

        .main-footer { margin-top:10px; color:var(--muted); font-size:13px; text-align:center; }

        /* small helpers */
        .empty { color: rgba(13,59,42,0.45); font-size:13px; }
        .loading { display:flex; justify-content:center; margin-top:10px; color:var(--muted); }

        /* responsive */
        @media (max-width: 980px) {
          .page-grid { grid-template-columns: 1fr; padding:12px; }
          .sidebar { position:relative; height:auto; margin-bottom:12px; }
          .messages-wrap { max-height: 50vh; }
        }

        /* DARK MODE overrides - keeps contrast and avoids washed out tones
           NOTE: we ensure sidebar buttons, mini/refresh/save are visible in dark */
        :global(.dark) .greanly-shell { background: linear-gradient(180deg,#061612, #062018); }
        :global(.dark) .sidebar { background: linear-gradient(180deg,#071815, #071E18); border-color: rgba(255,255,255,0.04); box-shadow: 0 18px 40px rgba(0,0,0,0.6); }
        :global(.dark) .brand-title, :global(.dark) .history-title, :global(.dark) .title { color: #CFEFE0; }
        :global(.dark) .brand-sub, :global(.dark) .history-meta, :global(.dark) .subtitle, :global(.dark) .sidebar-footer { color: rgba(255,255,255,0.64); }

        /* make left-buttons visible in dark mode */
        :global(.dark) .btn.new-left { background: linear-gradient(180deg,#072518,#073826); color:#DFF6E6; border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 8px 20px rgba(0,0,0,0.6); }
        :global(.dark) .btn.ghost { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color: rgba(223,246,230,0.9); border: 1px solid rgba(255,255,255,0.04); box-shadow: none; }
        :global(.dark) .mini { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color: rgba(223,246,230,0.88); border: 1px solid rgba(255,255,255,0.04); }
        :global(.dark) .tiny { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color: rgba(223,246,230,0.88); border: 1px solid rgba(255,255,255,0.04); }
        :global(.dark) .tiny.danger { color: #FFA8A8; border-color: rgba(255,255,255,0.03); }

        :global(.dark) .chat-card { background: linear-gradient(180deg,#061612,#04120F); border-color: rgba(255,255,255,0.03); box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
        :global(.dark) .composer-input { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.04); color: #E6F6EE; }
        :global(.dark) .history-item.active { background: rgba(255,255,255,0.02); }
      `}</style>
    </div>
  );
}
