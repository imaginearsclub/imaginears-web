-- AlterTable
ALTER TABLE `user` ADD COLUMN `permissions` JSON NULL,
    MODIFY `role` ENUM('OWNER', 'ADMIN', 'MODERATOR', 'STAFF', 'USER') NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX `user_role_idx` ON `user`(`role`);
