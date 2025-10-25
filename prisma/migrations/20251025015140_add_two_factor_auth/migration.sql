-- AlterTable
ALTER TABLE `user` ADD COLUMN `backupCodes` JSON NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` TEXT NULL;
