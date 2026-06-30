import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canEdit } from "@/lib/authorization";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const aiActionSchema = z.object({
  action: z.enum([
    "improve",
    "summarize",
    "grammar",
    "translate",
    "continue",
    "explain",
  ]),
  text: z.string().max(10000),
  language: z.string().max(50).optional(),
});

const PROMPTS: Record<string, (text: string, lang?: string) => string> = {
  improve: (text) =>
    `Improve the following text for clarity, readability, and professional tone. Keep the same meaning but make it more polished and engaging. Return ONLY the improved text without any explanation:\n\n${text}`,
  summarize: (text) =>
    `Summarize the following text concisely in 2-3 sentences. Return ONLY the summary:\n\n${text}`,
  grammar: (text) =>
    `Fix all grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text without explanation:\n\n${text}`,
  translate: (text, lang = "Spanish") =>
    `Translate the following text to ${lang}. Return ONLY the translation:\n\n${text}`,
  continue: (text) =>
    `Continue writing from where the following text leaves off. Write 2-3 more paragraphs in the same style and tone. Return ONLY the continuation:\n\n${text}`,
  explain: (text) =>
    `Explain the following text in simpler terms that anyone can understand. Return ONLY the explanation:\n\n${text}`,
};

// POST /api/documents/[id]/ai - AI text operations
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const hasEditAccess = await canEdit(session.user.id, id);
    if (!hasEditAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = aiActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, text, language } = parsed.data;
    const promptFn = PROMPTS[action];

    if (!promptFn) {
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      );
    }

    const result = streamText({
      model: google("gemini-2.0-flash"),
      prompt: promptFn(text, language),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
