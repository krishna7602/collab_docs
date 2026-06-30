import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/authorization";

interface RouteContext {
  params: Promise<{ id: string; versionId: string }>;
}

// GET /api/documents/[id]/versions/[versionId]
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, versionId } = await context.params;

    const hasAccess = await canView(session.user.id, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId: id,
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Convert Bytes to base64 for transport
    const base64Content = Buffer.from(version.content).toString("base64");

    return NextResponse.json({
      ...version,
      content: base64Content,
    });
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
