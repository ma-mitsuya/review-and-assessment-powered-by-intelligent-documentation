import React from "react";
import { HiOutlineLightBulb } from "react-icons/hi";
import { useTranslation } from "react-i18next";

interface ExperimentalBadgeProps {
  type?: "beta" | "experimental";
}

export const ExperimentalBadge: React.FC<ExperimentalBadgeProps> = ({
  type = "experimental",
}) => {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
      <HiOutlineLightBulb className="h-3 w-3" />
      <span>
        {type === "beta"
          ? t("experimental.beta")
          : t("experimental.experimental")}
      </span>
    </div>
  );
};
