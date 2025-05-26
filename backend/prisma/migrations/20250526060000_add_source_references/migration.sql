-- AlterTable: Add sourceReferences field and remove sourceDocumentId, sourcePageNumber
ALTER TABLE `review_results` 
ADD COLUMN `source_references` JSON NULL,
DROP COLUMN `source_document_id`,
DROP COLUMN `source_page_number`;
