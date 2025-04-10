/**
 * チェックリストセットリポジトリの統合テスト
 * 実際のデータベースに接続して動作を確認します
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaCheckListSetRepository } from '../repository';

// このテストは実際のデータベースに接続するため、必要に応じてスキップする
// テスト実行時に環境変数 SKIP_INTEGRATION_TESTS=true を設定するとスキップされる
const shouldSkipTests = process.env.SKIP_INTEGRATION_TESTS === 'true';
const testSuite = shouldSkipTests ? describe.skip : describe;

testSuite('PrismaCheckListSetRepository (Integration)', () => {
  let prisma: PrismaClient;
  let repository: PrismaCheckListSetRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    repository = new PrismaCheckListSetRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('チェックリストセットの一覧を取得できること', async () => {
    const result = await repository.getCheckListSets();
    
    // 少なくとも1つのチェックリストセットが存在することを確認
    expect(result.length).toBeGreaterThan(0);
    
    // 各チェックリストセットが正しい形式であることを確認
    result.forEach(set => {
      expect(set).toHaveProperty('check_list_set_id');
      expect(set).toHaveProperty('name');
      expect(set).toHaveProperty('description');
    });
  });

  it('チェックリストセットの総数を取得できること', async () => {
    const count = await repository.countCheckListSets();
    
    // 少なくとも1つのチェックリストセットが存在することを確認
    expect(count).toBeGreaterThan(0);
  });

  it('IDによるチェックリストセットの取得ができること', async () => {
    // まず一覧を取得して最初のIDを使用
    const sets = await repository.getCheckListSets();
    const firstSetId = sets[0].check_list_set_id;
    
    const result = await repository.getCheckListSetById(firstSetId);
    
    // 取得したチェックリストセットが正しいことを確認
    expect(result).not.toBeNull();
    expect(result?.check_list_set_id).toBe(firstSetId);
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('description');
  });

  it('存在しないIDの場合はnullを返すこと', async () => {
    const result = await repository.getCheckListSetById('non-existent-id');
    expect(result).toBeNull();
  });
});
