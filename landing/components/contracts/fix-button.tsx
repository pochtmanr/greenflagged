"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

type Props = {
  contractId: string;
  disabled?: boolean;
};

export function FixButton({ contractId, disabled = false }: Props) {
  const router = useRouter();
  const [navigating, setNavigating] = React.useState(false);

  function onClick() {
    if (navigating || disabled) return;
    setNavigating(true);
    router.push(`/contracts/${contractId}/fix`);
  }

  return (
    <button
      type="button"
      className="gf-btn-link"
      onClick={onClick}
      disabled={disabled || navigating}
    >
      {navigating ? "Opening…" : "Create fixed version"}{" "}
      <span className="arrow">→</span>
    </button>
  );
}
