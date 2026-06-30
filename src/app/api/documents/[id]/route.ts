import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canView, canEdit, isOwner } from "@/lib/authorization";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id] - Fetch document metadata
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

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: { select: { versions: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(10).optional(),
  isStarred: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// PATCH /api/documents/[id] - Update document metadata
export async function PATCH(req: NextRequest, context: RouteContext) {
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
    const parsed = updateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const document = await prisma.document.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document (owner only)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const isDocOwner = await isOwner(session.user.id, id);
    if (!isDocOwner) {
      return NextResponse.json(
        { error: "Only the document owner can delete it" },
        { status: 403 }
      );
    }

    await prisma.document.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
