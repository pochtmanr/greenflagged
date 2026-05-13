"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContractKind } from "@/lib/supabase/types";

export type ContractRowMenuRow = {
  id: string;
  title: string | null;
  kind: ContractKind;
};

type Props = {
  row: ContractRowMenuRow;
  busy: boolean;
  onClone: (id: string) => void;
  onDelete: (id: string, title: string | null) => void;
};

/**
 * ContractRowMenu — the per-row [⋮] dropdown used on both
 * `/dashboard` (My contracts widget) and `/contracts` (full index).
 *
 * Owns no state; clone/delete handlers and busy flag come from the parent
 * table so optimistic UI stays consistent across surfaces.
 */
export function ContractRowMenu({ row, busy, onClone, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Row actions"
          className="gf-row-action"
          onClick={(e) => e.stopPropagation()}
          disabled={busy}
        >
          ⋮
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href={`/contracts/${row.id}`}>Open</Link>
        </DropdownMenuItem>
        {row.kind === "drafted" ? (
          <DropdownMenuItem asChild>
            <Link href={`/contracts/${row.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        ) : null}
        {row.kind === "drafted" ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onClone(row.id);
            }}
          >
            Clone as template
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href={`/api/contracts/${row.id}/pdf`}
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            Download PDF
          </a>
        </DropdownMenuItem>
        {row.kind === "drafted" ? (
          <DropdownMenuItem asChild>
            <a
              href={`/api/contracts/${row.id}/docx`}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              Download DOCX
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          danger
          onSelect={(e) => {
            e.preventDefault();
            onDelete(row.id, row.title);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
