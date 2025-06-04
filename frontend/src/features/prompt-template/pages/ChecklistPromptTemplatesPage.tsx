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
import { useAlert } from "../../../hooks/useAlert";
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

  const { showConfirm, showSuccess, showError, AlertModal } = useAlert();

  const handleDelete = (template: PromptTemplate) => {
    setCurrentTemplate(template);

    showConfirm(
      `テンプレート「${template.name}」を削除してもよろしいですか？ この操作は元に戻せません。`,
      {
        title: "テンプレートの削除",
        confirmButtonText: "削除",
        onConfirm: async () => {
          await handleConfirmDelete(template);
        },
      }
    );
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

  const handleConfirmDelete = async (template: PromptTemplate) => {
    setIsSubmitting(true);
    try {
      await deleteTemplate(template.id);
      await refetch();
      showSuccess("テンプレートを削除しました");
    } catch (error) {
      showError("削除中にエラーが発生しました");
      console.error(error);
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

      <AlertModal />

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
