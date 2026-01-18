import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/rbac";

export interface AuthContext {
  userId: string;
  email: string;
}

/**
 * Middleware to verify authentication
 * Returns AuthContext or error response
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const cookieToken = request.cookies.get("auth_token")?.value ?? null;

  const token = bearerToken ?? cookieToken;

  if (!token) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
  }

  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * Middleware to verify authentication AND specific permission
 * Returns AuthContext or error response
 */
export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(request);

  // If auth failed, return error response
  if (auth instanceof NextResponse) {
    return auth;
  }

  // Check permission
  const hasAccess = await hasPermission(auth.userId, resource, action);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Você não tem permissão para realizar esta ação" },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Middleware to verify authentication AND any of the permissions (OR logic)
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  for (const perm of permissions) {
    const hasAccess = await hasPermission(auth.userId, perm.resource, perm.action);
    if (hasAccess) {
      return auth;
    }
  }

  return NextResponse.json(
    { error: "Você não tem permissão para realizar esta ação" },
    { status: 403 }
  );
}

/**
 * Middleware to verify authentication AND all permissions (AND logic)
 */
export async function requireAllPermissions(
  request: NextRequest,
  permissions: Permission[]
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  for (const perm of permissions) {
    const hasAccess = await hasPermission(auth.userId, perm.resource, perm.action);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Você não tem permissão para realizar esta ação" },
        { status: 403 }
      );
    }
  }

  return auth;
}
