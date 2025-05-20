import { useState } from "react";
import { useCheckListItems } from "../hooks/useCheckListItems";
import { HierarchicalCheckListItem } from "../types";
import { useToast } from "../../../contexts/ToastContext";

type CheckListItemAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  checkListSetId: string;
  checkItems: HierarchicalCheckListItem[];
  onSuccess: () => void;
};

export default function CheckListItemAddModal({
  isOpen,
  onClose,
  checkListSetId,
  checkItems,
  onSuccess,
}: CheckListItemAddModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
  });

  const { addToast } = useToast();

  // コンポーネントのトップレベルでフックを呼び出す
  const { createItem } = useCheckListItems(checkListSetId);

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
      await createItem(checkListSetId, formData);
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
          <button
            onClick={onClose}
            className="text-aws-font-color-gray hover:text-aws-squid-ink-light"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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

          <div className="mb-4">
            <label
              htmlFor="parentId"
              className="block text-aws-squid-ink-light font-medium mb-2"
            >
              親項目
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
            >
              <option value="">親項目なし（ルート項目）</option>
              {checkItems.map((item) => (
                <option key={item.check_id} value={item.check_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-light-gray rounded-md text-aws-squid-ink-light hover:bg-aws-paper-light transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light text-aws-font-color-white-light px-5 py-2.5 rounded-md flex items-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
