/*
  Warnings:

  - Made the column `endAt` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Event` ADD COLUMN `byWeekdayJson` JSON NULL,
    ADD COLUMN `recurrenceFreq` ENUM('NONE', 'DAILY', 'WEEKLY') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `recurrenceUntil` DATETIME(3) NULL,
    ADD COLUMN `timesJson` JSON NULL,
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/New_York',
    MODIFY `endAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `Event_recurrenceFreq_idx` ON `Event`(`recurrenceFreq`);
