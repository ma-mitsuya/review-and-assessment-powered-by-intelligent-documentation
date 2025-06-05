import { useApiClient } from "../../../hooks/useApiClient";
import { UserPreference, UpdateLanguageRequest } from "../types";

export function useUpdateLanguage() {
  const { useMutation } = useApiClient();
  const { mutateAsync, status, error } = useMutation<
    UserPreference,
    UpdateLanguageRequest
  >("put", "/user/preference/language");

  return {
    updateLanguage: mutateAsync,
    status,
    error,
  };
}
