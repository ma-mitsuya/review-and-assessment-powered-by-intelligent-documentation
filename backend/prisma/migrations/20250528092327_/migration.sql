-- AlterTable
ALTER TABLE `checklist_documents` ADD COLUMN `error_detail` TEXT NULL;

-- AlterTable
ALTER TABLE `review_jobs` ADD COLUMN `error_detail` TEXT NULL;

-- CreateIndex
CREATE INDEX `check_lists_check_list_set_id_fkey` ON `check_lists`(`check_list_set_id`);

-- CreateIndex
CREATE INDEX `review_results_review_job_id_fkey` ON `review_results`(`review_job_id`);
