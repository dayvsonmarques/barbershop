import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "users", "update");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { name, email, password, groupId, isActive } = await request.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  const dataUpdate: Record<string, unknown> = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    isActive: isActive ?? true,
  };

  if (password) {
    dataUpdate.password = await bcrypt.hash(password, 10);
  }

  await prisma.userGroup.deleteMany({ where: { userId: id } });

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...dataUpdate,
      groups: groupId ? { create: { groupId } } : undefined,
    },
    select: { id: true, name: true, email: true, isActive: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "users", "delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ message: "Usuário excluído" });
}
