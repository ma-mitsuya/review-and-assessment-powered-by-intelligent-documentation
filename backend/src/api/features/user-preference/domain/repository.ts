import { getPrismaClient } from "../../../core/db";
import { UserPreferenceModel } from "./model/preference";

export interface UserPreferenceRepository {
  getUserPreference(userId: string): Promise<UserPreferenceModel | null>;
  saveUserPreference(preference: UserPreferenceModel): Promise<void>;
  updateUserPreference(preference: UserPreferenceModel): Promise<void>;
  getMcpServerConfigByName(
    userId: string,
    serverName: string
  ): Promise<any | null>;
}

export const makePrismaUserPreferenceRepository = async (
  clientInput?: any
): Promise<UserPreferenceRepository> => {
  const client = clientInput || (await getPrismaClient());

  const getUserPreference = async (
    userId: string
  ): Promise<UserPreferenceModel | null> => {
    const preference = await client.userPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return null;
    }

    return {
      id: preference.id,
      userId: preference.userId,
      language: preference.language,
      mcpServers: preference.mcpServers as any,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  };

  const saveUserPreference = async (
    preference: UserPreferenceModel
  ): Promise<void> => {
    await client.userPreference.create({
      data: {
        id: preference.id,
        userId: preference.userId,
        language: preference.language,
        mcpServers: preference.mcpServers as any,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      },
    });
  };

  const updateUserPreference = async (
    preference: UserPreferenceModel
  ): Promise<void> => {
    await client.userPreference.update({
      where: { userId: preference.userId },
      data: {
        language: preference.language,
        mcpServers: preference.mcpServers as any,
        updatedAt: preference.updatedAt,
      },
    });
  };

  const getMcpServerConfigByName = async (
    userId: string,
    serverName: string
  ): Promise<any | null> => {
    const preference = await getUserPreference(userId);

    if (!preference || !preference.mcpServers) {
      return null;
    }

    return preference.mcpServers[serverName] || null;
  };

  return {
    getUserPreference,
    saveUserPreference,
    updateUserPreference,
    getMcpServerConfigByName,
  };
};
