"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import type { ContractStyle } from "@/lib/pdf/themes";
import { StyleSidebar } from "./style-sidebar";

type ProfileOption = {
  id: string;
  label: string;
  has_logo: boolean;
  is_default: boolean;
};

type Props = {
  contractId: string;
  initialTitle: string;
  initialBodyMd: string;
  initialStyle: ContractStyle;
  initialBusinessProfileId: string | null;
  profiles: ProfileOption[];
};

type SaveOutcome =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; version: number }
  | { kind: "error"; message: string };

export function ContractEditor({
  contractId,
  initialTitle,
  initialBodyMd,
  initialStyle,
  initialBusinessProfileId,
  profiles,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [style, setStyle] = React.useState<ContractStyle>(initialStyle);
  const [businessProfileId, setBusinessProfileId] = React.useState<string | null>(
    initialBusinessProfileId,
  );
  const [saveState, setSaveState] = React.useState<SaveOutcome>({ kind: "idle" });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: "-",
        breaks: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing — markdown shortcuts (#, -, **bold**) work.",
      }),
    ],
    content: initialBodyMd,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "ProseMirror gf-prose",
      },
    },
  });

  React.useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const serializeMarkdown = React.useCallback((): string => {
    if (!editor) return initialBodyMd;
    const storage = (editor.storage as unknown as Record<string, unknown>).markdown as
      | { getMarkdown?: () => string }
      | undefined;
    if (storage?.getMarkdown) {
      return storage.getMarkdown();
    }
    return editor.getText();
  }, [editor, initialBodyMd]);

  const save = React.useCallback(
    async (): Promise<{ ok: true; version: number } | { ok: false; message: string }> => {
      setSaveState({ kind: "saving" });
      const body_md = serializeMarkdown();
      try {
        const res = await fetch(`/api/contracts/${contractId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body_md,
            title,
            style,
            business_profile_id: businessProfileId,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = data?.error ?? `Save failed (${res.status})`;
          setSaveState({ kind: "error", message });
          return { ok: false, message };
        }
        const data = (await res.json()) as { version: number };
        setSaveState({ kind: "saved", version: data.version });
        return { ok: true, version: data.version };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSaveState({ kind: "error", message });
        return { ok: false, message };
      }
    },
    [businessProfileId, contractId, serializeMarkdown, style, title],
  );

  const downloadAfterSave = async (format: "pdf" | "docx") => {
    const result = await save();
    if (!result.ok) return;
    // Use top-level navigation so the browser handles the download dialog.
    window.location.href = `/api/contracts/${contractId}/${format}`;
  };

  const previewPdf = () => {
    window.open(`/api/contracts/${contractId}/pdf`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="contract-editor__grid">
      <div className="contract-editor__main">
        <div className="contract-editor__title-row">
          <input
            className="gf-input contract-editor__title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contract title"
          />
        </div>

        <EditorToolbar editor={editor} />

        <div className="gf-card contract-editor__paper">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <p className="gf-body-sm" style={{ color: "var(--fg-3)", margin: 0 }}>
              Loading editor…
            </p>
          )}
        </div>
      </div>

      <aside className="contract-editor__sidebar">
        <StyleSidebar
          value={style}
          onChange={setStyle}
          profiles={profiles}
          selectedProfileId={businessProfileId}
          onProfileChange={setBusinessProfileId}
        />

        <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="gf-btn" onClick={previewPdf}>
            Preview PDF <span className="arrow">→</span>
          </button>
          <button
            type="button"
            className="gf-btn"
            onClick={() => downloadAfterSave("pdf")}
            disabled={saveState.kind === "saving"}
          >
            {saveState.kind === "saving" ? "Saving…" : "Save & download PDF"}
          </button>
          <button
            type="button"
            className="gf-btn-ghost"
            onClick={() => downloadAfterSave("docx")}
            disabled={saveState.kind === "saving"}
          >
            Save & download DOCX
          </button>
          <button
            type="button"
            className="gf-btn-ghost"
            onClick={async () => {
              const result = await save();
              if (result.ok) router.refresh();
            }}
            disabled={saveState.kind === "saving"}
          >
            {saveState.kind === "saving" ? "Saving…" : "Save"}
          </button>
          {saveState.kind === "saved" ? (
            <p className="gf-mono-sm" style={{ color: "var(--accent-strong)", margin: 0 }}>
              Saved · v{saveState.version}
            </p>
          ) : null}
          {saveState.kind === "error" ? (
            <p className="gf-mono-sm" style={{ color: "var(--sev-red)", margin: 0 }}>
              {saveState.message}
            </p>
          ) : null}
        </div>
      </aside>
      <EditorStyles />
    </div>
  );
}

type EditorToolbarProps = {
  editor: Editor | null;
};

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return <div className="contract-editor__toolbar" aria-hidden />;
  }
  const e: Editor = editor;
  const button = (
    label: string,
    active: boolean,
    onClick: () => void,
    title: string,
  ) => (
    <button
      type="button"
      className={
        "contract-editor__toolbtn" + (active ? " is-active" : "")
      }
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <div className="contract-editor__toolbar">
      {button(
        "B",
        e.isActive("bold"),
        () => e.chain().focus().toggleBold().run(),
        "Bold",
      )}
      {button(
        "I",
        e.isActive("italic"),
        () => e.chain().focus().toggleItalic().run(),
        "Italic",
      )}
      {button(
        "H1",
        e.isActive("heading", { level: 1 }),
        () => e.chain().focus().toggleHeading({ level: 1 }).run(),
        "Heading 1",
      )}
      {button(
        "H2",
        e.isActive("heading", { level: 2 }),
        () => e.chain().focus().toggleHeading({ level: 2 }).run(),
        "Heading 2",
      )}
      {button(
        "H3",
        e.isActive("heading", { level: 3 }),
        () => e.chain().focus().toggleHeading({ level: 3 }).run(),
        "Heading 3",
      )}
      {button(
        "•",
        e.isActive("bulletList"),
        () => e.chain().focus().toggleBulletList().run(),
        "Bullet list",
      )}
      {button(
        "1.",
        e.isActive("orderedList"),
        () => e.chain().focus().toggleOrderedList().run(),
        "Ordered list",
      )}
      {button(
        "―",
        false,
        () => e.chain().focus().setHorizontalRule().run(),
        "Horizontal rule",
      )}
    </div>
  );
}

function EditorStyles() {
  return (
    <style>{`
      .contract-editor__grid {
        display: grid;
        grid-template-columns: minmax(0, 960px) 320px;
        gap: 32px;
        align-items: start;
      }
      @media (max-width: 980px) {
        .contract-editor__grid { grid-template-columns: 1fr; }
        .contract-editor__sidebar { order: -1; position: static !important; }
      }
      .contract-editor__main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
      .contract-editor__title-row { display: flex; }
      .contract-editor__title {
        font-size: 22px;
        font-weight: 600;
        background: transparent;
        border: 1px dashed var(--rule);
      }
      .contract-editor__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        border: 1px solid var(--rule);
        background: var(--surface);
        padding: 6px;
      }
      .contract-editor__toolbtn {
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1;
        padding: 6px 10px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--fg-2);
        cursor: pointer;
        min-width: 32px;
      }
      .contract-editor__toolbtn:hover { color: var(--fg-1); border-color: var(--rule); }
      .contract-editor__toolbtn.is-active {
        color: var(--accent-strong);
        border-color: var(--accent-strong);
        background: var(--accent-tint);
      }
      .contract-editor__paper {
        min-height: 480px;
        max-width: none;
      }
      .contract-editor__paper .ProseMirror {
        outline: none;
        min-height: 420px;
        font-size: 15px;
        line-height: 1.7;
        color: var(--fg-2);
      }
      .contract-editor__paper .ProseMirror :where(h1) {
        font-size: 28px;
        font-weight: 700;
        color: var(--fg-1);
        margin: 0 0 12px;
      }
      .contract-editor__paper .ProseMirror :where(h2) {
        font-size: 20px;
        font-weight: 700;
        color: var(--fg-1);
        margin: 24px 0 8px;
      }
      .contract-editor__paper .ProseMirror :where(h3) {
        font-size: 16px;
        font-weight: 600;
        color: var(--fg-1);
        margin: 18px 0 6px;
      }
      .contract-editor__paper .ProseMirror :where(p) { margin: 0 0 12px; }
      .contract-editor__paper .ProseMirror :where(strong) { color: var(--fg-1); }
      .contract-editor__paper .ProseMirror :where(ul, ol) {
        padding-left: 24px;
        margin: 0 0 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .contract-editor__paper .ProseMirror :where(a) {
        color: var(--accent-strong);
        border-bottom: 1px solid currentColor;
      }
      .contract-editor__paper .ProseMirror :where(hr) {
        border: none;
        border-top: 1px solid var(--rule);
        margin: 16px 0;
      }
      .contract-editor__paper .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: var(--fg-4);
        pointer-events: none;
        height: 0;
      }
      .contract-editor__sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: sticky;
        top: 96px;
      }
    `}</style>
  );
}
