import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { resolveModel } from "./models";

export type CompleteArgs = {
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  json?: boolean;
};

let openaiClient: OpenAI | null = null;
function openai(): OpenAI {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env before invoking AI routes."
    );
  }
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

let anthropicClient: Anthropic | null = null;
function anthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Pick an OpenAI model or set the key."
    );
  }
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

const isReasoningModel = (id: string) =>
  id.startsWith("gpt-5") || id.startsWith("o1") || id.startsWith("o3");

export async function complete(args: CompleteArgs): Promise<string> {
  const model = resolveModel(args.model);
  // Reasoning models (gpt-5 family, o-series) spend tokens on hidden reasoning
  // before emitting any visible content. With a 4k cap, finish_reason="length"
  // can fire before a single output token, leaving content empty. Give them
  // generous headroom; non-reasoning models stay at the requested cap.
  const baseTokens = args.maxTokens ?? 4096;
  const maxTokens = isReasoningModel(model.id)
    ? Math.max(baseTokens, 16000)
    : baseTokens;

  if (model.provider === "openai") {
    const res = await openai().chat.completions.create({
      model: model.id,
      max_completion_tokens: maxTokens,
      response_format: args.json ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    });
    const choice = res.choices[0];
    const content = choice?.message?.content;
    if (typeof content !== "string" || !content) {
      const finish = choice?.finish_reason ?? "unknown";
      throw new Error(
        `OpenAI response was empty (model=${model.id}, finish_reason=${finish}). ` +
          (finish === "length"
            ? "Hit the token cap before producing output — try a shorter contract or a non-reasoning model."
            : "Try a different model.")
      );
    }
    return content;
  }

  const msg = await anthropic().messages.create({
    model: model.id,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: args.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: args.user }],
  });
  const block = msg.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Anthropic response had no text block");
  }
  return block.text;
}
