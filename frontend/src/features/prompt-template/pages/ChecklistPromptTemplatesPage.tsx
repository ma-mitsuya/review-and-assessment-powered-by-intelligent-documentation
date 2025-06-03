import React, { useState } from "react";
import { PromptTemplateList } from "../components/PromptTemplateList";
import { PromptTemplateEditor } from "../components/PromptTemplateEditor";
import { usePromptTemplates } from "../hooks/usePromptTemplateQueries";
import {
  useCreatePromptTemplate,
  useUpdatePromptTemplate,
  useDeletePromptTemplate,
} from "../hooks/usePromptTemplateMutations";
import Modal from "../../../components/Modal";
import { Toast } from "../../../components/Toast";
import { HiCheck, HiPlus } from "react-icons/hi";
import Button from "../../../components/Button";
import {
  PromptTemplate,
  PromptTemplateType,
  UpdatePromptTemplateRequest,
} from "../types";

export const ChecklistPromptTemplatesPage: React.FC = () => {
  const { templates, isLoading, refetch } = usePromptTemplates(
    PromptTemplateType.CHECKLIST
  );
  const { createTemplate } = useCreatePromptTemplate();
  const { updateTemplate } = useUpdatePromptTemplate();
  const { deleteTemplate } = useDeletePromptTemplate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<
    PromptTemplate | undefined
  >(undefined);
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleCreateNew = () => {
    setCurrentTemplate(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: PromptTemplate) => {
    setCurrentTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDelete = (template: PromptTemplate) => {
    setCurrentTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (data: UpdatePromptTemplateRequest) => {
    setIsSubmitting(true);
    try {
      if (currentTemplate) {
        await updateTemplate(currentTemplate.id, data);
        await refetch();
        setToast({
          id: `update-${new Date().getTime()}`,
          message: "テンプレートを更新しました",
          type: "success",
        });
      } else {
        if (data.name && data.prompt) {
          await createTemplate({
            name: data.name,
            prompt: data.prompt,
            description: data.description,
            type: PromptTemplateType.CHECKLIST,
          });
          await refetch();
        } else {
          throw new Error("Name and prompt are required");
        }
        setToast({
          id: `create-${new Date().getTime()}`,
          message: "テンプレートを作成しました",
          type: "success",
        });
      }
      setIsEditorOpen(false);
    } catch (error) {
      setToast({
        id: `error-${new Date().getTime()}`,
        message: "エラーが発生しました",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentTemplate) return;

    setIsSubmitting(true);
    try {
      await deleteTemplate(currentTemplate.id);
      await refetch();
      setToast({
        id: `delete-${new Date().getTime()}`,
        message: "テンプレートを削除しました",
        type: "success",
      });
      setIsDeleteModalOpen(false);
    } catch (error) {
      setToast({
        id: `delete-error-${new Date().getTime()}`,
        message: "削除中にエラーが発生しました",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <HiCheck className="mr-2 h-8 w-8 text-aws-font-color-light dark:text-aws-font-color-dark" />
            <h1 className="text-3xl font-bold text-aws-font-color-light dark:text-aws-font-color-dark">
              チェックリストプロンプト管理
            </h1>
          </div>
          <p className="mt-2 text-aws-font-color-gray">
            チェックリスト生成に使用するプロンプトテンプレートを管理します
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreateNew}
          icon={<HiPlus className="h-5 w-5" />}>
          新規作成
        </Button>
      </div>

      <PromptTemplateList
        templates={templates}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={() => {}}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
      />

      {/* エディターモーダル */}
      {isEditorOpen && (
        <Modal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          title={
            currentTemplate ? "テンプレートを編集" : "新規テンプレート作成"
          }
          size="lg">
          <PromptTemplateEditor
            template={currentTemplate}
            type={PromptTemplateType.CHECKLIST}
            onSave={handleSave}
            onCancel={() => setIsEditorOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}

      {/* 削除確認モーダル */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="テンプレートの削除">
          <div className="space-y-4">
            <p>
              テンプレート「{currentTemplate?.name}
              」を削除してもよろしいですか？ この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="rounded-md border border-light-gray bg-aws-paper-light px-4 py-2 text-sm font-medium text-aws-font-color-light shadow-sm hover:bg-light-gray focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light focus:ring-offset-2 dark:border-dark-gray dark:bg-aws-paper-dark dark:text-aws-font-color-dark dark:hover:bg-dark-gray"
                onClick={() => setIsDeleteModalOpen(false)}>
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-md border border-transparent bg-aws-sea-blue-light px-4 py-2 text-sm font-medium text-aws-font-color-white-light shadow-sm hover:bg-aws-sea-blue-hover-light focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light focus:ring-offset-2 dark:bg-aws-sea-blue-dark dark:hover:bg-aws-sea-blue-hover-dark"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}>
                {isSubmitting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* トースト通知 */}
      {toast && (
        <Toast
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
