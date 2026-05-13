export type AIProvider = "openai" | "anthropic";

export type ModelEntry = {
  id: string;
  label: string;
  provider: AIProvider;
  hint?: string;
};

export const MODEL_CATALOG: ModelEntry[] = [
  { id: "gpt-5-mini", label: "GPT-5 mini", provider: "openai", hint: "Fast · cheap" },
  { id: "gpt-5-nano", label: "GPT-5 nano", provider: "openai", hint: "Cheapest" },
  { id: "gpt-5", label: "GPT-5", provider: "openai", hint: "Most capable OpenAI" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai", hint: "Legacy · fast" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", hint: "Legacy · balanced" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", hint: "Fast · cheap" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", hint: "Balanced" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "anthropic", hint: "Most capable Claude" },
];

const BY_ID = new Map(MODEL_CATALOG.map((m) => [m.id, m]));

function defaultModelId(): string {
  return process.env.AI_DEFAULT_MODEL?.trim() || "gpt-5-mini";
}

export function resolveModel(id?: string | null): ModelEntry {
  const requested = (id ?? "").trim();
  if (requested && BY_ID.has(requested)) return BY_ID.get(requested)!;
  const fallback = BY_ID.get(defaultModelId());
  if (fallback) return fallback;
  return MODEL_CATALOG[0];
}

export function isKnownModel(id: string): boolean {
  return BY_ID.has(id);
}
