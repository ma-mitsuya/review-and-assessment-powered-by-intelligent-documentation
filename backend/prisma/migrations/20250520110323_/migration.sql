-- CreateTable
CREATE TABLE `check_list_sets` (
    `check_list_set_id` VARCHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,

    PRIMARY KEY (`check_list_set_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `check_list` (
    `check_id` VARCHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `parent_id` VARCHAR(26) NULL,
    `check_list_set_id` VARCHAR(26) NOT NULL,
    `document_id` VARCHAR(26) NULL,

    PRIMARY KEY (`check_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklist_documents` (
    `document_id` VARCHAR(26) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `s3_path` VARCHAR(512) NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `upload_date` TIMESTAMP NOT NULL,
    `check_list_set_id` VARCHAR(26) NOT NULL,
    `user_id` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',

    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_documents` (
    `review_document_id` VARCHAR(26) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `s3_path` VARCHAR(512) NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `upload_date` TIMESTAMP NOT NULL,
    `user_id` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',

    PRIMARY KEY (`review_document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_jobs` (
    `review_job_id` VARCHAR(26) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `document_id` VARCHAR(26) NOT NULL,
    `check_list_set_id` VARCHAR(26) NOT NULL,
    `created_at` TIMESTAMP NOT NULL,
    `updated_at` TIMESTAMP NOT NULL,
    `completed_at` TIMESTAMP NULL,
    `user_id` VARCHAR(50) NULL,
    `meta_data` JSON NULL,

    PRIMARY KEY (`review_job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_results` (
    `review_result_id` VARCHAR(26) NOT NULL,
    `review_job_id` VARCHAR(26) NOT NULL,
    `check_id` VARCHAR(26) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `result` VARCHAR(20) NULL,
    `confidence_score` DOUBLE NULL,
    `explanation` TEXT NULL,
    `extracted_text` TEXT NULL,
    `user_override` BOOLEAN NOT NULL DEFAULT false,
    `user_comment` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL,
    `updated_at` TIMESTAMP NOT NULL,

    PRIMARY KEY (`review_result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `check_list` ADD CONSTRAINT `check_list_check_list_set_id_fkey` FOREIGN KEY (`check_list_set_id`) REFERENCES `check_list_sets`(`check_list_set_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `check_list` ADD CONSTRAINT `check_list_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `check_list`(`check_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `check_list` ADD CONSTRAINT `check_list_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `checklist_documents`(`document_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklist_documents` ADD CONSTRAINT `checklist_documents_check_list_set_id_fkey` FOREIGN KEY (`check_list_set_id`) REFERENCES `check_list_sets`(`check_list_set_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_jobs` ADD CONSTRAINT `review_jobs_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `review_documents`(`review_document_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_jobs` ADD CONSTRAINT `review_jobs_check_list_set_id_fkey` FOREIGN KEY (`check_list_set_id`) REFERENCES `check_list_sets`(`check_list_set_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_results` ADD CONSTRAINT `review_results_review_job_id_fkey` FOREIGN KEY (`review_job_id`) REFERENCES `review_jobs`(`review_job_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_results` ADD CONSTRAINT `review_results_check_id_fkey` FOREIGN KEY (`check_id`) REFERENCES `check_list`(`check_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
