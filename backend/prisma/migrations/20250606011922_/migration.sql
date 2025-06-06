-- AlterTable
ALTER TABLE `user_preferences` MODIFY `language` VARCHAR(10) NOT NULL DEFAULT 'en';

-- RenameIndex
ALTER TABLE `user_preferences` RENAME INDEX `user_preferences_userId_key` TO `user_preferences_user_id_key`;
