import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notesTable = pgTable("notes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().unique(),
  summary: text("summary").notNull(),
  detailedContent: text("detailed_content").notNull(),
  keyPoints: text("key_points").array().notNull().default([]),
  studyTips: text("study_tips").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNotesSchema = createInsertSchema(notesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotes = z.infer<typeof insertNotesSchema>;
export type Notes = typeof notesTable.$inferSelect;
