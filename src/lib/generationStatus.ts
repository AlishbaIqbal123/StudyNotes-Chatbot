export type SectionKey =
  | 'notes'
  | 'exam_cram'
  | 'presentation'
  | 'quiz'
  | 'flashcards'
  | 'roadmap'
  | 'mind_map'
  | 'podcast';

export type SectionState = 'complete' | 'missing' | 'failed' | 'quota_exceeded' | 'skipped';

export type GenerationOverall = 'completed' | 'partial' | 'quota_exceeded' | 'failed';

export interface SectionStatusEntry {
  status: SectionState;
  label: string;
  message?: string;
  regenerateType?: string;
}

export interface GenerationStatusReport {
  overall: GenerationOverall;
  completedCount: number;
  totalRequested: number;
  quotaExceeded: boolean;
  sections: Record<SectionKey, SectionStatusEntry>;
  summary: string;
}

export const SECTION_META: Record<
  SectionKey,
  { label: string; regenerateType: string; tab?: string }
> = {
  notes: { label: 'Detailed Notes', regenerateType: 'notes', tab: 'notes' },
  exam_cram: { label: 'Exam Cram Sheet', regenerateType: 'exam_cram', tab: 'exam_cram' },
  presentation: { label: 'Presentation Outline', regenerateType: 'presentation', tab: 'presentation' },
  quiz: { label: 'Knowledge Quiz', regenerateType: 'quiz', tab: 'quiz' },
  flashcards: { label: 'Flashcard Deck', regenerateType: 'flashcards', tab: 'flashcards' },
  roadmap: { label: 'Study Roadmap', regenerateType: 'diagrams', tab: 'roadmap' },
  mind_map: { label: 'Concept Mind Map', regenerateType: 'diagrams', tab: 'mindmap' },
  podcast: { label: 'Audio Lab Script', regenerateType: 'podcast', tab: 'podcast' },
};

const FAILED_SNIPPETS = ['Notes generation failed', 'Generation failed', 'Please try again'];

function isFailedPlaceholder(text?: string): boolean {
  if (!text?.trim()) return false;
  return FAILED_SNIPPETS.some((s) => text.includes(s));
}

function hasSectionContent(key: SectionKey, note: Record<string, unknown>): boolean {
  switch (key) {
    case 'notes': {
      const t = String(note.simplified_notes || note.simplified_content || '');
      return t.trim().length > 80 && !isFailedPlaceholder(t);
    }
    case 'exam_cram':
      return Boolean(String(note.exam_cram_notes || '').trim()) && !isFailedPlaceholder(String(note.exam_cram_notes));
    case 'presentation':
      return Boolean(String(note.presentation_notes || '').trim()) && !isFailedPlaceholder(String(note.presentation_notes));
    case 'quiz':
      return Array.isArray(note.quizzes) && note.quizzes.length > 0;
    case 'flashcards':
      return Array.isArray(note.flashcards) && note.flashcards.length > 0;
    case 'roadmap':
      return Boolean(String(note.roadmap || '').trim());
    case 'mind_map':
      return Boolean(String(note.mind_map || '').trim());
    case 'podcast':
      return Boolean(String(note.podcast_script || '').trim());
    default:
      return false;
  }
}

export function inferGenerationStatus(
  note: Record<string, unknown>,
  stored?: GenerationStatusReport | null
): GenerationStatusReport {
  if (stored?.sections) return stored;

  const sections = {} as Record<SectionKey, SectionStatusEntry>;
  let completed = 0;
  const keys = Object.keys(SECTION_META) as SectionKey[];

  for (const key of keys) {
    const meta = SECTION_META[key];
    if (hasSectionContent(key, note)) {
      sections[key] = { status: 'complete', label: meta.label, regenerateType: meta.regenerateType };
      completed++;
    } else {
      sections[key] = { status: 'missing', label: meta.label, regenerateType: meta.regenerateType };
    }
  }

  const total = keys.length;
  const overall: GenerationOverall =
    completed === total ? 'completed' : completed === 0 ? 'failed' : 'partial';

  return {
    overall,
    completedCount: completed,
    totalRequested: total,
    quotaExceeded: note.status === 'partial' || isFailedPlaceholder(String(note.simplified_notes)),
    sections,
    summary: buildSummary(completed, total, overall),
  };
}

export function parseGenerationStatusFromResponse(
  data: Record<string, unknown>
): GenerationStatusReport | null {
  const raw = data.generation_status as GenerationStatusReport | undefined;
  if (raw?.sections) return raw;
  return null;
}

export function buildSummary(
  completed: number,
  total: number,
  overall: GenerationOverall,
  quotaExceeded = false
): string {
  if (overall === 'completed') {
    return `All ${total} study sections generated successfully.`;
  }
  if (quotaExceeded) {
    return `${completed} of ${total} sections ready — generation credits ran out before the rest could finish.`;
  }
  if (overall === 'partial') {
    return `${completed} of ${total} sections generated. Missing sections can be regenerated separately.`;
  }
  return 'Generation did not complete. Please retry when credits reset.';
}

export function getIncompleteSections(report: GenerationStatusReport): SectionKey[] {
  return (Object.entries(report.sections) as [SectionKey, SectionStatusEntry][])
    .filter(([, v]) => v.status !== 'complete' && v.status !== 'skipped')
    .map(([k]) => k);
}

export function markQuotaLimitReached(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lumina_rate_limit_ts', String(Date.now() + 3600000));
}

export function isQuotaCooldownActive(): boolean {
  if (typeof window === 'undefined') return false;
  const expiry = parseInt(localStorage.getItem('lumina_rate_limit_ts') || '0', 10);
  return expiry > Date.now();
}
