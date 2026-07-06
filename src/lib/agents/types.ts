// Shared types for FarmGPT AI agents.
export type AgentName =
  | "intent-router"
  | "disease-agent"
  | "weather-agent"
  | "market-agent"
  | "government-agent";

export interface AgentInput {
  message: string;
  chatId?: string;
  imageUrl?: string;
  language?: string;
  location?: { lat: number; lng: number } | null;
}

export interface AgentResponse {
  agent: AgentName;
  content: string;
  data?: Record<string, unknown>;
}
