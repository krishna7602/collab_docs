"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DocumentProvider } from "@/lib/crdt/document-provider";
import { CollaborativeEditor } from "@/components/editor/editor";
import { AIPanel } from "@/components/editor/ai-panel";
import { VersionPanel } from "@/components/editor/version-panel";
import {
  ArrowLeft,
  Clock,
  Share2,
  Sparkles,
  MoreHorizontal,
  Star,
  StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateColor } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: PageProps) {
  const { id: documentId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [isStarred, setIsStarred] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  // Fetch document metadata
  useEffect(() => {
    async function fetchDoc() {
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (res.ok) {
          const doc = await res.json();
          setDocTitle(doc.title);
          setIsStarred(doc.isStarred);
        } else if (res.status === 403 || res.status === 404) {
          router.push("/dashboard");
        }
      } catch {
        // Document may still be accessible locally
      }
    }
    fetchDoc();
  }, [documentId, router]);

  // Update title
  const updateTitle = useCallback(
    async (title: string) => {
      setDocTitle(title);
      try {
        await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      } catch {
        // Silently fail — local-first
      }
    },
    [documentId]
  );

  // Toggle star
  const toggleStar = async () => {
    const newVal = !isStarred;
    setIsStarred(newVal);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: newVal }),
      });
    } catch {
      setIsStarred(!newVal);
    }
  };

  // Handle AI actions from editor
  const handleAIAction = (action: string, text?: string) => {
    setSelectedText(text || "");
    setIsAIPanelOpen(true);
  };

  const userColor = generateColor(session?.user?.id || "default");

  return (
    <DocumentProvider
      documentId={documentId}
      userToken={session?.user?.id}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Editor Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-border glass">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <input
              type="text"
              value={docTitle}
              onChange={(e) => updateTitle(e.target.value)}
              className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 flex-1 max-w-xs"
              placeholder="Untitled Document"
            />

            <button
              onClick={toggleStar}
              className="p-1 rounded hover:bg-secondary transition-colors"
            >
              {isStarred ? (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ) : (
                <Star className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
              className="text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
              AI
            </Button>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden relative">
          <CollaborativeEditor onAIAction={handleAIAction} />

          {/* Side Panels */}
          <AIPanel
            isOpen={isAIPanelOpen}
            onClose={() => setIsAIPanelOpen(false)}
            documentId={documentId}
            selectedText={selectedText}
            onInsert={(text) => {
              // TODO: Insert at cursor position
              console.log("Insert:", text);
            }}
            onReplace={(text) => {
              // TODO: Replace selection
              console.log("Replace:", text);
            }}
          />

          <VersionPanel
            isOpen={isVersionPanelOpen}
            onClose={() => setIsVersionPanelOpen(false)}
            documentId={documentId}
          />
        </div>
      </div>
    </DocumentProvider>
  );
}
