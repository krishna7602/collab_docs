"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Save,
  RotateCcw,
  X,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocument } from "@/lib/crdt/document-provider";
import * as Y from "yjs";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Version {
  id: string;
  name: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export function VersionPanel({
  isOpen,
  onClose,
  documentId,
}: VersionPanelProps) {
  const { ydoc } = useDocument();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fetchVersions]);

  // Save snapshot
  const saveSnapshot = async () => {
    setIsSaving(true);
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(update))
      );

      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: snapshotName || undefined,
          content: base64,
        }),
      });

      if (res.ok) {
        setSnapshotName("");
        fetchVersions();
      }
    } catch (error) {
      console.error("Failed to save snapshot:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Restore version
  const restoreVersion = async (versionId: string) => {
    if (!confirm("Restore this version? This creates a new snapshot of the current state first.")) {
      return;
    }

    try {
      // First, save current state as a snapshot
      const currentUpdate = Y.encodeStateAsUpdate(ydoc);
      const currentBase64 = btoa(
        String.fromCharCode(...new Uint8Array(currentUpdate))
      );

      await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Auto-save before restore",
          content: currentBase64,
        }),
      });

      // Fetch the version content
      const res = await fetch(
        `/api/documents/${documentId}/versions/${versionId}`
      );

      if (res.ok) {
        const data = await res.json();
        const binary = atob(data.content);
        const uint8 = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          uint8[i] = binary.charCodeAt(i);
        }

        // Apply the version state to the document
        // This creates a new update that merges via CRDT
        const tempDoc = new Y.Doc();
        Y.applyUpdate(tempDoc, uint8);

        // Get the text content from the temp doc and apply to current
        const currentText = ydoc.getText("default");
        const versionText = tempDoc.getText("default");

        ydoc.transact(() => {
          currentText.delete(0, currentText.length);
          currentText.insert(0, versionText.toString());
        });

        tempDoc.destroy();
        fetchVersions();
      }
    } catch (error) {
      console.error("Failed to restore version:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 z-50 glass-strong border-l border-border shadow-2xl animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Save Snapshot */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="Snapshot name (optional)"
            className="flex-1 text-sm bg-secondary border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="sm" onClick={saveSnapshot} disabled={isSaving}>
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? "..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Version Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No snapshots yet</p>
              <p className="text-xs mt-1">
                Save a snapshot to create a version
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />

              <div className="space-y-1">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={cn(
                      "relative pl-8 py-2 rounded-lg transition-colors cursor-pointer",
                      "hover:bg-secondary/50",
                      selectedVersion === version.id && "bg-secondary"
                    )}
                    onClick={() =>
                      setSelectedVersion(
                        selectedVersion === version.id ? null : version.id
                      )
                    }
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-1.5 top-4 w-3 h-3 rounded-full border-2 border-background",
                        index === 0
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      )}
                    />

                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {version.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <UserIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {version.createdBy.name || version.createdBy.email}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(version.createdAt)}
                        </p>
                      </div>

                      {selectedVersion === version.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreVersion(version.id);
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
