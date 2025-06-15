import {
  UserPreferenceModel,
  UserPreferenceDomain,
  McpServers,
} from "../domain/model/preference";
import {
  UserPreferenceRepository,
  makePrismaUserPreferenceRepository,
} from "../domain/repository";

export const getUserPreference = async (params: {
  userId: string;
  deps?: {
    repo?: UserPreferenceRepository;
  };
}): Promise<UserPreferenceModel> => {
  const repo =
    params.deps?.repo || (await makePrismaUserPreferenceRepository());
  const preference = await repo.getUserPreference(params.userId);

  if (!preference) {
    return UserPreferenceDomain.getDefault(params.userId);
  }

  return preference;
};

export interface UpdateLanguageRequest {
  language: string;
}

export const updateLanguage = async (params: {
  userId: string;
  request: UpdateLanguageRequest;
  deps?: {
    repo?: UserPreferenceRepository;
  };
}): Promise<UserPreferenceModel> => {
  const repo =
    params.deps?.repo || (await makePrismaUserPreferenceRepository());

  // 既存の設定を取得
  const existing = await repo.getUserPreference(params.userId);

  // 存在しない場合は新規作成
  if (!existing) {
    const newPreference = UserPreferenceDomain.create(
      params.userId,
      params.request.language
    );
    await repo.saveUserPreference(newPreference);
    return newPreference;
  }

  // 存在する場合は更新 - ドメイン専用の更新メソッドを使用
  const updatedPreference = UserPreferenceDomain.updateLanguage(
    existing,
    params.request.language
  );
  await repo.updateUserPreference(updatedPreference);
  return updatedPreference;
};

export interface GetMcpServersResponse {
  mcpServers?: McpServers;
}

export const getMcpServers = async (params: {
  userId: string;
  deps?: {
    repo?: UserPreferenceRepository;
  };
}): Promise<GetMcpServersResponse> => {
  const repo =
    params.deps?.repo || (await makePrismaUserPreferenceRepository());

  const preference = await repo.getUserPreference(params.userId);

  if (!preference) {
    return { mcpServers: undefined };
  }

  return {
    mcpServers: preference.mcpServers,
  };
};

export const getMcpServerConfig = async (params: {
  userId: string;
  serverName: string;
  deps?: {
    repo?: UserPreferenceRepository;
  };
}): Promise<any | null> => {
  const repo =
    params.deps?.repo || (await makePrismaUserPreferenceRepository());

  return await repo.getMcpServerConfigByName(params.userId, params.serverName);
};

export interface UpdateMcpServersRequest {
  mcpServers: McpServers;
}

export const updateMcpServers = async (params: {
  userId: string;
  request: UpdateMcpServersRequest;
  deps?: {
    repo?: UserPreferenceRepository;
  };
}): Promise<UserPreferenceModel> => {
  const repo =
    params.deps?.repo || (await makePrismaUserPreferenceRepository());

  // 既存の設定を取得
  const existing = await repo.getUserPreference(params.userId);

  // 存在しない場合は新規作成
  if (!existing) {
    const newPreference = UserPreferenceDomain.create(
      params.userId,
      "en", // デフォルト言語
      params.request.mcpServers
    );
    await repo.saveUserPreference(newPreference);
    return newPreference;
  }

  // 存在する場合は更新 - ドメイン専用の更新メソッドを使用
  // バリデーションはドメインモデル内で実行される
  const updatedPreference = UserPreferenceDomain.updateMcpServers(
    existing,
    params.request.mcpServers
  );
  await repo.updateUserPreference(updatedPreference);
  return updatedPreference;
};
