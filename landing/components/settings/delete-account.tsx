"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/app/(app)/settings/actions";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const matches = confirmText === CONFIRM_PHRASE;

  const onCancel = () => {
    setConfirming(false);
    setConfirmText("");
    setError(null);
  };

  const onDelete = async () => {
    if (!matches) return;
    setPending(true);
    setError(null);
    const result = await deleteAccount();
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    // Account gone. Push to home and force a server-component re-fetch.
    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="gf-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderColor: "var(--sev-red)",
      }}
    >
      <h3 className="gf-h4" style={{ color: "var(--sev-red)" }}>
        Delete account
      </h3>
      <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
        Permanent. Wipes your profile, contracts, scans, uploaded files, and
        usage history. There&apos;s no undo. If you signed in with Google, the
        Google account itself stays — only your Green Flagged data is removed.
      </p>

      {!confirming ? (
        <div>
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            style={{ color: "var(--sev-red)", borderColor: "var(--sev-red)" }}
            onClick={() => setConfirming(true)}
          >
            Delete my account
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="gf-label">
              // TYPE {CONFIRM_PHRASE} TO CONFIRM
            </span>
            <Input
              type="text"
              autoComplete="off"
              autoFocus
              placeholder={CONFIRM_PHRASE}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
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
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="gf-btn"
              style={{
                background: "var(--sev-red)",
                color: "var(--paper-0)",
                borderColor: "var(--sev-red)",
              }}
              disabled={!matches || pending}
              onClick={onDelete}
            >
              {pending ? (
                <>
                  <Loader2 width={14} height={14} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                <>Permanently delete</>
              )}
            </button>
            <button
              type="button"
              className="gf-btn-link"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
