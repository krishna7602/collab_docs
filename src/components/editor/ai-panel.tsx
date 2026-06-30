"use client";

import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Wand2,
  FileText,
  CheckCircle,
  Languages,
  PenLine,
  HelpCircle,
  X,
  Loader2,
  Copy,
  Check,
  Replace,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AI_ACTIONS: AIAction[] = [
  {
    id: "improve",
    label: "Improve Writing",
    icon: <Wand2 className="w-4 h-4" />,
    description: "Enhance clarity and tone",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: <FileText className="w-4 h-4" />,
    description: "Condense into key points",
  },
  {
    id: "grammar",
    label: "Fix Grammar",
    icon: <CheckCircle className="w-4 h-4" />,
    description: "Correct spelling & grammar",
  },
  {
    id: "translate",
    label: "Translate",
    icon: <Languages className="w-4 h-4" />,
    description: "Translate to another language",
  },
  {
    id: "continue",
    label: "Continue Writing",
    icon: <PenLine className="w-4 h-4" />,
    description: "AI writes the next paragraphs",
  },
  {
    id: "explain",
    label: "Explain",
    icon: <HelpCircle className="w-4 h-4" />,
    description: "Simplify complex text",
  },
];

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  selectedText: string;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
}

export function AIPanel({
  isOpen,
  onClose,
  documentId,
  selectedText,
  onInsert,
  onReplace,
}: AIPanelProps) {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const executeAction = useCallback(
    async (actionId: string) => {
      if (!selectedText && actionId !== "continue") {
        setResult("⚠️ Please select some text first, then click an action.");
        return;
      }

      setIsLoading(true);
      setActiveAction(actionId);
      setResult("");

      try {
        const response = await fetch(`/api/documents/${documentId}/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionId,
            text: selectedText || "Continue from where you left off.",
          }),
        });

        if (!response.ok) {
          // Try to get specific error from API
          try {
            const errData = await response.json();
            if (response.status === 500) {
              setResult("⚠️ AI service unavailable. Make sure GOOGLE_GENERATIVE_AI_API_KEY is set in your .env.local file. Get a free key at aistudio.google.com/apikey");
            } else {
              setResult(`⚠️ Error: ${errData.error || "Request failed"}`);
            }
          } catch {
            setResult("⚠️ AI request failed. Check your API key configuration.");
          }
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setResult(accumulated);
        }
      } catch (error) {
        setResult("⚠️ Network error. Make sure the dev server is running.");
      } finally {
        setIsLoading(false);
      }
    },
    [documentId, selectedText]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 z-50 glass-strong border-l border-border shadow-2xl animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Text Preview */}
      {selectedText && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
          <p className="text-sm text-foreground/80 line-clamp-3 italic">
            &ldquo;{selectedText}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => executeAction(action.id)}
              disabled={isLoading}
              className={cn(
                "flex flex-col items-start gap-1 p-3 rounded-lg border border-border transition-all",
                "hover:bg-secondary hover:border-primary/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                activeAction === action.id && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-1.5 text-foreground">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {action.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {(result || isLoading) && (
        <div className="flex-1 flex flex-col border-t border-border">
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Result
            </p>
            {isLoading && !result && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </div>
            )}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {result}
              {isLoading && (
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </p>
          </div>

          {/* Action Buttons */}
          {result && !isLoading && (
            <div className="p-4 border-t border-border flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onReplace(result);
                  onClose();
                }}
                className="flex-1"
              >
                <Replace className="w-3.5 h-3.5 mr-1" />
                Replace
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onInsert(result);
                  onClose();
                }}
                className="flex-1"
              >
                <PenLine className="w-3.5 h-3.5 mr-1" />
                Insert
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
