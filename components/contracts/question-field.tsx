"use client";

import * as React from "react";
import { Info, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries";
import type {
  AddressValue,
  NameValue,
  Question,
} from "@/lib/contracts/types";

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
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  const label = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
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
        {question.required ? (
          <span style={{ color: "var(--accent-strong)", marginLeft: 6 }}>*</span>
        ) : null}
      </label>
      {question.tooltip ? (
        <button
          type="button"
          aria-expanded={tooltipOpen}
          aria-label="Show explanation"
          onClick={() => setTooltipOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            background: "transparent",
            border: "1px solid var(--rule)",
            color: tooltipOpen ? "var(--accent-strong)" : "var(--fg-3)",
            cursor: "pointer",
            padding: 0,
            borderRadius: 2,
            transition: "color 160ms ease, border-color 160ms ease",
          }}
        >
          <Info size={14} />
        </button>
      ) : null}
    </div>
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
  } else if (question.kind === "name-group") {
    const v = (value && typeof value === "object" ? value : {}) as NameValue;
    const set = (patch: Partial<NameValue>) => onChange({ ...v, ...patch });
    const showBusiness = question.showBusiness !== false;
    control = (
      <div className="gf-name-grid">
        <input
          id={id}
          className="gf-input"
          type="text"
          placeholder="First name"
          autoComplete="given-name"
          value={v.first ?? ""}
          onChange={(e) => set({ first: e.target.value })}
        />
        <input
          className="gf-input"
          type="text"
          placeholder="Family name"
          autoComplete="family-name"
          value={v.family ?? ""}
          onChange={(e) => set({ family: e.target.value })}
        />
        {showBusiness ? (
          <input
            className="gf-input"
            type="text"
            placeholder={
              question.businessLabel ?? "Business / company name (optional)"
            }
            autoComplete="organization"
            value={v.business ?? ""}
            onChange={(e) => set({ business: e.target.value })}
            style={{ gridColumn: "1 / -1" }}
          />
        ) : null}
      </div>
    );
  } else if (question.kind === "address") {
    const v = (value && typeof value === "object" ? value : {}) as AddressValue;
    const set = (patch: Partial<AddressValue>) => onChange({ ...v, ...patch });
    control = (
      <div className="gf-addr-grid">
        <select
          id={id}
          className="gf-input"
          value={v.country ?? ""}
          onChange={(e) => set({ country: e.target.value })}
          style={{ appearance: "auto" }}
          autoComplete="country"
        >
          <option value="">Country…</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="gf-input"
          type="text"
          placeholder="Postal code"
          autoComplete="postal-code"
          value={v.postal ?? ""}
          onChange={(e) => set({ postal: e.target.value })}
        />
        <input
          className="gf-input"
          type="text"
          placeholder="Street address"
          autoComplete="street-address"
          value={v.street ?? ""}
          onChange={(e) => set({ street: e.target.value })}
          style={{ gridColumn: "1 / -1" }}
        />
        <input
          className="gf-input"
          type="text"
          placeholder="City"
          autoComplete="address-level2"
          value={v.city ?? ""}
          onChange={(e) => set({ city: e.target.value })}
          style={{ gridColumn: "1 / -1" }}
        />
      </div>
    );
  } else if (question.kind === "improve-textarea") {
    const v = typeof value === "string" ? value : "";
    control = (
      <ImproveTextareaControl
        id={id}
        value={v}
        onChange={(next) => onChange(next)}
        fieldKind={question.field_kind}
        placeholder={question.placeholder}
        minRows={question.minRows ?? 5}
      />
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
      {tooltipOpen && question.tooltip ? (
        <div
          className="gf-body-sm"
          style={{
            color: "var(--fg-3)",
            borderLeft: "2px solid var(--rule)",
            paddingLeft: 12,
            margin: 0,
          }}
        >
          {question.tooltip}
        </div>
      ) : null}
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
      <QuestionFieldStyles />
    </div>
  );
}

type ImproveTextareaControlProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  fieldKind: "scope" | "deliverables";
  placeholder?: string;
  minRows: number;
};

function ImproveTextareaControl({
  id,
  value,
  onChange,
  fieldKind,
  placeholder,
  minRows,
}: ImproveTextareaControlProps) {
  const [loading, setLoading] = React.useState(false);
  const [original, setOriginal] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const undoVisible = original !== null;

  const handleImprove = async () => {
    if (loading) return;
    const text = value.trim();
    if (!text) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contracts/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, field_kind: fieldKind }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Improve failed (${res.status})`);
      }
      const data = (await res.json()) as { improved: string };
      const improved = data.improved ?? "";
      if (!improved) throw new Error("Empty response");
      setOriginal(value);
      onChange(improved);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setOriginal(null);
      }, 10_000);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? `Couldn't improve — ${err.message}`
          : "Couldn't improve — try again",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (original === null) return;
    onChange(original);
    setOriginal(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <textarea
        id={id}
        className="gf-textarea"
        rows={minRows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingBottom: 56 }}
      />
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {undoVisible ? (
          <button
            type="button"
            className="gf-btn-ghost"
            onClick={handleUndo}
            disabled={loading}
            style={{ padding: "6px 12px", fontSize: 12, height: "auto" }}
          >
            <Undo2 size={14} style={{ marginRight: 6 }} />
            Undo
          </button>
        ) : null}
        <button
          type="button"
          className="gf-btn-ghost"
          onClick={handleImprove}
          disabled={loading || !value.trim()}
          style={{ padding: "6px 12px", fontSize: 12, height: "auto" }}
        >
          <Sparkles
            size={14}
            style={{
              marginRight: 6,
              animation: loading ? "gf-spin 1s linear infinite" : undefined,
            }}
          />
          {loading ? "Improving…" : "Improve"}
        </button>
      </div>
    </div>
  );
}

function QuestionFieldStyles() {
  return (
    <style>{`
      .gf-name-grid, .gf-addr-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      @media (max-width: 720px) {
        .gf-name-grid, .gf-addr-grid {
          grid-template-columns: 1fr;
        }
      }
      @keyframes gf-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `}</style>
  );
}
