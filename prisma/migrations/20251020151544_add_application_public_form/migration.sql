/*
  Warnings:

  - Added the required column `ageRange` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canDiscord` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mcUsername` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priorStaff` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timezone` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitedDisney` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Application_createdAt_idx` ON `Application`;

-- DropIndex
DROP INDEX `Application_role_idx` ON `Application`;

-- DropIndex
DROP INDEX `Application_status_idx` ON `Application`;

-- AlterTable
ALTER TABLE `Application` ADD COLUMN `ageRange` VARCHAR(191) NOT NULL,
    ADD COLUMN `canDiscord` BOOLEAN NOT NULL,
    ADD COLUMN `devLanguages` VARCHAR(191) NULL,
    ADD COLUMN `devPortfolioUrl` VARCHAR(191) NULL,
    ADD COLUMN `devSpecialty` VARCHAR(191) NULL,
    ADD COLUMN `discordUser` VARCHAR(191) NULL,
    ADD COLUMN `grStory` VARCHAR(191) NULL,
    ADD COLUMN `grSuggestions` VARCHAR(191) NULL,
    ADD COLUMN `grValue` VARCHAR(191) NULL,
    ADD COLUMN `imgPluginFamiliar` VARCHAR(191) NULL,
    ADD COLUMN `imgPortfolioUrl` VARCHAR(191) NULL,
    ADD COLUMN `imgWorldEditLevel` VARCHAR(191) NULL,
    ADD COLUMN `mcUsername` VARCHAR(191) NOT NULL,
    ADD COLUMN `priorServers` VARCHAR(191) NULL,
    ADD COLUMN `priorStaff` BOOLEAN NOT NULL,
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL,
    ADD COLUMN `visitedDetails` VARCHAR(191) NULL,
    ADD COLUMN `visitedDisney` BOOLEAN NOT NULL,
    MODIFY `role` ENUM('Developer', 'Imaginear', 'GuestServices') NOT NULL;

-- AlterTable
ALTER TABLE `Event` MODIFY `endAt` DATETIME(3) NULL;
