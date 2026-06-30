"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Plus,
  FileText,
  Search,
  Star,
  Users,
  MoreHorizontal,
  Trash2,
  Share2,
  Edit3,
  LogOut,
  Loader2,
  Clock,
  StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatRelativeTime, getInitials, generateColor } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  icon: string;
  isStarred: boolean;
  updatedAt: string;
  createdAt: string;
  owner: { id: string; name: string | null; email: string | null; image: string | null };
  collaborators: Array<{
    role: string;
    user: { id: string; name: string | null; email: string | null; image: string | null };
  }>;
  _count: { versions: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "owned" | "shared" | "starred">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [shareDialogDoc, setShareDialogDoc] = useState<Document | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("EDITOR");
  const [shareError, setShareError] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/editor/${doc.id}`);
      }
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const toggleStar = async (doc: Document) => {
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: !doc.isStarred }),
      });
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, isStarred: !d.isStarred } : d
        )
      );
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  const shareDocument = async () => {
    if (!shareDialogDoc) return;
    setShareError("");

    try {
      const res = await fetch(`/api/documents/${shareDialogDoc.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        setShareError(data.error || "Failed to share");
        return;
      }

      setShareEmail("");
      setShareDialogDoc(null);
      fetchDocuments();
    } catch {
      setShareError("Something went wrong");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "owned":
        return doc.owner.id === session?.user?.id;
      case "shared":
        return doc.owner.id !== session?.user?.id;
      case "starred":
        return doc.isStarred;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Visual Accent Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/60 w-full backdrop-blur-md">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <FileText className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">CollabDocs</span>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={createDocument} 
              disabled={isCreating} 
              size="sm" 
              className="bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02]"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              New Document
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-secondary/60 rounded-full p-1.5 transition-all outline-none">
                  <Avatar className="w-8.5 h-8.5 ring-2 ring-border/50">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="bg-secondary text-primary font-semibold text-xs">
                      {getInitials(session?.user?.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 glass-strong border-border/80">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-6 py-10 z-10 max-w-7xl mx-auto">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-card/40 border-border/80 focus:border-primary/50 transition-all rounded-xl"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-xl p-1 backdrop-blur-sm self-start sm:self-auto">
            {(["all", "owned", "shared", "starred"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 capitalize cursor-pointer",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-44 rounded-2xl opacity-60" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-24 glass rounded-3xl border-border/50 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-5 border border-border/40">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? "No matching documents" : "No documents created"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
              {searchQuery
                ? "Double check your query or adjust the status filters."
                : "Create a collaborative, real-time workspace to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={createDocument} className="shadow-md shadow-primary/15 hover:shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> Create First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/editor/${doc.id}`)}
                className={cn(
                  "group relative glass rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[170px]",
                  "hover:bg-secondary/20 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.04]",
                  "hover:scale-[1.01] animate-fade-in"
                )}
              >
                {/* Header: Icon, Title & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl select-none group-hover:scale-110 transition-transform duration-250 shrink-0">
                      {doc.icon}
                    </span>
                    <h3 className="font-semibold text-sm text-foreground/90 truncate tracking-tight">
                      {doc.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(doc);
                      }}
                      className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {doc.isStarred ? (
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Star className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                        className="glass-strong border-border/80"
                      >
                        <DropdownMenuItem
                          onClick={() => router.push(`/editor/${doc.id}`)}
                          className="cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 mr-2.5 text-muted-foreground" /> Edit Document
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShareDialogDoc(doc)}
                          className="cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 mr-2.5 text-muted-foreground" /> Share Access
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/60" />
                        <DropdownMenuItem
                          onClick={() => deleteDocument(doc.id)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2.5" /> Delete Document
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Footer Meta */}
                <div className="space-y-4 pt-4 border-t border-border/40 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Edited {formatRelativeTime(doc.updatedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      <Avatar className="w-5.5 h-5.5 ring-2 ring-background shrink-0">
                        <AvatarImage src={doc.owner.image || ""} />
                        <AvatarFallback
                          className="text-[8px] font-bold"
                          style={{ backgroundColor: generateColor(doc.owner.id) + "25", color: generateColor(doc.owner.id) }}
                        >
                          {getInitials(doc.owner.name || "O")}
                        </AvatarFallback>
                      </Avatar>
                      {doc.collaborators.slice(0, 3).map((c) => (
                        <Avatar key={c.user.id} className="w-5.5 h-5.5 ring-2 ring-background shrink-0">
                          <AvatarImage src={c.user.image || ""} />
                          <AvatarFallback
                            className="text-[8px] font-bold"
                            style={{ backgroundColor: generateColor(c.user.id) + "25", color: generateColor(c.user.id) }}
                          >
                            {getInitials(c.user.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {doc.collaborators.length > 3 && (
                        <div className="w-5.5 h-5.5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-semibold text-muted-foreground ring-2 ring-background shrink-0">
                          +{doc.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                    {doc._count.versions > 0 && (
                      <span className="text-[10px] text-muted-foreground/75 font-medium px-2 py-0.5 rounded-full bg-secondary/50 border border-border/30">
                        {doc._count.versions} v{doc._count.versions > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 w-full mt-auto bg-card/20 backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-6.5 h-6.5 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-foreground/80 tracking-wide">CollabDocs</span>
            <span className="text-border">|</span>
            <span>Local-First Workspace</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Built by <strong className="text-foreground/90 font-semibold">Ramkrishna</strong></span>
            <a href="https://github.com/krishna7602" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium">
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/ramkrishna-mondal-b73b09294/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>

      {/* Share Dialog */}
      <Dialog
        open={!!shareDialogDoc}
        onOpenChange={(open) => !open && setShareDialogDoc(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Invite collaborators by email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {shareError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {shareError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="collaborator@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShareRole("EDITOR")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                    shareRole === "EDITOR"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  ✏️ Editor
                </button>
                <button
                  onClick={() => setShareRole("VIEWER")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                    shareRole === "VIEWER"
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  👁️ Viewer
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShareDialogDoc(null)}>
              Cancel
            </Button>
            <Button onClick={shareDocument}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
