-- CreateTable
CREATE TABLE `AppSettings` (
    `id` VARCHAR(32) NOT NULL DEFAULT 'global',
    `siteName` VARCHAR(191) NOT NULL DEFAULT 'Imaginears',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/New_York',
    `homepageIntro` TEXT NULL,
    `branding` JSON NULL,
    `events` JSON NULL,
    `applications` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
