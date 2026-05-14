"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { toast } from "sonner";
import { Dropdown } from "@/components/ui/dropdown";
import { LOCALE_OPTIONS, type Locale } from "@/lib/contracts/i18n";

type Props = {
  contractId: string;
  /** Translations already cached on the latest version row. */
  cached: Record<string, string>;
  onCacheUpdated: (locale: Locale, body: string) => void;
};

export function LanguagePanel({ contractId, cached, onCacheUpdated }: Props) {
  const [locale, setLocale] = React.useState<Locale>("en");
  const [loading, setLoading] = React.useState(false);

  const alreadyCached = locale === "en" || Boolean(cached[locale]);

  const translate = async () => {
    if (locale === "en") {
      toast.info("English is the source — no translation needed.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Translate failed (${res.status})`);
      }
      const data = (await res.json()) as { body_md: string };
      onCacheUpdated(locale, data.body_md);
      toast.success(`Translated — open Preview to view.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="gf-card"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <span className="gf-label">// TRANSLATE WITH AI</span>
      <p
        className="gf-body-sm"
        style={{ color: "var(--fg-3)", margin: 0, fontSize: 13 }}
      >
        Translates template phrasing only. Names, scope, and amounts stay as-is.
        Cached for instant re-use in Preview.
      </p>
      <Dropdown
        value={locale}
        onChange={(v) => setLocale(v as Locale)}
        options={LOCALE_OPTIONS.map((o) => ({
          ...o,
          hint:
            o.value === "en"
              ? "Source"
              : cached[o.value]
                ? "Cached"
                : undefined,
        }))}
        placeholder="Select a language"
        aria-label="Translation language"
        disabled={loading}
      />
      <button
        type="button"
        className="gf-btn"
        onClick={translate}
        disabled={loading || locale === "en"}
      >
        <Languages
          size={14}
          style={{
            marginRight: 6,
            animation: loading ? "gf-spin 1s linear infinite" : undefined,
          }}
        />
        {loading
          ? "Translating…"
          : alreadyCached && locale !== "en"
            ? "Re-translate"
            : "Translate with AI"}
      </button>
    </div>
  );
}
