"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BubbleMenuProps {
  editor: Editor;
  onAIAction: (action: string) => void;
}

interface BubbleButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  label?: string;
}

function BubbleButton({ onClick, isActive, children, label }: BubbleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-1.5 transition-colors",
        "hover:bg-white/10 text-muted-foreground hover:text-foreground",
        isActive && "text-primary bg-primary/10"
      )}
      title={label}
    >
      {children}
    </button>
  );
}

export function EditorBubbleMenu({ editor, onAIAction }: BubbleMenuProps) {
  return (
    <div className="flex items-center">
      <BubbleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        label="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        label="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        label="Underline"
      >
        <Underline className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        label="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        label="Code"
      >
        <Code className="w-3.5 h-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        label="Highlight"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </BubbleButton>

      <div className="w-px h-5 bg-border mx-0.5" />

      <BubbleButton
        onClick={() => onAIAction("improve")}
        label="AI Improve"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
      </BubbleButton>
    </div>
  );
}
