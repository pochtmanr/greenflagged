import { freelance } from "./industries/freelance";
import { software } from "./industries/software";
import { design } from "./industries/design";
import { nda } from "./industries/nda";
import type { IndustryId, IndustrySchema } from "./types";

export const INDUSTRIES: Record<IndustryId, IndustrySchema> = {
  freelance,
  software,
  design,
  nda,
};

export const INDUSTRY_LIST: IndustrySchema[] = [freelance, software, design, nda];

export function getIndustry(id: string): IndustrySchema | null {
  return (INDUSTRIES as Record<string, IndustrySchema>)[id] ?? null;
}

export type { IndustryId, IndustrySchema, Question } from "./types";
