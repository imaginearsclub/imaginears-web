-- AlterTable
ALTER TABLE `Event` ADD COLUMN `category` ENUM('Fireworks', 'SeasonalOverlay', 'MeetAndGreet', 'Parade', 'Other') NOT NULL DEFAULT 'Other',
    ADD COLUMN `details` VARCHAR(191) NULL,
    ADD COLUMN `shortDescription` VARCHAR(300) NULL;

-- CreateIndex
CREATE INDEX `Event_category_idx` ON `Event`(`category`);
