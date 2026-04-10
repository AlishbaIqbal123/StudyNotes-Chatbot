import { Router, type IRouter, type Request } from "express";
import { db, chatMessagesTable, notesTable, studySessionsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { SendChatMessageBody } from "@workspace/api-zod";
import { generateChatResponse } from "../lib/ai";

const router: IRouter = Router();
type AuthRequest = Request & { userId: number };

router.post("/sessions/:id/chat", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [session] = await db
    .select()
    .from(studySessionsTable)
    .where(and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, userId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [userMsg] = await db
    .insert(chatMessagesTable)
    .values({ sessionId: id, role: "user", content: parsed.data.message })
    .returning();

  const [notes] = await db.select().from(notesTable).where(eq(notesTable.sessionId, id));
  const notesContext = notes
    ? `${notes.summary}\n${notes.keyPoints.join("\n")}`
    : session.inputContent.slice(0, 500);

  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, id))
    .orderBy(asc(chatMessagesTable.createdAt));

  const chatHistory = history.map((m) => ({ role: m.role, content: m.content }));
  const aiReply = await generateChatResponse(parsed.data.message, notesContext, chatHistory);

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ sessionId: id, role: "assistant", content: aiReply })
    .returning();

  res.json({ message: assistantMsg });
});

router.get("/sessions/:id/chat/history", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [session] = await db
    .select()
    .from(studySessionsTable)
    .where(and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, userId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, id))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(messages);
});

export default router;
