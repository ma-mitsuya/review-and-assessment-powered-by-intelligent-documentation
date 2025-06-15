import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUserPreference } from "../../user-preference/hooks/useUserPreferenceQueries";

interface McpServerSelectorProps {
  onChange: (selectedServerName: string) => void;
  value?: string;
}

export const McpServerSelector: React.FC<McpServerSelectorProps> = ({
  onChange,
  value = "",
}) => {
  const { t } = useTranslation();
  const { preference, isLoading, error } = useUserPreference();
  const [isMcpEnabled, setIsMcpEnabled] = useState(false);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);

  // Convert the mcpServers record to array for easier UI rendering
  const mcpServersList = preference?.mcpServers
    ? Object.entries(preference.mcpServers).map(([name, config]) => ({
        name,
        config,
      }))
    : [];

  // Initialize state based on provided value
  useEffect(() => {
    if (value) {
      const servers = value.split(",").map((s) => s.trim());
      setSelectedServers(servers);
      setIsMcpEnabled(true);
    } else {
      setSelectedServers([]);
      setIsMcpEnabled(false);
    }
  }, []);

  // Handle MCP enable/disable toggle
  const handleMcpToggle = (enabled: boolean) => {
    setIsMcpEnabled(enabled);

    if (!enabled) {
      // Clear selected servers when MCP is disabled
      setSelectedServers([]);
      onChange("");
    } else if (selectedServers.length === 0 && mcpServersList.length > 0) {
      // Auto-select the first server if none are selected and MCP is enabled
      const firstServer = mcpServersList[0].name;
      setSelectedServers([firstServer]);
      onChange(firstServer);
    } else {
      // Update with current selections
      onChange(selectedServers.join(","));
    }
  };

  // Handle server checkbox selection
  const handleServerToggle = (serverName: string, checked: boolean) => {
    let updatedSelection;

    if (checked) {
      // Add to selection
      updatedSelection = [...selectedServers, serverName];
    } else {
      // Remove from selection
      updatedSelection = selectedServers.filter((name) => name !== serverName);
    }

    setSelectedServers(updatedSelection);
    onChange(updatedSelection.join(","));
  };

  // If no MCP servers available, show message
  if (!isLoading && (mcpServersList.length === 0 || error)) {
    return (
      <div className="mb-6">
        <label className="mb-2 block font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
          {t("review.mcpServer")}
        </label>
        <div className="text-gray-600 rounded-md border border-light-gray bg-light-gray p-4 text-sm">
          {error
            ? t("review.mcpServerError")
            : t("review.mcpServerNotAvailable")}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mb-6">
        <label className="mb-2 block font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
          {t("review.mcpServer")}
        </label>
        <div className="h-40 w-full animate-pulse rounded-md border border-light-gray bg-light-gray shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="mb-2 block font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
        {t("review.mcpServer")}
      </label>

      <div className="overflow-hidden rounded-md border border-light-gray bg-white shadow-sm dark:bg-aws-squid-ink-dark">
        <div className="border-b border-light-gray p-4">
          <h3 className="text-lg font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
            {t("review.mcpServer")}
          </h3>
          <p className="mt-1 text-sm text-aws-font-color-gray">
            {t("review.mcpServerDescription")}
          </p>
        </div>

        <div className="divide-y divide-light-gray">
          {/* Option: Don't use MCP */}
          <div
            className={`cursor-pointer p-4 transition-colors ${
              !isMcpEnabled
                ? "bg-aws-sea-blue-light bg-opacity-10"
                : "hover:bg-aws-paper-light"
            }`}
            onClick={() => handleMcpToggle(false)}>
            <div className="flex items-center">
              <input
                type="radio"
                id="mcp-disabled"
                name="mcpEnabled"
                checked={!isMcpEnabled}
                onChange={() => handleMcpToggle(false)}
                className="h-4 w-4 text-aws-sea-blue-light focus:ring-aws-sea-blue-light"
              />
              <label
                htmlFor="mcp-disabled"
                className="ml-3 block cursor-pointer text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
                <span className="font-medium">{t("review.mcpDisabled")}</span>
                <p className="mt-1 text-sm text-aws-font-color-gray">
                  {t("review.mcpDisabledDescription")}
                </p>
              </label>
            </div>
          </div>

          {/* Option: Use MCP */}
          <div
            className={`cursor-pointer p-4 transition-colors ${
              isMcpEnabled
                ? "bg-aws-sea-blue-light bg-opacity-10"
                : "hover:bg-aws-paper-light"
            }`}
            onClick={() => handleMcpToggle(true)}>
            <div className="flex items-center">
              <input
                type="radio"
                id="mcp-enabled"
                name="mcpEnabled"
                checked={isMcpEnabled}
                onChange={() => handleMcpToggle(true)}
                className="h-4 w-4 text-aws-sea-blue-light focus:ring-aws-sea-blue-light"
              />
              <label
                htmlFor="mcp-enabled"
                className="ml-3 block cursor-pointer text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
                <span className="font-medium">{t("review.mcpEnabled")}</span>
                <p className="mt-1 text-sm text-aws-font-color-gray">
                  {t("review.mcpEnabledDescription")}
                </p>
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className={`${!isMcpEnabled ? "opacity-50" : ""}`}>
            {/* Available MCP Servers with checkboxes */}
            {mcpServersList.map((server) => (
              <div
                key={server.name}
                className={`p-4 transition-colors ${
                  isMcpEnabled ? "hover:bg-aws-paper-light" : ""
                }`}>
                <div className="flex items-center pl-6">
                  <input
                    type="checkbox"
                    id={`server-${server.name}`}
                    name={`server-${server.name}`}
                    checked={selectedServers.includes(server.name)}
                    onChange={(e) =>
                      handleServerToggle(server.name, e.target.checked)
                    }
                    disabled={!isMcpEnabled}
                    className="h-4 w-4 text-aws-sea-blue-light focus:ring-aws-sea-blue-light"
                  />
                  <label
                    htmlFor={`server-${server.name}`}
                    className={`ml-3 block ${
                      isMcpEnabled
                        ? "cursor-pointer text-aws-squid-ink-light"
                        : "text-aws-font-color-gray"
                    } dark:text-aws-font-color-white-dark`}>
                    <span className="font-medium">{server.name}</span>
                  </label>
                </div>
              </div>
            ))}

            {/* No servers message */}
            {mcpServersList.length === 0 && (
              <div className="p-4 text-center text-aws-font-color-gray">
                {t("review.noMcpServersAvailable")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default McpServerSelector;
