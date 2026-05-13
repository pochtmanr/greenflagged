import type { z } from "zod";

export type SelectOption = { value: string; label: string };

export type Question =
  | {
      id: string;
      kind: "text";
      label: string;
      placeholder?: string;
      required?: boolean;
      multiline?: boolean;
      help?: string;
    }
  | {
      id: string;
      kind: "select";
      label: string;
      options: SelectOption[];
      required?: boolean;
      help?: string;
    }
  | {
      id: string;
      kind: "number";
      label: string;
      min?: number;
      max?: number;
      step?: number;
      suffix?: string;
      required?: boolean;
      defaultValue?: number;
      help?: string;
    }
  | {
      id: string;
      kind: "date";
      label: string;
      required?: boolean;
      help?: string;
    }
  | {
      id: string;
      kind: "toggle";
      label: string;
      defaultValue?: boolean;
      help?: string;
    }
  | {
      id: string;
      kind: "checkbox-group";
      label: string;
      options: SelectOption[];
      defaultValue?: string[];
      help?: string;
    };

export type IndustryId = "freelance" | "software" | "design" | "nda";

export type IndustryAnswers = Record<string, unknown>;

export type IndustrySchema = {
  id: IndustryId;
  label: string;
  description: string;
  questions: Question[];
  validator: z.ZodTypeAny;
  render: (answers: IndustryAnswers) => string;
  buildTitle: (answers: IndustryAnswers) => string;
};
