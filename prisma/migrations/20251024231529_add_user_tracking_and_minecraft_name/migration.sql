-- AlterTable
ALTER TABLE `Application` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `minecraftName` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Application_createdById_idx` ON `Application`(`createdById`);

-- CreateIndex
CREATE INDEX `Application_updatedById_idx` ON `Application`(`updatedById`);

-- CreateIndex
CREATE INDEX `Event_createdById_idx` ON `Event`(`createdById`);

-- CreateIndex
CREATE INDEX `Event_updatedById_idx` ON `Event`(`updatedById`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
