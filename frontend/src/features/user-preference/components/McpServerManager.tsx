import React from "react";
import { useUserPreference } from "../hooks/useUserPreferenceQueries";
import { McpServerForm } from "./McpServerForm";
import Spinner from "../../../components/Spinner";
import InfoAlert from "../../../components/InfoAlert";
import { useTranslation } from "react-i18next";

export const McpServerManager: React.FC = () => {
  const { preference, isLoading, refetch } = useUserPreference();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <InfoAlert
        title={t("mcpServer.infoTitle")}
        message={t("mcpServer.infoMessage")}
        variant="info"
        dangerouslySetInnerHTML={true}
      />

      <div className="rounded-lg border border-light-gray bg-white p-6 shadow-md">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <McpServerForm
            initialValue={preference?.mcpServers}
            onSaved={() => refetch()}
          />
        )}
      </div>
    </div>
  );
};
