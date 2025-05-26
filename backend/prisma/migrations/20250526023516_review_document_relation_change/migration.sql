/*
  Warnings:

  - You are about to drop the column `document_id` on the `review_jobs` table. All the data in the column will be lost.
  - Added the required column `review_job_id` to the `review_documents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `review_jobs` DROP FOREIGN KEY `review_jobs_document_id_fkey`;

-- DropIndex
DROP INDEX `review_jobs_document_id_fkey` ON `review_jobs`;

-- AlterTable
ALTER TABLE `review_documents` ADD COLUMN `review_job_id` VARCHAR(26) NOT NULL;

-- AlterTable
ALTER TABLE `review_jobs` DROP COLUMN `document_id`,
    ADD COLUMN `meta_data` JSON NULL;

-- AddForeignKey
ALTER TABLE `review_documents` ADD CONSTRAINT `review_documents_review_job_id_fkey` FOREIGN KEY (`review_job_id`) REFERENCES `review_jobs`(`review_job_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
