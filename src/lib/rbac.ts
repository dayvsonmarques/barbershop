import { prisma } from "@/lib/prisma";

export interface Permission {
  resource: string;
  action: "view" | "create" | "update" | "delete";
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permission = await prisma.permission.findFirst({
    where: {
      resource,
      action,
      groups: {
        some: {
          group: {
            users: {
              some: {
                userId,
              },
            },
          },
        },
      },
    },
  });

  return !!permission;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const permissions = await prisma.permission.findMany({
    where: {
      groups: {
        some: {
          group: {
            users: {
              some: {
                userId,
              },
            },
          },
        },
      },
    },
    select: {
      resource: true,
      action: true,
    },
  });

  return permissions as Permission[];
}

/**
 * Get user groups
 */
export async function getUserGroups(userId: string) {
  const userGroups = await prisma.userGroup.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  return userGroups.map((ug) => ug.group);
}

/**
 * Check if user has any of the required permissions (OR logic)
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const perm of permissions) {
    if (await hasPermission(userId, perm.resource, perm.action)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all required permissions (AND logic)
 */
export async function hasAllPermissions(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const perm of permissions) {
    if (!(await hasPermission(userId, perm.resource, perm.action))) {
      return false;
    }
  }
  return true;
}
