import type { DraftInput, DraftProvider } from "./types";
import { openaiProvider } from "./openai";

export type { DraftInput } from "./types";

function pickProvider(): DraftProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();

  if (explicit === "openai") return openaiProvider;

  if (explicit === "anthropic") {
    throw new Error(
      "AI_PROVIDER=anthropic is configured but no provider is wired. Add lib/ai/anthropic.ts and register it here."
    );
  }

  if (process.env.OPENAI_API_KEY) return openaiProvider;

  throw new Error(
    "No AI provider configured. Set AI_PROVIDER and the matching API key (OPENAI_API_KEY)."
  );
}

export function getDraftProvider(): DraftProvider {
  return pickProvider();
}

export async function* streamDraft(input: DraftInput) {
  yield* getDraftProvider().streamDraft(input);
}

export async function draftOnce(input: DraftInput): Promise<string> {
  return getDraftProvider().draftOnce(input);
}
