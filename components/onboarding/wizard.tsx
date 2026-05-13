"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COUNTRIES, COUNTRY_CODES } from "@/lib/countries";
import {
  completeOnboarding,
  type OnboardingResult,
} from "@/app/(app)/onboarding/actions";

type AccountType = "solo" | "freelancer" | "business";

const ACCOUNT_OPTIONS: Array<{ value: AccountType; title: string; sub: string }> = [
  {
    value: "solo",
    title: "Solo",
    sub: "Personal contracts and one-off deals.",
  },
  {
    value: "freelancer",
    title: "Freelancer",
    sub: "Client work — design, dev, writing, consulting.",
  },
  {
    value: "business",
    title: "Business",
    sub: "Team contracts, vendor agreements, NDAs at scale.",
  },
];

function detectLocaleCountry(): string {
  if (typeof navigator === "undefined") return "US";
  const lang = navigator.language || "en-US";
  const region = lang.split("-")[1]?.toUpperCase();
  if (region && COUNTRY_CODES.has(region)) return region;
  return "US";
}

export function OnboardingWizard() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = React.useState<AccountType | null>(null);
  const [country, setCountry] = React.useState<string>("US");
  const [businessName, setBusinessName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setCountry(detectLocaleCountry());
  }, []);

  const isBusiness = accountType === "business";
  const lastStep: 2 | 3 = isBusiness ? 3 : 2;

  const onPickType = (t: AccountType) => {
    setAccountType(t);
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) {
      setError("Pick an account type to continue.");
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result: OnboardingResult = await completeOnboarding({
      account_type: accountType,
      country_code: country,
      business_name: isBusiness ? businessName : null,
    });
    if (result && !result.ok) {
      setError(result.error);
      setSubmitting(false);
    }
    // success → server action redirects to /dashboard
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        Step {step} of {lastStep}
      </div>

      {step === 1 ? (
        <div
          className="gf-frame"
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <span className="gf-frame-bl" />
          <span className="gf-frame-br" />
          <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
            // 01 / WHO ARE YOU
          </span>
          <h2 className="gf-h2">What describes you?</h2>
          <div
            role="radiogroup"
            aria-label="Account type"
            style={{ display: "grid", gap: 12 }}
          >
            {ACCOUNT_OPTIONS.map((opt) => {
              const active = accountType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onPickType(opt.value)}
                  style={{
                    textAlign: "left",
                    padding: "20px 24px",
                    background: active ? "var(--surface-elev)" : "var(--surface)",
                    border: `1px solid ${
                      active ? "var(--accent-strong)" : "var(--rule)"
                    }`,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span className="gf-h4">{opt.title}</span>
                  <span className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <form
          className="gf-frame"
          onSubmit={isBusiness ? (e) => { e.preventDefault(); setStep(3); } : onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <span className="gf-frame-bl" />
          <span className="gf-frame-br" />
          <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
            // 02 / WHERE
          </span>
          <h2 className="gf-h2">Where do you operate?</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="gf-label">// COUNTRY</span>
            <select
              required
              className="gf-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
              {error}
            </p>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <button
              type="button"
              className="gf-btn-link"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="gf-btn"
              disabled={submitting || !country}
            >
              {submitting ? (
                <>
                  <Loader2 width={14} height={14} className="animate-spin" />
                  Saving…
                </>
              ) : isBusiness ? (
                <>
                  Continue <span className="arrow">→</span>
                </>
              ) : (
                <>
                  Finish setup <span className="arrow">→</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 && isBusiness ? (
        <form
          className="gf-frame"
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <span className="gf-frame-bl" />
          <span className="gf-frame-br" />
          <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
            // 03 / BUSINESS
          </span>
          <h2 className="gf-h2">What&apos;s your business called?</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="gf-label">// BUSINESS NAME</span>
            <Input
              required
              type="text"
              autoComplete="organization"
              placeholder="Acme Inc."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={120}
            />
          </label>

          {error ? (
            <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
              {error}
            </p>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <button
              type="button"
              className="gf-btn-link"
              onClick={() => setStep(2)}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="gf-btn"
              disabled={submitting || !businessName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 width={14} height={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Finish setup <span className="arrow">→</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
