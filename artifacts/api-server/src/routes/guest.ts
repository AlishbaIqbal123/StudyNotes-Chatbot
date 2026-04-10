import { Router, type IRouter } from "express";
import { db, studySessionsTable, notesTable, quizQuestionsTable, flashcardsTable, chatMessagesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { generateAIContent, generateChatResponse } from "../lib/ai";

const router: IRouter = Router();

const GUEST_USER_ID = 0;

router.post("/guest/sessions", async (req, res): Promise<void> => {
  const { title, inputType, inputContent, subject } = req.body;
  if (!title || !inputType || !inputContent) {
    res.status(400).json({ error: "title, inputType, and inputContent are required" });
    return;
  }
  const [session] = await db.insert(studySessionsTable).values({
    userId: GUEST_USER_ID,
    title,
    inputType,
    inputContent,
    subject: subject ?? null,
    tags: [],
    status: "pending",
    isSaved: false,
  }).returning();
  res.status(201).json(session);
});

router.post("/guest/sessions/:id/generate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) {
    res.status(404).json({ error: "Guest session not found" });
    return;
  }
  await db.update(studySessionsTable).set({ status: "processing" }).where(eq(studySessionsTable.id, id));
  try {
    const { notes, quiz, flashcards } = await generateAIContent(session.inputContent, session.title);
    const existing = await db.select().from(notesTable).where(eq(notesTable.sessionId, id));
    if (existing.length === 0) {
      await db.insert(notesTable).values({ sessionId: id, summary: notes.summary, detailedContent: notes.detailedContent, keyPoints: notes.keyPoints, studyTips: notes.studyTips });
    }
    await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.sessionId, id));
    for (let i = 0; i < quiz.length; i++) {
      await db.insert(quizQuestionsTable).values({ sessionId: id, question: quiz[i].question, options: quiz[i].options, correctIndex: quiz[i].correctIndex, explanation: quiz[i].explanation, order: i });
    }
    await db.delete(flashcardsTable).where(eq(flashcardsTable.sessionId, id));
    for (let i = 0; i < flashcards.length; i++) {
      await db.insert(flashcardsTable).values({ sessionId: id, front: flashcards[i].front, back: flashcards[i].back, order: i });
    }
    const [updated] = await db.update(studySessionsTable).set({ status: "ready" }).where(eq(studySessionsTable.id, id)).returning();
    res.json(updated);
  } catch {
    await db.update(studySessionsTable).set({ status: "error" }).where(eq(studySessionsTable.id, id));
    res.status(500).json({ error: "Failed to generate content" });
  }
});

router.get("/guest/sessions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(session);
});

router.get("/guest/sessions/:id/notes", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  const [notes] = await db.select().from(notesTable).where(eq(notesTable.sessionId, id));
  if (!notes) { res.status(404).json({ error: "Notes not ready" }); return; }
  res.json({ sessionId: notes.sessionId, summary: notes.summary, detailedContent: notes.detailedContent, keyPoints: notes.keyPoints, studyTips: notes.studyTips });
});

router.get("/guest/sessions/:id/quiz", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.sessionId, id)).orderBy(asc(quizQuestionsTable.order));
  res.json({ sessionId: id, questions: questions.map(q => ({ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })) });
});

router.get("/guest/sessions/:id/flashcards", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.sessionId, id)).orderBy(asc(flashcardsTable.order));
  res.json(cards);
});

router.post("/guest/sessions/:id/chat", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  const { message } = req.body;
  if (!message) { res.status(400).json({ error: "message is required" }); return; }
  const [userMsg] = await db.insert(chatMessagesTable).values({ sessionId: id, role: "user", content: message }).returning();
  const [notes] = await db.select().from(notesTable).where(eq(notesTable.sessionId, id));
  const notesContext = notes ? `${notes.summary}\n${notes.keyPoints.join("\n")}` : session.inputContent.slice(0, 500);
  const history = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.sessionId, id)).orderBy(asc(chatMessagesTable.createdAt));
  const aiReply = await generateChatResponse(message, notesContext, history.map(m => ({ role: m.role, content: m.content })));
  const [assistantMsg] = await db.insert(chatMessagesTable).values({ sessionId: id, role: "assistant", content: aiReply }).returning();
  res.json({ message: assistantMsg });
});

router.get("/guest/sessions/:id/chat/history", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [session] = await db.select().from(studySessionsTable).where(
    and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, GUEST_USER_ID))
  );
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  const messages = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.sessionId, id)).orderBy(asc(chatMessagesTable.createdAt));
  res.json(messages);
});

export default router;
