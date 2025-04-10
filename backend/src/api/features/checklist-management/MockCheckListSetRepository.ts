/**
 * チェックリストセットリポジトリのモック実装
 */

import { ulid } from 'ulid';
import { CheckListSet, CreateCheckListSetRequest, GetCheckListSetsParams, UpdateCheckListSetRequest } from './types';
import { CheckListSetRepository } from './repository';

/**
 * モック実装のチェックリストセットリポジトリ
 */
export class MockCheckListSetRepository implements CheckListSetRepository {
  private mockData: CheckListSet[] = [
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

  async getCheckListSets(params?: GetCheckListSetsParams): Promise<CheckListSet[]> {
    // ページネーション処理
    if (params?.page && params?.limit) {
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      return this.mockData.slice(start, end);
    }
    return this.mockData;
  }

  async countCheckListSets(): Promise<number> {
    return this.mockData.length;
  }

  async getCheckListSetById(id: string): Promise<CheckListSet | null> {
    return this.mockData.find(set => set.check_list_set_id === id) || null;
  }
  
  async createCheckListSet(data: CreateCheckListSetRequest): Promise<CheckListSet> {
    const newSet: CheckListSet = {
      check_list_set_id: ulid(),
      name: data.name,
      description: data.description || ''
    };
    
    this.mockData.push(newSet);
    return newSet;
  }
  
  async updateCheckListSet(id: string, data: UpdateCheckListSetRequest): Promise<CheckListSet | null> {
    const index = this.mockData.findIndex(set => set.check_list_set_id === id);
    
    if (index === -1) return null;
    
    const updatedSet = {
      ...this.mockData[index],
      name: data.name !== undefined ? data.name : this.mockData[index].name,
      description: data.description !== undefined ? data.description : this.mockData[index].description
    };
    
    this.mockData[index] = updatedSet;
    return updatedSet;
  }
  
  async deleteCheckListSet(id: string): Promise<boolean> {
    const index = this.mockData.findIndex(set => set.check_list_set_id === id);
    
    if (index === -1) return false;
    
    this.mockData.splice(index, 1);
    return true;
  }
}
