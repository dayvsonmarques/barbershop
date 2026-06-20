import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, COOKIE_NAME } from "@/lib/customer-jwt";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { phone, code, name } = parsed.data;

  const otp = await prisma.phoneOtp.findFirst({
    where: {
      phone,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 401 });
  }

  let customer = await prisma.customer.findUnique({ where: { phone } });

  if (!customer) {
    if (!name) {
      return NextResponse.json({ needsName: true }, { status: 200 });
    }
    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    customer = await prisma.customer.create({ data: { phone, name } });
  } else {
    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  }

  const token = await signCustomerToken({ id: customer.id, phone: customer.phone, name: customer.name });

  const res = NextResponse.json({ ok: true, name: customer.name });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
