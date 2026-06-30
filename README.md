# CollabDocs 📝

A state-of-the-art **local-first, collaborative document editor** featuring real-time peer synchronization, offline-resilience with conflict resolution via Conflict-free Replicated Data Types (CRDTs), named version histories, and a Gemini-powered writing assistant.

> Submitted for the Fullstack Developer Assignment (v2.2)

---

## ✨ Features Deep-Dive

### 🔌 Local-First Architecture
* **IndexedDB Store:** Powered by `y-indexeddb`, client mutations write directly to local IndexedDB. The application is completely interactive offline.
* **Resilient Sync Engine:** Updates accumulate client-side and synchronize instantly when the connection to the WebSocket server is restored.

### 🔄 Mathematical Conflict Resolution (CRDT)
* **Yjs CRDT Engine:** Utilizes Yjs to merge updates deterministically.
* **Zero Merging Conflicts:** Multi-user concurrent inputs converge seamlessly without requiring manual resolution.

### 👥 Real-Time Presence & Collaboration
* **WebSocket Server:** Dedicated standalone server on port `1234` utilizing the Yjs Awareness Protocol.
* **Presence & Cursors:** Collaborators see real-time cursor offsets, active selection highlight colors, and who is online.

### 📜 Version History & Snapshot Time-Travel
* **Named Snapshots:** Save checkpoints before making extensive changes.
* **Nondestructive Restores:** Restoring a historic version auto-creates a backup of the current state before rolling back the workspace text.

### 🤖 Gemini AI Assistant
* **Vercel AI SDK Integration:** Powered by `gemini-2.0-flash`.
* **Actions Suite:** Rewrite/improve, summarize, fix grammar, translate, explain, and continue writing.
* **Inline Injection:** Smooth stream-typewriter effect with instant insert-at-cursor or selection-replace.

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 16 (App Router, React 19, TypeScript)
* **CRDT & Sync:** Yjs + `y-websocket` + `y-indexeddb`
* **Rich Text Editor:** Tiptap Editor (ProseMirror core)
* **Styling & UI:** Tailwind CSS v4, Lucide React, Radix UI primitives
* **Database & ORM:** PostgreSQL + Prisma ORM
* **Authentication:** Auth.js v5 (NextAuth) supporting Email/Credentials
* **AI Integration:** Google Generative AI (Gemini) via Vercel AI SDK

---

## 🚀 Setup & Execution Guide

### 1. Configure Environments

Create a `.env` **and** `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db_name>?sslmode=require"

# Authentication (Generate secret with `openssl rand -base64 32`)
AUTH_SECRET="your-auth-secret-key"
AUTH_URL="http://localhost:3000"

# Gemini AI (Free tier at aistudio.google.com/apikey)
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:1234"
WS_PORT=1234
```

### 2. Install Packages
```bash
npm install
```

### 3. Sync Database Schema
Deploy the Prisma schema models to your PostgreSQL / Neon database instance and regenerate the client:
```bash
npx prisma db push
```

### 4. Start Development Servers

You can start both the Next.js development server and the WebSocket collaboration server in a single command, or start them separately:

#### Option A: Start Concurrently (Recommended)
Runs both the Next.js app and the WebSocket server concurrently in the same terminal session:
```bash
npm run dev:all
```

#### Option B: Start Separately
* **Next.js Web App Server** (Port `3000`):
  ```bash
  npm run dev
  ```
* **WebSocket Collaboration Server** (Port `1234`):
  ```bash
  npm run dev:ws
  ```

---

## 📂 Project Architecture

```
├── prisma/
│   └── schema.prisma         # Postgres database schema
├── server/
│   └── ws-server.js          # Standalone WebSocket server (Yjs awareness & sync)
├── src/
│   ├── app/
│   │   ├── api/              # Rest endpoints (Auth, Documents, AI)
│   │   ├── dashboard/        # Premium workspace dashboard
│   │   ├── editor/[id]/      # Live document portal
│   │   └── page.tsx          # Marketing Landing page
│   ├── components/
│   │   ├── editor/           # Tiptap toolbar, status panel, AI sidebars
│   │   └── ui/               # Radix UI design primitives
│   ├── lib/
│   │   └── crdt/             # Sync provider logic (WebSocket + IndexedDB)
│   ├── auth.ts               # Auth.js core config
│   └── proxy.ts              # Route protection middleware
```

---

## 👤 Author

* **Name:** Ramkrishna
* **GitHub:** [github.com/krishna7602](https://github.com/krishna7602)
* **LinkedIn:** [linkedin.com/in/ramkrishna-mondal-b73b09294](https://www.linkedin.com/in/ramkrishna-mondal-b73b09294/)

