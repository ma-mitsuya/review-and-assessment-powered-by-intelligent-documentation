import { useApiClient } from "../../../hooks/useApiClient";
import type {
  CreateChecklistSetRequest,
  CreateChecklistSetResponse,
} from "../types";

export function useCreateChecklistSet() {
  const { mutateAsync, status, error } = useApiClient().useMutation<
    CreateChecklistSetResponse,
    CreateChecklistSetRequest
  >("post", "/checklist-sets");

  return { createChecklistSet: mutateAsync, status, error };
}

export function useUpdateChecklistSet() {
  const { mutateAsync, status, error } = useApiClient().useMutation<
    CreateChecklistSetResponse,
    Omit<CreateChecklistSetRequest, "documents">
  >("put", "/checklist-sets");

  function updateChecklistSet(
    id: string,
    body: Omit<CreateChecklistSetRequest, "documents">
  ) {
    return mutateAsync(body, `/checklist-sets/${id}`);
  }

  return { updateChecklistSet, status, error };
}

export function useDeleteChecklistSet() {
  const { mutateAsync, status, error } = useApiClient().useMutation<
    CreateChecklistSetResponse,
    void
  >("delete", "/checklist-sets");

  function deleteChecklistSet(id: string) {
    return mutateAsync(undefined, `/checklist-sets/${id}`);
  }

  return { deleteChecklistSet, status, error };
}
