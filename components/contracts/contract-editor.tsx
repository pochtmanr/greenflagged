"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  DOC_PREVIEW_FONTS,
  resolveStyle,
  type ContractStyle,
} from "@/lib/pdf/themes";
import { StyleSidebar } from "./style-sidebar";
import { AiTweakPanel } from "./ai-tweak-panel";
import { LanguagePanel } from "./language-panel";

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
  initialTranslations: Record<string, string> | null;
  profiles: ProfileOption[];
  initialLogoSrc: string | null;
  initialBusinessName: string | null;
  initialBusinessAddress: string | null;
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
  initialTranslations,
  profiles,
  initialLogoSrc,
  initialBusinessName,
  initialBusinessAddress,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [style, setStyle] = React.useState<ContractStyle>(initialStyle);
  const [businessProfileId, setBusinessProfileId] = React.useState<string | null>(
    initialBusinessProfileId,
  );
  const [saveState, setSaveState] = React.useState<SaveOutcome>({ kind: "idle" });
  const [translations, setTranslations] = React.useState<Record<string, string>>(
    initialTranslations ?? {},
  );

  // Logo / business name / address mirror what the server resolved for the
  // initial profile. When the user switches profile in the StyleSidebar the
  // editor surface still shows the previous logo until the user saves and
  // reloads — acceptable since the canonical render runs server-side.
  const logoSrc = initialLogoSrc;
  const businessName = initialBusinessName;
  const businessAddress = initialBusinessAddress;

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

  const applyAiRevision = React.useCallback(
    (nextBodyMd: string) => {
      if (editor) {
        editor.commands.setContent(nextBodyMd, { emitUpdate: false });
      }
      // Editing the canonical body invalidates any cached translations.
      setTranslations({});
    },
    [editor],
  );

  const save = React.useCallback(
    async (): Promise<
      { ok: true; version: number } | { ok: false; message: string }
    > => {
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

  // Resolve live preview CSS vars so headings / body / accent track the
  // current style selection. Mirrors StyledMarkdown so /edit and /preview
  // share the same surface.
  const resolved = resolveStyle(style);
  const fonts = DOC_PREVIEW_FONTS[style.typography];
  const docVars = {
    "--doc-font-heading": fonts.heading,
    "--doc-font-body": fonts.body,
    "--doc-accent": resolved.colors.accent,
  } as React.CSSProperties;
  const docClass = [
    "doc-preview",
    "contract-editor__paper",
    `doc-preview--layout-${style.layout}`,
    `doc-preview--logo-${style.logo_placement}`,
  ].join(" ");

  const showLogo = style.logo_placement !== "none" && Boolean(logoSrc);
  const logoImg = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoSrc} alt={businessName ?? "Logo"} className="doc-logo" />
  ) : null;

  const headerWithInfo =
    style.logo_placement === "header_with_info" ? (
      <div className="doc-preview__head" contentEditable={false}>
        <div className="doc-preview__head-logo">{logoImg}</div>
        <div className="doc-preview__head-info">
          {businessName ? <strong>{businessName}</strong> : null}
          {businessAddress ? <span>{businessAddress}</span> : null}
        </div>
      </div>
    ) : null;

  const plainHeaderLogo =
    style.logo_placement === "header" && showLogo ? (
      <div contentEditable={false}>{logoImg}</div>
    ) : null;

  const coverHeader =
    style.layout === "cover" ? (
      <div className="doc-preview__cover" contentEditable={false}>
        {style.logo_placement === "cover" && logoImg}
        <h1 className="doc-preview__cover-title">{title}</h1>
        {businessName ? (
          <p className="doc-preview__cover-sub">{businessName}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="contract-editor__wrap">
      <div className="contract-editor__actionbar">
        <button
          type="button"
          className="gf-btn"
          onClick={async () => {
            const result = await save();
            if (result.ok) router.refresh();
          }}
          disabled={saveState.kind === "saving"}
        >
          {saveState.kind === "saving" ? "Saving…" : "Save"}{" "}
          <span className="arrow">→</span>
        </button>
        <Link
          href={`/contracts/${contractId}/preview`}
          className="gf-btn-ghost"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview
        </Link>
        {saveState.kind === "saved" ? (
          <span
            className="gf-mono-sm"
            style={{ color: "var(--accent-strong)" }}
          >
            Saved · v{saveState.version}
          </span>
        ) : null}
        {saveState.kind === "error" ? (
          <span
            className="gf-mono-sm"
            style={{ color: "var(--sev-red)" }}
          >
            {saveState.message}
          </span>
        ) : null}
      </div>

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

          <div className={docClass} style={docVars}>
            {coverHeader}
            {coverHeader ? <hr /> : null}
            {plainHeaderLogo}
            {headerWithInfo}
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <p
                className="gf-body-sm"
                style={{ color: "var(--fg-3)", margin: 0 }}
              >
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

          <AiTweakPanel contractId={contractId} onApply={applyAiRevision} />

          <LanguagePanel
            contractId={contractId}
            cached={translations}
            onCacheUpdated={(loc, body) =>
              setTranslations((prev) => ({ ...prev, [loc]: body }))
            }
          />
        </aside>
      </div>
      <EditorStyles />
    </div>
  );
}

type EditorToolbarProps = {
  editor: Editor | null;
};

type ToolbarState = {
  bold: boolean;
  italic: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  bullet: boolean;
  ordered: boolean;
};

const EMPTY_STATE: ToolbarState = {
  bold: false,
  italic: false,
  h1: false,
  h2: false,
  h3: false,
  bullet: false,
  ordered: false,
};

function EditorToolbar({ editor }: EditorToolbarProps) {
  // useEditorState re-renders the toolbar on every editor transaction, so
  // active marks reflect the current selection. Without this the buttons
  // would never update after the initial render.
  const state =
    useEditorState({
      editor,
      selector: ({ editor: ed }): ToolbarState => {
        if (!ed) return EMPTY_STATE;
        return {
          bold: ed.isActive("bold"),
          italic: ed.isActive("italic"),
          h1: ed.isActive("heading", { level: 1 }),
          h2: ed.isActive("heading", { level: 2 }),
          h3: ed.isActive("heading", { level: 3 }),
          bullet: ed.isActive("bulletList"),
          ordered: ed.isActive("orderedList"),
        };
      },
    }) ?? EMPTY_STATE;

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
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {label}
    </button>
  );

  return (
    <div className="contract-editor__toolbar">
      {button(
        "B",
        state.bold,
        () => e.chain().focus().toggleBold().run(),
        "Bold",
      )}
      {button(
        "I",
        state.italic,
        () => e.chain().focus().toggleItalic().run(),
        "Italic",
      )}
      {button(
        "H1",
        state.h1,
        () => e.chain().focus().toggleHeading({ level: 1 }).run(),
        "Heading 1",
      )}
      {button(
        "H2",
        state.h2,
        () => e.chain().focus().toggleHeading({ level: 2 }).run(),
        "Heading 2",
      )}
      {button(
        "H3",
        state.h3,
        () => e.chain().focus().toggleHeading({ level: 3 }).run(),
        "Heading 3",
      )}
      {button(
        "•",
        state.bullet,
        () => e.chain().focus().toggleBulletList().run(),
        "Bullet list",
      )}
      {button(
        "1.",
        state.ordered,
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
      .contract-editor__wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .contract-editor__actionbar {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding-bottom: 12px;
        border-bottom: 1px dashed var(--rule);
      }
      .contract-editor__grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 32px;
        align-items: start;
      }
      @media (max-width: 980px) {
        .contract-editor__grid { grid-template-columns: 1fr; }
        .contract-editor__sidebar { order: -1; position: static !important; }
      }
      .contract-editor__main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
      .contract-editor__sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: sticky;
        top: 96px;
      }
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

      /* Editor surface inherits .doc-preview (paper bg, layout/logo variants)
         and overrides ProseMirror so the live editor matches /preview. */
      .contract-editor__paper.doc-preview {
        min-height: 600px;
        max-width: none;
      }
      .contract-editor__paper .ProseMirror {
        outline: none;
        min-height: 480px;
        font-family: var(--doc-font-body);
        font-size: 14px;
        line-height: 1.6;
        color: #0E110F;
      }
      .contract-editor__paper .ProseMirror :where(h1, h2, h3) {
        font-family: var(--doc-font-heading);
        color: var(--doc-accent);
        letter-spacing: -0.01em;
        margin: 0 0 12px;
      }
      .contract-editor__paper .ProseMirror :where(h1) { font-size: 26px; font-weight: 700; }
      .contract-editor__paper .ProseMirror :where(h2) { font-size: 18px; font-weight: 700; margin-top: 24px; }
      .contract-editor__paper .ProseMirror :where(h3) { font-size: 15px; font-weight: 600; margin-top: 18px; }
      .contract-editor__paper .ProseMirror :where(p) { margin: 8px 0 12px; }
      .contract-editor__paper .ProseMirror :where(strong) { color: #0E110F; font-weight: 700; }
      .contract-editor__paper .ProseMirror :where(ul, ol) {
        padding-left: 1.4em;
        margin: 8px 0 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .contract-editor__paper .ProseMirror :where(a) {
        color: var(--doc-accent);
        border-bottom: 1px solid currentColor;
      }
      .contract-editor__paper .ProseMirror :where(hr) {
        border: none;
        border-top: 1px dashed #D9D5C7;
        margin: 24px 0;
      }
      .contract-editor__paper .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: #9B9684;
        pointer-events: none;
        height: 0;
      }
    `}</style>
  );
}
