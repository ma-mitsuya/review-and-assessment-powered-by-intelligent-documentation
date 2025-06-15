import { ApiResponse } from "../../types/api";

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export type McpServers = Record<string, McpServerConfig>;

export interface UserPreference {
  id: string;
  userId: string;
  language: string;
  mcpServers?: McpServers;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLanguageRequest {
  language: string;
}

export interface UpdateMcpServersRequest {
  mcpServers: McpServers;
}

export interface McpServersData {
  mcpServers?: McpServers;
}

export type GetUserPreferenceResponse = ApiResponse<UserPreference>;
export type UpdateLanguageResponse = ApiResponse<UserPreference>;
export type GetMcpServersResponse = ApiResponse<McpServersData>;
export type UpdateMcpServersResponse = ApiResponse<UserPreference>;
