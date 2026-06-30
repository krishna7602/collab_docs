import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canView, canEdit, isOwner } from "@/lib/authorization";
import { z } from "zod";
import { DocumentRole } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/collaborators
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

    const collaborators = await prisma.documentCollaborator.findMany({
      where: { documentId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Also include the owner
    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({
      owner: doc?.owner,
      collaborators,
    });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const addCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

// POST /api/documents/[id]/collaborators - Invite collaborator
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const isDocOwner = await isOwner(session.user.id, id);
    if (!isDocOwner) {
      return NextResponse.json(
        { error: "Only the owner can manage collaborators" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = addCollaboratorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot add yourself as a collaborator" },
        { status: 400 }
      );
    }

    // Check if collaborator already exists
    const existingCollaborator = await prisma.documentCollaborator.findUnique({
      where: {
        documentId_userId: { documentId: id, userId: user.id },
      },
    });

    let collaborator;
    if (existingCollaborator) {
      // Update their role
      collaborator = await prisma.documentCollaborator.update({
        where: {
          id: existingCollaborator.id,
        },
        data: {
          role: parsed.data.role as DocumentRole,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });
    } else {
      // Create a new record
      collaborator = await prisma.documentCollaborator.create({
        data: {
          documentId: id,
          userId: user.id,
          role: parsed.data.role as DocumentRole,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });
    }

    return NextResponse.json(collaborator, { status: 201 });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const removeCollaboratorSchema = z.object({
  userId: z.string(),
});

// DELETE /api/documents/[id]/collaborators - Remove collaborator
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
        { error: "Only the owner can manage collaborators" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = removeCollaboratorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    await prisma.documentCollaborator.delete({
      where: {
        documentId_userId: { documentId: id, userId: parsed.data.userId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
