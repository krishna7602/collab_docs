import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DocumentRole } from "@prisma/client";

/**
 * Authorization helpers for document access control.
 * Implements strict ORM scoping — all queries filter by user/role.
 */

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getDocumentRole(
  userId: string,
  documentId: string
): Promise<DocumentRole | null> {
  // Check if user is the owner
  const doc = await prisma.document.findFirst({
    where: { id: documentId, ownerId: userId },
    select: { id: true },
  });

  if (doc) return DocumentRole.OWNER;

  // Check if user is a collaborator
  const collab = await prisma.documentCollaborator.findUnique({
    where: {
      documentId_userId: { documentId, userId },
    },
    select: { role: true },
  });

  return collab?.role ?? null;
}

export async function canView(
  userId: string,
  documentId: string
): Promise<boolean> {
  const role = await getDocumentRole(userId, documentId);
  if (role) return true;

  // Check if document is public
  const doc = await prisma.document.findFirst({
    where: { id: documentId, isPublic: true },
    select: { id: true },
  });

  return !!doc;
}

export async function canEdit(
  userId: string,
  documentId: string
): Promise<boolean> {
  const role = await getDocumentRole(userId, documentId);
  return role === DocumentRole.OWNER || role === DocumentRole.EDITOR;
}

export async function isOwner(
  userId: string,
  documentId: string
): Promise<boolean> {
  const role = await getDocumentRole(userId, documentId);
  return role === DocumentRole.OWNER;
}

/**
 * Get all documents accessible by a user (owned + shared)
 * Strict ORM scoping — no document leaks
 */
export async function getUserDocuments(userId: string) {
  return prisma.document.findMany({
    where: {
      isArchived: false,
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: { userId },
          },
        },
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
      _count: {
        select: { versions: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
