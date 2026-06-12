import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "groups", "view");
  if (auth instanceof NextResponse) return auth;

  const groups = await prisma.group.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { users: true, permissions: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "groups", "create");
  if (auth instanceof NextResponse) return auth;

  const { name, description, permissionIds } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      permissions: {
        create: (permissionIds ?? []).map((id: number) => ({ permissionId: id })),
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
