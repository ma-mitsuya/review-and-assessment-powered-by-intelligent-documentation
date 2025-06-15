import { FastifyRequest, FastifyReply } from "fastify";
import {
  getUserPreference,
  updateLanguage,
  UpdateLanguageRequest,
  getMcpServers,
  updateMcpServers,
  UpdateMcpServersRequest,
} from "../usecase/preference";

export const getUserPreferenceHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const userId = request.user?.sub;

  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: {
        message: "Authentication required",
      },
    });
  }

  try {
    const preference = await getUserPreference({ userId });

    reply.code(200).send({
      success: true,
      data: preference,
    });
  } catch (error) {
    console.error("Error getting user preference:", error);
    reply.code(500).send({
      success: false,
      error: {
        message: "Failed to get user preference",
      },
    });
  }
};

export const getMcpServersHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const userId = request.user?.sub;

  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: {
        message: "Authentication required",
      },
    });
  }

  try {
    const mcpServerConfig = await getMcpServers({ userId });

    reply.code(200).send({
      success: true,
      data: mcpServerConfig,
    });
  } catch (error) {
    console.error("Error getting MCP server configuration:", error);
    reply.code(500).send({
      success: false,
      error: {
        message: "Failed to get MCP server configuration",
      },
    });
  }
};

export const updateMcpServersHandler = async (
  request: FastifyRequest<{ Body: UpdateMcpServersRequest }>,
  reply: FastifyReply
): Promise<void> => {
  const userId = request.user?.sub;

  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: {
        message: "Authentication required",
      },
    });
  }

  try {
    const updatedPreference = await updateMcpServers({
      userId,
      request: request.body,
    });

    reply.code(200).send({
      success: true,
      data: updatedPreference,
    });
  } catch (error) {
    console.error("Error updating MCP server configuration:", error);
    // バリデーションエラーの場合は400を返す
    if (error instanceof Error && error.message) {
      reply.code(400).send({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      reply.code(500).send({
        success: false,
        error: {
          message: "Failed to update MCP server configuration",
        },
      });
    }
  }
};

export const updateLanguageHandler = async (
  request: FastifyRequest<{ Body: UpdateLanguageRequest }>,
  reply: FastifyReply
): Promise<void> => {
  const userId = request.user?.sub;

  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: {
        message: "Authentication required",
      },
    });
  }

  try {
    const updatedPreference = await updateLanguage({
      userId,
      request: request.body,
    });

    reply.code(200).send({
      success: true,
      data: updatedPreference,
    });
  } catch (error) {
    console.error("Error updating language preference:", error);
    reply.code(500).send({
      success: false,
      error: {
        message: "Failed to update language preference",
      },
    });
  }
};
