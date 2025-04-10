/**
 * チェックリスト項目ルートのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { CheckListItem } from '../types';
import { CheckListItemService } from '../service';

// モックデータ
const mockCheckListItems: CheckListItem[] = [
  {
    check_id: '01ITEM1234567890ABC',
    name: 'チェック項目1',
    description: '説明1',
    parent_id: null,
    item_type: 'simple',
    is_conclusion: false,
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
  },
  {
    check_id: '01ITEM2345678901DEF',
    name: 'チェック項目2',
    description: '説明2',
    parent_id: null,
    item_type: 'flow',
    is_conclusion: false,
    flow_data: { condition: 'test' },
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
  }
];

// 階層構造のモックデータ
const mockHierarchyItems: CheckListItem[] = [
  {
    check_id: '01ITEM1234567890ABC',
    name: 'チェック項目1',
    description: '説明1',
    parent_id: null,
    item_type: 'simple',
    is_conclusion: false,
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
    children: [
      {
        check_id: '01ITEM3456789012GHI',
        name: 'チェック項目1-1',
        description: '説明1-1',
        parent_id: '01ITEM1234567890ABC',
        item_type: 'simple',
        is_conclusion: false,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
        children: []
      }
    ]
  },
  {
    check_id: '01ITEM2345678901DEF',
    name: 'チェック項目2',
    description: '説明2',
    parent_id: null,
    item_type: 'flow',
    is_conclusion: false,
    flow_data: { condition: 'test' },
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
    children: []
  }
];

// サービスのモック
const mockService: CheckListItemService = {
  getCheckListItems: vi.fn(),
  getCheckListItemById: vi.fn(),
  getCheckListItemsHierarchy: vi.fn(),
  createCheckListItem: vi.fn(),
  updateCheckListItem: vi.fn(),
  deleteCheckListItem: vi.fn()
};

// 実際のルート関数をインポート
import { registerCheckListItemRoutes } from '../routes';

describe('CheckListItemRoutes', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.resetAllMocks();
    
    fastify = Fastify();
    
    // ルートの登録 - 直接モックサービスを渡す
    const mockPrisma = {} as any;
    registerCheckListItemRoutes(fastify, mockPrisma, mockService);
    await fastify.ready();
  });

  describe('GET /api/checklist-sets/:id/items', () => {
    it('チェックリスト項目の一覧を取得できること', async () => {
      // モックの設定
      (mockService.getCheckListItems as any).mockResolvedValue({
        checkListItems: mockCheckListItems,
        total: mockCheckListItems.length
      });

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items'
      });

      // 検証
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockCheckListItems,
        meta: {
          page: 1,
          limit: 10,
          total: mockCheckListItems.length
        }
      });
    });

    it('クエリパラメータを正しく処理できること', async () => {
      // モックの設定
      (mockService.getCheckListItems as any).mockResolvedValue({
        checkListItems: [mockCheckListItems[0]],
        total: 1
      });

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items?page=2&limit=5&itemType=simple'
      });

      // 検証
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: [mockCheckListItems[0]],
        meta: {
          page: 2,
          limit: 5,
          total: 1
        }
      });
    });

    it('エラーが発生した場合は500を返すこと', async () => {
      // モックの設定
      (mockService.getCheckListItems as any).mockRejectedValue(new Error('テストエラー'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items'
      });

      // 検証
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目の取得に失敗しました'
      });
    });
  });

  describe('GET /api/checklist-sets/:id/items/hierarchy', () => {
    it('チェックリスト項目の階層構造を取得できること', async () => {
      // モックの設定
      (mockService.getCheckListItemsHierarchy as any).mockResolvedValue(mockHierarchyItems);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items/hierarchy'
      });

      // 検証
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockHierarchyItems
      });
    });

    it('エラーが発生した場合は500を返すこと', async () => {
      // モックの設定
      (mockService.getCheckListItemsHierarchy as any).mockRejectedValue(new Error('テストエラー'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items/hierarchy'
      });

      // 検証
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目の階層構造取得に失敗しました'
      });
    });
  });

  describe('GET /api/checklist-items/:id', () => {
    it('IDによるチェックリスト項目の取得ができること', async () => {
      // モックの設定
      (mockService.getCheckListItemById as any).mockResolvedValue(mockCheckListItems[0]);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-items/01ITEM1234567890ABC'
      });

      // 検証
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockCheckListItems[0]
      });
    });

    it('存在しないIDの場合は404を返すこと', async () => {
      // モックの設定
      (mockService.getCheckListItemById as any).mockResolvedValue(null);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-items/non-existent-id'
      });

      // 検証
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目が見つかりません'
      });
    });

    it('エラーが発生した場合は500を返すこと', async () => {
      // モックの設定
      (mockService.getCheckListItemById as any).mockRejectedValue(new Error('テストエラー'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/checklist-items/01ITEM1234567890ABC'
      });

      // 検証
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目の取得に失敗しました'
      });
    });
  });

  describe('POST /api/checklist-sets/:id/items', () => {
    it('チェックリスト項目を作成できること', async () => {
      // モックの設定
      const createData = {
        name: '新規チェック項目',
        description: '新規作成のテスト用項目',
        itemType: 'simple'
      };
      
      const createdItem = {
        check_id: '01NEWITEM123456789',
        name: createData.name,
        description: createData.description,
        parent_id: null,
        item_type: 'simple',
        is_conclusion: false,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      
      (mockService.createCheckListItem as any).mockResolvedValue(createdItem);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items',
        payload: createData
      });

      // 検証
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: createdItem
      });
    });

    it('バリデーションエラーの場合は400を返すこと', async () => {
      // モックの設定
      (mockService.createCheckListItem as any).mockRejectedValue(new Error('チェックリスト項目名は必須です'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items',
        payload: {
          name: '',
          itemType: 'simple'
        }
      });

      // 検証
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目名は必須です'
      });
    });

    it('エラーが発生した場合は500を返すこと', async () => {
      // モックの設定
      (mockService.createCheckListItem as any).mockRejectedValue(new Error('テストエラー'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/checklist-sets/01B5NHDV91YF9QKH4JBSQFSBGN/items',
        payload: {
          name: '新規チェック項目',
          itemType: 'simple'
        }
      });

      // 検証
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目の作成に失敗しました'
      });
    });
  });

  describe('PUT /api/checklist-items/:id', () => {
    it('チェックリスト項目を更新できること', async () => {
      // モックの設定
      const updateData = {
        name: '更新後のチェック項目',
        description: '更新後の説明'
      };
      
      const updatedItem = {
        check_id: '01ITEM1234567890ABC',
        name: updateData.name,
        description: updateData.description,
        parent_id: null,
        item_type: 'simple',
        is_conclusion: false,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      
      (mockService.updateCheckListItem as any).mockResolvedValue(updatedItem);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/checklist-items/01ITEM1234567890ABC',
        payload: updateData
      });

      // 検証
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: updatedItem
      });
    });

    it('存在しないIDの場合は404を返すこと', async () => {
      // モックの設定
      (mockService.updateCheckListItem as any).mockResolvedValue(null);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/checklist-items/non-existent-id',
        payload: {
          name: '更新後のチェック項目'
        }
      });

      // 検証
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目が見つかりません'
      });
    });

    it('バリデーションエラーの場合は400を返すこと', async () => {
      // モックの設定
      (mockService.updateCheckListItem as any).mockRejectedValue(new Error('チェックリスト項目名は空にできません'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/checklist-items/01ITEM1234567890ABC',
        payload: {
          name: ''
        }
      });

      // 検証
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目名は空にできません'
      });
    });

    it('エラーが発生した場合は500を返すこと', async () => {
      // モックの設定
      (mockService.updateCheckListItem as any).mockRejectedValue(new Error('テストエラー'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/checklist-items/01ITEM1234567890ABC',
        payload: {
          name: '更新後のチェック項目'
        }
      });

      // 検証
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目の更新に失敗しました'
      });
    });
  });

  describe('DELETE /api/checklist-items/:id', () => {
    it('チェックリスト項目を削除できること', async () => {
      // モックの設定
      (mockService.deleteCheckListItem as any).mockResolvedValue(true);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/checklist-items/01ITEM1234567890ABC'
      });

      // 検証
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: { deleted: true }
      });
    });

    it('存在しないIDの場合は404を返すこと', async () => {
      // モックの設定
      (mockService.deleteCheckListItem as any).mockResolvedValue(false);

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/checklist-items/non-existent-id'
      });

      // 検証
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目が見つかりません'
      });
    });

    it('エラーが発生した場合は500を返すこと', async () => {
      // モックの設定
      (mockService.deleteCheckListItem as any).mockRejectedValue(new Error('テストエラー'));

      // テスト対象の実行
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/checklist-items/01ITEM1234567890ABC'
      });

      // 検証
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'チェックリスト項目の削除に失敗しました'
      });
    });
  });
});
