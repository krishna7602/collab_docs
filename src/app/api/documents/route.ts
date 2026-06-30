import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/documents - List user's documents
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: {
        isArchived: false,
        OR: [
          { ownerId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
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
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(10).optional(),
});

// POST /api/documents - Create new document
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createDocumentSchema.safeParse(body);

    const document = await prisma.document.create({
      data: {
        title: parsed.success ? parsed.data.title || "Untitled Document" : "Untitled Document",
        icon: parsed.success ? parsed.data.icon || "📄" : "📄",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
