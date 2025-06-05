-- CreateTable
CREATE TABLE `user_preferences` (
  `preference_id` VARCHAR(26) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `language` VARCHAR(10) NOT NULL DEFAULT 'ja',
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL,
  
  PRIMARY KEY (`preference_id`),
  UNIQUE INDEX `user_preferences_userId_key` (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
