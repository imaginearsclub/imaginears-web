-- AlterTable
ALTER TABLE `session` ADD COLUMN `browser` VARCHAR(100) NULL,
    ADD COLUMN `city` VARCHAR(255) NULL,
    ADD COLUMN `country` VARCHAR(100) NULL,
    ADD COLUMN `deviceName` VARCHAR(255) NULL,
    ADD COLUMN `deviceType` VARCHAR(50) NULL,
    ADD COLUMN `isRememberMe` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSuspicious` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `loginMethod` VARCHAR(50) NULL,
    ADD COLUMN `os` VARCHAR(100) NULL,
    ADD COLUMN `requiredStepUp` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `trustLevel` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `SessionActivity` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `endpoint` VARCHAR(500) NULL,
    `method` VARCHAR(10) NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `statusCode` INTEGER NULL,
    `duration` INTEGER NULL,
    `isError` BOOLEAN NOT NULL DEFAULT false,
    `isSuspicious` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SessionActivity_sessionId_idx`(`sessionId`),
    INDEX `SessionActivity_action_idx`(`action`),
    INDEX `SessionActivity_createdAt_idx`(`createdAt`),
    INDEX `SessionActivity_isSuspicious_idx`(`isSuspicious`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `session_lastActivityAt_idx` ON `session`(`lastActivityAt`);

-- CreateIndex
CREATE INDEX `session_isSuspicious_idx` ON `session`(`isSuspicious`);

-- AddForeignKey
ALTER TABLE `SessionActivity` ADD CONSTRAINT `SessionActivity_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
