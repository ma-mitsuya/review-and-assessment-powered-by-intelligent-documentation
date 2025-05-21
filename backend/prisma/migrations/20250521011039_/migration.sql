/*
  Warnings:

  - You are about to alter the column `upload_date` on the `checklist_documents` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `upload_date` on the `review_documents` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `created_at` on the `review_jobs` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `updated_at` on the `review_jobs` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `completed_at` on the `review_jobs` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `created_at` on the `review_results` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `updated_at` on the `review_results` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to drop the `check_list` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `check_list` DROP FOREIGN KEY `check_list_check_list_set_id_fkey`;

-- DropForeignKey
ALTER TABLE `check_list` DROP FOREIGN KEY `check_list_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `check_list` DROP FOREIGN KEY `check_list_parent_id_fkey`;

-- DropForeignKey
ALTER TABLE `review_results` DROP FOREIGN KEY `review_results_check_id_fkey`;

-- DropIndex
DROP INDEX `review_results_check_id_fkey` ON `review_results`;

-- AlterTable
ALTER TABLE `checklist_documents` MODIFY `upload_date` TIMESTAMP NOT NULL;

-- AlterTable
ALTER TABLE `review_documents` MODIFY `upload_date` TIMESTAMP NOT NULL;

-- AlterTable
ALTER TABLE `review_jobs` MODIFY `created_at` TIMESTAMP NOT NULL,
    MODIFY `updated_at` TIMESTAMP NOT NULL,
    MODIFY `completed_at` TIMESTAMP NULL;

-- AlterTable
ALTER TABLE `review_results` MODIFY `created_at` TIMESTAMP NOT NULL,
    MODIFY `updated_at` TIMESTAMP NOT NULL;

-- DropTable
DROP TABLE `check_list`;

-- CreateTable
CREATE TABLE `check_lists` (
    `check_id` VARCHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `parent_id` VARCHAR(26) NULL,
    `check_list_set_id` VARCHAR(26) NOT NULL,
    `document_id` VARCHAR(26) NULL,

    INDEX `idx_check_list_parent`(`parent_id`),
    PRIMARY KEY (`check_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `check_lists` ADD CONSTRAINT `check_lists_check_list_set_id_fkey` FOREIGN KEY (`check_list_set_id`) REFERENCES `check_list_sets`(`check_list_set_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `check_lists` ADD CONSTRAINT `check_lists_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `check_lists`(`check_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `check_lists` ADD CONSTRAINT `check_lists_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `checklist_documents`(`document_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_results` ADD CONSTRAINT `review_results_check_id_fkey` FOREIGN KEY (`check_id`) REFERENCES `check_lists`(`check_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
