-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'normal',
    `category` VARCHAR(50) NOT NULL,
    `actionUrl` VARCHAR(500) NULL,
    `actionText` VARCHAR(100) NULL,
    `metadata` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `deliveredVia` JSON NULL,
    `emailSentAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notification_userId_idx`(`userId`),
    INDEX `notification_type_idx`(`type`),
    INDEX `notification_category_idx`(`category`),
    INDEX `notification_isRead_idx`(`isRead`),
    INDEX `notification_priority_idx`(`priority`),
    INDEX `notification_createdAt_idx`(`createdAt`),
    INDEX `notification_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `inAppEnabled` BOOLEAN NOT NULL DEFAULT true,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `pushEnabled` BOOLEAN NOT NULL DEFAULT false,
    `securityAlerts` BOOLEAN NOT NULL DEFAULT true,
    `eventReminders` BOOLEAN NOT NULL DEFAULT true,
    `playerAlerts` BOOLEAN NOT NULL DEFAULT true,
    `sessionAlerts` BOOLEAN NOT NULL DEFAULT true,
    `systemAnnouncements` BOOLEAN NOT NULL DEFAULT true,
    `digestEnabled` BOOLEAN NOT NULL DEFAULT false,
    `digestFrequency` VARCHAR(20) NOT NULL DEFAULT 'daily',
    `quietHoursEnabled` BOOLEAN NOT NULL DEFAULT false,
    `quietHoursStart` VARCHAR(5) NULL,
    `quietHoursEnd` VARCHAR(5) NULL,
    `soundEnabled` BOOLEAN NOT NULL DEFAULT true,
    `desktopNotifications` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_preferences_userId_key`(`userId`),
    INDEX `notification_preferences_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
