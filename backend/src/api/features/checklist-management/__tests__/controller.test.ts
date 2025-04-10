/**
 * チェックリストセットコントローラのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { registerCheckListSetRoutes } from '../controller';
import { CheckListSetService } from '../service';
import { CheckListSet } from '../types';

// モックデータ
const mockCheckListSets: CheckListSet[] = [
  {
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
    name: '自社物件チェックリストセット',
    description: '自社物件の契約書チェック用のセット'
  },
  {
    check_list_set_id: '01DAG9M3AQN08QVNFMW6P6MKSG',
    name: '他社物件チェックリストセット',
    description: '他社物件の契約書チェック用のセット'
  }
];

// サービスのモック
const mockService: CheckListSetService = {
  getCheckListSets: vi.fn(),
  getCheckListSetById: vi.fn()
};

// Fastifyのモック
const mockFastify: any = {
  get: vi.fn(),
  log: {
    error: vi.fn()
  }
};

describe('CheckListSetController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('registerCheckListSetRoutes', () => {
    it('ルートが正しく登録されること', () => {
      // テスト対象の実行
      registerCheckListSetRoutes(mockFastify as FastifyInstance, mockService);

      // 検証
      expect(mockFastify.get).toHaveBeenCalledTimes(2);
      expect(mockFastify.get).toHaveBeenCalledWith('/checklist-sets', expect.any(Function));
      expect(mockFastify.get).toHaveBeenCalledWith('/checklist-sets/:id', expect.any(Function));
    });
  });

  describe('GET /checklist-sets', () => {
    it('チェックリストセットの一覧を取得できること', async () => {
      // モックの設定
      const mockRequest = {
        query: { page: 1, limit: 10 }
      };
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn()
      };
      (mockService.getCheckListSets as any).mockResolvedValue({
        checkListSets: mockCheckListSets,
        total: mockCheckListSets.length
      });

      // ルートハンドラの取得
      registerCheckListSetRoutes(mockFastify as FastifyInstance, mockService);
      const routeHandler = mockFastify.get.mock.calls[0][1];

      // テスト対象の実行
      await routeHandler(mockRequest, mockReply);

      // 検証
      expect(mockService.getCheckListSets).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          checkListSets: mockCheckListSets,
          total: mockCheckListSets.length
        }
      });
    });

    it('エラー発生時に500エラーを返すこと', async () => {
      // モックの設定
      const mockRequest = {
        query: { page: 1, limit: 10 }
      };
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn()
      };
      const error = new Error('テストエラー');
      (mockService.getCheckListSets as any).mockRejectedValue(error);

      // ルートハンドラの取得
      registerCheckListSetRoutes(mockFastify as FastifyInstance, mockService);
      const routeHandler = mockFastify.get.mock.calls[0][1];

      // テスト対象の実行
      await routeHandler(mockRequest, mockReply);

      // 検証
      expect(mockFastify.log.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'チェックリストセットの取得に失敗しました'
      });
    });
  });

  describe('GET /checklist-sets/:id', () => {
    it('IDによるチェックリストセットの取得ができること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      const mockRequest = {
        params: { id }
      };
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn()
      };
      (mockService.getCheckListSetById as any).mockResolvedValue(mockCheckListSets[0]);

      // ルートハンドラの取得
      registerCheckListSetRoutes(mockFastify as FastifyInstance, mockService);
      const routeHandler = mockFastify.get.mock.calls[1][1];

      // テスト対象の実行
      await routeHandler(mockRequest, mockReply);

      // 検証
      expect(mockService.getCheckListSetById).toHaveBeenCalledWith(id);
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockCheckListSets[0]
      });
    });

    it('存在しないIDの場合は404エラーを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      const mockRequest = {
        params: { id }
      };
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn()
      };
      (mockService.getCheckListSetById as any).mockResolvedValue(null);

      // ルートハンドラの取得
      registerCheckListSetRoutes(mockFastify as FastifyInstance, mockService);
      const routeHandler = mockFastify.get.mock.calls[1][1];

      // テスト対象の実行
      await routeHandler(mockRequest, mockReply);

      // 検証
      expect(mockService.getCheckListSetById).toHaveBeenCalledWith(id);
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: '指定されたチェックリストセットが見つかりません'
      });
    });
  });
});
