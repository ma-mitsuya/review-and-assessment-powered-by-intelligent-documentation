/**
 * チェックリストセットハンドラーのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { createChecklistSetHandler } from '../handlers/checklist-set-handlers';
import { ChecklistSetService } from '../services/checklist-set-service';

// サービスのモック
vi.mock('../services/checklist-set-service', () => {
  return {
    ChecklistSetService: vi.fn().mockImplementation(() => ({
      createChecklistSet: vi.fn().mockImplementation((params) => {
        return Promise.resolve({
          id: 'MOCK_ID',
          name: params.name,
          description: params.description
        });
      })
    }))
  };
});

describe('ChecklistSetHandlers', () => {
  describe('createChecklistSetHandler', () => {
    it('正常にチェックリストセットを作成してレスポンスを返すこと', async () => {
      // モックリクエストとレスポンス
      const request = {
        body: {
          name: 'テストチェックリスト',
          description: 'テスト用の説明',
          documentIds: ['DOC1', 'DOC2']
        },
        log: {
          error: vi.fn()
        }
      } as any;
      
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn()
      } as any;
      
      // ハンドラーの実行
      await createChecklistSetHandler(request, reply);
      
      // 正しいステータスコードが設定されたか確認
      expect(reply.code).toHaveBeenCalledWith(200);
      
      // 正しいレスポンスが送信されたか確認
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          check_list_set_id: 'MOCK_ID',
          name: 'テストチェックリスト',
          description: 'テスト用の説明',
          processing_status: 'pending'
        }
      });
    });
    
    it('エラー発生時に適切なエラーレスポンスを返すこと', async () => {
      // サービスのモックをエラーを投げるように上書き
      const mockService = {
        createChecklistSet: vi.fn().mockRejectedValue(new Error('テストエラー'))
      };
      vi.mocked(ChecklistSetService).mockImplementation(() => mockService as any);
      
      // モックリクエストとレスポンス
      const request = {
        body: {
          name: 'テストチェックリスト'
        },
        log: {
          error: vi.fn()
        }
      } as any;
      
      const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn()
      } as any;
      
      // ハンドラーの実行
      await createChecklistSetHandler(request, reply);
      
      // エラーログが記録されたか確認
      expect(request.log.error).toHaveBeenCalled();
      
      // 正しいステータスコードが設定されたか確認
      expect(reply.code).toHaveBeenCalledWith(500);
      
      // 正しいエラーレスポンスが送信されたか確認
      expect(reply.send).toHaveBeenCalledWith({
        success: false,
        error: 'チェックリストセットの作成に失敗しました'
      });
    });
  });
});
