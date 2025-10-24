-- CreateTable for CustomRole
CREATE TABLE `CustomRole` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `permissions` JSON NOT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomRole_slug_key`(`slug`),
    INDEX `CustomRole_slug_idx`(`slug`),
    INDEX `CustomRole_isSystem_idx`(`isSystem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Change user.role from ENUM to VARCHAR
-- This preserves existing role values since enum values match the strings
ALTER TABLE `user` MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'USER';

-- Insert system roles into CustomRole table
INSERT INTO `CustomRole` (`id`, `slug`, `name`, `description`, `permissions`, `isSystem`, `color`, `createdAt`, `updatedAt`) VALUES
('role_owner', 'OWNER', 'Owner', 'Full system access. Can manage everything including critical settings.', 
 JSON_ARRAY('events:read', 'events:write', 'events:delete', 'events:publish', 'applications:read', 'applications:write', 'applications:delete', 'applications:approve', 'players:read', 'players:write', 'players:ban', 'users:read', 'users:write', 'users:delete', 'users:manage_roles', 'settings:read', 'settings:write', 'settings:security', 'dashboard:view', 'dashboard:stats', 'system:maintenance', 'system:logs'),
 true, '#ef4444', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('role_admin', 'ADMIN', 'Administrator', 'Can manage most features, users, and settings. Cannot access critical security settings.', 
 JSON_ARRAY('events:read', 'events:write', 'events:delete', 'events:publish', 'applications:read', 'applications:write', 'applications:delete', 'applications:approve', 'players:read', 'players:write', 'players:ban', 'users:read', 'users:write', 'settings:read', 'settings:write', 'dashboard:view', 'dashboard:stats', 'system:logs'),
 true, '#22c55e', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('role_moderator', 'MODERATOR', 'Moderator', 'Can manage events, applications, and players. Limited settings access.', 
 JSON_ARRAY('events:read', 'events:write', 'events:publish', 'applications:read', 'applications:write', 'applications:approve', 'players:read', 'players:write', 'users:read', 'settings:read', 'dashboard:view', 'dashboard:stats'),
 true, '#3b82f6', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('role_staff', 'STAFF', 'Staff Member', 'Can view and assist with events and applications. Read-only for most features.', 
 JSON_ARRAY('events:read', 'events:write', 'applications:read', 'applications:write', 'players:read', 'users:read', 'settings:read', 'dashboard:view'),
 true, '#6b7280', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),

('role_user', 'USER', 'User', 'Basic authenticated access. Can view own information and public content.', 
 JSON_ARRAY('dashboard:view'),
 true, '#9ca3af', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

