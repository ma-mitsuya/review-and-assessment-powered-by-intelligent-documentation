export const getChecklistItemSchema = {
  params: {
    type: "object",
    required: ["setId", "itemId"],
    properties: {
      setId: { type: "string" },
      itemId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            checkId: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            parentId: { type: ["string", "null"] },
            itemType: { type: "string", enum: ["simple", "flow"] },
            isConclusion: { type: "boolean" },
            flowData: {
              type: ["object", "null"],
              properties: {
                conditionType: { type: "string" },
                nextIfYes: { type: ["string", "null"] },
                nextIfNo: { type: ["string", "null"] },
              },
            },
            checkListSetId: { type: "string" },
            documentId: { type: ["string", "null"] },
            document: {
              type: ["object", "null"],
              properties: {
                documentId: { type: "string" },
                filename: { type: "string" },
                s3Path: { type: "string" },
                fileType: { type: "string" },
                uploadDate: { type: "string", format: "date-time" },
                status: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

export const getChecklistItemHierarchySchema = {
  params: {
    type: "object",
    required: ["setId"],
    properties: {
      setId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              checkId: { type: "string" },
              name: { type: "string" },
              description: { type: ["string", "null"] },
              parentId: { type: ["string", "null"] },
              itemType: { type: "string", enum: ["simple", "flow"] },
              isConclusion: { type: "boolean" },
              flowData: {
                type: ["object", "null"],
                properties: {
                  conditionType: { type: "string" },
                  nextIfYes: { type: ["string", "null"] },
                  nextIfNo: { type: ["string", "null"] },
                },
              },
              checkListSetId: { type: "string" },
              documentId: { type: ["string", "null"] },
              children: { type: "array" },
            },
          },
        },
      },
    },
  },
};

export const createChecklistItemSchema = {
  params: {
    type: "object",
    required: ["setId"],
    properties: {
      setId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["name", "itemType"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
      parentId: { type: ["string", "null"] },
      itemType: { type: "string", enum: ["simple", "flow"] },
      isConclusion: { type: "boolean", default: false },
      flowData: {
        type: "object",
        properties: {
          conditionType: { type: "string" },
          nextIfYes: { type: "string" },
          nextIfNo: { type: "string" },
        },
      },
      documentId: { type: ["string", "null"] },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            checkId: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            parentId: { type: ["string", "null"] },
            itemType: { type: "string", enum: ["simple", "flow"] },
            isConclusion: { type: "boolean" },
            flowData: { type: ["object", "null"] },
            checkListSetId: { type: "string" },
            documentId: { type: ["string", "null"] },
          },
        },
      },
    },
  },
};

export const updateChecklistItemSchema = {
  params: {
    type: "object",
    required: ["setId", "itemId"],
    properties: {
      setId: { type: "string" },
      itemId: { type: "string" },
    },
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
      isConclusion: { type: "boolean" },
      flowData: {
        type: "object",
        properties: {
          conditionType: { type: "string" },
          nextIfYes: { type: "string" },
          nextIfNo: { type: "string" },
        },
      },
      documentId: { type: ["string", "null"] },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            checkId: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            parentId: { type: ["string", "null"] },
            itemType: { type: "string", enum: ["simple", "flow"] },
            isConclusion: { type: "boolean" },
            flowData: { type: ["object", "null"] },
            checkListSetId: { type: "string" },
            documentId: { type: ["string", "null"] },
          },
        },
      },
    },
  },
};

export const deleteChecklistItemSchema = {
  params: {
    type: "object",
    required: ["setId", "itemId"],
    properties: {
      setId: { type: "string" },
      itemId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            deleted: { type: "boolean" },
          },
        },
      },
    },
  },
};

export const createChecklistSetSchema = {
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
      documents: {
        type: "array",
        items: {
          type: "object",
          required: ["documentId", "filename", "s3Key", "fileType"],
          properties: {
            documentId: { type: "string" },
            filename: { type: "string" },
            s3Key: { type: "string" },
            fileType: { type: "string" },
          },
        },
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            checkListSetId: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            processingStatus: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
            },
          },
        },
      },
    },
  },
};

export const getChecklistSetsSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
      sortBy: { type: "string" },
      sortOrder: { type: "string", enum: ["asc", "desc"] },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            checkListSets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  checkListSetId: { type: "string" },
                  name: { type: "string" },
                  description: { type: ["string", "null"] },
                  processingStatus: {
                    type: "string",
                    enum: ["pending", "in_progress", "completed"],
                  },
                  isEditable: { type: "boolean" },
                },
              },
            },
            total: { type: "integer" },
          },
        },
      },
    },
  },
};

export const deleteChecklistSetSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            deleted: { type: "boolean" },
          },
        },
      },
    },
  },
};
