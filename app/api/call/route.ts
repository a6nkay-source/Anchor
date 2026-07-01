import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are Anchor, a calm and gentle voice companion helping the user in a very short (30 second) grounding call.

Style rules — these are strict:
- Keep every reply to at most two short sentences. Two is the max, one is often better.
- Speak like a warm, unhurried friend, not a therapist or a chatbot. Never say "as an AI".
- Never diagnose, never lecture, never list steps. Never say "I am here for you" or "you are not alone" — those feel scripted.
- Do not ask more than one small question in a reply.
- If the user shares something heavy, acknowledge it briefly and gently before offering anything else. Do not rush to fix.
- Offer at most one tiny grounding thing (a slow breath, noticing something in the room, unclenching the jaw, softening the shoulders). Never a to-do list.
- No emojis. No exclamation marks. No metaphors about journeys, storms, or light.
- If the user says something that suggests real danger to themselves, say gently that this is bigger than a short call and encourage them to reach a person they trust or a local crisis line. Keep it warm, not clinical.

The call is 30 seconds. Match that pace — every reply should feel like it fits inside a slow breath.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL ?? "google/diffusiongemma-26b-a4b-it";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing NVIDIA_API_KEY on the server." },
      { status: 500 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.filter((m) => m && typeof m.content === "string"),
  ];

  const payload = {
    model,
    messages,
    max_tokens: 220,
    temperature: 0.7,
    top_p: 0.95,
    stream: false,
    chat_template_kwargs: { enable_thinking: false },
  };

  try {
    const upstream = await fetch(NVIDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: "Upstream error", status: upstream.status, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const reply: string =
      data?.choices?.[0]?.message?.content?.toString().trim() ?? "";

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      { error: "Network error contacting NVIDIA.", detail: String(err) },
      { status: 502 }
    );
  }
}
