import { Course, Feedback, LessonStep } from "./types";

const ok = (body: string): Feedback => ({
  code: "correct",
  title: "That fits.",
  body,
});

const fb = (code: string, title: string, body: string): Feedback => ({
  code,
  title,
  body,
});

const c1 = "language-of-ai";
const c2 = "markdown-and-json";

export const aiFoundationsCourse: Course = {
  id: "course_ai_foundations",
  slug: "ai-foundations",
  title: "AI Foundations",
  description:
    "A hands-on introduction to how AI systems read prompts, use context, and return useful structured output.",
  chapters: [
    {
      id: "chapter_language_of_ai",
      slug: c1,
      title: "The Language of AI",
      description:
        "Learn the working vocabulary behind models, prompts, context, evidence, and evaluation.",
      order: 1,
      steps: [
        {
          id: "ai-c1-s1",
          slug: "classify-ai-tasks",
          chapterSlug: c1,
          order: 1,
          kind: "single_choice",
          title: "Classification, prediction, or generation?",
          prompt: {
            stem: "A support inbox marks each incoming message as billing, bug, or account access.",
            instruction: "What kind of AI task is this?",
            choices: [
              { id: "classification", label: "Classification" },
              { id: "prediction", label: "Prediction", feedbackCode: "future_value" },
              { id: "generation", label: "Generation", feedbackCode: "new_content" },
            ],
          },
          solution: { type: "single_choice", correctId: "classification" },
          feedback: {
            future_value: fb("future_value", "Prediction estimates a value.", "Prediction is about estimating an unknown or future value, like next month's signups. This task chooses one label from a fixed set."),
            new_content: fb("new_content", "Generation creates new output.", "Generation writes new text, images, or code. Here the system is sorting an existing message into a known category."),
          },
          correctFeedback: ok("The output is one of several fixed labels, so this is classification."),
          tutorContext: "Distinguish classification, prediction, and generation using everyday work examples.",
          xp: 10,
        },
        {
          id: "ai-c1-s2",
          slug: "order-model-flow",
          chapterSlug: c1,
          order: 2,
          kind: "ordering",
          title: "From data to output",
          prompt: {
            stem: "Put the model workflow in the usual order.",
            instruction: "Move the steps into sequence.",
            items: [
              { id: "data", label: "Collect examples" },
              { id: "training", label: "Train the model" },
              { id: "model", label: "Save the trained model" },
              { id: "input", label: "Send a new input" },
              { id: "output", label: "Receive an output" },
            ],
          },
          solution: {
            type: "ordering",
            correctOrder: ["data", "training", "model", "input", "output"],
            branchCodes: { input: "usage_before_training", model: "model_before_training" },
          },
          feedback: {
            usage_before_training: fb("usage_before_training", "Use happens after training.", "A live user input comes after a model has already been trained. Training builds behavior; usage applies it."),
            model_before_training: fb("model_before_training", "The model is the result of training.", "The saved model comes after training. The data and training process produce the model that later handles inputs."),
            order_mismatch: fb("order_mismatch", "The sequence is still mixed.", "Keep the build phase before the use phase: examples, training, trained model, new input, output."),
          },
          correctFeedback: ok("Training creates a model first; later, inputs are sent to that trained model."),
          tutorContext: "Explain data, training, model, input, output as build-time versus use-time stages.",
          xp: 10,
        },
        {
          id: "ai-c1-s3",
          slug: "pattern-not-person",
          chapterSlug: c1,
          order: 3,
          kind: "single_choice",
          title: "Pattern matching, not mind reading",
          prompt: {
            stem: "A chatbot answers a medical question confidently but cites a study that does not exist.",
            instruction: "What is the best explanation?",
            choices: [
              { id: "pattern", label: "It generated a plausible pattern without evidence." },
              { id: "intention", label: "It intended to deceive the user.", feedbackCode: "anthropomorphism" },
              { id: "memory", label: "It must have remembered the study incorrectly.", feedbackCode: "memory_assumption" },
            ],
          },
          solution: { type: "single_choice", correctId: "pattern" },
          feedback: {
            anthropomorphism: fb("anthropomorphism", "Avoid human motives.", "A model does not need an intention to produce a false claim. It can produce text that looks right because the pattern fits."),
            memory_assumption: fb("memory_assumption", "Do not assume stored memories.", "A generated citation can be invented, not misremembered. The issue is unsupported output, not necessarily faulty memory."),
          },
          correctFeedback: ok("The useful mental model is pattern completion under uncertainty, not human understanding."),
          tutorContext: "Address anthropomorphism and explain why confident AI text can still be unsupported.",
          xp: 10,
        },
        {
          id: "ai-c1-s4",
          slug: "tokens",
          chapterSlug: c1,
          order: 4,
          kind: "single_choice",
          title: "What models read",
          prompt: {
            stem: "A model breaks text into smaller pieces before processing it.",
            instruction: "What are those pieces usually called?",
            choices: [
              { id: "tokens", label: "Tokens" },
              { id: "ideas", label: "Ideas", feedbackCode: "idea_units" },
              { id: "sentences", label: "Always full sentences", feedbackCode: "sentence_units" },
              { id: "exact_words", label: "Always exact words", feedbackCode: "word_units" },
            ],
          },
          solution: { type: "single_choice", correctId: "tokens" },
          feedback: {
            idea_units: fb("idea_units", "Tokens are text pieces.", "Tokens are not pure ideas. They are chunks of text, sometimes whole words and sometimes parts of words."),
            sentence_units: fb("sentence_units", "Tokens are usually smaller than sentences.", "A sentence normally contains many tokens. The model processes token sequences, not only sentence-sized chunks."),
            word_units: fb("word_units", "Tokens are not always full words.", "A token can be a word, part of a word, punctuation, or spacing. That is why token counts do not exactly match word counts."),
          },
          correctFeedback: ok("Tokens are the practical text chunks models process."),
          tutorContext: "Teach tokens as text chunks rather than exact words, sentences, or ideas.",
          xp: 10,
        },
        {
          id: "ai-c1-s5",
          slug: "context-budget",
          chapterSlug: c1,
          order: 5,
          kind: "token_budget",
          title: "Spend the context budget",
          prompt: {
            stem: "You need the model to draft a refund reply. Your context budget is 7 points.",
            instruction: "Choose only the facts that help the answer.",
            budget: 7,
            items: [
              { id: "policy", label: "Refund policy: 14 days", weight: 3 },
              { id: "purchase", label: "Customer bought 9 days ago", weight: 2 },
              { id: "tone", label: "Use a calm, helpful tone", weight: 2 },
              { id: "office", label: "The support team moved desks", weight: 2 },
              { id: "old", label: "Customer used a coupon in 2021", weight: 3 },
            ],
          },
          solution: {
            type: "token_budget",
            correctIds: ["policy", "purchase", "tone"],
            maxWeight: 7,
            wrongChoiceCodes: { office: "irrelevant_context", old: "stale_context" },
          },
          feedback: {
            irrelevant_context: fb("irrelevant_context", "Irrelevant context crowds out useful facts.", "The desk move does not help decide or explain a refund. In a limited context window, irrelevant facts compete with useful ones."),
            stale_context: fb("stale_context", "Old history can displace the key facts.", "The 2021 coupon is not needed for this refund reply. Prefer the policy, purchase date, and tone constraint."),
            missing_relevant: fb("missing_relevant", "A key fact is missing.", "A refund answer needs the policy, the purchase timing, and the requested tone. Missing one makes the model guess."),
            over_budget: fb("over_budget", "The context window is limited.", "The chosen facts exceed the budget. Good prompting is partly deciding what not to include."),
          },
          correctFeedback: ok("You kept the policy, timing, and tone while excluding facts that would dilute the context."),
          tutorContext: "Explain context windows as limited room for relevant facts.",
          xp: 10,
        },
        {
          id: "ai-c1-s6",
          slug: "prompt-parts",
          chapterSlug: c1,
          order: 6,
          kind: "matching",
          title: "Label the prompt parts",
          prompt: {
            stem: "Match each prompt excerpt to its role.",
            instruction: "Pair the excerpt with the prompt component it represents.",
            items: [
              { id: "instruction", label: "Summarize this incident report" },
              { id: "context", label: "The outage lasted 18 minutes" },
              { id: "constraint", label: "Use fewer than 80 words" },
              { id: "format", label: "Return JSON with keys: cause, impact" },
            ],
            targets: [
              { id: "instruction", label: "Instruction" },
              { id: "context", label: "Context" },
              { id: "constraint", label: "Constraint" },
              { id: "format", label: "Output format" },
            ],
          },
          solution: {
            type: "matching",
            correctPairs: { instruction: "instruction", context: "context", constraint: "constraint", format: "format" },
          },
          feedback: {
            mismatch: fb("mismatch", "One role is mislabeled.", "Instruction says what to do, context supplies facts, constraints limit the answer, and output format describes the shape of the response."),
            instruction_context_mixup: fb("instruction_context_mixup", "Instructions and facts do different jobs.", "The instruction tells the model what action to perform. Context gives facts the model should use while performing it."),
            format_constraint_mixup: fb("format_constraint_mixup", "Format is not the same as a limit.", "A constraint limits the answer, like word count. Output format defines the shape, like JSON keys or bullets."),
          },
          correctFeedback: ok("Those four roles make prompts easier to inspect and improve."),
          tutorContext: "Teach instruction, context, constraints, examples, and output format as prompt parts.",
          xp: 10,
        },
        {
          id: "ai-c1-s7",
          slug: "clearer-prompt",
          chapterSlug: c1,
          order: 7,
          kind: "single_choice",
          title: "Choose the clearer prompt",
          prompt: {
            stem: "You want a beginner-friendly explanation of phishing.",
            instruction: "Which prompt is clearer?",
            choices: [
              { id: "clear", label: "Explain phishing to a new employee in 5 bullets, with one example and one warning sign." },
              { id: "vague", label: "Tell me about phishing.", feedbackCode: "missing_audience_goal_format" },
              { id: "overloaded", label: "Write everything about phishing, cybersecurity, hackers, email, and passwords.", feedbackCode: "too_broad" },
            ],
          },
          solution: { type: "single_choice", correctId: "clear" },
          feedback: {
            missing_audience_goal_format: fb("missing_audience_goal_format", "The audience and format are missing.", "A vague prompt can still work, but it gives the model less guidance about depth, audience, and output shape."),
            too_broad: fb("too_broad", "Broad prompts blur the task.", "Asking for everything makes it harder to produce a focused answer. A clearer prompt narrows audience, goal, and format."),
          },
          correctFeedback: ok("The stronger prompt defines audience, scope, structure, and an example requirement."),
          tutorContext: "Explain why audience, goal, constraints, and format improve prompts.",
          xp: 10,
        },
        {
          id: "ai-c1-s8",
          slug: "evidence-check",
          chapterSlug: c1,
          order: 8,
          kind: "single_choice",
          title: "Confidence is not evidence",
          prompt: {
            stem: "The model says, 'This policy definitely changed last Friday,' but the provided document has no date or revision note.",
            instruction: "What should you flag?",
            choices: [
              { id: "unsupported", label: "The claim is unsupported by the available evidence." },
              { id: "style", label: "The claim is true because the wording is confident.", feedbackCode: "confidence_bias" },
              { id: "ignore", label: "Nothing, because policy documents are always current.", feedbackCode: "source_assumption" },
            ],
          },
          solution: { type: "single_choice", correctId: "unsupported" },
          feedback: {
            confidence_bias: fb("confidence_bias", "Confidence is not proof.", "A fluent, certain sentence can still be unsupported. Check the source, not just the tone."),
            source_assumption: fb("source_assumption", "Do not invent source guarantees.", "A document might be stale or incomplete. If the evidence does not show a Friday change, the claim needs verification."),
          },
          correctFeedback: ok("The claim needs evidence from the provided material or an external source check."),
          tutorContext: "Teach hallucination detection and evidence-based review.",
          xp: 10,
        },
        {
          id: "ai-c1-s9",
          slug: "quality-rubric",
          chapterSlug: c1,
          order: 9,
          kind: "multi_select",
          title: "Build a review rubric",
          prompt: {
            stem: "You are reviewing an AI answer before sending it to a client.",
            instruction: "Select every useful review criterion.",
            choices: [
              { id: "relevance", label: "Relevance" },
              { id: "accuracy", label: "Accuracy" },
              { id: "completeness", label: "Completeness" },
              { id: "clarity", label: "Clarity" },
              { id: "uncertainty", label: "Uncertainty" },
              { id: "confidence_only", label: "How confident it sounds", feedbackCode: "confidence_not_quality" },
            ],
          },
          solution: {
            type: "multi_select",
            correctIds: ["relevance", "accuracy", "completeness", "clarity", "uncertainty"],
            wrongChoiceCodes: { confidence_only: "confidence_not_quality" },
          },
          feedback: {
            confidence_not_quality: fb("confidence_not_quality", "Sounding confident is not enough.", "Confidence can be useful only when paired with evidence and uncertainty. Tone alone is not a quality criterion."),
            missing_criteria: fb("missing_criteria", "The rubric is incomplete.", "A good review checks whether the answer fits the question, is true, covers the need, reads clearly, and admits uncertainty."),
          },
          correctFeedback: ok("That rubric checks usefulness, truth, coverage, readability, and uncertainty."),
          tutorContext: "Teach an AI answer review rubric for relevance, accuracy, completeness, clarity, and uncertainty.",
          xp: 10,
        },
        {
          id: "ai-c1-s10",
          slug: "prompt-builder",
          chapterSlug: c1,
          order: 10,
          kind: "prompt_builder",
          title: "Assemble a complete prompt",
          prompt: {
            stem: "Build a prompt asking AI to draft a project status update for your manager.",
            instruction: "Include the task, audience, facts, constraints, and output format.",
            placeholder: "Write your prompt here...",
          },
          solution: {
            type: "prompt_builder",
            required: ["manager", "status", "format", "constraint", "fact"],
          },
          feedback: {
            missing_audience: fb("missing_audience", "Name the audience.", "A manager needs a different level of detail than a teammate or customer. Include who the update is for."),
            missing_format: fb("missing_format", "Specify the output shape.", "Tell the model whether you want bullets, an email, JSON, a table, or another format."),
            missing_constraints: fb("missing_constraints", "Add boundaries.", "A useful workplace prompt usually states length, tone, source limits, or what not to include."),
            missing_context: fb("missing_context", "Add facts to work from.", "Without project facts, the model has to guess. Include the real dates, blockers, wins, or next steps."),
          },
          correctFeedback: ok("Your prompt includes the working parts: task, audience, context, constraints, and format."),
          tutorContext: "Coach a learner building a complete workplace prompt without giving a final answer.",
          xp: 10,
        },
      ],
    },
    {
      id: "chapter_markdown_and_json",
      slug: c2,
      title: "Markdown and JSON",
      description:
        "Practice the two most useful formats for AI work: readable Markdown and strict JSON.",
      order: 2,
      steps: [
        {
          id: "ai-c2-s1",
          slug: "choose-format",
          chapterSlug: c2,
          order: 1,
          kind: "single_choice",
          title: "Pick the right format",
          prompt: {
            stem: "You need a human-readable onboarding note with headings, bullets, and a link.",
            instruction: "Which format should you choose?",
            choices: [
              { id: "markdown", label: "Markdown" },
              { id: "json", label: "JSON", feedbackCode: "machine_format" },
              { id: "plain", label: "Unstructured plain text", feedbackCode: "missing_structure" },
            ],
          },
          solution: { type: "single_choice", correctId: "markdown" },
          feedback: {
            machine_format: fb("machine_format", "JSON is for structured data exchange.", "JSON is excellent when software needs fields and values. A readable note with headings and bullets is a Markdown job."),
            missing_structure: fb("missing_structure", "Plain text loses useful structure.", "Plain text can work, but Markdown gives lightweight headings, lists, links, and code formatting for readers."),
          },
          correctFeedback: ok("Markdown is designed for readable documents with simple structure."),
          tutorContext: "Contrast Markdown for human-readable documents with JSON for structured data.",
          xp: 10,
        },
        {
          id: "ai-c2-s2",
          slug: "markdown-heading",
          chapterSlug: c2,
          order: 2,
          kind: "markdown_editor",
          title: "Write a heading",
          prompt: {
            stem: "Create a top-level Markdown heading named AI Notes.",
            instruction: "Type the Markdown heading.",
            starter: "AI Notes",
          },
          solution: { type: "markdown_editor", mode: "heading", required: ["# AI Notes"] },
          feedback: {
            missing_hash: fb("missing_hash", "Headings need hash marks.", "A top-level Markdown heading starts with one # followed by a space, then the heading text."),
            wrong_level: fb("wrong_level", "This is the wrong heading level.", "Two or more # characters create lower-level headings. For the main heading, use one #."),
          },
          correctFeedback: ok("One # creates a top-level Markdown heading."),
          tutorContext: "Explain Markdown heading levels and the required space after #.",
          xp: 10,
        },
        {
          id: "ai-c2-s3",
          slug: "inline-formatting",
          chapterSlug: c2,
          order: 3,
          kind: "markdown_editor",
          title: "Inline formatting",
          prompt: {
            stem: "Format the words urgent, draft, and status as bold, italic, and inline code.",
            instruction: "Use Markdown inline formatting.",
            starter: "urgent draft status",
          },
          solution: { type: "markdown_editor", mode: "inline", required: ["**urgent**", "*draft*", "`status`"] },
          feedback: {
            missing_bold: fb("missing_bold", "Bold uses double marks.", "Use double asterisks around the word that needs strong emphasis, like **urgent**."),
            missing_italic: fb("missing_italic", "Italic uses single marks.", "Use one asterisk or underscore on each side for italic text, like *draft*."),
            missing_code: fb("missing_code", "Inline code uses backticks.", "Use backticks around short literal terms, commands, fields, or code-like words."),
          },
          correctFeedback: ok("Bold, italic, and inline code each have distinct Markdown markers."),
          tutorContext: "Teach Markdown inline bold, italic, and code formatting.",
          xp: 10,
        },
        {
          id: "ai-c2-s4",
          slug: "list-builder",
          chapterSlug: c2,
          order: 4,
          kind: "markdown_editor",
          title: "Build nested lists",
          prompt: {
            stem: "Create a numbered list with two steps. Under step 2, add one bullet named Check JSON.",
            instruction: "Use valid Markdown list syntax.",
            starter: "1. Plan\n2. Build\nCheck JSON",
          },
          solution: { type: "markdown_editor", mode: "list", required: ["1.", "2.", "  - Check JSON"] },
          feedback: {
            missing_ordered: fb("missing_ordered", "Numbered lists need numeric markers.", "Use 1. and 2. for ordered steps. Markdown needs the marker before each item."),
            missing_nested: fb("missing_nested", "Nested bullets need indentation.", "Put spaces before the nested bullet so Markdown knows it belongs under step 2."),
          },
          correctFeedback: ok("The nested bullet is indented under the ordered item."),
          tutorContext: "Explain ordered and unordered Markdown lists with nesting.",
          xp: 10,
        },
        {
          id: "ai-c2-s5",
          slug: "links-and-code",
          chapterSlug: c2,
          order: 5,
          kind: "markdown_editor",
          title: "Links and code fences",
          prompt: {
            stem: "Create a Markdown link labeled Docs to https://example.com, then add a fenced json code block.",
            instruction: "Use link syntax and triple backticks.",
            starter: "Docs https://example.com\n{\"ok\": true}",
          },
          solution: { type: "markdown_editor", mode: "link_code", required: ["[Docs](https://example.com)", "```json", "```"] },
          feedback: {
            swapped_link: fb("swapped_link", "Markdown links put label first.", "Use [label](url). The readable label goes in square brackets and the URL goes in parentheses."),
            missing_fence: fb("missing_fence", "Code blocks need fences.", "A fenced code block starts and ends with triple backticks. Add json after the opening fence for highlighting."),
          },
          correctFeedback: ok("The link and fenced code block are both valid Markdown patterns."),
          tutorContext: "Teach Markdown link labels, URLs, and fenced code blocks.",
          xp: 10,
        },
        {
          id: "ai-c2-s6",
          slug: "repair-markdown",
          chapterSlug: c2,
          order: 6,
          kind: "markdown_editor",
          title: "Repair a note",
          prompt: {
            stem: "Fix this note so it has a heading, a bullet, and inline code: Title\n- command npm test",
            instruction: "Use the preview to check the structure.",
            starter: "Title\n- command npm test",
          },
          solution: { type: "markdown_editor", mode: "repair", required: ["# Title", "- command `npm test`"] },
          feedback: {
            missing_heading: fb("missing_heading", "The title is still plain text.", "Add # and a space before Title so Markdown treats it as a heading."),
            missing_inline_code: fb("missing_inline_code", "The command should be literal.", "Wrap npm test in backticks so it reads as a command, not regular prose."),
          },
          correctFeedback: ok("The note now has a real heading, bullet, and inline command."),
          tutorContext: "Explain Markdown repair using a sanitized live preview.",
          xp: 10,
        },
        {
          id: "ai-c2-s7",
          slug: "json-anatomy",
          chapterSlug: c2,
          order: 7,
          kind: "matching",
          title: "JSON anatomy",
          prompt: {
            stem: "Match each JSON symbol or part to its role.",
            instruction: "Pair the part with the correct role.",
            items: [
              { id: "object", label: "{ }" },
              { id: "key", label: "\"title\"" },
              { id: "colon", label: ":" },
              { id: "comma", label: "," },
            ],
            targets: [
              { id: "object", label: "Object boundary" },
              { id: "key", label: "Key" },
              { id: "colon", label: "Separates key and value" },
              { id: "comma", label: "Separates pairs or items" },
            ],
          },
          solution: {
            type: "matching",
            correctPairs: { object: "object", key: "key", colon: "colon", comma: "comma" },
          },
          feedback: {
            mismatch: fb("mismatch", "JSON punctuation has jobs.", "Braces hold an object, a quoted key names a field, a colon connects key to value, and commas separate entries."),
            key_value_mixup: fb("key_value_mixup", "Keys name fields; values hold data.", "In JSON, a key is the quoted label before the colon. The value comes after the colon."),
            comma_colon_mixup: fb("comma_colon_mixup", "Colons connect; commas separate.", "A colon connects one key to its value. A comma separates one key-value pair or array item from the next."),
          },
          correctFeedback: ok("Those roles are the skeleton of a JSON object."),
          tutorContext: "Teach JSON object, key, value, colon, comma, and brace roles.",
          xp: 10,
        },
        {
          id: "ai-c2-s8",
          slug: "json-types",
          chapterSlug: c2,
          order: 8,
          kind: "matching",
          title: "Classify JSON values",
          prompt: {
            stem: "Match each value to its JSON type.",
            instruction: "Choose the type for every value.",
            items: [
              { id: "string", label: "\"ready\"" },
              { id: "number", label: "42" },
              { id: "boolean", label: "false" },
              { id: "null", label: "null" },
              { id: "array", label: "[1, 2]" },
              { id: "object", label: "{\"ok\": true}" },
            ],
            targets: [
              { id: "string", label: "String" },
              { id: "number", label: "Number" },
              { id: "boolean", label: "Boolean" },
              { id: "null", label: "Null" },
              { id: "array", label: "Array" },
              { id: "object", label: "Object" },
            ],
          },
          solution: {
            type: "matching",
            correctPairs: { string: "string", number: "number", boolean: "boolean", null: "null", array: "array", object: "object" },
          },
          feedback: {
            mismatch: fb("mismatch", "JSON types are strict.", "Strings need quotes, numbers do not, booleans are true or false, null is empty, arrays use brackets, and objects use braces."),
            quoted_value_mixup: fb("quoted_value_mixup", "Quotes change the type.", "A quoted value is a string. Numbers, booleans, and null are written without quotes in JSON."),
            container_mixup: fb("container_mixup", "Arrays and objects are different containers.", "Arrays use square brackets for ordered lists. Objects use braces for named fields."),
          },
          correctFeedback: ok("You separated literal values from containers and quoted text."),
          tutorContext: "Teach strings, numbers, booleans, null, arrays, and objects in JSON.",
          xp: 10,
        },
        {
          id: "ai-c2-s9",
          slug: "json-debugger",
          chapterSlug: c2,
          order: 9,
          kind: "json_debugger",
          title: "Debug JSON",
          prompt: {
            stem: "Repair this JSON so it parses.",
            instruction: "Fix quotes, commas, and brackets.",
            starter: "{ title: \"AI\", \"steps\": [1, 2,], }",
          },
          solution: { type: "json_debugger", mode: "valid_json", requiredKeys: ["title", "steps"] },
          feedback: {
            parse_error: fb("parse_error", "The parser still rejects it.", "JSON requires quoted keys, no trailing commas, and matching braces or brackets. Use the parser position as the repair clue."),
            missing_key: fb("missing_key", "A required field is missing.", "Keep both title and steps. Repair syntax without removing the data the object needs."),
          },
          correctFeedback: ok("The JSON parses and preserves the required fields."),
          tutorContext: "Coach JSON parser-position repair without revealing the full corrected object.",
          xp: 10,
        },
        {
          id: "ai-c2-s10",
          slug: "structured-output",
          chapterSlug: c2,
          order: 10,
          kind: "json_debugger",
          title: "Structured output",
          prompt: {
            stem: "Build valid JSON for an AI task with task, format, and checks fields.",
            instruction: "Use nested JSON where checks is an array.",
            starter: "{\n  \"task\": \"\",\n  \"format\": \"\",\n  \"checks\": []\n}",
          },
          solution: { type: "json_debugger", mode: "structured", requiredKeys: ["task", "format", "checks"] },
          feedback: {
            parse_error: fb("parse_error", "The JSON is not valid yet.", "Structured output only helps software if it parses. Check quotes, commas, brackets, and braces."),
            missing_key: fb("missing_key", "The schema is incomplete.", "The object needs task, format, and checks so another program can reliably read the result."),
            checks_not_array: fb("checks_not_array", "Checks should be an array.", "Use an array when a field can hold multiple items, even if there is only one check today."),
          },
          correctFeedback: ok("This is the kind of strict shape software can consume after an AI call."),
          tutorContext: "Teach when to request JSON instead of Markdown for AI structured output.",
          xp: 10,
        },
      ],
    },
  ],
};

export const allSteps: LessonStep[] = aiFoundationsCourse.chapters.flatMap(
  (chapter) => chapter.steps,
);

export function getCourse() {
  return aiFoundationsCourse;
}

export function getStepById(stepId: string) {
  return allSteps.find((step) => step.id === stepId) ?? null;
}

export function getStepByRoute(chapterSlug: string, stepSlug: string) {
  return (
    allSteps.find(
      (step) => step.chapterSlug === chapterSlug && step.slug === stepSlug,
    ) ?? null
  );
}

export function getNextStep(stepId: string) {
  const index = allSteps.findIndex((step) => step.id === stepId);
  return index >= 0 ? allSteps[index + 1] ?? null : null;
}

export function getPreviousStep(stepId: string) {
  const index = allSteps.findIndex((step) => step.id === stepId);
  return index > 0 ? allSteps[index - 1] ?? null : null;
}
