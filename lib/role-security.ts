/**
 * Role Security Utilities
 * 
 * Prevents privilege escalation and ensures role hierarchy
 */

/**
 * Role hierarchy (from lowest to highest)
 */
export const ROLE_HIERARCHY = ["USER", "STAFF", "MODERATOR", "ADMIN", "OWNER"] as const;

export type SystemRole = (typeof ROLE_HIERARCHY)[number];

/**
 * Get numeric level for a role
 * @param role - Role name
 * @returns Numeric level (0-4) or -1 if invalid
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY.indexOf(role as SystemRole);
}

/**
 * Check if a user can assign a specific role
 * 
 * Rules:
 * - OWNER can assign any role
 * - Others can only assign roles below their level
 * - No one can assign their own role or higher (except OWNER)
 * 
 * @param assignerRole - Role of the person assigning
 * @param targetRole - Role being assigned
 * @returns True if allowed
 */
export function canAssignRole(assignerRole: string, targetRole: string): boolean {
  // OWNER can assign any role
  if (assignerRole === "OWNER") {
    return true;
  }

  const assignerLevel = getRoleLevel(assignerRole);
  const targetLevel = getRoleLevel(targetRole);

  // Invalid roles
  if (assignerLevel === -1 || targetLevel === -1) {
    return false;
  }

  // Can only assign roles strictly below your level
  return assignerLevel > targetLevel;
}

/**
 * Check if a user can modify another user
 * 
 * Rules:
 * - OWNER can modify anyone
 * - Others can only modify users with lower roles
 * - No one can modify themselves (use separate endpoint for that)
 * 
 * @param assignerRole - Role of the person modifying
 * @param targetRole - Role of the user being modified
 * @param isSelf - Is the target the same as the assigner?
 * @returns True if allowed
 */
export function canModifyUser(
  assignerRole: string,
  targetRole: string,
  isSelf: boolean = false
): boolean {
  // Can't modify yourself through admin endpoints
  if (isSelf) {
    return false;
  }

  // OWNER can modify anyone (except through general endpoints)
  if (assignerRole === "OWNER") {
    return true;
  }

  const assignerLevel = getRoleLevel(assignerRole);
  const targetLevel = getRoleLevel(targetRole);

  // Invalid roles
  if (assignerLevel === -1 || targetLevel === -1) {
    return false;
  }

  // Can only modify users with strictly lower roles
  return assignerLevel > targetLevel;
}

/**
 * Check if a user can delete another user
 * 
 * Rules:
 * - OWNER can delete anyone except other OWNERS
 * - ADMIN can delete MODERATOR, STAFF, USER
 * - MODERATOR can delete STAFF, USER
 * - No one can delete themselves
 * 
 * @param assignerRole - Role of the person deleting
 * @param targetRole - Role of the user being deleted
 * @param isSelf - Is the target the same as the assigner?
 * @returns True if allowed
 */
export function canDeleteUser(
  assignerRole: string,
  targetRole: string,
  isSelf: boolean = false
): boolean {
  // Can't delete yourself
  if (isSelf) {
    return false;
  }

  // Even OWNER can't delete other OWNERS (safety measure)
  if (targetRole === "OWNER") {
    return false;
  }

  const assignerLevel = getRoleLevel(assignerRole);
  const targetLevel = getRoleLevel(targetRole);

  // Invalid roles
  if (assignerLevel === -1 || targetLevel === -1) {
    return false;
  }

  // Can only delete users with strictly lower roles
  return assignerLevel > targetLevel;
}

/**
 * Get all roles that a user can assign
 * @param assignerRole - Role of the person assigning
 * @returns Array of assignable roles
 */
export function getAssignableRoles(assignerRole: string): SystemRole[] {
  if (assignerRole === "OWNER") {
    return [...ROLE_HIERARCHY];
  }

  const assignerLevel = getRoleLevel(assignerRole);
  
  if (assignerLevel === -1) {
    return [];
  }

  // Return all roles below assigner's level
  return ROLE_HIERARCHY.slice(0, assignerLevel);
}

/**
 * Validate role exists and is a system role
 * @param role - Role to validate
 * @returns True if valid system role
 */
export function isValidSystemRole(role: string): role is SystemRole {
  return ROLE_HIERARCHY.includes(role as SystemRole);
}

/**
 * Check if a role has admin privileges
 * @param role - Role to check
 * @returns True if role is ADMIN or OWNER
 */
export function isAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "OWNER";
}

/**
 * Check if a role has moderator privileges or higher
 * @param role - Role to check
 * @returns True if role is MODERATOR, ADMIN, or OWNER
 */
export function isModeratorOrHigher(role: string): boolean {
  const level = getRoleLevel(role);
  const modLevel = getRoleLevel("MODERATOR");
  return level >= modLevel;
}

/**
 * Check if a role has staff privileges or higher
 * @param role - Role to check
 * @returns True if role is STAFF or higher
 */
export function isStaffOrHigher(role: string): boolean {
  const level = getRoleLevel(role);
  const staffLevel = getRoleLevel("STAFF");
  return level >= staffLevel;
}

/**
 * Validate role change is safe
 * Prevents privilege escalation and ensures proper authorization
 * 
 * @param assignerRole - Role of person making the change
 * @param currentTargetRole - Current role of the user being changed
 * @param newRole - New role being assigned
 * @param assignerId - ID of the assigner
 * @param targetId - ID of the target user
 * @returns Validation result
 */
export function validateRoleChange(
  assignerRole: string,
  currentTargetRole: string,
  newRole: string,
  assignerId: string,
  targetId: string
): { valid: boolean; error?: string } {
  // Check if trying to modify self
  if (assignerId === targetId) {
    return {
      valid: false,
      error: "You cannot change your own role. Contact another administrator.",
    };
  }

  // Validate new role is a system role
  if (!isValidSystemRole(newRole)) {
    return { valid: false, error: `Invalid role: ${newRole}` };
  }

  // Check if assigner can modify this user
  if (!canModifyUser(assignerRole, currentTargetRole)) {
    return {
      valid: false,
      error: "You don't have permission to modify this user's role.",
    };
  }

  // Check if assigner can assign the new role
  if (!canAssignRole(assignerRole, newRole)) {
    return {
      valid: false,
      error: `You don't have permission to assign the ${newRole} role.`,
    };
  }

  // Special protection: Only OWNER can create new OWNERS
  if (newRole === "OWNER" && assignerRole !== "OWNER") {
    return {
      valid: false,
      error: "Only existing owners can promote users to the OWNER role.",
    };
  }

  return { valid: true };
}

/**
 * Validate user deletion is safe
 * 
 * @param assignerRole - Role of person deleting
 * @param targetRole - Role of user being deleted
 * @param assignerId - ID of the assigner
 * @param targetId - ID of the target user
 * @returns Validation result
 */
export function validateUserDeletion(
  assignerRole: string,
  targetRole: string,
  assignerId: string,
  targetId: string
): { valid: boolean; error?: string } {
  // Check if trying to delete self
  if (assignerId === targetId) {
    return {
      valid: false,
      error: "You cannot delete your own account through this interface.",
    };
  }

  // Check if trying to delete an owner
  if (targetRole === "OWNER") {
    return {
      valid: false,
      error: "OWNER accounts cannot be deleted through this interface.",
    };
  }

  // Check if assigner has permission
  if (!canDeleteUser(assignerRole, targetRole)) {
    return {
      valid: false,
      error: "You don't have permission to delete this user.",
    };
  }

  return { valid: true };
}

