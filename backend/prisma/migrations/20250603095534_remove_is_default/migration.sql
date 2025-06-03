/*
  Warnings:

  - You are about to drop the column `is_default` on the `prompt_templates` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `prompt_templates_user_id_type_is_default_idx` ON `prompt_templates`;

-- AlterTable
ALTER TABLE `prompt_templates` DROP COLUMN `is_default`;

-- CreateIndex
CREATE INDEX `prompt_templates_user_id_type_idx` ON `prompt_templates`(`user_id`, `type`);
