import type { z } from "zod";

export type SelectOption = { value: string; label: string };

type QuestionBase = {
  id: string;
  label: string;
  /** Plain helper text shown under the input. Always visible. */
  help?: string;
  /** Legacy click-to-reveal tooltip (kept for optional fields). */
  tooltip?: string;
  required?: boolean;
  /**
   * Optional helper that depends on other answers (e.g. rate_amount help that
   * reads rate_type). Returning undefined falls back to `help`.
   */
  dynamicHelp?: (
    allAnswers: Record<string, unknown>,
  ) => string | null | undefined;
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
      /** Optional inline explanation shown under the dropdown for the
       *  currently-selected option. */
      optionDescriptions?: Record<string, string>;
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
      /** Adds a checkbox under the date input that, when ticked, marks the
       *  date as open-ended. The companion boolean field is stored at
       *  `${id}_open` in the answers Record. */
      allowOpenEnded?: boolean;
      openLabel?: string;
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

export type IpSharedParty = { name: string; pct: number };
export type IpSharedValue = {
  provider_pct: number;
  client_pct: number;
  additional: IpSharedParty[];
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
