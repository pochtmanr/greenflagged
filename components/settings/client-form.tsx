"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export type ClientFormValues = {
  id?: string;
  first_name: string;
  family_name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string;
  city: string;
  street: string;
  postal_code: string;
  notes: string | null;
  is_default: boolean;
};

type Props = {
  initial?: Partial<ClientFormValues>;
  onDone?: () => void;
  onCancel?: () => void;
};

export function ClientForm({ initial, onDone, onCancel }: Props) {
  const router = useRouter();
  const [values, setValues] = React.useState<ClientFormValues>({
    id: initial?.id,
    first_name: initial?.first_name ?? "",
    family_name: initial?.family_name ?? "",
    business_name: initial?.business_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    country_code: initial?.country_code ?? "DE",
    city: initial?.city ?? "",
    street: initial?.street ?? "",
    postal_code: initial?.postal_code ?? "",
    notes: initial?.notes ?? "",
    is_default: initial?.is_default ?? false,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      first_name: values.first_name.trim(),
      family_name: values.family_name.trim(),
      business_name: values.business_name?.trim() || null,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      country_code: values.country_code,
      city: values.city.trim(),
      street: values.street.trim(),
      postal_code: values.postal_code.trim(),
      notes: values.notes?.trim() || null,
      is_default: values.is_default,
    };

    try {
      const url = values.id ? `/api/clients/${values.id}` : `/api/clients`;
      const res = await fetch(url, {
        method: values.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Save failed (${res.status})`);
      }
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div className="form-grid">
        <Field label="First name" required>
          <input
            className="gf-input"
            required
            value={values.first_name}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </Field>
        <Field label="Family name" required>
          <input
            className="gf-input"
            required
            value={values.family_name}
            onChange={(e) => set("family_name", e.target.value)}
          />
        </Field>

        <Field label="Business name" wide>
          <input
            className="gf-input"
            value={values.business_name ?? ""}
            onChange={(e) => set("business_name", e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            className="gf-input"
            value={values.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <input
            className="gf-input"
            value={values.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>

        <Field label="Country" required>
          <select
            className="gf-input"
            value={values.country_code}
            onChange={(e) => set("country_code", e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City" required>
          <input
            className="gf-input"
            required
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Street" required wide>
          <input
            className="gf-input"
            required
            value={values.street}
            onChange={(e) => set("street", e.target.value)}
          />
        </Field>
        <Field label="Postal code" required>
          <input
            className="gf-input"
            required
            value={values.postal_code}
            onChange={(e) => set("postal_code", e.target.value)}
          />
        </Field>

        <Field label="Notes" wide>
          <textarea
            className="gf-textarea"
            value={values.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything to remember about this client."
          />
        </Field>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--fg-2)",
        }}
      >
        <input
          type="checkbox"
          checked={values.is_default}
          onChange={(e) => set("is_default", e.target.checked)}
        />
        Set as default client
      </label>

      {error ? (
        <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" className="gf-btn" disabled={saving}>
          {saving ? "Saving…" : values.id ? "Save changes" : "Create client"}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="gf-btn-ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        ) : null}
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .form-grid :global(.field--wide) {
          grid-column: 1 / -1;
        }
        @media (max-width: 720px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={wide ? "field--wide" : undefined}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <label className="gf-label">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}
