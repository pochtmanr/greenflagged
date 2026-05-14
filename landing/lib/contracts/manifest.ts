import { freelanceQuestions } from "./industries/freelance";
import { softwareQuestions } from "./industries/software";
import { designQuestions } from "./industries/design";
import { ndaQuestions } from "./industries/nda";
import type { IndustryId, Question } from "./types";

export type IndustryMeta = {
  id: IndustryId;
  label: string;
  description: string;
  eyebrow: string;
  questions: Question[];
};

export const INDUSTRY_META: IndustryMeta[] = [
  {
    id: "freelance",
    label: "Freelance",
    description: "Services contract for solo freelancers and small studios.",
    eyebrow: "// 01 / FREELANCE",
    questions: freelanceQuestions,
  },
  {
    id: "software",
    label: "Software / IT",
    description: "Build, integrate, or maintain software for a client.",
    eyebrow: "// 02 / SOFTWARE",
    questions: softwareQuestions,
  },
  {
    id: "design",
    label: "Design / Creative",
    description: "Brand, graphic, web, or illustration work.",
    eyebrow: "// 03 / DESIGN",
    questions: designQuestions,
  },
  {
    id: "nda",
    label: "NDA",
    description: "Mutual or one-way non-disclosure agreement.",
    eyebrow: "// 04 / NDA",
    questions: ndaQuestions,
  },
];

export function getIndustryMeta(id: string): IndustryMeta | null {
  return INDUSTRY_META.find((i) => i.id === id) ?? null;
}
