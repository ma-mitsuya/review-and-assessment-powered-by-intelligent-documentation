import {
  UserPreferenceModel,
  UserPreferenceDomain,
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

  // 存在する場合は更新
  const updatedPreference = UserPreferenceDomain.update(
    existing,
    params.request.language
  );
  await repo.updateUserPreference(updatedPreference);
  return updatedPreference;
};
