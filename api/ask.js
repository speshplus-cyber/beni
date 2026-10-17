// Vercel serverless function: streams Claude's answer back to the Beni page as plain text.
// Env vars: ANTHROPIC_API_KEY (required), BENI_PASSCODE (optional access code), BENI_MODEL (optional).
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = process.env.BENI_MODEL || "claude-opus-5-5";
const MAX_CHARS = 250_000;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const pass = process.env.BENI_PASSCODE;
  if (pass && req.headers["x-beni-passcode"] !== pass) return res.status(401).json({ error: "passcode" });

  const { messages, images = [], tier } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "messages required" });

  // Only plain user/assistant text turns, starting and ending on the user.
  const turns = messages
    .filter(m => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content }));
  if (!turns.length || turns[0].role !== "user" || turns.at(-1).role !== "user") return res.status(400).json({ error: "bad turns" });
  if (turns.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return res.status(413).json({ error: "too long" });

  // Photos ride along with the last user turn.
  const pics = (Array.isArray(images) ? images : [])
    .filter(i => IMAGE_TYPES.has(i?.media_type) && typeof i.data === "string")
    .slice(0, 5)
    .map(i => ({ type: "image", source: { type: "base64", media_type: i.media_type, data: i.data } }));
  if (pics.length) {
    const last = turns.at(-1);
    last.content = [...pics, { type: "text", text: last.content }];
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" });

  let stream;
  req.on("close", () => { if (!res.writableEnded) stream?.abort(); });

  try {
    stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: tier === "complex" ? "medium" : "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: turns,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") res.write(event.delta.text);
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") res.write("\n\n[[BENI_ERR:refused]]");
    else if (final.stop_reason === "max_tokens") res.write("\n\n[[BENI_ERR:truncated]]");
  } catch (err) {
    if (res.writableEnded) return;
    const code =
      err instanceof Anthropic.RateLimitError ? "rate_limited" :
      err instanceof Anthropic.AuthenticationError ? "server_key" :
      err instanceof Anthropic.BadRequestError ? "invalid_request" :
      "upstream_error";
    console.error("beni ask failed:", err?.status, err?.message);
    res.write("\n\n[[BENI_ERR:" + code + "]]");
  }
  res.end();
}
