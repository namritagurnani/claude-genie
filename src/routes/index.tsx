import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Claude Genies — Demo" },
      {
        name: "description",
        content:
          "Prototype of Claude Genies — an expert marketplace inside Claude.",
      },
    ],
  }),
  component: Page,
});

// ---------- Types ----------
type Msg = { role: "user" | "assistant"; content: string };
type Expert = {
  id: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  name: string;
  domain: string;
  rating: string;
  badge: { text: string; bg: string; color: string };
};

// ---------- Static data ----------
const AVAILABLE_BADGE = { text: "Available now", bg: "#EAF3DE", color: "#3B6D11" };
const AVATAR_PALETTE: { bg: string; color: string }[] = [
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#FBE9E7", color: "#7A2E0E" },
  { bg: "#FFF4D6", color: "#7A5A0B" },
  { bg: "#F0E6FA", color: "#4A1F7A" },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function makeExpert(
  id: string,
  name: string,
  domain: string,
  rating: string,
  paletteIdx: number,
): Expert {
  const p = AVATAR_PALETTE[paletteIdx % AVATAR_PALETTE.length];
  return {
    id,
    initials: initialsOf(name),
    avatarBg: p.bg,
    avatarText: p.color,
    name,
    domain,
    rating,
    badge: AVAILABLE_BADGE,
  };
}

type ExpertPool = { keys: string[]; experts: Expert[] };

const EXPERT_POOLS: ExpertPool[] = [
  {
    keys: ["license", "permit", "bbmp", "compliance", "regulation", "trade"],
    experts: [
      makeExpert("arjun", "Arjun Mehta", "Startup & local compliance · Bangalore", "★ 4.9 · 8 yrs · 230+ clients", 0),
      makeExpert("priya", "Priya Nair", "BBMP permits & trade licensing · Karnataka", "★ 4.8 · 6 yrs · 180+ clients", 1),
      makeExpert("rohan", "Rohan Das", "Local compliance & ward office procedures · South Bangalore", "★ 4.7 · 11 yrs · 400+ clients", 2),
    ],
  },
  {
    keys: ["food", "fssai", "restaurant", "stall", "f&b", "catering"],
    experts: [
      makeExpert("meera", "Meera Iyer", "Food business licensing & FSSAI · Karnataka", "★ 4.9 · 7 yrs · 210+ clients", 1),
      makeExpert("sanjay", "Sanjay Kulkarni", "F&B compliance & restaurant permits · Bangalore", "★ 4.8 · 10 yrs · 300+ clients", 3),
      makeExpert("divya", "Divya Rao", "Local food entrepreneur & pop-up specialist · Bangalore", "★ 4.7 · 5 yrs · 140+ clients", 4),
    ],
  },
  {
    keys: ["ai", "marketing", "digital", "growth", "campaign", "funnel"],
    experts: [
      makeExpert("karan", "Karan Mehta", "AI marketing & growth strategy", "★ 4.9 · 6 yrs · 190+ clients", 2),
      makeExpert("sneha", "Sneha Pillai", "Digital marketing & emerging tools specialist", "★ 4.8 · 8 yrs · 240+ clients", 5),
      makeExpert("rahul", "Rahul Nair", "Content strategy & AI-driven campaigns", "★ 4.7 · 7 yrs · 170+ clients", 0),
    ],
  },
  {
    keys: ["tax", "gst", "income", "filing", "ca", "accounting"],
    experts: [
      makeExpert("vikram", "Vikram Shah", "GST & startup taxation · Bangalore", "★ 4.9 · 9 yrs · 320+ clients", 3),
      makeExpert("ananya", "Ananya Bose", "CA & business tax filing specialist", "★ 4.8 · 11 yrs · 400+ clients", 1),
      makeExpert("ravi", "Ravi Kumar", "Finance & compliance for small businesses", "★ 4.7 · 8 yrs · 260+ clients", 4),
    ],
  },
  {
    keys: ["career", "job", "role", "interview", "resume", "switch"],
    experts: [
      makeExpert("pooja", "Pooja Menon", "Career coach & transition specialist", "★ 4.9 · 7 yrs · 220+ clients", 5),
      makeExpert("aryan", "Aryan Sinha", "Tech careers & interview preparation", "★ 4.8 · 6 yrs · 180+ clients", 2),
      makeExpert("nisha", "Nisha Reddy", "Resume & personal branding coach", "★ 4.7 · 5 yrs · 150+ clients", 0),
    ],
  },
];

const FALLBACK_EXPERTS: Expert[] = [
  makeExpert("amit", "Amit Sharma", "Domain research specialist", "★ 4.8 · 7 yrs · 200+ clients", 0),
  makeExpert("lavanya", "Lavanya Nair", "Subject matter consultant", "★ 4.7 · 6 yrs · 170+ clients", 1),
  makeExpert("dev", "Dev Patel", "Independent research advisor", "★ 4.8 · 9 yrs · 250+ clients", 2),
];

function detectExperts(userMessages: string[]): Expert[] {
  const blob = userMessages.join(" ").toLowerCase();
  for (const pool of EXPERT_POOLS) {
    if (pool.keys.some((k) => blob.includes(k))) return pool.experts;
  }
  return FALLBACK_EXPERTS;
}

const SCRIPTED: { text: string; annotation: string }[] = [
  {
    text: "RWA angle is key in Koramangala. Active resident associations enforce restrictions beyond BBMP. You need their NOC separately — BBMP approval alone won't be enough.",
    annotation: "Adds hyper-local context Claude couldn't provide",
  },
  {
    text: "Yes. Under 7 days uses simplified BBMP process. Form 14B at the ward office. Turnaround is 2 working days. I handled this exact case 3 months ago.",
    annotation: "Corrects Claude's general answer with ward-specific detail",
  },
  {
    text: "I'll draft Form 14B pre-filled for your location. You'll also need an RWA NOC — I can draft that too. Want me to start with the BBMP form?",
    annotation: "Offers concrete next action based on your situation",
  },
];

const DOMAIN_NUDGE: { keys: string[]; text: string }[] = [
  {
    keys: ["license","permit","bbmp","compliance","regulation","ward","trade"],
    text: "A local compliance expert in Bangalore can give you precise guidance.",
  },
  {
    keys: ["food","fssai","restaurant","stall","f&b","catering"],
    text: "A food business licensing specialist can help with the exact requirements.",
  },
  {
    keys: ["ai","marketing","digital","growth","campaign","funnel"],
    text: "A specialist in AI and emerging marketing can give sharper advice.",
  },
  {
    keys: ["tax","gst","income","filing","ca","accounting"],
    text: "A tax and finance specialist can clarify this for your situation.",
  },
  {
    keys: ["career","job","role","interview","resume","switch"],
    text: "A career specialist can give you personalised guidance here.",
  },
];

function detectNudgeText(userMessages: string[]): string {
  const blob = userMessages.join(" ").toLowerCase();
  for (const d of DOMAIN_NUDGE) {
    if (d.keys.some((k) => blob.includes(k))) return d.text;
  }
  return "A domain specialist may give you more precise guidance for your situation.";
}

// ---------- Component ----------
function Page() {
  type View = "chat" | "experts" | "genie";
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nudgeShown, setNudgeShown] = useState(false);
  const [nudgeActive, setNudgeActive] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const userMessages = useMemo(
    () => messages.filter((m) => m.role === "user").map((m) => m.content),
    [messages],
  );
  const nudgeText = useMemo(() => detectNudgeText(userMessages), [userMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    let reply: string;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      reply = data.text ?? "Sorry, something went wrong.";
    } catch {
      reply = "Network error — please try again.";
    }
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    if (!nudgeShown && assistantCount + 1 === 3) {
      setNudgeShown(true);
      setNudgeActive(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar showGeniesBadge={view !== "chat"} />
      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex flex-col transition-all duration-300"
          style={{ width: view === "chat" ? "100%" : "55%" }}
        >
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={send}
            loading={loading}
            nudgeActive={nudgeActive && view === "chat"}
            nudgeText={nudgeText}
            onConsult={() => {
              setNudgeActive(false);
              setView("experts");
            }}
            dimmed={view === "genie"}
            chatEndRef={chatEndRef}
          />
        </div>
        {view !== "chat" && (
          <div
            className="hairline flex flex-col border-l border-border"
            style={{ width: "45%" }}
          >
            {view === "experts" && (
              <ExpertPanel
                experts={detectExperts(userMessages)}
                onPick={(e) => {
                  setSelectedExpert(e);
                  setView("genie");
                }}
              />
            )}
            {view === "genie" && selectedExpert && (
              <GenieChat
                expert={selectedExpert}
                onBack={() => setView("experts")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- TopBar ----------
function TopBar({ showGeniesBadge }: { showGeniesBadge: boolean }) {
  return (
    <div
      className="hairline flex items-center justify-between border-b border-border bg-background px-5"
      style={{ height: 48 }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center rounded-full text-white"
          style={{ width: 22, height: 22, background: "var(--coral)", fontSize: 11, fontWeight: 600 }}
        >
          C
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Claude</span>
      </div>
      {showGeniesBadge && (
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: "var(--genie-bg)", color: "var(--genie-text)" }}
        >
          <Sparkles size={12} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>Claude Genies</span>
        </div>
      )}
    </div>
  );
}

// ---------- ChatPanel ----------
function ChatPanel({
  messages,
  input,
  setInput,
  onSend,
  loading,
  nudgeActive,
  nudgeText,
  onConsult,
  dimmed,
  chatEndRef,
}: {
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  nudgeActive: boolean;
  nudgeText: string;
  onConsult: () => void;
  dimmed: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative flex h-full flex-col">
      <div
        className="flex-1 overflow-y-auto px-6 py-6 transition-opacity duration-300"
        style={{ opacity: dimmed ? 0.4 : 1, pointerEvents: dimmed ? "none" : "auto" }}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="mt-12 text-center text-muted-foreground" style={{ fontSize: 13 }}>
              Ask Claude anything. Try a hyper-local question to see Genies in action.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i}>
              <MessageRow msg={m} />
              {/* Show nudge under the latest assistant message */}
              {nudgeActive &&
                m.role === "assistant" &&
                i === messages.length - 1 && (
                  <div className="mt-3 pl-9">
                    <NudgeBanner text={nudgeText} onConsult={onConsult} />
                  </div>
                )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 pl-9 text-muted-foreground" style={{ fontSize: 12 }}>
              <span className="animate-pulse">Claude is typing…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      {dimmed && (
        <div
          className="absolute bottom-2 left-0 right-0 text-center text-muted-foreground"
          style={{ fontSize: 10 }}
        >
          Previous conversation — visible to expert
        </div>
      )}
      {!dimmed && (
        <div className="hairline border-t border-border bg-background px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              placeholder="Reply to Claude…"
              className="hairline flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 outline-none focus:border-[var(--primary)]"
              style={{ fontSize: 13, maxHeight: 140 }}
            />
            <button
              onClick={onSend}
              disabled={loading || !input.trim()}
              className="rounded-xl px-3.5 py-2.5 text-white disabled:opacity-50"
              style={{ background: "var(--primary)", fontSize: 12, fontWeight: 500 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageRow({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end gap-2.5">
        <div
          className="max-w-[80%] px-3.5 py-2.5"
          style={{
            background: "#EEF0FF",
            color: "#1a1a2e",
            borderRadius: "10px 3px 10px 10px",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {msg.content}
        </div>
        <Avatar text="U" bg="#9ca3af" color="#fff" />
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <Avatar text="C" bg="var(--coral)" color="#fff" />
      <div
        className="hairline max-w-[80%] border border-border px-3.5 py-2.5"
        style={{
          background: "var(--secondary)",
          borderRadius: "3px 10px 10px 10px",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

function Avatar({
  text,
  bg,
  color,
  size = 28,
  fontSize = 11,
}: {
  text: string;
  bg: string;
  color: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: bg, color, fontSize }}
    >
      {text}
    </div>
  );
}

function NudgeBanner({ text, onConsult }: { text: string; onConsult: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{ background: "#FFF8F0", border: "0.5px solid #E8A87C" }}
    >
      <Sparkles size={14} color="var(--coral)" />
      <div className="flex-1" style={{ fontSize: 12, color: "#1a1a2e" }}>
        {text}
      </div>
      <button
        onClick={onConsult}
        className="rounded-md px-2.5 py-1.5 text-white"
        style={{ background: "var(--coral)", fontSize: 11, fontWeight: 500 }}
      >
        Consult an expert →
      </button>
    </div>
  );
}

// ---------- Expert Panel ----------
function ExpertPanel({ experts, onPick }: { experts: Expert[]; onPick: (e: Expert) => void }) {
  const tabs = ["Law & compliance", "Local permits", "Food & F&B", "Real estate"];
  const [active, setActive] = useState(0);
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} color="var(--genie-text)" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            Claude Genies — connect with an expert
          </span>
        </div>
        <div className="mt-1 text-muted-foreground" style={{ fontSize: 11 }}>
          Verified specialists · your conversation context will be shared
        </div>
      </div>
      <div
        className="mx-2.5 mt-3 flex items-center gap-2 rounded-lg px-2.5 py-2"
        style={{ background: "#EAF3DE", color: "#3B6D11", fontSize: 11 }}
      >
        <Check size={12} />
        Your Claude conversation will be shared — no re-explaining needed
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t}
              onClick={() => setActive(i)}
              className="hairline shrink-0 rounded-full border px-3 py-1"
              style={{
                background: isActive ? "var(--genie-bg)" : "#fff",
                color: isActive ? "var(--genie-text)" : "var(--muted-foreground)",
                borderColor: isActive ? "var(--genie-border)" : "var(--border)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-2.5">
          {experts.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e)}
              className="hairline flex items-start gap-3 rounded-xl border border-border bg-white p-3 text-left transition hover:border-[var(--primary)]"
            >
              <Avatar
                text={e.initials}
                bg={e.avatarBg}
                color={e.avatarText}
                size={36}
                fontSize={12}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{
                      background: e.badge.bg,
                      color: e.badge.color,
                      fontSize: 10,
                      fontWeight: 500,
                    }}
                  >
                    {e.badge.text}
                  </span>
                </div>
                <div className="mt-0.5 text-muted-foreground" style={{ fontSize: 11 }}>
                  {e.domain}
                </div>
                <div className="mt-1 text-muted-foreground" style={{ fontSize: 11 }}>
                  {e.rating}
                </div>
                <div className="mt-2 flex justify-end">
                  <span
                    className="rounded-md px-2.5 py-1 text-white"
                    style={{ background: "var(--primary)", fontSize: 11 }}
                  >
                    Chat
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Genie Chat ----------
type GenieMsg =
  | { role: "user"; text: string }
  | { role: "expert"; text: string; annotation: string };

function GenieChat({ expert, onBack }: { expert: Expert; onBack: () => void }) {
  const [msgs, setMsgs] = useState<GenieMsg[]>([]);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [input, setInput] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // First expert message auto on open
  useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([
        {
          role: "expert",
          text: SCRIPTED[0].text,
          annotation: SCRIPTED[0].annotation,
        },
      ]);
      setScriptIdx(1);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expert.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    if (scriptIdx < SCRIPTED.length) {
      const nextIdx = scriptIdx;
      setTimeout(() => {
        setMsgs((m) => [
          ...m,
          {
            role: "expert",
            text: SCRIPTED[nextIdx].text,
            annotation: SCRIPTED[nextIdx].annotation,
          },
        ]);
        setScriptIdx(nextIdx + 1);
      }, 900);
    }
  }

  const showRating = scriptIdx >= SCRIPTED.length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="hairline flex items-center gap-3 border-b border-border px-3 py-3">
        <button
          onClick={onBack}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Back"
        >
          <Arrow />
        </button>
        <Avatar
          text={expert.initials}
          bg={expert.avatarBg}
          color={expert.avatarText}
          size={32}
          fontSize={11}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 500 }}>{expert.name}</span>
            <span
              className="rounded-full px-1.5 py-0.5"
              style={{ background: "#EAF3DE", color: "#3B6D11", fontSize: 10 }}
            >
              Active now
            </span>
          </div>
          <div className="text-muted-foreground" style={{ fontSize: 10 }}>
            {expert.domain}
          </div>
        </div>
      </div>

      <div
        className="mx-2.5 mt-2.5 flex items-center gap-2 rounded-lg px-2.5 py-2"
        style={{ background: "#EAF3DE", color: "#3B6D11", fontSize: 11 }}
      >
        <Check size={12} />
        {expert.name.split(" ")[0]} can see your Claude conversation · context shared
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-3">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div
                  className="max-w-[80%] px-3 py-2"
                  style={{
                    background: "#EEF0FF",
                    color: "#1a1a2e",
                    borderRadius: "10px 3px 10px 10px",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <Avatar
                    text={expert.initials}
                    bg={expert.avatarBg}
                    color={expert.avatarText}
                    size={26}
                    fontSize={10}
                  />
                  <div
                    className="hairline max-w-[80%] border border-border px-3 py-2"
                    style={{
                      background: "var(--secondary)",
                      borderRadius: "3px 10px 10px 10px",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
                <div
                  className="ml-8 rounded-md px-2 py-1 italic"
                  style={{
                    background: "#F0F4FF",
                    borderLeft: "2px solid var(--primary)",
                    fontSize: 10,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {m.annotation}
                </div>
              </div>
            ),
          )}

          {showRating && (
            <div className="mt-4 flex flex-col items-center gap-2.5">
              {!submitted ? (
                <>
                  <div
                    className="text-muted-foreground"
                    style={{ fontSize: 11 }}
                  >
                    Session complete · rate {expert.name}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        aria-label={`${n} star`}
                      >
                        <Star
                          filled={n <= rating}
                          color={n <= rating ? "#E8A060" : "var(--border)"}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => rating > 0 && setSubmitted(true)}
                    className="rounded-lg px-3 py-1.5 text-white disabled:opacity-50"
                    style={{ background: "#1a1a1a", fontSize: 11 }}
                    disabled={rating === 0}
                  >
                    Submit rating
                  </button>
                </>
              ) : (
                <div
                  className="text-center text-muted-foreground"
                  style={{ fontSize: 11 }}
                >
                  Thanks for your rating — it helps improve expert matching.
                </div>
              )}
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="hairline border-t border-border px-3 py-3">
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message ${expert.name.split(" ")[0]}…`}
            className="hairline flex-1 rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-[var(--primary)]"
            style={{ fontSize: 13 }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="rounded-xl px-3 py-2 text-white disabled:opacity-50"
            style={{ background: "var(--primary)", fontSize: 12 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Icons (inline SVG, no extra deps) ----------
function Sparkles({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z" />
      <path d="M19 14l.9 2.2L22 17l-2.1.8L19 20l-.9-2.2L16 17l2.1-.8L19 14z" />
    </svg>
  );
}
function Check({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function Star({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.5" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
