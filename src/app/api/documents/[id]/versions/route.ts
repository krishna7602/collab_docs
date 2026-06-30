import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canView, canEdit } from "@/lib/authorization";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/versions - List versions
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const hasAccess = await canView(session.user.id, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createVersionSchema = z.object({
  name: z.string().max(100).optional(),
  content: z.string().max(5 * 1024 * 1024), // Max 5MB base64 encoded
});

// POST /api/documents/[id]/versions - Create a snapshot
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
    const parsed = createVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Convert base64 string to Buffer for BYTEA storage
    const contentBuffer = Buffer.from(parsed.data.content, "base64");

    // Validate payload size (max 5MB binary)
    if (contentBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload too large. Max document size is 5MB." },
        { status: 413 }
      );
    }

    const version = await prisma.documentVersion.create({
      data: {
        name: parsed.data.name || `Snapshot ${new Date().toLocaleString()}`,
        content: contentBuffer,
        documentId: id,
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
