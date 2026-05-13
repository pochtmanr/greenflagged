// Minimal shim. Phase 2 owns the canonical version of this file; reconcile at merge.
//
// Exports a lazily-initialised Anthropic client and a MODELS map used by both
// the drafting (Phase 2) and the review (Phase 3) code paths. Lazy init is
// required so `next build` (which evaluates route modules without runtime env)
// doesn't crash when ANTHROPIC_API_KEY isn't provided at build time.

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local before invoking AI routes."
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

// Proxy so callers can keep writing `claude.messages.create(...)` while the
// underlying SDK instance is only constructed on first use.
export const claude = new Proxy({} as Anthropic, {
  get(_target, prop, receiver) {
    const instance = getClient();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const MODELS = {
  draft: "claude-sonnet-4-6",
  review: "claude-sonnet-4-6",
} as const;

export type ModelKey = keyof typeof MODELS;
