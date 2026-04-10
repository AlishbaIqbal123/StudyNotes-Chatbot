import { Router, type IRouter, type Request } from "express";
import { db, quizQuestionsTable, studySessionsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
type AuthRequest = Request & { userId: number };

router.get("/sessions/:id/quiz", requireAuth, async (req, res): Promise<void> => {
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

  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.sessionId, id))
    .orderBy(asc(quizQuestionsTable.order));

  res.json({
    sessionId: id,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })),
  });
});

export default router;
