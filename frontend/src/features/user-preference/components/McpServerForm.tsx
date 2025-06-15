import React, { useState, useEffect } from "react";
import { Button } from "../../../components/Button";
import { FormTextArea } from "../../../components/FormTextArea";
import { McpServerConfig, McpServers } from "../types";
import { useUpdateMcpServers } from "../hooks/useUserPreferenceMutations";
import { useAlert } from "../../../hooks/useAlert";
import { useTranslation } from "react-i18next";

interface McpServerFormProps {
  initialValue?: McpServers;
  onSaved?: () => void;
}

// Example MCP server configuration
const EXAMPLE_CONFIG = JSON.stringify(
  {
    "awslabs.aws-location-mcp-server": {
      command: "uvx",
      args: ["awslabs.aws-location-mcp-server@latest"],
      env: {
        FASTMCP_LOG_LEVEL: "ERROR",
      },
    },
  },
  null,
  2
);

export const McpServerForm: React.FC<McpServerFormProps> = ({
  initialValue,
  onSaved,
}) => {
  const { t } = useTranslation();

  // Initialize with empty string if no initial value
  const [jsonValue, setJsonValue] = useState<string>(
    initialValue ? JSON.stringify(initialValue, null, 2) : ""
  );

  const [isEmpty, setIsEmpty] = useState<boolean>(!initialValue);

  // Monitor if text area is empty
  useEffect(() => {
    setIsEmpty(!jsonValue.trim());
  }, [jsonValue]);

  const [jsonError, setJsonError] = useState<string | null>(null);
  const { updateMcpServers, status } = useUpdateMcpServers();
  const { showAlert, showSuccess, showError, AlertModal } = useAlert();

  const handleSave = async () => {
    try {
      const parsedJson = JSON.parse(jsonValue);

      // Validation - ensuring it's an object
      if (!parsedJson || typeof parsedJson !== "object") {
        setJsonError(t("mcpServer.validationErrors.mcpServersRequired"));
        return;
      }

      const servers = parsedJson;

      for (const [key, config] of Object.entries(servers)) {
        // Check server configuration structure
        if (!config || typeof config !== "object") {
          setJsonError(
            t("mcpServer.validationErrors.configObjectRequired", { key })
          );
          return;
        }

        // Cast config to McpServerConfig for TypeScript type safety
        const serverConfig = config as McpServerConfig;

        // Check command field
        if (!serverConfig.command || typeof serverConfig.command !== "string") {
          setJsonError(
            t("mcpServer.validationErrors.commandRequired", { key })
          );
          return;
        }

        // Allowed commands only
        if (serverConfig.command !== "uvx" && serverConfig.command !== "npx") {
          setJsonError(
            t("mcpServer.validationErrors.commandRestriction", { key })
          );
          return;
        }

        // Check args field
        if (!Array.isArray(serverConfig.args)) {
          setJsonError(t("mcpServer.validationErrors.argsArray", { key }));
          return;
        }

        // Security check for args
        for (const arg of serverConfig.args) {
          if (typeof arg !== "string") {
            setJsonError(t("mcpServer.validationErrors.argsString", { key }));
            return;
          }

          // Allow only arguments starting with awslabs.
          if (!arg.startsWith("awslabs.")) {
            setJsonError(
              t("mcpServer.validationErrors.argsPrefix", { key, arg })
            );
            return;
          }
        }

        // Check env field if present
        if (serverConfig.env && typeof serverConfig.env !== "object") {
          setJsonError(t("mcpServer.validationErrors.envObject", { key }));
          return;
        }
      }

      // Clear errors
      setJsonError(null);

      // Call update API - wrap in expected request format
      await updateMcpServers({ mcpServers: parsedJson });
      showSuccess(t("mcpServer.saveSuccess"));

      if (onSaved) {
        onSaved();
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        setJsonError(t("mcpServer.validationErrors.invalidJson") + e.message);
      } else if (e instanceof Error) {
        showError(t("mcpServer.saveError") + e.message);
      } else {
        showError(t("mcpServer.saveError"));
      }
    }
  };

  // Handler to add example configuration
  const handleInsertExample = () => {
    setJsonValue(EXAMPLE_CONFIG);
    setJsonError(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="mcp-settings"
            className="block text-sm font-medium text-aws-font-color-light dark:text-aws-font-color-dark">
            {t("mcpServer.settingsLabel")}
          </label>
          <Button
            onClick={handleInsertExample}
            variant="secondary"
            className="text-sm"
            disabled={!isEmpty}>
            {t("mcpServer.insertExample")}
          </Button>
        </div>
        <FormTextArea
          id="mcp-settings"
          name="mcpSettings"
          label=""
          value={jsonValue}
          onChange={(e) => {
            setJsonValue(e.target.value);
            setJsonError(null);
          }}
          rows={20}
          className="font-mono"
          error={jsonError || undefined}
          placeholder={isEmpty ? EXAMPLE_CONFIG : undefined}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={status === "loading"}
          loading={status === "loading"}
          type="button"
          variant="primary">
          {t("mcpServer.saveButton")}
        </Button>
      </div>
      <AlertModal />
    </div>
  );
};
