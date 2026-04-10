import { Router, type IRouter, type Request } from "express";
import { db, studySessionsTable, flashcardsTable, quizQuestionsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
type AuthRequest = Request & { userId: number };

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.userId, userId));

  const sessionIds = sessions.map((s) => s.id);

  let totalFlashcards = 0;
  let totalQuizQuestions = 0;

  if (sessionIds.length > 0) {
    for (const sid of sessionIds) {
      const cards = await db
        .select()
        .from(flashcardsTable)
        .where(eq(flashcardsTable.sessionId, sid));
      totalFlashcards += cards.length;

      const questions = await db
        .select()
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.sessionId, sid));
      totalQuizQuestions += questions.length > 0 ? 1 : 0;
    }
  }

  const statusCounts = { pending: 0, processing: 0, ready: 0, error: 0 };
  let savedSessions = 0;
  for (const s of sessions) {
    if (s.status === "pending") statusCounts.pending++;
    else if (s.status === "processing") statusCounts.processing++;
    else if (s.status === "ready") statusCounts.ready++;
    else if (s.status === "error") statusCounts.error++;
    if (s.isSaved) savedSessions++;
  }

  res.json({
    totalSessions: sessions.length,
    totalFlashcards,
    totalQuizzes: totalQuizQuestions,
    savedSessions,
    sessionsByStatus: statusCounts,
  });
});

router.get("/dashboard/recent", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.userId, userId))
    .orderBy(desc(studySessionsTable.createdAt))
    .limit(6);

  res.json(sessions);
});

export default router;
