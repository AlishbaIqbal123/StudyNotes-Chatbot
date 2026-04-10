import { Router, type IRouter, type Request } from "express";
import { db, studySessionsTable, notesTable, quizQuestionsTable, flashcardsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { CreateSessionBody, GetSessionParams, DeleteSessionParams, GenerateContentParams } from "@workspace/api-zod";
import { generateAIContent } from "../lib/ai";

const router: IRouter = Router();

type AuthRequest = Request & { userId: number };

router.get("/sessions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.userId, userId))
    .orderBy(desc(studySessionsTable.createdAt));
  res.json(sessions);
});

router.post("/sessions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, inputType, inputContent, subject, tags } = parsed.data;
  const [session] = await db
    .insert(studySessionsTable)
    .values({
      userId,
      title,
      inputType,
      inputContent,
      subject: subject ?? null,
      tags: tags ?? [],
      status: "pending",
      isSaved: false,
    })
    .returning();

  res.status(201).json(session);
});

router.get("/sessions/:id", requireAuth, async (req, res): Promise<void> => {
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

  res.json(session);
});

router.delete("/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [session] = await db
    .delete(studySessionsTable)
    .where(and(eq(studySessionsTable.id, id), eq(studySessionsTable.userId, userId)))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/sessions/:id/generate", requireAuth, async (req, res): Promise<void> => {
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

  await db
    .update(studySessionsTable)
    .set({ status: "processing" })
    .where(eq(studySessionsTable.id, id));

  try {
    const { notes, quiz, flashcards } = await generateAIContent(
      session.inputContent,
      session.title
    );

    const existingNotes = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.sessionId, id));

    if (existingNotes.length === 0) {
      await db.insert(notesTable).values({
        sessionId: id,
        summary: notes.summary,
        detailedContent: notes.detailedContent,
        keyPoints: notes.keyPoints,
        studyTips: notes.studyTips,
      });
    }

    await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.sessionId, id));
    for (let i = 0; i < quiz.length; i++) {
      await db.insert(quizQuestionsTable).values({
        sessionId: id,
        question: quiz[i].question,
        options: quiz[i].options,
        correctIndex: quiz[i].correctIndex,
        explanation: quiz[i].explanation,
        order: i,
      });
    }

    await db.delete(flashcardsTable).where(eq(flashcardsTable.sessionId, id));
    for (let i = 0; i < flashcards.length; i++) {
      await db.insert(flashcardsTable).values({
        sessionId: id,
        front: flashcards[i].front,
        back: flashcards[i].back,
        order: i,
      });
    }

    const [updatedSession] = await db
      .update(studySessionsTable)
      .set({ status: "ready" })
      .where(eq(studySessionsTable.id, id))
      .returning();

    res.json(updatedSession);
  } catch (err) {
    await db
      .update(studySessionsTable)
      .set({ status: "error" })
      .where(eq(studySessionsTable.id, id));
    res.status(500).json({ error: "Failed to generate content" });
  }
});

export default router;
