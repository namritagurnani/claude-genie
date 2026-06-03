import { createFileRoute } from "@tanstack/react-router";
import Anthropic from "@anthropic-ai/sdk";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM =
  "You are Claude, an AI assistant. The user may be asking about various topics including business licensing in Bangalore, AI marketing, food regulations, career decisions, or other research topics. Answer helpfully and thoroughly. For hyper-local or highly specialised questions, provide good general guidance but acknowledge that a domain specialist may help with precise details. Keep responses to 3 to 5 sentences. No markdown. Be conversational.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages: Msg[] };
          if (!Array.isArray(messages)) {
            return new Response("messages required", { status: 400 });
          }
          const key = process.env.ANTHROPIC_API_KEY;
          if (!key) {
            return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });
          }
          const client = new Anthropic({ apiKey: key });
          const resp = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 512,
            system: SYSTEM,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });
          const text = resp.content
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n")
            .trim();
          return Response.json({ text });
        } catch (e: any) {
          console.error("chat error", e);
          return new Response(e?.message ?? "error", { status: 500 });
        }
      },
    },
  },
});
