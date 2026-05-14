export type AIProvider = "openai";

export type ModelEntry = {
  id: string;
  label: string;
  provider: AIProvider;
  hint?: string;
};

// Only two models are exposed in code now:
//   • gpt-5.4-mini — the default for every workflow.
//   • gpt-4o       — used explicitly by `/api/contracts/improve` (text
//                    improvement on /contracts/new) and by translation
//                    (lib/contracts/i18n.ts).
// Other model ids passed via overrides are coerced to the default below.
export const MODEL_CATALOG: ModelEntry[] = [
  {
    id: "gpt-5.4-mini",
    label: "ChatGPT 5.4 mini",
    provider: "openai",
    hint: "Default · fast · cheap",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    hint: "Used for translation + text improvement",
  },
];

export const DEFAULT_MODEL_ID = "gpt-5.4-mini";

const BY_ID = new Map(MODEL_CATALOG.map((m) => [m.id, m]));

export function resolveModel(id?: string | null): ModelEntry {
  const requested = (id ?? "").trim();
  if (requested && BY_ID.has(requested)) return BY_ID.get(requested)!;
  return BY_ID.get(DEFAULT_MODEL_ID) ?? MODEL_CATALOG[0];
}

export function isKnownModel(id: string): boolean {
  return BY_ID.has(id);
}
