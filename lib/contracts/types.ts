import type { z } from "zod";

export type SelectOption = { value: string; label: string };

type QuestionBase = {
  id: string;
  label: string;
  help?: string;
  tooltip?: string;
  required?: boolean;
};

export type Question =
  | (QuestionBase & {
      kind: "text";
      placeholder?: string;
      multiline?: boolean;
    })
  | (QuestionBase & {
      kind: "select";
      options: SelectOption[];
    })
  | (QuestionBase & {
      kind: "number";
      min?: number;
      max?: number;
      step?: number;
      suffix?: string;
      defaultValue?: number;
    })
  | (QuestionBase & {
      kind: "date";
    })
  | (QuestionBase & {
      kind: "toggle";
      defaultValue?: boolean;
    })
  | (QuestionBase & {
      kind: "checkbox-group";
      options: SelectOption[];
      defaultValue?: string[];
    })
  | (QuestionBase & {
      kind: "name-group";
      showBusiness?: boolean;
      businessLabel?: string;
    })
  | (QuestionBase & {
      kind: "address";
    })
  | (QuestionBase & {
      kind: "improve-textarea";
      field_kind: "scope" | "deliverables";
      placeholder?: string;
      minRows?: number;
    });

export type NameValue = { first?: string; family?: string; business?: string };
export type AddressValue = {
  country?: string;
  city?: string;
  street?: string;
  postal?: string;
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
