"use client";

import * as React from "react";
import type { Question } from "@/lib/contracts/types";

type Props = {
  question: Question;
  value: unknown;
  onChange: (next: unknown) => void;
  error?: string | null;
};

function fieldId(q: Question): string {
  return `q-${q.id}`;
}

export function QuestionField({ question, value, onChange, error }: Props) {
  const id = fieldId(question);
  const label = (
    <label
      htmlFor={id}
      className="gf-mono-sm"
      style={{
        color: "var(--fg-2)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontSize: 12,
      }}
    >
      {question.label}
      {"required" in question && question.required ? (
        <span style={{ color: "var(--accent-strong)", marginLeft: 6 }}>*</span>
      ) : null}
    </label>
  );

  let control: React.ReactNode = null;

  if (question.kind === "text") {
    const v = typeof value === "string" ? value : "";
    if (question.multiline) {
      control = (
        <textarea
          id={id}
          className="gf-textarea"
          rows={4}
          value={v}
          placeholder={question.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    } else {
      control = (
        <input
          id={id}
          className="gf-input"
          type="text"
          value={v}
          placeholder={question.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
  } else if (question.kind === "select") {
    const v = typeof value === "string" ? value : "";
    control = (
      <select
        id={id}
        className="gf-input"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        style={{ appearance: "auto" }}
      >
        <option value="">Select…</option>
        {question.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else if (question.kind === "number") {
    const v =
      typeof value === "number"
        ? value
        : typeof value === "string" && value !== ""
          ? Number(value)
          : "";
    control = (
      <div style={{ position: "relative" }}>
        <input
          id={id}
          className="gf-input"
          type="number"
          inputMode="decimal"
          step={question.step ?? 1}
          min={question.min}
          max={question.max}
          value={v as number | ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
          style={question.suffix ? { paddingRight: 64 } : undefined}
        />
        {question.suffix ? (
          <span
            className="gf-mono-sm"
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-3)",
              pointerEvents: "none",
            }}
          >
            {question.suffix}
          </span>
        ) : null}
      </div>
    );
  } else if (question.kind === "date") {
    const v = typeof value === "string" ? value : "";
    control = (
      <input
        id={id}
        className="gf-input"
        type="date"
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (question.kind === "toggle") {
    const checked = typeof value === "boolean" ? value : !!question.defaultValue;
    control = (
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 999,
            border: "1px solid var(--rule)",
            background: checked ? "var(--accent-strong)" : "var(--surface)",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            justifyContent: checked ? "flex-end" : "flex-start",
            transition: "background 160ms ease, border-color 160ms ease",
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "var(--paper-50)",
              display: "block",
            }}
          />
        </button>
        <span className="gf-body-sm" style={{ color: "var(--fg-2)" }}>
          {checked ? "Yes" : "No"}
        </span>
      </div>
    );
  } else if (question.kind === "checkbox-group") {
    const current = Array.isArray(value) ? (value as string[]) : [];
    control = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingTop: 4,
        }}
      >
        {question.options.map((opt) => {
          const checked = current.includes(opt.value);
          return (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? current.filter((v) => v !== opt.value)
                    : [...current, opt.value];
                  onChange(next);
                }}
              />
              <span className="gf-body-sm" style={{ color: "var(--fg-1)" }}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {label}
      {control}
      {"help" in question && question.help ? (
        <p className="gf-body-sm" style={{ color: "var(--fg-3)", margin: 0 }}>
          {question.help}
        </p>
      ) : null}
      {error ? (
        <p
          className="gf-mono-sm"
          style={{ color: "var(--sev-red)", margin: 0, fontSize: 12 }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
