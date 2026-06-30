"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, posToDOMRect, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Typography from "@tiptap/extension-typography";
import { common, createLowlight } from "lowlight";
import { useDocument } from "@/lib/crdt/document-provider";
import { EditorToolbar } from "./toolbar";
import { EditorBubbleMenu } from "./bubble-menu";
import { ConnectionStatus } from "./connection-status";

const lowlight = createLowlight(common);

// ---------------------------------------------------------------------------
// FloatingBubbleMenu — replaces <BubbleMenu> (removed from @tiptap/react v3)
// Uses a portal so it renders above everything and tracks selection position
// via posToDOMRect.
// ---------------------------------------------------------------------------
interface FloatingBubbleMenuProps {
  editor: Editor;
  onAIAction: (action: string) => void;
}

function FloatingBubbleMenu({ editor, onAIAction }: FloatingBubbleMenuProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const { empty, from, to } = editor.state.selection;
      if (empty) {
        setRect(null);
        return;
      }
      const domRect = posToDOMRect(editor.view, from, to);
      setRect(domRect);
    };

    const hide = () => setRect(null);

    editor.on("selectionUpdate", update);
    editor.on("blur", hide);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("blur", hide);
    };
  }, [editor]);

  if (!rect || typeof document === "undefined") return null;

  const top = rect.top + window.scrollY - 52; // 52px above selection
  const left = rect.left + window.scrollX + rect.width / 2;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top,
        left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
      className="glass-strong rounded-lg shadow-2xl overflow-hidden"
      // Prevent editor from losing focus when clicking bubble menu buttons
      onMouseDown={(e) => e.preventDefault()}
    >
      <EditorBubbleMenu editor={editor} onAIAction={onAIAction} />
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// CollaborativeEditor
// ---------------------------------------------------------------------------
interface CollaborativeEditorProps {
  onAIAction?: (action: string, selectedText?: string) => void;
}

export function CollaborativeEditor({ onAIAction }: CollaborativeEditorProps) {
  const { ydoc, isSynced } = useDocument();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for IndexedDB sync before rendering editor
    if (isSynced) {
      setIsReady(true);
    }
  }, [isSynced]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false, // Disabled — Yjs handles undo/redo via CRDT
          codeBlock: false, // Using CodeBlockLowlight instead
        } as any),
        Collaboration.configure({
          document: ydoc,
        }),
        Placeholder.configure({
          placeholder: "Start writing something amazing...",
          emptyEditorClass: "is-editor-empty",
        }),
        Highlight.configure({
          multicolor: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2",
          },
        }),
        Underline,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TextStyle,
        Color,
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg max-w-full",
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        CodeBlockLowlight.configure({
          lowlight,
        }),
        Typography,
      ],
      editorProps: {
        attributes: {
          class: "tiptap prose-invert focus:outline-none max-w-none",
        },
      },
      immediatelyRender: false, // Prevents SSR hydration issues
    },
    [isReady]
  );

  const handleAIAction = useCallback(
    (action: string) => {
      if (!editor || !onAIAction) return;

      const { from, to, empty } = editor.state.selection;
      let selectedText = "";

      if (!empty) {
        selectedText = editor.state.doc.textBetween(from, to, "\n");
      }

      onAIAction(action, selectedText);
    },
    [editor, onAIAction]
  );

  if (!isReady) {
    return (
      <div className="flex flex-col gap-4 p-8 animate-pulse">
        <div className="h-8 w-2/3 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-5/6 skeleton rounded" />
        <div className="h-4 w-4/6 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar editor={editor} onAIAction={handleAIAction} />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Floating bubble menu — portal-based, appears above text selection */}
      {editor && (
        <FloatingBubbleMenu editor={editor} onAIAction={handleAIAction} />
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32">
        <div className="max-w-3xl mx-auto py-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
