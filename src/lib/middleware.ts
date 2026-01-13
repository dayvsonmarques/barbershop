import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token não fornecido" },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: "Token inválido ou expirado" },
      { status: 401 }
    );
  }

  return payload;
}
