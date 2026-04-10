import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import sessionsRouter from "./sessions";
import notesRouter from "./notes";
import quizRouter from "./quiz";
import flashcardsRouter from "./flashcards";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(sessionsRouter);
router.use(notesRouter);
router.use(quizRouter);
router.use(flashcardsRouter);
router.use(chatRouter);
router.use(dashboardRouter);

export default router;
