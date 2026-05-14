import OpenAI from "openai";
import {
  type DraftInput,
  type DraftProvider,
  SYSTEM_DRAFT,
  userMessage,
} from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to use the OpenAI provider");
  }
  return new OpenAI({ apiKey });
}

import { DEFAULT_MODEL_ID } from "./models";

function getModel(): string {
  // Pinned to the catalog default. `OPENAI_DRAFT_MODEL` is intentionally
  // ignored — see lib/ai/models.ts for the canonical model registry.
  return DEFAULT_MODEL_ID;
}

export const openaiProvider: DraftProvider = {
  id: "openai",
  get model() {
    return getModel();
  },

  async *streamDraft(input: DraftInput) {
    const client = getClient();
    const stream = await client.chat.completions.create({
      model: getModel(),
      stream: true,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_DRAFT },
        { role: "user", content: userMessage(input) },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },

  async draftOnce(input: DraftInput) {
    const client = getClient();
    const res = await client.chat.completions.create({
      model: getModel(),
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_DRAFT },
        { role: "user", content: userMessage(input) },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  },
};
