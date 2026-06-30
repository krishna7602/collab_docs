import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CollabDocs — Local-First Collaborative Document Editor",
  description:
    "A local-first, collaborative document editor with offline synchronization, deterministic conflict resolution via CRDTs, and granular version control. Built with Next.js 16, Yjs, and Tiptap.",
  keywords: [
    "collaborative editor",
    "local-first",
    "CRDT",
    "Yjs",
    "Next.js",
    "document editor",
    "offline sync",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(24, 24, 27, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
