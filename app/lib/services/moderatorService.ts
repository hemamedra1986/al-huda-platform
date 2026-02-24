/**
 * Moderator Management Service
 * إدارة المشرفين والصلاحيات الخاصة بهم
 */

import { Permission, Role, createCustomPermissions, validatePermissionUpdate } from "./permissionService";

export interface Moderator {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  status: "active" | "inactive";
  assignedBy: string;
  assignedAt: string;
  lastLogin?: string;
  notes?: string;
}

export interface CreateModeratorInput {
  name: string;
  email: string;
  role: Role;
  permissions?: Permission[];
  notes?: string;
}

export interface UpdateModeratorInput {
  name?: string;
  email?: string;
  role?: Role;
  permissions?: Permission[];
  status?: "active" | "inactive";
  notes?: string;
}

// Mock data
const mockModerators: Moderator[] = [
  {
    id: "mod-1",
    name: "محمود أحمد",
    email: "mahmoud@example.com",
    role: "moderator",
    permissions: ["manage_content", "manage_quran", "view_logs"],
    status: "active",
    assignedBy: "admin",
    assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Get all moderators
 */
export async function getModerators(): Promise<Moderator[]> {
  return mockModerators;
}

/**
 * Get moderator by ID
 */
export async function getModerator(id: string): Promise<Moderator | null> {
  return mockModerators.find((m) => m.id === id) || null;
}

/**
 * Create new moderator
 */
export async function createModerator(
  input: CreateModeratorInput,
  adminId: string,
  adminRole: Role
): Promise<{ success: boolean; moderator?: Moderator; error?: string }> {
  // Validate permissions
  const defaultPermissions = input.permissions || [];
  const validation = validatePermissionUpdate(adminRole, input.role, defaultPermissions);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const moderator: Moderator = {
    id: `mod-${Date.now()}`,
    name: input.name,
    email: input.email,
    role: input.role,
    permissions: defaultPermissions,
    status: "active",
    assignedBy: adminId,
    assignedAt: new Date().toISOString(),
    notes: input.notes,
  };

  mockModerators.push(moderator);
  return { success: true, moderator };
}

/**
 * Update moderator
 */
export async function updateModerator(
  id: string,
  input: UpdateModeratorInput,
  adminRole: Role
): Promise<{ success: boolean; moderator?: Moderator; error?: string }> {
  const moderator = mockModerators.find((m) => m.id === id);
  if (!moderator) {
    return { success: false, error: "المشرف غير موجود" };
  }

  // Validate permission updates
  if (input.permissions) {
    const validation = validatePermissionUpdate(
      adminRole,
      input.role || moderator.role,
      input.permissions
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
  }

  const updated: Moderator = {
    ...moderator,
    ...input,
  };

  const index = mockModerators.indexOf(moderator);
  mockModerators[index] = updated;

  return { success: true, moderator: updated };
}

/**
 * Add permission to moderator
 */
export async function addPermissionToModerator(
  moderatorId: string,
  permission: Permission,
  adminRole: Role
): Promise<{ success: boolean; error?: string }> {
  const moderator = mockModerators.find((m) => m.id === moderatorId);
  if (!moderator) {
    return { success: false, error: "المشرف غير موجود" };
  }

  const newPermissions = [...new Set([...moderator.permissions, permission])];
  const result = await updateModerator(
    moderatorId,
    { permissions: newPermissions },
    adminRole
  );

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Remove permission from moderator
 */
export async function removePermissionFromModerator(
  moderatorId: string,
  permission: Permission
): Promise<{ success: boolean; error?: string }> {
  const moderator = mockModerators.find((m) => m.id === moderatorId);
  if (!moderator) {
    return { success: false, error: "المشرف غير موجود" };
  }

  const newPermissions = moderator.permissions.filter((p) => p !== permission);

  const index = mockModerators.indexOf(moderator);
  mockModerators[index] = {
    ...moderator,
    permissions: newPermissions,
  };

  return { success: true };
}

/**
 * Suspend moderator (deactivate)
 */
export async function suspendModerator(id: string): Promise<{ success: boolean; error?: string }> {
  const moderator = mockModerators.find((m) => m.id === id);
  if (!moderator) {
    return { success: false, error: "المشرف غير موجود" };
  }

  const index = mockModerators.indexOf(moderator);
  mockModerators[index] = {
    ...moderator,
    status: "inactive",
  };

  return { success: true };
}

/**
 * Activate moderator
 */
export async function activateModerator(id: string): Promise<{ success: boolean; error?: string }> {
  const moderator = mockModerators.find((m) => m.id === id);
  if (!moderator) {
    return { success: false, error: "المشرف غير موجود" };
  }

  const index = mockModerators.indexOf(moderator);
  mockModerators[index] = {
    ...moderator,
    status: "active",
  };

  return { success: true };
}

/**
 * Delete moderator
 */
export async function deleteModerator(id: string): Promise<{ success: boolean; error?: string }> {
  const index = mockModerators.findIndex((m) => m.id === id);
  if (index === -1) {
    return { success: false, error: "المشرف غير موجود" };
  }

  mockModerators.splice(index, 1);
  return { success: true };
}

/**
 * Update last login
 */
export async function updateLastLogin(moderatorId: string): Promise<void> {
  const moderator = mockModerators.find((m) => m.id === moderatorId);
  if (moderator) {
    moderator.lastLogin = new Date().toISOString();
  }
}
