import { useState } from "react";
import { useCreateCheckListItem } from "../hooks/useCheckListItemMutations";
import { useToast } from "../../../contexts/ToastContext";
import Button from "../../../components/Button";
import { HiX } from "react-icons/hi";

type CheckListItemAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  checkListSetId: string;
  parentId?: string;
  onSuccess: () => void;
};

export default function CheckListItemAddModal({
  isOpen,
  onClose,
  checkListSetId,
  parentId,
  onSuccess,
}: CheckListItemAddModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: parentId || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
  });

  const { addToast } = useToast();

  // コンポーネントのトップレベルでフックを呼び出す
  const {
    createCheckListItem,
    status: submitStatus,
    error: submitError,
  } = useCreateCheckListItem(checkListSetId);

  // 入力値の変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // エラークリア
    if (name === "name" && errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  // バリデーション
  const validate = () => {
    const newErrors = {
      name: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "名前は必須です";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // parentIdが指定されている場合は、formDataのparentIdを上書きして確実に使用する
      const dataToSubmit = {
        ...formData,
        parentId: parentId !== undefined ? parentId : formData.parentId,
      };

      await createCheckListItem(dataToSubmit);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("保存に失敗しました", error);

      // エラーメッセージの処理
      if (
        error instanceof Error &&
        error.message.includes("LINKED_REVIEW_JOBS")
      ) {
        addToast(
          "このチェックリストセットは審査ジョブに紐づいているため編集できません",
          "error"
        );
      } else {
        addToast("チェックリスト項目の保存に失敗しました", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-aws-squid-ink-light">
            チェックリスト項目の追加
          </h2>
          <Button
            variant="text"
            size="sm"
            icon={<HiX className="h-6 w-6" />}
            onClick={onClose}
            aria-label="閉じる"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-aws-squid-ink-light font-medium mb-2"
            >
              名前 <span className="text-red">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light ${
                errors.name ? "border-red" : "border-light-gray"
              }`}
              placeholder="チェック項目の名前"
            />
            {errors.name && (
              <p className="mt-1 text-red text-sm">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-aws-squid-ink-light font-medium mb-2"
            >
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
              placeholder="チェック項目の説明"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
