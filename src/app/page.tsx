import Link from "next/link";
import {
  FileText,
  Wifi,
  WifiOff,
  GitBranch,
  Shield,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Github, Linkedin } from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">CollabDocs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Effects (Subtle and minimal) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/4 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/2 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border/80 bg-secondary/35 text-xs text-muted-foreground mb-6 animate-fade-in">
            <Zap className="w-3 h-3 text-primary" />
            <span>Local-First • Real-Time • AI-Powered</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-fade-in text-foreground">
            Write Together, <span className="text-primary">Even Apart</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            A collaborative document editor that works offline, syncs
            automatically, and never loses your work. Powered by CRDTs for
            deterministic conflict resolution.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10 hover:bg-primary/95 hover:scale-[1.01] transition-all duration-200"
            >
              Start Writing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/80 text-foreground font-medium hover:bg-secondary/60 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Built for <span className="text-primary">Real-World Collaboration</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Beyond basic CRUD — sophisticated distributed systems solving
              complex state synchronization challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <WifiOff className="w-6 h-6 text-primary" />,
                title: "Offline-First",
                description:
                  "Edit documents with zero network requests blocking the UI. Your work is saved locally in IndexedDB and syncs when you reconnect.",
              },
              {
                icon: <GitBranch className="w-6 h-6 text-primary" />,
                title: "CRDT Conflict Resolution",
                description:
                  "Yjs CRDTs guarantee deterministic merging without data loss. Concurrent edits from multiple users converge automatically.",
              },
              {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Real-Time Collaboration",
                description:
                  "See live cursors, selections, and edits from collaborators in real-time via WebSocket. Awareness protocol shows who is online.",
              },
              {
                icon: <GitBranch className="w-6 h-6 text-primary" />,
                title: "Version Time Travel",
                description:
                  "Capture named snapshots and browse a visual timeline. Restore any version safely without corrupting the shared state.",
              },
              {
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: "Role-Based Access",
                description:
                  "Owner, Editor, and Viewer roles with strict authorization. Viewers cannot push state updates. Row-level security via ORM scoping.",
              },
              {
                icon: <Sparkles className="w-6 h-6 text-primary" />,
                title: "AI Writing Assistant",
                description:
                  "Powered by Google Gemini — improve writing, summarize, fix grammar, translate, or let AI continue writing for you.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group border border-border/50 bg-secondary/15 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover:scale-[1.01]"
              >
                <div
                  className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 text-foreground group-hover:scale-105 transition-transform border border-border/40"
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground/90">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Technology Stack</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js 16",
              "React 19",
              "TypeScript",
              "Yjs (CRDT)",
              "Tiptap",
              "PostgreSQL",
              "Prisma",
              "Auth.js v5",
              "Tailwind CSS v4",
              "WebSocket",
              "IndexedDB",
              "Vercel AI SDK",
              "Google Gemini",
            ].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg glass text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm font-medium gradient-text">
              CollabDocs
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              Built by{" "}
              <strong className="text-foreground">Ramkrishna</strong>
            </span>
            <a
              href="https://github.com/krishna7602"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ramkrishna-mondal-b73b09294/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
