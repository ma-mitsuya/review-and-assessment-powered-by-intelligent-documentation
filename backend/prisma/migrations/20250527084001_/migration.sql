/*
  Warnings:

  - You are about to drop the column `meta_data` on the `review_jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `review_jobs` DROP COLUMN `meta_data`;

-- CreateIndex
CREATE INDEX `idx_check_list_set_parent` ON `check_lists`(`check_list_set_id`, `parent_id`);

-- CreateIndex
CREATE INDEX `idx_review_results_job_status_result` ON `review_results`(`review_job_id`, `status`, `result`);

-- CreateIndex
CREATE INDEX `idx_review_results_job_check` ON `review_results`(`review_job_id`, `check_id`);
