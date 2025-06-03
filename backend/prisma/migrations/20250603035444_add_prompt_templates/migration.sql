-- CreateTable
CREATE TABLE `prompt_templates` (
    `template_id` VARCHAR(26) NOT NULL,
    `user_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `prompt` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `prompt_templates_user_id_type_is_default_idx`(`user_id`, `type`, `is_default`),
    UNIQUE INDEX `prompt_templates_user_id_name_type_key`(`user_id`, `name`, `type`),
    PRIMARY KEY (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
