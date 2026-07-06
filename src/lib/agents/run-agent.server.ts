// Server-only helpers for FarmGPT agents.
import { callGemini } from "@/lib/ai/gemini.server";
import type { AgentInput, AgentName, AgentResponse } from "./types";

const SYSTEM_PROMPTS: Record<Exclude<AgentName, "intent-router">, string> = {
  "disease-agent": `You are FarmGPT's crop disease expert for Indian farmers.
Diagnose likely diseases/pests from the described symptoms (and image if provided).
Give: likely disease, cause, severity, and a clear step-by-step treatment plan with
locally-available products, dosage, and safety notes. Be concise, practical, and
use simple language. Use markdown with short sections and bullet points.`,
  "weather-agent": `You are FarmGPT's weather & irrigation advisor for Indian farmers.
Give a practical farming-focused advisory: whether to irrigate, spray, harvest, or delay
work based on the weather context in the user's message. Use markdown with short
sections and bullet points. Be concise and locally relevant.`,
  "market-agent": `You are FarmGPT's mandi & market advisor for Indian farmers.
Give practical market guidance: price trends, best time/place to sell, and simple
reasoning. If exact live prices are unknown, say so and give directional advice.
Use markdown with short sections and bullet points.`,
  "government-agent": `You are FarmGPT's government schemes advisor for Indian farmers.
Explain relevant central & state schemes, eligibility, benefits, and how to apply.
Use markdown with short sections and bullet points. Note that details may change and
users should verify at the official portal.`,
};

export async function runAgent(
  agent: Exclude<AgentName, "intent-router">,
  data: AgentInput,
): Promise<AgentResponse> {
  const system = SYSTEM_PROMPTS[agent];
  const contextLines: string[] = [];
  if (data.location) {
    contextLines.push(`User location: ${data.location.lat}, ${data.location.lng}`);
  }
  if (data.language) contextLines.push(`Preferred language: ${data.language}`);
  const contextBlock = contextLines.length ? `\n\nContext:\n${contextLines.join("\n")}` : "";

  const { text } = await callGemini({
    system,
    prompt: `${data.message}${contextBlock}`,
    imageBase64: data.imageUrl?.startsWith("data:")
      ? data.imageUrl.split(",")[1]
      : undefined,
    temperature: 0.4,
    maxOutputTokens: 1024,
  });

  return {
    agent,
    content: text || "Sorry, I couldn't generate a response. Please try again.",
  };
}
