/**
 * チェックリストセットルートのテスト
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createApp } from "../../../core/app";
import { FastifyInstance } from "fastify";
import { registerChecklistRoutes } from "../index";

// モック
vi.mock("../services/checklist-set-service", () => {
  return {
    ChecklistSetService: vi.fn().mockImplementation(() => ({
      getChecklistSets: vi.fn().mockResolvedValue({
        checkListSets: [
          {
            check_list_set_id: "test-id-1",
            name: "テストチェックリスト1",
            description: "テスト説明1",
            processing_status: "pending",
          },
          {
            check_list_set_id: "test-id-2",
            name: "テストチェックリスト2",
            description: "テスト説明2",
            processing_status: "completed",
          },
        ],
        total: 2,
      }),
      createChecklistSet: vi.fn().mockResolvedValue({
        id: "new-test-id",
        name: "新規チェックリスト",
        description: "新規説明",
      }),
    })),
  };
});

describe("チェックリストセットルート", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = createApp();
    registerChecklistRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /checklist-sets - チェックリストセット一覧を取得できる", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/checklist-sets",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.checkListSets).toHaveLength(2);
    expect(body.data.total).toBe(2);
    expect(body.data.checkListSets[0].check_list_set_id).toBe("test-id-1");
  });

  it("GET /checklist-sets - クエリパラメータを指定して取得できる", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/checklist-sets?page=2&limit=5&sortBy=name&sortOrder=desc",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("POST /checklist-sets - チェックリストセットを作成できる", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/checklist-sets",
      payload: {
        name: "新規チェックリスト",
        description: "新規説明",
        documents: [
          {
            documentId: "doc-id-1",
            filename: "test.pdf",
            s3Key: "documents/test.pdf",
            fileType: "application/pdf",
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.check_list_set_id).toBe("new-test-id");
    expect(body.data.name).toBe("新規チェックリスト");
  });
});
