import { Router, type IRouter, type Request } from "express";
import { db, notesTable, studySessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
type AuthRequest = Request & { userId: number };

router.get("/sessions/:id/notes", requireAuth, async (req, res): Promise<void> => {
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

  const [notes] = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.sessionId, id));

  if (!notes) {
    res.status(404).json({ error: "Notes not generated yet" });
    return;
  }

  res.json({
    sessionId: notes.sessionId,
    summary: notes.summary,
    detailedContent: notes.detailedContent,
    keyPoints: notes.keyPoints,
    studyTips: notes.studyTips,
  });
});

export default router;
