import { Router, type Request, type Response } from "express";
import {
  createConversationBodySchema,
  conversationIdParamSchema,
  listConversationsQuerySchema,
  createMessageBodySchema,
  listMessagesQuerySchema,
} from "../validation/schemas.js";
import { validateBody, validateParams, validateQuery, sendValidationError } from "../validation/validate.js";
import {
  listConversations,
  createConversation,
  getConversationById,
  markConversationRead,
} from "../conversations/conversationService.js";
import { listMessages, sendMessage } from "../conversations/messageService.js";

export function createConversationsRouter(): Router {
  const router = Router();

  /** GET /conversations — list conversations for the current user. */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
      return;
    }
    const validation = validateQuery(listConversationsQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const limit = validation.data.limit ?? 20;
    const offset = validation.data.offset ?? 0;
    try {
      const result = await listConversations(userId, limit, offset);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list conversations" } });
    }
  });

  /** POST /conversations — create a conversation (current user + participantUserIds). */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
      return;
    }
    const validation = validateBody(createConversationBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const conversation = await createConversation(userId, validation.data.participantUserIds);
      res.status(201).json(conversation);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create conversation";
      res.status(400).json({ error: { code: "CONVERSATION_ERROR", message } });
    }
  });

  /** GET /conversations/:conversationId — get one conversation (with unread count). */
  router.get("/:conversationId", async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
      return;
    }
    const paramValidation = validateParams(conversationIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const conversation = await getConversationById(paramValidation.data.conversationId, userId);
    if (!conversation) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } });
      return;
    }
    res.json(conversation);
  });

  /** POST /conversations/:conversationId/read — mark as read (optional, for unread tracking). */
  router.post("/:conversationId/read", async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
      return;
    }
    const paramValidation = validateParams(conversationIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    try {
      await markConversationRead(paramValidation.data.conversationId, userId);
      res.status(204).send();
    } catch {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } });
    }
  });

  /** GET /conversations/:conversationId/messages — list messages (paginated). */
  router.get("/:conversationId/messages", async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
      return;
    }
    const paramValidation = validateParams(conversationIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const queryValidation = validateQuery(listMessagesQuerySchema, req.query);
    if (!queryValidation.success) {
      sendValidationError(res, queryValidation.errors);
      return;
    }
    const limit = queryValidation.data.limit ?? 50;
    const before = queryValidation.data.before;
    const result = await listMessages(
      paramValidation.data.conversationId,
      userId,
      limit,
      before
    );
    if (!result) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } });
      return;
    }
    res.json(result);
  });

  /** POST /conversations/:conversationId/messages — send a message (optional attachments). */
  router.post("/:conversationId/messages", async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
      return;
    }
    const paramValidation = validateParams(conversationIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const bodyValidation = validateBody(createMessageBodySchema, req.body);
    if (!bodyValidation.success) {
      sendValidationError(res, bodyValidation.errors);
      return;
    }
    const message = await sendMessage(
      paramValidation.data.conversationId,
      userId,
      bodyValidation.data
    );
    if (!message) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } });
      return;
    }
    res.status(201).json(message);
  });

  return router;
}
