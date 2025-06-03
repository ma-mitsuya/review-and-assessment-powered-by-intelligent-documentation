import {
  PromptTemplateEntity,
  PromptTemplateDomain,
  PromptTemplateType,
} from "../domain/model/template";
import {
  PromptTemplateRepository,
  makePrismaPromptTemplateRepository,
} from "../domain/repository";
import { NotFoundError } from "../../../core/errors";
import { CHECKLIST_EXTRACTION_PROMPT } from "../../../../checklist-workflow/document-processing/llm-processing";

export const getPromptTemplates = async (params: {
  userId: string;
  type: PromptTemplateType;
  deps?: {
    repo?: PromptTemplateRepository;
  };
}): Promise<PromptTemplateEntity[]> => {
  const repo =
    params.deps?.repo || (await makePrismaPromptTemplateRepository());
  return repo.getPromptTemplates(params.userId, params.type);
};

export const getPromptTemplateById = async (params: {
  id: string;
  deps?: {
    repo?: PromptTemplateRepository;
  };
}): Promise<PromptTemplateEntity> => {
  const repo =
    params.deps?.repo || (await makePrismaPromptTemplateRepository());
  return repo.getPromptTemplateById(params.id);
};

export const createPromptTemplate = async (params: {
  request: {
    userId: string;
    name: string;
    description?: string;
    prompt: string;
    type: PromptTemplateType;
  };
  deps?: {
    repo?: PromptTemplateRepository;
  };
}): Promise<PromptTemplateEntity> => {
  const repo =
    params.deps?.repo || (await makePrismaPromptTemplateRepository());
  const template = PromptTemplateDomain.fromCreateRequest(params.request);
  await repo.createPromptTemplate(template);
  return template;
};

export const updatePromptTemplate = async (params: {
  request: {
    id: string;
    name?: string;
    description?: string;
    prompt?: string;
  };
  deps?: {
    repo?: PromptTemplateRepository;
  };
}): Promise<PromptTemplateEntity> => {
  const repo =
    params.deps?.repo || (await makePrismaPromptTemplateRepository());

  try {
    const existing = await repo.getPromptTemplateById(params.request.id);
    const updated = PromptTemplateDomain.fromUpdateRequest(
      existing,
      params.request
    );
    await repo.updatePromptTemplate(updated);
    return updated;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError("Prompt template", params.request.id);
    }
    throw error;
  }
};

export const deletePromptTemplate = async (params: {
  id: string;
  deps?: {
    repo?: PromptTemplateRepository;
  };
}): Promise<void> => {
  const repo =
    params.deps?.repo || (await makePrismaPromptTemplateRepository());
  await repo.deletePromptTemplate(params.id);
};

export const getChecklistPromptForProcessing = async (params: {
  userId?: string;
  templateId?: string;
  deps?: {
    repo?: PromptTemplateRepository;
  };
}): Promise<string> => {
  // テンプレートIDが指定されていない場合はデフォルトプロンプトを返す
  if (!params.templateId) {
    console.info(
      "No templateId provided, using default checklist extraction prompt"
    );
    return CHECKLIST_EXTRACTION_PROMPT;
  }

  const repo =
    params.deps?.repo || (await makePrismaPromptTemplateRepository());

  try {
    // テンプレートIDが指定されている場合はそのテンプレートを取得
    const template = await repo.getPromptTemplateById(params.templateId);
    if (template.type !== PromptTemplateType.CHECKLIST) {
      console.warn(
        `Template ${params.templateId} is not a checklist template, using default`
      );
      return CHECKLIST_EXTRACTION_PROMPT;
    }
    return template.prompt;
  } catch (error) {
    console.error(`Error fetching prompt template: ${error}`);
    return CHECKLIST_EXTRACTION_PROMPT;
  }
};
