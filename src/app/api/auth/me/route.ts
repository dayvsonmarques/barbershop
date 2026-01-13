import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getUserPermissions, getUserGroups } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request as any);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const [permissions, groups] = await Promise.all([
      getUserPermissions(auth.userId),
      getUserGroups(auth.userId),
    ]);

    return NextResponse.json({
      user: {
        id: auth.userId,
        email: auth.email,
      },
      groups,
      permissions,
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
