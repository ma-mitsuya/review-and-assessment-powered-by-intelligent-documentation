import { useState } from "react";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import { CheckListItem } from "../types";
import { useCheckListItems } from "../hooks/useCheckListItems";

type CheckListItemEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: CheckListItem;
  checkListSetId: string;
};

/**
 * チェックリスト項目編集モーダル
 */
export default function CheckListItemEditModal({
  isOpen,
  onClose,
  item,
  checkListSetId,
}: CheckListItemEditModalProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // コンポーネントのトップレベルでフックを呼び出す
  const { updateItem } = useCheckListItems(checkListSetId);

  console.log("チェックリスト項目編集モーダル - 項目ID:", item.checkId);
  console.log("チェックリスト項目編集モーダル - セットID:", checkListSetId);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("名前は必須です");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("更新リクエスト送信:", {
        itemId: item.checkId,
        setId: checkListSetId,
        data: {
          name: formData.name,
          description: formData.description,
        },
      });

      await updateItem(checkListSetId, item.checkId, {
        name: formData.name,
        description: formData.description,
      });
      onClose();
    } catch (err) {
      console.error("項目の更新に失敗しました", err);
      setError("項目の更新に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="チェックリスト項目の編集"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red/10 border border-red rounded-md text-red">
            {error}
          </div>
        )}

        <div className="mb-6">
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
              !formData.name.trim() ? "border-red" : "border-light-gray"
            }`}
            placeholder="チェック項目の名前"
            required
          />
          {!formData.name.trim() && (
            <p className="mt-1 text-red text-sm">名前は必須です</p>
          )}
        </div>

        <div className="mb-6">
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

        {/* TODO: フロー形式の編集機能は将来的に実装予定 */}

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} type="button">
            キャンセル
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "更新"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
