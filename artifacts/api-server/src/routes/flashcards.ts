import { Router, type IRouter, type Request } from "express";
import { db, flashcardsTable, studySessionsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
type AuthRequest = Request & { userId: number };

router.get("/sessions/:id/flashcards", requireAuth, async (req, res): Promise<void> => {
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

  const cards = await db
    .select()
    .from(flashcardsTable)
    .where(eq(flashcardsTable.sessionId, id))
    .orderBy(asc(flashcardsTable.order));

  res.json(cards);
});

export default router;
