-- CreateTable
CREATE TABLE `analytics_event` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(100) NOT NULL,
    `eventName` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `anonymousId` VARCHAR(100) NULL,
    `path` VARCHAR(500) NOT NULL,
    `referrer` VARCHAR(500) NULL,
    `urlParams` JSON NULL,
    `deviceType` VARCHAR(50) NULL,
    `browser` VARCHAR(100) NULL,
    `os` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `city` VARCHAR(255) NULL,
    `properties` JSON NULL,
    `duration` INTEGER NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `analytics_event_eventType_idx`(`eventType`),
    INDEX `analytics_event_userId_idx`(`userId`),
    INDEX `analytics_event_sessionId_idx`(`sessionId`),
    INDEX `analytics_event_date_idx`(`date`),
    INDEX `analytics_event_eventType_date_idx`(`eventType`, `date`),
    INDEX `analytics_event_userId_date_idx`(`userId`, `date`),
    INDEX `analytics_event_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_metric` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `hour` INTEGER NULL,
    `period` VARCHAR(20) NOT NULL,
    `metricType` VARCHAR(100) NOT NULL,
    `category` VARCHAR(100) NULL,
    `value` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `dimension` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `analytics_metric_date_idx`(`date`),
    INDEX `analytics_metric_metricType_idx`(`metricType`),
    INDEX `analytics_metric_date_metricType_idx`(`date`, `metricType`),
    UNIQUE INDEX `analytics_metric_date_hour_period_metricType_category_dimens_key`(`date`, `hour`, `period`, `metricType`, `category`, `dimension`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `minecraftUuid` VARCHAR(36) NULL,
    `minecraftName` VARCHAR(16) NULL,
    `lastWebVisit` DATETIME(3) NULL,
    `totalWebVisits` INTEGER NOT NULL DEFAULT 0,
    `totalPageViews` INTEGER NOT NULL DEFAULT 0,
    `eventsViewed` INTEGER NOT NULL DEFAULT 0,
    `applicationsSubmitted` INTEGER NOT NULL DEFAULT 0,
    `lastMinecraftJoin` DATETIME(3) NULL,
    `totalMinecraftTime` INTEGER NOT NULL DEFAULT 0,
    `totalMinecraftJoins` INTEGER NOT NULL DEFAULT 0,
    `firstMinecraftJoin` DATETIME(3) NULL,
    `webEngagementScore` DOUBLE NOT NULL DEFAULT 0,
    `mcEngagementScore` DOUBLE NOT NULL DEFAULT 0,
    `overallEngagement` DOUBLE NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cohortMonth` VARCHAR(7) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `player_analytics_minecraftName_idx`(`minecraftName`),
    INDEX `player_analytics_isActive_idx`(`isActive`),
    INDEX `player_analytics_lastActiveAt_idx`(`lastActiveAt`),
    INDEX `player_analytics_cohortMonth_idx`(`cohortMonth`),
    UNIQUE INDEX `player_analytics_userId_key`(`userId`),
    UNIQUE INDEX `player_analytics_minecraftUuid_key`(`minecraftUuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventTitle` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `totalViews` INTEGER NOT NULL DEFAULT 0,
    `uniqueVisitors` INTEGER NOT NULL DEFAULT 0,
    `totalClicks` INTEGER NOT NULL DEFAULT 0,
    `shareCount` INTEGER NOT NULL DEFAULT 0,
    `favoriteCount` INTEGER NOT NULL DEFAULT 0,
    `expectedAttendance` INTEGER NULL,
    `actualAttendance` INTEGER NULL,
    `viewsByHour` JSON NULL,
    `peakViewTime` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_analytics_category_idx`(`category`),
    INDEX `event_analytics_startAt_idx`(`startAt`),
    UNIQUE INDEX `event_analytics_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `totalApplications` INTEGER NOT NULL DEFAULT 0,
    `approvedApplications` INTEGER NOT NULL DEFAULT 0,
    `rejectedApplications` INTEGER NOT NULL DEFAULT 0,
    `avgProcessingTime` INTEGER NULL,
    `formStarted` INTEGER NOT NULL DEFAULT 0,
    `formCompleted` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_analytics_date_idx`(`date`),
    INDEX `application_analytics_role_idx`(`role`),
    UNIQUE INDEX `application_analytics_date_role_status_key`(`date`, `role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
