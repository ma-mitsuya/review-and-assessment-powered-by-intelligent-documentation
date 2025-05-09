# スキーマ定義ファイル実装計画

## Checklist機能のスキーマ定義統合

### 新規作成するファイル: `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/schemas.ts`

```typescript
/**
 * チェックリスト機能のスキーマ定義
 */

// チェックリストセット関連のスキーマ
export const getChecklistSetsSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      sortBy: { type: 'string' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            checkListSets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  checkListSetId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  processingStatus: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
                  isEditable: { type: 'boolean' },
                },
              },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  },
};

export const createChecklistSetSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      documents: {
        type: 'array',
        items: {
          type: 'object',
          required: ['documentId', 'filename', 's3Key', 'fileType'],
          properties: {
            documentId: { type: 'string' },
            filename: { type: 'string' },
            s3Key: { type: 'string' },
            fileType: { type: 'string' },
          },
        },
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            checkListSetId: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            processingStatus: { type: 'string' },
            isEditable: { type: 'boolean' },
          },
        },
      },
    },
  },
};

export const updateChecklistSetSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            checkListSetId: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            isEditable: { type: 'boolean' },
          },
        },
      },
    },
  },
};

export const deleteChecklistSetSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean' },
          },
        },
      },
    },
  },
};

// チェックリスト項目関連のスキーマ
export const getChecklistItemsSchema = {
  params: {
    type: 'object',
    required: ['setId'],
    properties: {
      setId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkId: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              parentId: { type: ['string', 'null'] },
              itemType: { type: 'string' },
              isConclusion: { type: 'boolean' },
              flowData: {
                type: ['object', 'null'],
                properties: {
                  conditionType: { type: 'string' },
                  nextIfYes: { type: ['string', 'null'] },
                  nextIfNo: { type: ['string', 'null'] },
                },
              },
              documentId: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
  },
};

export const getChecklistItemHierarchySchema = {
  params: {
    type: 'object',
    required: ['setId'],
    properties: {
      setId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkId: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              parentId: { type: ['string', 'null'] },
              itemType: { type: 'string' },
              isConclusion: { type: 'boolean' },
              flowData: {
                type: ['object', 'null'],
                properties: {
                  conditionType: { type: 'string' },
                  nextIfYes: { type: ['string', 'null'] },
                  nextIfNo: { type: ['string', 'null'] },
                },
              },
              documentId: { type: ['string', 'null'] },
              children: { type: 'array' },
            },
          },
        },
      },
    },
  },
};

export const createChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId'],
    properties: {
      setId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['name', 'itemType'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      parentId: { type: ['string', 'null'] },
      itemType: { type: 'string', enum: ['simple', 'flow'] },
      isConclusion: { type: 'boolean' },
      documentId: { type: ['string', 'null'] },
      flowData: {
        type: 'object',
        properties: {
          conditionType: { type: 'string' },
          nextIfYes: { type: 'string' },
          nextIfNo: { type: 'string' },
        },
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            checkId: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            parentId: { type: ['string', 'null'] },
            itemType: { type: 'string' },
            isConclusion: { type: 'boolean' },
            checkListSetId: { type: 'string' },
            documentId: { type: ['string', 'null'] },
            flowData: {
              type: ['object', 'null'],
              properties: {
                conditionType: { type: 'string' },
                nextIfYes: { type: ['string', 'null'] },
                nextIfNo: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
  },
};

export const updateChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId', 'itemId'],
    properties: {
      setId: { type: 'string' },
      itemId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      isConclusion: { type: 'boolean' },
      documentId: { type: ['string', 'null'] },
      flowData: {
        type: 'object',
        properties: {
          conditionType: { type: 'string' },
          nextIfYes: { type: 'string' },
          nextIfNo: { type: 'string' },
        },
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            checkId: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            parentId: { type: ['string', 'null'] },
            itemType: { type: 'string' },
            isConclusion: { type: 'boolean' },
            checkListSetId: { type: 'string' },
            documentId: { type: ['string', 'null'] },
            flowData: {
              type: ['object', 'null'],
              properties: {
                conditionType: { type: 'string' },
                nextIfYes: { type: ['string', 'null'] },
                nextIfNo: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
  },
};

export const deleteChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId', 'itemId'],
    properties: {
      setId: { type: 'string' },
      itemId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean' },
          },
        },
      },
    },
  },
};
```

## 実装方針

1. 既存のスキーマ定義ファイルから内容を抽出
2. 新しいスキーマ定義ファイルに統合
3. 必要に応じてスキーマを整理・修正
4. 既存のコードから新しいスキーマ定義ファイルを参照するように修正
