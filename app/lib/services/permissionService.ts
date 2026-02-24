/**
 * Permission Service - نظام الصلاحيات والأدوار
 * RBAC (Role-Based Access Control)
 */

export type Permission = 
  | "manage_users"           // إدارة المستخدمين
  | "manage_moderators"      // إدارة المشرفين
  | "manage_content"         // إدارة المحتوى
  | "manage_quran"           // إدارة صوتيات القرآن
  | "manage_courses"         // إدارة الدروس
  | "manage_settings"        // إدارة الإعدادات
  | "manage_appearance"      // إدارة الخلفيات والخطوط والألوان
  | "manage_languages"       // إدارة اللغات
  | "manage_library_media"   // تحميل الكتب والفيديوهات
  | "manage_page_access"     // تعطيل/تفعيل الصفحات
  | "manage_messages"        // إرسال/استقبال الرسائل الكتابية
  | "manage_voice_messages"  // إرسال/استقبال الرسائل الصوتية
  | "manage_donations"       // إدارة التبرعات
  | "manage_payments"        // إدارة المدفوعات
  | "manage_payment_routing" // توجيه المدفوعات
  | "view_logs"              // عرض السجلات
  | "delete_content";        // حذف المحتوى

export type Role = "admin" | "moderator" | "user";

export interface RolePermissions {
  [key: string]: Permission[];
}

export interface UserRole {
  userId: string;
  role: Role;
  permissions: Permission[];
  createdAt: string;
  lastUpdated: string;
}

const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    "manage_users",
    "manage_moderators",
    "manage_content",
    "manage_quran",
    "manage_courses",
    "manage_settings",
    "manage_appearance",
    "manage_languages",
    "manage_library_media",
    "manage_page_access",
    "manage_messages",
    "manage_voice_messages",
    "manage_donations",
    "manage_payments",
    "manage_payment_routing",
    "view_logs",
    "delete_content",
  ],
  moderator: [
    "manage_content",
    "manage_quran",
    "manage_courses",
    "manage_messages",
    "view_logs",
  ],
  user: [],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user has all specified permissions
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Create custom permissions for a moderator
 */
export function createCustomPermissions(
  baseRole: Role,
  additionalPermissions: Permission[] = [],
  excludedPermissions: Permission[] = []
): Permission[] {
  let permissions = [...getPermissionsForRole(baseRole)];
  
  // Add additional permissions
  permissions = [...new Set([...permissions, ...additionalPermissions])];
  
  // Remove excluded permissions
  permissions = permissions.filter(p => !excludedPermissions.includes(p));
  
  return permissions;
}

/**
 * Validate permission hierarchy
 * Ensures that admins don't grant more permissions than they have
 */
export function validatePermissionUpdate(
  granterRole: Role,
  targetRole: Role,
  newPermissions: Permission[]
): { valid: boolean; error?: string } {
  // Only admins can grant permissions
  if (!hasPermission(granterRole, "manage_moderators")) {
    return { valid: false, error: "ليس لديك صلاحية لمنح الصلاحيات" };
  }

  // Cannot grant permissions higher than own permissions
  const granterPermissions = getPermissionsForRole(granterRole);
  const invalidPermissions = newPermissions.filter(
    (p) => !granterPermissions.includes(p)
  );

  if (invalidPermissions.length > 0) {
    return {
      valid: false,
      error: `لا يمكنك منح صلاحيات لا تملكها: ${invalidPermissions.join(", ")}`,
    };
  }

  return { valid: true };
}
