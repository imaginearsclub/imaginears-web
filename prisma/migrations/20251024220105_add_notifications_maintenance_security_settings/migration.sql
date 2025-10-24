-- AlterTable
ALTER TABLE `AppSettings` ADD COLUMN `maintenance` JSON NULL,
    ADD COLUMN `notifications` JSON NULL,
    ADD COLUMN `security` JSON NULL;
