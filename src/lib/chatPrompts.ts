// Contextual prompts for Lumina chat — exam, interview, diagrams, selections

export type LuminaPromptIntent =
  | 'explain'
  | 'exam'
  | 'interview'
  | 'example'
  | 'quiz'
  | 'compare'
  | 'diagram'
  | 'fix_diagram';

export type PromptSource =
  | 'selection'
  | 'term'
  | 'diagram'
  | 'table'
  | 'roadmap'
  | 'mindmap';

export interface PromptContext {
  term: string;
  excerpt?: string;
  noteTitle?: string;
  source?: PromptSource;
  diagramChart?: string;
}

const SOURCE_LABEL: Record<PromptSource, string> = {
  selection: 'highlighted passage',
  term: 'key term in the notes',
  diagram: 'diagram node',
  table: 'table in the notes',
  roadmap: 'study roadmap node',
  mindmap: 'concept map node',
};

function excerptBlock(ctx: PromptContext): string {
  if (!ctx.excerpt?.trim()) return '';
  return `\n\n**Passage from my notes:**\n> ${ctx.excerpt.trim().slice(0, 1200)}\n`;
}

function header(ctx: PromptContext): string {
  const title = ctx.noteTitle ? `Topic: "${ctx.noteTitle}"` : '';
  const src = ctx.source ? SOURCE_LABEL[ctx.source] : 'notes';
  return [title, `Focus: **${ctx.term}** (from ${src})`].filter(Boolean).join('\n');
}

export function buildContextualPrompt(
  intent: LuminaPromptIntent,
  ctx: PromptContext
): string {
  const h = header(ctx);
  const ex = excerptBlock(ctx);

  switch (intent) {
    case 'explain':
      return `${h}${ex}

I'm studying this material. Explain **"${ctx.term}"** as if you're my tutor:
1. **One-sentence definition** (plain English)
2. **Why it matters** in this subject
3. **Step-by-step** how it works
4. **Common mistake** students make
5. **Memory hook** (analogy or mnemonic)

Use short paragraphs and bullet points. Stay faithful to my notes — don't invent facts.`;

    case 'exam':
      return `${h}${ex}

**I have an exam soon.** For **"${ctx.term}"** (and the passage above if relevant), give me:
1. **Must-know facts** (5 bullets max — exam-ready)
2. **Likely exam question** + a model answer I can say in 60 seconds
3. **Trick question** they might ask and how to avoid the trap
4. **Quick mnemonic** to recall under pressure

Be concise. No fluff.`;

    case 'interview':
      return `${h}${ex}

Explain **"${ctx.term}"** at **interview / professional depth**:
1. **Elevator pitch** (30 seconds)
2. **Technical depth** — tradeoffs, when to use vs avoid
3. **Real-world scenario** where this shows up
4. **Follow-up question** an interviewer might ask + strong answer
5. **One "senior engineer" insight** most juniors miss

Use clear structure. Markdown bullets welcome.`;

    case 'example':
      return `${h}${ex}

Give me **concrete examples** for **"${ctx.term}"**:
1. **Simple example** (beginner)
2. **Real-world example** (industry or daily life)
3. **Worked mini-example** if math/code applies (keep it under 15 lines)
4. **Contrast**: what it is NOT (to avoid confusion)

Tie examples to my notes when possible.${ex}`;

    case 'quiz':
      return `${h}${ex}

Quiz me on **"${ctx.term}"**:
1. Ask **one** challenging multiple-choice question (4 options, mark correct letter)
2. Wait for my thinking — then explain why the answer is right and why others are wrong
3. Give **one** short follow-up question to deepen understanding

Start with the MCQ only in your first response.`;

    case 'compare':
      return `${h}${ex}

Help me **compare and contrast** concepts related to **"${ctx.term}"** from my notes:
1. Build a **comparison table** (3–5 rows) vs the closest related concept
2. **When to use A vs B**
3. **Exam tip**: one sentence on what professors usually test

Use a markdown table.`;

    case 'diagram':
      return `${h}${ex}

I clicked **"${ctx.term}"** on a ${ctx.source === 'mindmap' ? 'concept map' : ctx.source === 'roadmap' ? 'study roadmap' : 'diagram'}.

Explain this node in context:
1. **What this node means** in the bigger picture
2. **Prerequisites** I should know first
3. **Connections** to neighboring ideas (upstream → downstream)
4. **Exam / interview angle** in 2–3 sentences
5. **One practice question** to test myself

${ctx.diagramChart ? `\n*(Diagram context available in my notes.)*` : ''}`;

    case 'fix_diagram':
      return `The following Mermaid diagram failed to render. Please:
1. Output a **corrected** Mermaid block (safe syntax: quoted labels, no reserved word "end" as classDef)
2. Briefly explain what the diagram shows

**Broken diagram source:**
\`\`\`mermaid
${(ctx.diagramChart || ctx.term).slice(0, 2000)}
\`\`\``;

    default:
      return `Explain "${ctx.term}" clearly based on my study notes.${ex}`;
  }
}

export const POPOVER_ACTIONS: {
  intent: LuminaPromptIntent;
  label: string;
  short: string;
}[] = [
  { intent: 'explain', label: 'Explain simply', short: '💡' },
  { intent: 'exam', label: 'Exam cram', short: '📝' },
  { intent: 'interview', label: 'Interview depth', short: '🎯' },
  { intent: 'example', label: 'Examples', short: '🌍' },
  { intent: 'quiz', label: 'Quiz me', short: '❓' },
];

export const CHAT_SUGGESTED_PILLS = [
  { label: '📝 Exam cram sheet', intent: 'exam' as const, term: 'this entire topic' },
  { label: '🎯 Interview prep', intent: 'interview' as const, term: 'core concepts' },
  { label: '💡 ELI5 summary', intent: 'explain' as const, term: 'main ideas' },
];
