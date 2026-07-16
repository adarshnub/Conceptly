export type ClassVisual =
  | {
      type: "task-cards";
      items: { request: string; label: string; accent: "blue" | "amber" | "green" }[];
    }
  | {
      type: "pipeline";
      nodes: { label: string; phase: "Training" | "Using the model" }[];
    }
  | {
      type: "token-window";
      text: string;
      tokens: string[];
      context: { text: string; useful: boolean }[];
    }
  | {
      type: "prompt-anatomy";
      parts: { label: string; text: string; accent: "blue" | "amber" | "green" | "rose" }[];
    }
  | {
      type: "evidence-check";
      claim: string;
      checks: { label: string; state: "pass" | "warning" }[];
    }
  | {
      type: "format-choice";
      markdown: string[];
      json: string[];
    }
  | {
      type: "markdown-render";
      source: string[];
      rendered: { kind: "heading" | "body" | "bullet" | "code"; text: string }[];
    }
  | {
      type: "markdown-toolkit";
      items: { syntax: string; result: string; label: string }[];
    }
  | {
      type: "json-anatomy";
      lines: { code: string; label?: string }[];
    }
  | {
      type: "output-flow";
      input: string;
      fields: { key: string; value: string }[];
      destination: string;
    };

export type ClassBeat = {
  id: string;
  stage: "Warm-up" | "Demonstration" | "Walkthrough" | "Try noticing" | "Wrap-up";
  title: string;
  narration: string;
  learnerPrompt: string;
  revealLabel: string;
  takeaway: string;
  visual: ClassVisual;
};

export type ChapterClassSession = {
  chapterSlug: string;
  title: string;
  eyebrow: string;
  summary: string;
  duration: string;
  beats: ClassBeat[];
};

export const chapterClassSessions: Record<string, ChapterClassSession> = {
  "language-of-ai": {
    chapterSlug: "language-of-ai",
    eyebrow: "Chapter 1 class",
    title: "The Language of AI",
    summary:
      "See what an AI model is actually doing, then learn the five ideas that make its answers easier to guide and judge.",
    duration: "About 7 minutes",
    beats: [
      {
        id: "task-shapes",
        stage: "Warm-up",
        title: "Three requests. Three different jobs.",
        narration:
          "Let’s begin with three everyday requests. Sort an email into spam or not spam. Estimate tomorrow’s sales. Write a friendly reply. They can all use AI, but the job changes each time. The first chooses a label, the second estimates what comes next, and the third creates something new. That distinction matters because you should judge each kind of answer differently.",
        learnerPrompt: "Look at the three cards. What changes: the topic, or the kind of output?",
        revealLabel: "Show the job behind each request",
        takeaway: "Classification chooses, prediction estimates, and generation creates.",
        visual: {
          type: "task-cards",
          items: [
            { request: "Spam or not spam?", label: "Classification", accent: "blue" },
            { request: "Tomorrow’s sales?", label: "Prediction", accent: "amber" },
            { request: "Write a friendly reply", label: "Generation", accent: "green" },
          ],
        },
      },
      {
        id: "training-usage",
        stage: "Demonstration",
        title: "Watch the model move from learning to doing.",
        narration:
          "Now follow the line from left to right. During training, examples are used to adjust the model. That creates a trained model. Later, when you use it, you provide a fresh input and receive an output. Your prompt does not retrain the model. It gives the already-trained model something to work on right now.",
        learnerPrompt: "Find the boundary between training and using the model.",
        revealLabel: "Mark the two phases",
        takeaway: "Training shapes the model; prompting uses the model.",
        visual: {
          type: "pipeline",
          nodes: [
            { label: "Examples", phase: "Training" },
            { label: "Training", phase: "Training" },
            { label: "Model", phase: "Training" },
            { label: "New input", phase: "Using the model" },
            { label: "Output", phase: "Using the model" },
          ],
        },
      },
      {
        id: "tokens-context",
        stage: "Walkthrough",
        title: "Words go in. Tokens and context do the work.",
        narration:
          "Here’s a small sentence. A model breaks text into tokens—small chunks that may be a word, part of a word, or punctuation. Those tokens share a limited working space called the context window. If we fill that space with old, irrelevant history, there is less room for the instructions and facts that matter now. Good prompting is partly the art of choosing what deserves that space.",
        learnerPrompt: "Which context card would you remove first to make room?",
        revealLabel: "Reveal the useful context",
        takeaway: "Keep the context window focused on information the current task needs.",
        visual: {
          type: "token-window",
          text: "Summarize the launch notes.",
          tokens: ["Sum", "marize", " the", " launch", " notes", "."],
          context: [
            { text: "Audience: new customers", useful: true },
            { text: "Use three bullets", useful: true },
            { text: "Lunch order from Tuesday", useful: false },
          ],
        },
      },
      {
        id: "prompt-parts",
        stage: "Try noticing",
        title: "Build a prompt the model can inspect.",
        narration:
          "Instead of asking, ‘write something about the launch,’ let’s build the request in visible parts. First, say what to do. Then give the situation. Add boundaries such as length and audience. An example can show the style, and an output format makes the result predictable. You won’t need every part every time—but when an answer is weak, these parts tell you what may be missing.",
        learnerPrompt: "Before revealing the labels, identify the instruction and the output format.",
        revealLabel: "Label the prompt parts",
        takeaway: "Clear prompts expose the task, context, constraints, examples, and format.",
        visual: {
          type: "prompt-anatomy",
          parts: [
            { label: "Instruction", text: "Summarize the launch notes", accent: "blue" },
            { label: "Context", text: "for a first-time customer", accent: "amber" },
            { label: "Constraint", text: "in plain language, under 80 words", accent: "rose" },
            { label: "Output format", text: "as three Markdown bullets", accent: "green" },
          ],
        },
      },
      {
        id: "evidence",
        stage: "Wrap-up",
        title: "A confident sentence is still only a claim.",
        narration:
          "One last habit. Imagine the model says, very confidently, that a product grew by forty percent. The sentence is fluent and specific, but we still need to ask: where did that number come from? Does the source support it? Is uncertainty being hidden? Treat AI output as material to evaluate, not authority to accept. Relevance, accuracy, completeness, clarity, and honest uncertainty are your final checks.",
        learnerPrompt: "What is missing from this confident claim?",
        revealLabel: "Run the evidence check",
        takeaway: "Confidence changes the tone of a claim—not the evidence behind it.",
        visual: {
          type: "evidence-check",
          claim: "Customer retention increased by 40% last quarter.",
          checks: [
            { label: "Clear wording", state: "pass" },
            { label: "Relevant to the question", state: "pass" },
            { label: "Source for 40%", state: "warning" },
            { label: "Uncertainty stated", state: "warning" },
          ],
        },
      },
    ],
  },
  "markdown-and-json": {
    chapterSlug: "markdown-and-json",
    eyebrow: "Chapter 2 class",
    title: "Markdown and JSON",
    summary:
      "Turn the same information into a document a person can scan and data a program can reliably consume.",
    duration: "About 8 minutes",
    beats: [
      {
        id: "choose-format",
        stage: "Warm-up",
        title: "Same idea. Two very different readers.",
        narration:
          "Picture a project update. If a teammate will read it, headings and bullets make the message easy to scan—that’s a Markdown job. If another program needs to read it, named fields and strict values make the structure dependable—that’s a JSON job. The information can be identical. The right format depends on who, or what, reads it next.",
        learnerPrompt: "Which side would you send to a person? Which side would you send to software?",
        revealLabel: "Show each format’s reader",
        takeaway: "Markdown serves human readers; JSON serves structured data exchange.",
        visual: {
          type: "format-choice",
          markdown: ["# Launch update", "- Status: ready", "- Owner: Maya"],
          json: ["{", '  \"status\": \"ready\",', '  \"owner\": \"Maya\"', "}"],
        },
      },
      {
        id: "markdown-render",
        stage: "Demonstration",
        title: "Watch plain symbols become a readable page.",
        narration:
          "On the left is the text you type. A hash and a space create a heading. A dash and a space create a bullet. Backticks mark code. On the right is what the reader sees. Markdown stays readable before and after rendering, which is why it works so well for notes, documentation, and AI answers meant for people.",
        learnerPrompt: "Trace each symbol on the left to the visual change on the right.",
        revealLabel: "Connect syntax to result",
        takeaway: "Markdown uses small, readable symbols to express document structure.",
        visual: {
          type: "markdown-render",
          source: ["# Launch plan", "Ready for review.", "- Check links", "Run `npm test`"],
          rendered: [
            { kind: "heading", text: "Launch plan" },
            { kind: "body", text: "Ready for review." },
            { kind: "bullet", text: "Check links" },
            { kind: "code", text: "npm test" },
          ],
        },
      },
      {
        id: "markdown-tools",
        stage: "Walkthrough",
        title: "Four tools cover most everyday Markdown.",
        narration:
          "Let’s put the core tools on one workbench. Hash marks create heading levels. Asterisks can add emphasis. Brackets hold link text while parentheses hold the destination. Triple backticks fence a block of code. The symbols are simple, but their order matters—especially for links and code fences.",
        learnerPrompt: "Which tool changes structure, and which ones change inline meaning?",
        revealLabel: "Open the Markdown toolkit",
        takeaway: "Use headings for hierarchy, emphasis for meaning, links for navigation, and fences for code.",
        visual: {
          type: "markdown-toolkit",
          items: [
            { syntax: "## Plan", result: "Plan", label: "Heading" },
            { syntax: "**important**", result: "important", label: "Bold" },
            { syntax: "[Docs](url)", result: "Docs ↗", label: "Link" },
            { syntax: "```js … ```", result: "code block", label: "Fence" },
          ],
        },
      },
      {
        id: "json-anatomy",
        stage: "Try noticing",
        title: "JSON is less forgiving—and that is useful.",
        narration:
          "Now look at a JSON object. Curly braces contain the object. Every key is a quoted string. A colon connects each key to its value, and a comma separates one field from the next. Strings use quotes; numbers and booleans do not. Because the rules are strict, software can either parse the data or point to where the structure broke.",
        learnerPrompt: "Find the key, the string value, and the boolean value before revealing the labels.",
        revealLabel: "Annotate the JSON",
        takeaway: "Valid JSON follows exact rules for objects, keys, separators, and value types.",
        visual: {
          type: "json-anatomy",
          lines: [
            { code: "{", label: "object starts" },
            { code: '  \"topic\": \"AI basics\",', label: "string value" },
            { code: '  \"lessons\": 2,', label: "number value" },
            { code: '  \"published\": true', label: "boolean value" },
            { code: "}", label: "object ends" },
          ],
        },
      },
      {
        id: "structured-output",
        stage: "Wrap-up",
        title: "Design the output around what happens next.",
        narration:
          "Suppose an AI extracts a support ticket. We ask for a small JSON object with a category, a priority, and a summary. Because the fields are named and predictable, another tool can route the ticket automatically. If the final destination were a human report, we would choose Markdown instead. Start with the next reader, then choose the format.",
        learnerPrompt: "What would break downstream if the model renamed ‘priority’ to ‘urgency’ without warning?",
        revealLabel: "Follow the data downstream",
        takeaway: "A structured output is a contract between the AI response and the next system.",
        visual: {
          type: "output-flow",
          input: "“I can’t sign in and need access today.”",
          fields: [
            { key: "category", value: "account_access" },
            { key: "priority", value: "high" },
            { key: "summary", value: "User cannot sign in" },
          ],
          destination: "Support queue",
        },
      },
    ],
  },
};

export function getChapterClassSession(chapterSlug: string) {
  return chapterClassSessions[chapterSlug] ?? null;
}

export function getAllChapterClassSessions() {
  return Object.values(chapterClassSessions);
}
