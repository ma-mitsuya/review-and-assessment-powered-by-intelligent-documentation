import React from "react";
import { PageHeader } from "../../../components/PageHeader";
import { McpServerManager } from "../components/McpServerManager";
import { ExperimentalBadge } from "../components/ExperimentalBadge";
import { useTranslation } from "react-i18next";

export const McpServersPage: React.FC = () => {
  const { t } = useTranslation();

  // @ts-ignore - PageHeader expects string but we're passing JSX like in the original
  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            {t("mcpServer.title")}
            <ExperimentalBadge type="beta" />
          </div>
        }
        description={t("mcpServer.description")}
      />
      <div className="mt-6">
        <McpServerManager />
      </div>
    </div>
  );
};
