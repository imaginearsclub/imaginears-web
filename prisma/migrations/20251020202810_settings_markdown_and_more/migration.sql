-- AlterTable
ALTER TABLE `AppSettings` ADD COLUMN `aboutMarkdown` TEXT NULL,
    ADD COLUMN `applicationsIntroMarkdown` TEXT NULL,
    ADD COLUMN `features` JSON NULL,
    ADD COLUMN `footerMarkdown` TEXT NULL,
    ADD COLUMN `seo` JSON NULL,
    ADD COLUMN `social` JSON NULL;
