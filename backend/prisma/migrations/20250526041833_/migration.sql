-- AlterTable
ALTER TABLE `review_results` ADD COLUMN `source_document_id` VARCHAR(26) NULL,
    ADD COLUMN `source_page_number` INTEGER NULL;
