import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "groups", "view");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const groupId = parseInt(id, 10);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      permissions: { select: { permissionId: true } },
      _count: { select: { users: true } },
    },
  });

  if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

  return NextResponse.json(group);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "groups", "update");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const groupId = parseInt(id, 10);
  const { name, description, permissionIds } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  await prisma.groupPermission.deleteMany({ where: { groupId } });

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      permissions: {
        create: (permissionIds ?? []).map((pid: number) => ({ permissionId: pid })),
      },
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "groups", "delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const groupId = parseInt(id, 10);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { users: true } } },
  });

  if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

  if (group._count.users > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir um grupo com usuários vinculados" },
      { status: 400 }
    );
  }

  await prisma.group.delete({ where: { id: groupId } });

  return NextResponse.json({ message: "Grupo excluído" });
}
