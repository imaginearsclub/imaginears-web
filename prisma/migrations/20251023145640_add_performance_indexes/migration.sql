-- CreateIndex
CREATE INDEX `Application_status_createdAt_idx` ON `Application`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Application_email_idx` ON `Application`(`email`);

-- CreateIndex
CREATE INDEX `Application_role_status_idx` ON `Application`(`role`, `status`);

-- CreateIndex
CREATE INDEX `Event_status_startAt_idx` ON `Event`(`status`, `startAt`);

-- CreateIndex
CREATE INDEX `Event_category_status_idx` ON `Event`(`category`, `status`);
