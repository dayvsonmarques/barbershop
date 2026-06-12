import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "users", "view");
  if (auth instanceof NextResponse) return auth;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      createdAt: true,
      groups: {
        select: { group: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "users", "create");
  if (auth instanceof NextResponse) return auth;

  const { name, email, password, groupId, isActive } = await request.json();

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      isActive: isActive ?? true,
      groups: groupId ? { create: { groupId } } : undefined,
    },
    select: { id: true, name: true, email: true, isActive: true },
  });

  return NextResponse.json(user, { status: 201 });
}
