import { logger } from "./logger";

interface NotesResult {
  summary: string;
  detailedContent: string;
  keyPoints: string[];
  studyTips: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface FlashcardResult {
  front: string;
  back: string;
}

function generateNotes(content: string, title: string): NotesResult {
  const words = content.split(/\s+/).slice(0, 50).join(" ");
  return {
    summary: `This study material covers "${title}". ${words}... The content provides a comprehensive overview of the subject matter with key concepts and principles clearly explained for easy understanding.`,
    detailedContent: `# ${title}\n\n## Overview\n\n${content.slice(0, 800)}\n\n## Key Concepts\n\nThis material introduces fundamental ideas that form the foundation of understanding. Each concept builds on the previous one, creating a logical progression of knowledge.\n\n### Core Principles\n\n- **Principle 1**: Understanding the fundamentals is essential before moving to advanced topics\n- **Principle 2**: Practice and repetition strengthen long-term memory retention\n- **Principle 3**: Connecting new information to existing knowledge improves comprehension\n\n## Summary\n\nThe material covered here provides a solid foundation for further study. Regular review and application of these concepts will lead to mastery of the subject.`,
    keyPoints: [
      `"${title}" introduces core concepts for students to master`,
      "Understanding the fundamentals is critical before advancing",
      "Active recall through quizzes and flashcards improves retention",
      "Connecting concepts to real-world examples aids comprehension",
      "Regular study sessions of 25-30 minutes optimize learning",
    ],
    studyTips: [
      "Use the Pomodoro technique: 25 minutes of focused study, then a 5-minute break",
      "Review flashcards daily to reinforce key terms and definitions",
      "Try explaining concepts out loud as if teaching someone else",
      "Create mind maps to visualize connections between ideas",
      "Take practice quizzes before moving to new material",
    ],
  };
}

function generateQuiz(content: string, title: string): QuizQuestion[] {
  return [
    {
      question: `What is the primary focus of "${title}"?`,
      options: [
        "Understanding core concepts and their applications",
        "Memorizing facts without understanding",
        "Avoiding practical examples",
        "Skipping foundational knowledge",
      ],
      correctIndex: 0,
      explanation: "The primary focus is always to understand core concepts and how they apply in practice, building a strong foundation.",
    },
    {
      question: "Which study technique is most effective for long-term retention?",
      options: [
        "Reading once and never reviewing",
        "Active recall with spaced repetition",
        "Highlighting everything in the text",
        "Studying for 8 hours straight",
      ],
      correctIndex: 1,
      explanation: "Active recall with spaced repetition forces your brain to retrieve information, which strengthens memory pathways.",
    },
    {
      question: "What does the content primarily help students develop?",
      options: [
        "Test anxiety",
        "Passive reading habits",
        "Critical thinking and understanding",
        "Memorization without comprehension",
      ],
      correctIndex: 2,
      explanation: "Good study materials develop critical thinking skills and deep understanding, not just surface-level memorization.",
    },
    {
      question: "How long should focused study sessions ideally be?",
      options: [
        "2-3 hours without breaks",
        "25-30 minutes with short breaks",
        "5 minutes maximum",
        "All night without sleeping",
      ],
      correctIndex: 1,
      explanation: "The Pomodoro Technique recommends 25-30 minute focused sessions followed by short breaks to maintain peak concentration.",
    },
    {
      question: "Which approach best connects new knowledge to existing understanding?",
      options: [
        "Ignoring prior knowledge",
        "Reading without thinking",
        "Creating real-world examples and analogies",
        "Studying in isolation",
      ],
      correctIndex: 2,
      explanation: "Creating real-world examples and analogies activates prior knowledge, making new information easier to understand and remember.",
    },
  ];
}

function generateFlashcards(content: string, title: string): FlashcardResult[] {
  return [
    { front: `What is "${title}" about?`, back: "A comprehensive study of core concepts, principles, and their practical applications in the field." },
    { front: "What is active recall?", back: "A learning technique where you actively stimulate memory during learning by testing yourself on material rather than passively reviewing it." },
    { front: "What is spaced repetition?", back: "A study method that involves reviewing material at increasing intervals over time to combat the forgetting curve and improve long-term retention." },
    { front: "What is the Pomodoro Technique?", back: "A time management method using 25-minute focused work sessions followed by 5-minute breaks, helping maintain concentration and prevent burnout." },
    { front: "Why is teaching others effective for learning?", back: "Explaining concepts to others (the Feynman Technique) forces you to identify gaps in understanding and reinforces your own knowledge through articulation." },
    { front: "What makes a study session productive?", back: "Clear goals, active engagement with material, regular self-testing, minimizing distractions, and consistent review over time." },
    { front: "What is elaborative interrogation?", back: "A study strategy where you ask and answer 'why' questions about the material, creating deeper understanding by connecting facts to reasons." },
    { front: "How does interleaving improve learning?", back: "Mixing different subjects or problem types during study (interleaving) improves long-term retention and the ability to apply knowledge flexibly." },
  ];
}

export async function generateAIContent(
  content: string,
  title: string
): Promise<{ notes: NotesResult; quiz: QuizQuestion[]; flashcards: FlashcardResult[] }> {
  logger.info({ title }, "Generating AI content");
  
  await new Promise((r) => setTimeout(r, 1500));

  return {
    notes: generateNotes(content, title),
    quiz: generateQuiz(content, title),
    flashcards: generateFlashcards(content, title),
  };
}

export async function generateChatResponse(
  userMessage: string,
  notesContext: string,
  chatHistory: { role: string; content: string }[]
): Promise<string> {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    return "Hello! I'm your AI study assistant. I'm here to help you understand the material in your notes. What would you like to know?";
  }

  if (lowerMsg.includes("summary") || lowerMsg.includes("summarize")) {
    return `Based on the notes, here's a quick summary: ${notesContext.slice(0, 200)}... Would you like me to explain any specific part in more detail?`;
  }

  if (lowerMsg.includes("key point") || lowerMsg.includes("important")) {
    return "The key points from your notes include the fundamental concepts, core principles, and their practical applications. Focus on understanding how each concept connects to the others for a complete picture.";
  }

  if (lowerMsg.includes("quiz") || lowerMsg.includes("test")) {
    return "Great idea! Head over to the Quiz section to test your knowledge. I recommend reviewing the flashcards first to warm up your memory.";
  }

  if (lowerMsg.includes("tip") || lowerMsg.includes("advice") || lowerMsg.includes("how to study")) {
    return "My top study tips: (1) Use active recall instead of passive re-reading, (2) Space out your study sessions, (3) Teach the concepts to someone else, (4) Take breaks using the Pomodoro technique. Which would you like me to explain more?";
  }

  const isRelated = notesContext.toLowerCase().split(" ").some((word) => 
    word.length > 4 && lowerMsg.includes(word.toLowerCase())
  );

  if (!isRelated && notesContext.length > 0) {
    return "Please ask questions related to the provided notes. I can help you understand the material, clarify concepts, or suggest study strategies for the content you've uploaded.";
  }

  return `Based on your notes about "${notesContext.slice(0, 50)}...", I can help clarify this topic. The material covers this concept in detail — would you like me to break it down step by step, or is there a specific aspect you're finding challenging?`;
}
