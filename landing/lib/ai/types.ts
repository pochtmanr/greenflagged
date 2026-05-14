export type DraftInput = {
  industry: string;
  description: string;
  jurisdiction?: string;
  parties?: { client?: string; provider?: string };
};

export type DraftProvider = {
  id: "openai" | "anthropic";
  model: string;
  streamDraft(input: DraftInput): AsyncGenerator<string, void, unknown>;
  draftOnce(input: DraftInput): Promise<string>;
};

export const SYSTEM_DRAFT = `You are a contract drafter for Green Flagged, a service for freelancers and small businesses. Output a complete, plain-language contract in markdown. Use clear headings (## Section). Number every clause. Include: parties, scope, deliverables, payment terms, IP ownership, confidentiality, termination, liability, jurisdiction, signatures. Avoid legalese where a plain phrase works. Add a footer noting: "This contract was drafted with AI assistance. Have a lawyer review for high-value engagements." Never include placeholders like [INSERT NAME] in the final output — if a detail is missing, write a reasonable default in italics so the user can edit.`;

export function userMessage(input: DraftInput): string {
  return `Industry: ${input.industry}
Jurisdiction: ${input.jurisdiction ?? "unspecified"}
Description:
${input.description}`;
}
