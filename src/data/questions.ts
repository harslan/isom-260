// ISOM 260 — Practice Question Bank
// Each question tests a production-judgment call on agentic AI systems.
// Distractors carry named misconceptions so students learn vocabulary for
// thinking, not just answers.

export type DomainId =
  | 'agentic-architecture'
  | 'tool-design-mcp'
  | 'claude-code-config'
  | 'prompt-engineering'
  | 'context-management';

export interface Domain {
  id: DomainId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
}

export const domains: Domain[] = [
  {
    id: 'agentic-architecture',
    number: '01',
    title: 'Agentic Architecture & Orchestration',
    shortTitle: 'Architecture',
    description: 'How agents loop, when to plan, how subagents coordinate, where deterministic enforcement beats prompting.',
    icon: 'network',
  },
  {
    id: 'tool-design-mcp',
    number: '02',
    title: 'Tool Design & MCP Integration',
    shortTitle: 'Tools & MCP',
    description: 'Why descriptions are leverage, when narrow tools beat general ones, how to scope MCP across teams.',
    icon: 'wrench',
  },
  {
    id: 'claude-code-config',
    number: '03',
    title: 'Claude Code Configuration & Workflows',
    shortTitle: 'Claude Code',
    description: 'Where conventions live, when to plan, how teams share rules, how to run Claude Code non-interactively.',
    icon: 'terminal',
  },
  {
    id: 'prompt-engineering',
    number: '04',
    title: 'Prompt Engineering & Structured Output',
    shortTitle: 'Prompts & Output',
    description: 'Schema constraints over instructions, categorical criteria over adjectives, examples for format variation.',
    icon: 'type',
  },
  {
    id: 'context-management',
    number: '05',
    title: 'Context Management & Reliability',
    shortTitle: 'Context & Reliability',
    description: 'Lost-in-the-middle, structured errors, honoring explicit requests, stratifying before automating.',
    icon: 'shield',
  },
];

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface DistractorExplanation {
  misconception: string;
  explanation: string;
}

export interface Question {
  id: string;
  number: number;
  domain: DomainId;
  scenario: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  correctExplanation: string;
  distractors: Partial<Record<'A' | 'B' | 'C' | 'D', DistractorExplanation>>;
  tags: string[];
}

export const questions: Question[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // DOMAIN 1: Agentic Architecture & Orchestration
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'Q01',
    number: 1,
    domain: 'agentic-architecture',
    scenario: "You've deployed a customer support resolution agent using the Claude Agent SDK. It has access to four tools: `get_customer`, `lookup_order`, `process_refund`, and `escalate_to_human`. Your system prompt clearly states that customer identity must be verified via `get_customer` before any refund is processed.\n\nAfter two weeks in production, you review the logs. In 92% of refund cases, the agent correctly calls `get_customer` first. In 8% of cases — specifically when the customer volunteers an order number in their opening message — the agent skips `get_customer` and goes directly to `lookup_order` followed by `process_refund`. Three of these cases resulted in refunds being issued to the wrong account. Your CFO is not amused.",
    question: 'What is the most effective fix?',
    options: [
      { id: 'A', text: 'Strengthen the system prompt with emphatic language ("You MUST call get_customer first in every case, without exception") and add three few-shot examples demonstrating the correct sequence, including one where the customer volunteers an order number.' },
      { id: 'B', text: 'Implement a PreToolUse hook that blocks `lookup_order` and `process_refund` from executing until `get_customer` has returned a verified customer ID in the current session.' },
      { id: 'C', text: 'Remove `lookup_order` from the agent\'s allowedTools until after `get_customer` has been called, dynamically updating the tool set based on session state.' },
      { id: 'D', text: 'Add a self-check step where the agent reviews its planned tool calls before execution and escalates to a human if identity verification is missing.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'A PreToolUse hook is **programmatic enforcement**, not prompt guidance. It runs deterministically, on every invocation, regardless of what the model "decides." The 8% failure rate you observed is not a prompt-quality problem — it\'s a category problem. **Prompts produce probabilistic compliance; hooks produce deterministic guarantees.** For any rule with financial or safety consequences, you want the guarantee. The hook intercepts the tool call, checks session state, and blocks execution if the prerequisite hasn\'t been satisfied. The model\'s reasoning becomes irrelevant to the enforcement — which is exactly what you want for critical paths.',
    distractors: {
      A: {
        misconception: 'Clarity equals compliance',
        explanation: 'This is the most tempting wrong answer because it works 92% of the time already, so "making the prompt stronger" feels like it should close the remaining gap. But clarity and compliance are different axes. A perfectly clear instruction can still be ignored by a probabilistic system, especially under the kind of distribution shift a volunteered order number creates. Few-shot examples help, but they also fail probabilistically. When three wrong refunds is already too many, "probably better" is not the right answer.',
      },
      C: {
        misconception: 'Tool availability is the right lever for workflow ordering',
        explanation: 'Dynamically modifying `allowedTools` mid-session sounds architecturally clever but introduces a subtler bug: the agent now receives inconsistent tool availability across turns, which degrades its reasoning about what it can do. It also doesn\'t actually solve the problem — you\'d need logic to decide when to re-enable `lookup_order`, and that logic is itself a prerequisite check, which is what a hook is. You\'ve just reinvented the hook, worse.',
      },
      D: {
        misconception: 'The model can reliably catch its own errors',
        explanation: 'Self-check steps rely on the model to audit its own reasoning, and in the exact case where the model decided to skip verification, the self-check will often rationalize that decision ("the customer provided the order number, so identity is effectively verified"). Self-review is a useful technique in many contexts, but it\'s not a substitute for deterministic enforcement on critical paths.',
      },
    },
    tags: ['hooks', 'deterministic-enforcement', 'tool-ordering'],
  },
  {
    id: 'Q02',
    number: 2,
    domain: 'agentic-architecture',
    scenario: 'You\'re building an agent that helps a small business owner manage their Etsy shop. The agent can search recent orders, draft customer replies, update inventory, and adjust prices. The owner asks: *"Reply to the angry customer from yesterday and figure out what happened with their order."* You expected the agent to use `search_orders` and `draft_reply`. Instead, it answers in plain text: *"I\'d be happy to help. Could you tell me the customer\'s name?"*\n\nThe system prompt is reasonable. The tools are well-described.',
    question: 'Why is the agent refusing to use them?',
    options: [
      { id: 'A', text: 'The agent is treating the request as conversational because the prompt phrasing ("figure out") is too vague to trigger tool use; rewriting the user\'s prompt would fix it.' },
      { id: 'B', text: 'The agent likely has its `tool_choice` set to `"auto"` and is choosing not to call tools when it judges them unnecessary — setting `tool_choice: "any"` would force it to use a tool.' },
      { id: 'C', text: 'The agent is missing the previous conversation history, so it doesn\'t know which customer "yesterday" refers to and is asking for clarification rather than guessing.' },
      { id: 'D', text: 'The agent\'s stop reason is set incorrectly, causing it to terminate the loop before reaching the tool-call stage.' },
    ],
    correctAnswer: 'C',
    correctExplanation: 'This is a **context management problem disguised as a tool-use problem**. The agent is acting reasonably given what it knows — it can\'t search orders without an identifier, and "the angry customer from yesterday" is unresolvable without conversation history. The fix is making sure the agent has access to the relevant past context, either via session continuity or by explicitly passing recent customer interactions in the prompt.',
    distractors: {
      A: {
        misconception: 'Tool use is triggered by keyword phrasing',
        explanation: 'The agent\'s reluctance has nothing to do with the verb "figure out." Rewriting prompts to be more "tool-call-friendly" is a common dead end — if the agent doesn\'t have what it needs to act, prompt rephrasing won\'t fix it.',
      },
      B: {
        misconception: 'tool_choice: "any" solves under-tool-use',
        explanation: 'Forcing a tool call here would just make the agent guess at a customer name or call a search with empty parameters. Forcing tool use when the model lacks information produces worse outcomes, not better ones. `tool_choice: "any"` is a real lever, but it\'s the wrong one for this failure mode.',
      },
      D: {
        misconception: 'Every unexpected behavior must be a control-flow bug',
        explanation: 'Stop-reason logic governs when the loop continues or terminates after a turn — it doesn\'t prevent tool calls within a turn. This option sounds technical and plausible but isn\'t how the SDK works. Students who pick D are reaching for infrastructure explanations when the actual problem is informational.',
      },
    },
    tags: ['context-management', 'tool-use', 'session-continuity'],
  },
  {
    id: 'Q03',
    number: 3,
    domain: 'agentic-architecture',
    scenario: 'Your team is building a multi-agent research system for a finance class project. A coordinator agent dispatches to three subagents: a web searcher, an SEC filings analyzer, and a synthesis agent that writes the final report. After running it on the prompt *"Analyze Tesla\'s competitive position in 2025,"* the report is coherent but the synthesis agent has invented two statistics that don\'t appear in any of the source materials.\n\nYour teammate proposes adding a "fact-checker" subagent that reviews the synthesis output and flags unsupported claims.',
    question: 'Is this the right fix?',
    options: [
      { id: 'A', text: 'Yes — adding a verification layer is the standard pattern for reducing hallucination in multi-agent systems and should be the first thing you try.' },
      { id: 'B', text: 'No — the right fix is to require the synthesis subagent to receive structured claim-source mappings from the upstream agents and preserve them through synthesis, rather than receiving prose summaries.' },
      { id: 'C', text: 'Yes — but the fact-checker should be Claude Opus rather than a smaller model, since hallucination detection requires the strongest available reasoner.' },
      { id: 'D', text: 'No — hallucinations in synthesis are unavoidable when combining multiple sources, and the right fix is to add a disclaimer in the final report rather than attempting to prevent them.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'The hallucinations aren\'t happening because there\'s no fact-checker. They\'re happening because the synthesis agent is **receiving compressed prose** from upstream agents, has lost the link between claims and their sources, and is filling gaps in its understanding by generating plausible-sounding statistics. The structural fix is upstream: require the web searcher and filings analyzer to output **structured claim-source mappings** (claim, source URL or document, supporting excerpt, date), and require the synthesis agent to preserve those mappings. When the architecture preserves provenance, the model has nothing to hallucinate around.',
    distractors: {
      A: {
        misconception: 'More agents fix more problems',
        explanation: 'Adding a fact-checker subagent is tempting because it sounds like defense-in-depth. But it adds latency, cost, and a new failure mode (the fact-checker can also be wrong), without addressing the upstream issue. You\'d be papering over a structural problem with another agent. Often the right fix in multi-agent systems is **better information flow, not more agents**.',
      },
      C: {
        misconception: 'A stronger model fixes architectural problems',
        explanation: 'Model selection rarely fixes architectural information loss. A stronger fact-checker still can\'t verify what the synthesis agent has invented if the source material it would check against is no longer in the system.',
      },
      D: {
        misconception: 'Hallucination is inherent and unfixable',
        explanation: 'This is the defeatist answer. Hallucination in multi-source synthesis is largely an architectural problem, not a model limitation. Systems that preserve provenance and require source attribution dramatically reduce hallucination. Disclaimers don\'t help users trust the output more — fixing the architecture does.',
      },
    },
    tags: ['multi-agent', 'hallucination', 'provenance'],
  },
  {
    id: 'Q04',
    number: 4,
    domain: 'agentic-architecture',
    scenario: 'You\'re designing an agent that helps the marketing team at a mid-sized e-commerce company plan campaigns. The team uses it for tasks ranging from *"write me a quick subject line for tomorrow\'s email"* to *"build a quarterly campaign strategy for our new product line."*\n\nA junior teammate proposes implementing both kinds of requests through the same fixed pipeline: (1) gather context, (2) brainstorm options, (3) evaluate options, (4) draft output, (5) review draft. They argue this gives consistency.',
    question: 'Why is this the wrong approach?',
    options: [
      { id: 'A', text: 'Fixed pipelines are always inferior to dynamic decomposition because they can\'t adapt to new request types, so the agent should generate a custom plan for every request.' },
      { id: 'B', text: 'A fixed five-step pipeline forces simple requests through unnecessary stages, increasing latency and cost, while complex requests may need adaptive subtask generation that a fixed pipeline can\'t provide — different request complexities call for different decomposition strategies.' },
      { id: 'C', text: 'The pipeline is missing a critical step — output formatting — which means the final deliverable will be inconsistent across request types regardless of what comes before.' },
      { id: 'D', text: 'Fixed pipelines work fine, but the steps should be parallelized rather than sequential to reduce latency.' },
    ],
    correctAnswer: 'B',
    correctExplanation: '**Task decomposition strategy should match task complexity.** Simple requests ("write a subject line") need maybe one step — direct generation. Complex requests ("quarterly strategy") may need adaptive decomposition where later subtasks depend on what\'s discovered earlier. Forcing both through the same five-step pipeline either over-engineers simple requests or under-serves complex ones. The right architecture is request-aware: the agent (or a routing layer) assesses complexity and chooses the appropriate decomposition pattern.',
    distractors: {
      A: {
        misconception: 'Dynamic decomposition is always better',
        explanation: 'Dynamic decomposition has real costs — unpredictability, harder debugging, higher latency, more failure modes. For predictable workflows, fixed pipelines are more reliable, not less. The right answer is matching strategy to task, not picking one strategy for all tasks.',
      },
      C: {
        misconception: 'Missing steps explain failures',
        explanation: 'Adding a formatting step doesn\'t fix the underlying mismatch between task complexity and pipeline rigidity. This option captures the instinct to "fix the pipeline" rather than question whether one pipeline should fit all cases.',
      },
      D: {
        misconception: 'Parallelization solves complexity mismatches',
        explanation: 'Parallelizing brainstorm/evaluate/draft for a "write me a subject line" request is incoherent — those steps depend on each other. Parallelization is a real optimization, but it doesn\'t address the fact that simple requests don\'t need all the steps in the first place.',
      },
    },
    tags: ['decomposition', 'task-routing', 'workflow-design'],
  },
  {
    id: 'Q05',
    number: 5,
    domain: 'agentic-architecture',
    scenario: 'Your agentic system maintains a long-running customer-support session. On turn 1, the customer mentions they\'ve been a Premium member since 2019 and are calling about a damaged shipment of three items totaling $247. On turn 8, after the agent has gathered order details, looked up policies, and drafted a resolution, the agent proposes a refund of $150 — and confidently states the customer is a **Standard** member.\n\nThe conversation history is intact and the original membership detail is still in the context window.',
    question: "What's the most likely cause?",
    options: [
      { id: 'A', text: 'The model has a training cutoff that doesn\'t include 2019 membership data, so it defaulted to "Standard" as a guess.' },
      { id: 'B', text: 'The original mention has drifted into the middle of the now-long context window where models reliably process information at the beginning and end but may overlook content in the middle — the "lost in the middle" effect.' },
      { id: 'C', text: 'The agent has been corrupted by tool outputs that overwrote the customer\'s stated membership status, and the fix is to restrict which tools can return membership data.' },
      { id: 'D', text: 'The model has confused this customer with a different customer from a parallel session, indicating a session isolation bug in the SDK.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'This is the **lost-in-the-middle effect**, a well-documented failure mode where models reliably process the start and end of long inputs but may omit information from the middle. By turn 8, the original membership mention is buried under seven turns of intermediate tool calls and reasoning. The fix is structural: extract critical case facts (membership status, claim amount, key dates) into a persistent **case facts** block that\'s re-injected into each prompt at a salient position, rather than relying on the model to retrieve them from buried conversation history.',
    distractors: {
      A: {
        misconception: 'Model failures must be training-data problems',
        explanation: 'This sounds technical but is incoherent. The customer told the agent their membership status in turn 1 — no training data is involved in retrieving that fact. Students who pick A are reaching for "the model didn\'t know" explanations when the actual problem is "the model didn\'t attend."',
      },
      C: {
        misconception: 'Incorrect outputs must come from corrupted inputs',
        explanation: 'There\'s no indication tools returned wrong data. Restricting tools wouldn\'t fix attention-position effects. This option captures the instinct to blame the most recently changed component rather than the structural property of long contexts.',
      },
      D: {
        misconception: 'Cross-session contamination is a likely failure mode',
        explanation: 'Claude doesn\'t share state across sessions. Within a single session, there\'s no "other customer" to confuse this one with. This is an attractive distractor for students who imagine LLMs as databases that can leak between queries.',
      },
    },
    tags: ['lost-in-the-middle', 'context-window', 'long-conversations'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOMAIN 2: Tool Design & MCP Integration
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'Q06',
    number: 6,
    domain: 'tool-design-mcp',
    scenario: 'You\'re building a customer service agent for an online bookstore. Two of your tools have these descriptions:\n\n- `search_books`: "Searches the book catalog."\n- `lookup_book`: "Looks up a book."\n\nIn production, the agent calls them seemingly at random — sometimes `search_books` for ISBN lookups, sometimes `lookup_book` for title searches, and occasionally calling both for the same query. Tool selection accuracy is around 60%.',
    question: "What's the highest-leverage first fix?",
    options: [
      { id: 'A', text: 'Consolidate both tools into a single `book_tool` that handles all book-related queries, removing the choice problem entirely.' },
      { id: 'B', text: 'Add 8–10 few-shot examples to the system prompt showing the correct tool for each query type.' },
      { id: 'C', text: 'Rewrite both tool descriptions to clearly differentiate purpose, expected inputs, example queries, and **when to use each one versus the other**.' },
      { id: 'D', text: 'Add a routing layer that pre-classifies user queries by type before they reach the agent.' },
    ],
    correctAnswer: 'C',
    correctExplanation: '**Tool descriptions are the primary mechanism a model uses to choose between tools.** When two descriptions are nearly identical and minimal, the model has nothing to differentiate them — and 60% accuracy is what random selection looks like for two near-identical options. The fix is the lowest-effort, highest-leverage change in the entire system: write descriptions that say what the tool does, what inputs it accepts, examples of the queries it handles, and crucially, **when to use it instead of the similar tool**. This is almost always the correct first move when tool selection is unreliable.',
    distractors: {
      A: {
        misconception: 'Consolidation simplifies decisions',
        explanation: 'Consolidating tools removes the choice problem at the cost of moving the routing logic inside the tool — you still need to decide whether to do an ISBN lookup or a title search. Now that decision is hidden from the agent and from your observability. Sometimes consolidation is right, but it\'s a structural change you make after exhausting cheaper fixes, not before.',
      },
      B: {
        misconception: 'Few-shot examples beat clear descriptions',
        explanation: 'Few-shot examples can help, but they add token overhead on every call and don\'t address the root cause: descriptions that don\'t differentiate the tools. If descriptions clearly explain when to use each tool, you may not need few-shot examples at all. Reaching for examples first is treating a symptom.',
      },
      D: {
        misconception: 'External routing is more reliable than tool descriptions',
        explanation: 'Adding a routing layer is over-engineering when the actual problem is two-line descriptions. You\'re proposing infrastructure to solve what is fundamentally a writing problem. Save routing layers for when descriptions have been fully invested in and the system still struggles.',
      },
    },
    tags: ['tool-descriptions', 'tool-selection', 'root-cause'],
  },
  {
    id: 'Q07',
    number: 7,
    domain: 'tool-design-mcp',
    scenario: 'Your agent integrates with a payment processing MCP server. When the payment API is down, the tool currently returns:\n\n```json\n{ "error": "Operation failed" }\n```\n\nYou notice the agent handles this poorly — it sometimes retries indefinitely, sometimes apologizes to the customer and gives up, and sometimes invents alternative explanations like "the customer\'s card may have been declined."',
    question: "What's the right fix?",
    options: [
      { id: 'A', text: 'Configure the MCP tool to retry internally up to five times before returning any error, so transient failures never reach the agent.' },
      { id: 'B', text: 'Return structured error metadata including `errorCategory` (transient/validation/business/permission), `isRetryable` boolean, and a human-readable description so the agent can make appropriate recovery decisions.' },
      { id: 'C', text: 'Strip the error message entirely and have the tool return `null` on failure, since the agent handles missing data more gracefully than error messages.' },
      { id: 'D', text: 'Add a system prompt instruction telling the agent that "Operation failed" means the payment system is down and to inform the customer accordingly.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'The agent\'s erratic behavior is a direct consequence of a uniform error response. *"Operation failed"* gives the agent no information about why the operation failed, so it can\'t choose between retry, escalation, and graceful degradation appropriately. **Structured error metadata** — category (transient vs. validation vs. business rule vs. permission), retryability, and a human-readable description — lets the agent make principled recovery decisions. Transient errors get retried; business rule violations get explained to the customer; permission errors get escalated. The agent\'s "intelligence" about errors comes from the information you give it.',
    distractors: {
      A: {
        misconception: 'Hiding errors from the agent is safer than exposing them',
        explanation: 'Internal retries are sometimes appropriate, but doing five blind retries on every failure burns time and money on validation errors that will never succeed. And when retries are exhausted, you\'re back to the same uninformative error. Hiding error structure from the agent removes its ability to reason about recovery.',
      },
      C: {
        misconception: 'Missing data is preferable to error data',
        explanation: 'Returning `null` on failure conflates two completely different states — "the operation failed" and "the operation succeeded with no result." The agent now can\'t distinguish between "payment system down" and "no transactions found for this customer." Information loss is rarely the right move.',
      },
      D: {
        misconception: 'Prompt instructions can substitute for structured data',
        explanation: 'You\'re trying to interpret an opaque error message via a system prompt instruction, which is fragile and doesn\'t generalize. When the error becomes "Operation failed: timeout after 30s," your prompt is now misleading. Build the structure into the data, not workarounds in the prompt.',
      },
    },
    tags: ['error-handling', 'mcp', 'structured-errors'],
  },
  {
    id: 'Q08',
    number: 8,
    domain: 'tool-design-mcp',
    scenario: 'You\'re designing a research agent for a marketing analytics team. You\'re tempted to give it a powerful tool: `web_action`, which can browse any URL, extract any content, and submit any form. One tool, maximum flexibility.\n\nYour colleague pushes back, suggesting three narrower tools instead: `fetch_article` (validates that the URL points to an article and returns clean text), `fetch_pricing_page` (extracts structured pricing data from a vendor page), and `submit_lead_form` (only submits forms on whitelisted domains).',
    question: 'Which approach is better, and why?',
    options: [
      { id: 'A', text: 'The single `web_action` tool, because flexibility lets the agent handle novel scenarios without requiring you to anticipate every use case in advance.' },
      { id: 'B', text: 'The three narrower tools, because constrained tools have clearer success criteria, fewer failure modes, better error messages, and don\'t require the agent to figure out how to use a general capability for a specific purpose.' },
      { id: 'C', text: 'The single `web_action` tool, because three narrower tools fragment the agent\'s attention and require it to pick from too many options.' },
      { id: 'D', text: 'Either is fine — tool design is a stylistic choice and doesn\'t meaningfully affect agent reliability.' },
    ],
    correctAnswer: 'B',
    correctExplanation: '**Narrow, purpose-specific tools dramatically outperform general-purpose tools in agent systems.** They have clearer descriptions ("when do I use this?" is obvious), validated inputs (the agent can\'t accidentally submit a form on a random domain), structured outputs (pricing data comes back as fields, not raw HTML), and better error messages (failures are scoped). The agent doesn\'t have to reason about how to use a general capability for a specific purpose — the tool encodes that knowledge. This is a recurring lesson: **constrain your tools to known good paths** rather than handing the agent a Swiss Army knife.',
    distractors: {
      A: {
        misconception: 'Maximum flexibility maximizes capability',
        explanation: 'Flexibility sounds like a virtue and sometimes is, but for production agents it usually trades reliability for surface area. The agent now has to figure out, for every request, how to use `web_action` correctly — which URL formats work, how to extract structured data from arbitrary HTML, when submitting forms is allowed. Each of these is a place to fail.',
      },
      C: {
        misconception: 'More tools always means worse selection',
        explanation: 'It\'s true that 18 tools is worse than 4–5 for selection accuracy. But three well-differentiated tools is not "too many" — it\'s the right resolution for a research agent. The selection-degradation effect happens when tools are numerous and overlapping. Three distinct tools are easier to select among than one ambiguous one.',
      },
      D: {
        misconception: 'Tool design is cosmetic',
        explanation: 'Tool design is one of the highest-leverage decisions in agent architecture. It determines reliability, observability, error handling, and the agent\'s effective capability. "Either is fine" is the answer of someone who hasn\'t shipped agents to production.',
      },
    },
    tags: ['tool-design', 'narrow-tools', 'reliability'],
  },
  {
    id: 'Q09',
    number: 9,
    domain: 'tool-design-mcp',
    scenario: 'You\'re building an internal tool for your company\'s HR department using Claude Code with MCP integrations. Your team needs three integrations:\n\n- a shared **Jira** server (everyone uses this)\n- a personal **Notion** workspace (each person has their own)\n- an experimental **scratch** server you\'re prototyping',
    question: 'Where should each be configured?',
    options: [
      { id: 'A', text: 'All three in the project\'s `.mcp.json`, so the configuration is version-controlled and consistent across the team.' },
      { id: 'B', text: 'All three in each user\'s `~/.claude.json`, so individual users can customize without affecting the project repo.' },
      { id: 'C', text: 'Jira in `.mcp.json` (project-scoped, shared via version control); Notion and the experimental server in `~/.claude.json` (user-scoped, personal).' },
      { id: 'D', text: 'Create a separate Git branch for each MCP configuration to isolate them.' },
    ],
    correctAnswer: 'C',
    correctExplanation: '**Project-scoped configuration** (`.mcp.json`) is for shared team infrastructure that everyone needs and that should be version-controlled. **User-scoped configuration** (`~/.claude.json`) is for personal or experimental setups that shouldn\'t be imposed on teammates. Jira fits the first category — it\'s shared team tooling. Personal Notion workspaces and experimental scratch servers fit the second — they\'re individual, and committing them to the project would either expose private workspaces or pollute the team\'s environment with half-finished experiments. Use environment variable expansion (e.g., `${JIRA_TOKEN}`) for credentials so the project file can be committed safely.',
    distractors: {
      A: {
        misconception: 'Consistency means putting everything in one place',
        explanation: 'Putting personal Notion workspaces in the project repo would mean every team member sees and potentially attempts to authenticate against everyone else\'s personal workspace. And the experimental scratch server probably shouldn\'t exist for teammates yet. "Version-controlled and consistent" applies to shared infrastructure, not personal tools.',
      },
      B: {
        misconception: 'User-scoped configuration is always more flexible',
        explanation: 'Putting Jira in user-scoped config means every team member has to set up Jira independently, with no shared standard, and a new hire has nothing to pull from. Shared infrastructure belongs in shared configuration.',
      },
      D: {
        misconception: 'Branches are an organizational tool for configuration',
        explanation: 'Git branches isolate code changes, not runtime configurations. Multiple users can\'t be on different branches simultaneously to get different MCP servers — that\'s not how branches work.',
      },
    },
    tags: ['mcp-config', 'scoping', 'team-tooling'],
  },
  {
    id: 'Q10',
    number: 10,
    domain: 'tool-design-mcp',
    scenario: 'A teammate added an MCP server providing a powerful `analyze_codebase` tool that can scan an entire repo and return structured architectural insights. But in practice, when the agent needs to find function callers or understand code structure, it almost always reaches for the built-in `Grep` tool instead — even when `analyze_codebase` would give better results.\n\nThe MCP tool description currently reads: *"Analyzes the codebase."*',
    question: "What's the most likely cause and fix?",
    options: [
      { id: 'A', text: 'The model has a built-in preference for native tools over MCP tools and the only fix is forcing tool choice via `tool_choice: {"type": "tool", "name": "analyze_codebase"}`.' },
      { id: 'B', text: 'The minimal description gives the model no reason to prefer `analyze_codebase` over the well-known `Grep`. Expanding the description to explain capabilities, expected outputs, and the kinds of queries it handles best would dramatically improve adoption.' },
      { id: 'C', text: 'MCP tools have higher latency than built-in tools, so the model is correctly choosing the faster option even at the cost of result quality.' },
      { id: 'D', text: 'The agent should be explicitly told in the system prompt to "always prefer MCP tools over built-in tools when available."' },
    ],
    correctAnswer: 'B',
    correctExplanation: '**Tool selection is driven by descriptions.** *"Analyzes the codebase"* tells the model almost nothing — it doesn\'t explain what kind of analysis, what inputs the tool expects, what outputs it returns, or when it\'s the right choice over alternatives. Meanwhile, `Grep` has clear semantics the model already understands deeply. The fix is to invest in the MCP tool description: explain that it returns structured architectural insights including dependency graphs, exports, and call hierarchies; give example queries it handles best; explicitly contrast it with line-level search tools like `Grep`. Good descriptions don\'t just describe the tool — they help the model decide **when** to choose this one.',
    distractors: {
      A: {
        misconception: 'Model preferences are fixed and require override',
        explanation: 'There\'s no built-in bias against MCP tools. The model picks tools based on description quality and apparent fit. Forcing tool choice solves the symptom but doesn\'t help the model learn when this tool is appropriate — and you can\'t force tool choice on every relevant query manually.',
      },
      C: {
        misconception: 'Latency drives tool selection',
        explanation: 'The model isn\'t aware of tool latency and doesn\'t optimize for speed. This is anthropomorphizing the model\'s behavior. The actual issue is information, not performance.',
      },
      D: {
        misconception: 'Prompt-level overrides fix tool selection',
        explanation: '"Always prefer MCP tools" is a blunt instruction that will cause the model to use MCP tools even when they\'re not the right fit. The model needs to understand **when** each tool applies, which is what descriptions are for. A blanket prompt rule replaces nuanced selection with crude preference.',
      },
    },
    tags: ['tool-descriptions', 'mcp', 'tool-selection'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOMAIN 3: Claude Code Configuration & Workflows
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'Q11',
    number: 11,
    domain: 'claude-code-config',
    scenario: 'You\'re the lead developer on a Suffolk student team building a class project in Claude Code. You\'ve written excellent coding standards and want every teammate to follow them automatically when they pull the repo. You put them in `~/.claude/CLAUDE.md` on your laptop.\n\nA week later, three teammates report that Claude is ignoring the standards.',
    question: "What's going on?",
    options: [
      { id: 'A', text: 'Claude Code\'s memory cache needs to be cleared with `/memory clear` for new instructions to take effect.' },
      { id: 'B', text: '`~/.claude/CLAUDE.md` is user-scoped — it lives on your machine and isn\'t shared with teammates via version control. Project-wide standards belong in the repo\'s `.claude/CLAUDE.md` or root `CLAUDE.md`.' },
      { id: 'C', text: 'The standards file needs to be named `STANDARDS.md` rather than `CLAUDE.md` for Claude Code to recognize it as project-scoped.' },
      { id: 'D', text: 'Your teammates need to manually run `claude --import ~/.claude/CLAUDE.md` to load your personal configuration.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'The CLAUDE.md hierarchy has three levels: **user-scoped** (`~/.claude/CLAUDE.md`, personal to each developer, not shared), **project-scoped** (`.claude/CLAUDE.md` or `CLAUDE.md` in the repo, shared via version control), and **directory-scoped** (subdirectory `CLAUDE.md` files for area-specific conventions). Standards that should apply to the whole team must be committed to the project repo. Putting them in your home directory means they apply only to you.',
    distractors: {
      A: {
        misconception: 'Caching explains missing behavior',
        explanation: 'There\'s no memory cache that needs clearing — teammates simply never received the file because it was never in the repo.',
      },
      C: {
        misconception: 'The filename determines recognition',
        explanation: 'The file is correctly named `CLAUDE.md`. The issue is location, not name.',
      },
      D: {
        misconception: 'There\'s a manual import command for personal configs',
        explanation: 'No such command exists. User-scoped configs are intentionally per-user; sharing them requires moving them into the project repo.',
      },
    },
    tags: ['claude-md', 'config-scoping', 'team-workflows'],
  },
  {
    id: 'Q12',
    number: 12,
    domain: 'claude-code-config',
    scenario: 'Your marketing operations team uses an agentic system to draft three kinds of outputs: customer email campaigns, internal Slack announcements, and quarterly board reports. Each has different conventions — emails follow brand voice guidelines and CAN-SPAM compliance, Slack messages use the team\'s casual house style, and board reports follow a strict executive-summary format with specific section headings.\n\nDifferent team members work on different output types from across the codebase — there\'s no single "emails" folder or "board reports" folder. The drafts are organized by client and campaign instead.',
    question: 'How should you configure Claude Code so the right conventions are applied automatically based on what\'s being drafted, regardless of which client folder the file lives in?',
    options: [
      { id: 'A', text: 'Put all conventions in a single root `CLAUDE.md` with sections for each output type, relying on Claude to figure out which section applies to the current file.' },
      { id: 'B', text: 'Create separate `CLAUDE.md` files in dedicated `email/`, `slack/`, and `board-reports/` directories, then ask the team to organize files into those folders.' },
      { id: 'C', text: 'Create files in `.claude/rules/` with YAML frontmatter glob patterns matching by file naming convention (e.g., `paths: ["**/*.email.md"]` for emails, `paths: ["**/*.board.md"]` for board reports), so conventions apply by file type regardless of folder.' },
      { id: 'D', text: 'Include the conventions as comments at the top of each file so Claude reads them as it edits.' },
    ],
    correctAnswer: 'C',
    correctExplanation: '**Path-specific rules with glob patterns** apply conventions based on file type rather than folder location, which is exactly what you need when the same client folder might contain emails, Slack messages, and board reports. The patterns match by naming convention (e.g., `.email.md` suffix), so a board report draft loads board-report conventions automatically, no matter which client\'s folder it\'s in.',
    distractors: {
      A: {
        misconception: 'One big file with sections is cleaner',
        explanation: 'Asking Claude to figure out which section applies adds inference where explicit matching would be more reliable. It also loads every convention into every context, even when only one applies.',
      },
      B: {
        misconception: 'Reorganize the work to fit the tooling',
        explanation: 'Asking the team to restructure their entire content organization to suit the tool is backwards. Tools should adapt to how the team actually works, not the other way around.',
      },
      D: {
        misconception: 'File-level reminders are better than centralized configuration',
        explanation: 'Comments at the top of every file are fragile, redundant, and pollute the documents themselves. They also drift out of sync over time as conventions evolve.',
      },
    },
    tags: ['claude-md', 'rules', 'glob-patterns'],
  },
  {
    id: 'Q13',
    number: 13,
    domain: 'claude-code-config',
    scenario: 'You\'re redesigning how customer escalations flow across your company\'s customer service, billing, and engineering teams. The redesign will touch about 40 standard operating procedure documents, change how three different ticketing tools integrate, and requires choosing between two competing approaches: a hub-and-spoke model where customer service routes everything, or a direct-handoff model where teams hand off to each other based on tags.\n\nYou\'re working in Claude Code with the team\'s process documentation.',
    question: 'Which approach should you take?',
    options: [
      { id: 'A', text: 'Direct execution with detailed instructions covering each document and integration upfront, working through them sequentially.' },
      { id: 'B', text: 'Direct execution starting with one team\'s procedures and letting the right approach emerge as you go.' },
      { id: 'C', text: 'Plan mode first — explore the current procedures, weigh the hub-and-spoke vs. direct-handoff tradeoffs, design the implementation sequence, then move to direct execution once the approach is settled.' },
      { id: 'D', text: 'Skip planning entirely; the documentation will reveal the right structure once you start editing.' },
    ],
    correctAnswer: 'C',
    correctExplanation: '**Plan mode is built for exactly this kind of work** — large scope, multiple valid architectural approaches, cross-cutting changes that affect many documents. Diving into direct execution without exploring the current state and committing to an approach almost guarantees you\'ll discover something halfway through that requires re-doing earlier work. Plan first; execute once the plan is solid.',
    distractors: {
      A: {
        misconception: 'Detailed upfront instructions substitute for exploration',
        explanation: 'Detailed instructions presume you already know which approach is right — but the whole task involves choosing between two approaches, which requires exploration first.',
      },
      B: {
        misconception: 'Emergent design beats designed architecture at scale',
        explanation: '"Letting the approach emerge" produces inconsistent procedures and forces later documents to work around early decisions made without full information. For cross-cutting changes, this is especially dangerous.',
      },
      D: {
        misconception: 'Planning is overhead you can skip',
        explanation: 'Skipping the design phase on a 40-document, multi-team change is how you end up redoing the work.',
      },
    },
    tags: ['plan-mode', 'large-changes', 'workflow-design'],
  },
  {
    id: 'Q14',
    number: 14,
    domain: 'claude-code-config',
    scenario: 'You want every developer on your team to have access to a custom `/test-and-review` slash command that runs your team\'s specific testing protocol.',
    question: 'Where do you put the command file?',
    options: [
      { id: 'A', text: '`~/.claude/commands/test-and-review.md` on each developer\'s machine.' },
      { id: 'B', text: '`.claude/commands/test-and-review.md` in the project repository, committed to version control.' },
      { id: 'C', text: 'A `commands` array in a top-level `.claude/config.json` file.' },
      { id: 'D', text: "Inside the project's `CLAUDE.md` as a section titled \"Custom Commands.\"" },
    ],
    correctAnswer: 'B',
    correctExplanation: 'Project-scoped slash commands live in `.claude/commands/` within the repo. They\'re version-controlled, automatically available to anyone who clones or pulls the project, and travel with the codebase.',
    distractors: {
      A: {
        misconception: 'Per-user setup ensures availability',
        explanation: 'User-scoped commands require every developer to install them independently and don\'t propagate to new team members. They\'re for personal commands you don\'t want to share, not for team standards.',
      },
      C: {
        misconception: 'There\'s a unified config file pattern',
        explanation: 'No such `.claude/config.json` commands array exists. This option fabricates a plausible-sounding configuration mechanism that students might assume exists.',
      },
      D: {
        misconception: 'CLAUDE.md is the configuration catch-all',
        explanation: '`CLAUDE.md` is for instructions and context, not command definitions. Slash commands are a distinct mechanism with their own location.',
      },
    },
    tags: ['slash-commands', 'team-tooling', 'config-scoping'],
  },
  {
    id: 'Q15',
    number: 15,
    domain: 'claude-code-config',
    scenario: 'Your operations team has set up an automated job that runs every morning at 6 AM to generate the daily customer feedback summary. The script calls Claude Code with a prompt to analyze yesterday\'s tickets and produce a Markdown summary.\n\nThe job has been hanging indefinitely, and your CTO is annoyed. Logs show Claude Code is waiting for interactive input.',
    question: "What's the fix?",
    options: [
      { id: 'A', text: 'Add the `-p` (or `--print`) flag to run Claude Code in non-interactive mode: `claude -p "Analyze yesterday\'s tickets..."`.' },
      { id: 'B', text: 'Set an environment variable like `CLAUDE_AUTO=true` to bypass interactive prompts.' },
      { id: 'C', text: 'Pipe `/dev/null` into stdin to fake an empty user input.' },
      { id: 'D', text: 'Add a `--cron` flag specifically designed for scheduled jobs.' },
    ],
    correctAnswer: 'A',
    correctExplanation: 'The `-p` (or `--print`) flag is the documented way to run Claude Code non-interactively. It processes the prompt, prints the result to stdout, and exits — exactly what an automated job needs.',
    distractors: {
      B: {
        misconception: 'Every tool has an env-var bypass',
        explanation: '`CLAUDE_AUTO` isn\'t a real variable. This option captures the instinct to look for environment configuration when the actual fix is a CLI flag.',
      },
      C: {
        misconception: 'Shell tricks substitute for proper CLI flags',
        explanation: 'Redirecting stdin from `/dev/null` is a workaround that doesn\'t reliably address Claude Code\'s expected invocation pattern. `-p` is the documented, supported approach.',
      },
      D: {
        misconception: 'Scheduled jobs need their own dedicated flag',
        explanation: 'Cron scheduling is the operating system\'s concern. Claude Code just needs to run non-interactively, which `-p` handles regardless of what\'s invoking it.',
      },
    },
    tags: ['cli', 'non-interactive', 'automation'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOMAIN 4: Prompt Engineering & Structured Output
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'Q16',
    number: 16,
    domain: 'prompt-engineering',
    scenario: 'You\'re building a tool that extracts structured data from invoices uploaded by accounting clerks. About 5% of the time, the model returns JSON that\'s missing closing braces or has trailing commas, causing your downstream parser to crash.',
    question: "What's the most reliable fix?",
    options: [
      { id: 'A', text: 'Add an instruction to the system prompt: "Make sure all JSON is syntactically valid before returning."' },
      { id: 'B', text: 'Use `tool_use` with a JSON schema definition — the model is constrained to produce schema-compliant output and JSON syntax errors are eliminated.' },
      { id: 'C', text: "Wrap the model's output in a try/catch and use a JSON repair library to fix malformed responses before parsing." },
      { id: 'D', text: 'Add three few-shot examples showing perfectly formatted JSON output.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'When you use `tool_use` with a JSON schema, the model is **constrained** to produce output that matches the schema — JSON syntax errors are structurally eliminated. This is the most reliable approach for guaranteed schema-compliant output. Note that this prevents *syntax* errors but not *semantic* errors (like a number going in the wrong field) — those need separate validation. But for the specific problem of malformed JSON, tool use is the right answer.',
    distractors: {
      A: {
        misconception: 'Prompt instructions enforce structural correctness',
        explanation: 'Asking the model to "make sure JSON is valid" relies on probabilistic compliance for a problem that has a deterministic solution. The model is *trying* to produce valid JSON; it\'s failing 5% of the time. More instructions won\'t fix what is fundamentally a constraint problem.',
      },
      C: {
        misconception: 'Post-hoc repair is preferable to prevention',
        explanation: 'JSON repair libraries are useful as a last-resort safety net, but using them as your primary approach hides the fact that your extraction is producing malformed output. You\'re treating the symptom and accepting that some fields will be guessed at by a repair library, which can introduce subtle data corruption.',
      },
      D: {
        misconception: 'Examples eliminate format errors',
        explanation: 'Few-shot examples can reduce error rates, but they don\'t structurally eliminate them — they\'re still probabilistic. For format correctness, structural constraint (tool use) beats demonstration (examples) every time.',
      },
    },
    tags: ['structured-output', 'tool-use', 'json-schema'],
  },
  {
    id: 'Q17',
    number: 17,
    domain: 'prompt-engineering',
    scenario: 'Your extraction tool pulls product information from supplier catalogs. The schema includes a `discontinued_date` field — but for products that aren\'t discontinued, the date doesn\'t exist in the source document.\n\nThe model is fabricating dates like `"2099-12-31"` or `"N/A"` or `"unknown"` to populate the field.',
    question: "What's the right schema-level fix?",
    options: [
      { id: 'A', text: 'Make `discontinued_date` a required field but instruct the model in the prompt to "only fill it in if the date appears in the document."' },
      { id: 'B', text: 'Define `discontinued_date` as **nullable** in the schema — when the source doesn\'t contain a date, the model returns `null` rather than fabricating one.' },
      { id: 'C', text: 'Remove `discontinued_date` from the schema entirely and have the model add it as a free-form note when relevant.' },
      { id: 'D', text: 'Use a default value like `1900-01-01` to indicate "not discontinued" and document this convention for downstream consumers.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'When a field may not exist in source documents, the schema should make that explicit by allowing `null`. The model then has a legitimate way to indicate absence and stops needing to fabricate values. This is one of the most common schema design mistakes — treating every field as required forces the model to invent content when the source is silent. **Optional/nullable fields are not a weakness in the schema; they\'re an honest reflection of what data is and isn\'t available.**',
    distractors: {
      A: {
        misconception: 'Prompt instructions can override schema constraints',
        explanation: 'If the schema requires the field, the model has to produce something. "Only fill it in when the date appears" contradicts the schema\'s requirement, and the model defaults to producing some value to satisfy the structure. Schema and prompt have to agree.',
      },
      C: {
        misconception: 'Removing fields is the fix for messy data',
        explanation: 'Removing structured fields and replacing them with free-form notes destroys downstream parseability. You\'d be solving a fabrication problem by abandoning structure entirely.',
      },
      D: {
        misconception: 'Sentinel values are a clean solution',
        explanation: 'Sentinel dates like `1900-01-01` are a classic anti-pattern. Every downstream consumer has to know about the convention, missed conversions cause bugs (the system thinks a product was discontinued in 1900), and you\'ve created a domain-specific magic value where `null` would have been universally understood.',
      },
    },
    tags: ['schema-design', 'nullable-fields', 'fabrication'],
  },
  {
    id: 'Q18',
    number: 18,
    domain: 'prompt-engineering',
    scenario: 'Your code review agent flags issues in pull requests. The team is increasingly frustrated because it produces false positives at a high rate — flagging stylistic patterns that match the team\'s actual conventions, complaining about defensive null checks the team explicitly wants, and sometimes contradicting itself across files.\n\nThe current prompt says: *"Review this pull request and report any issues. Be conservative and only report high-confidence findings."*',
    question: "What's the most effective revision?",
    options: [
      { id: 'A', text: 'Strengthen the conservativeness language: "Be EXTREMELY conservative. Only report findings with overwhelming confidence."' },
      { id: 'B', text: 'Replace "be conservative" with **explicit categorical criteria**: define which categories of issues to report (security vulnerabilities, logic bugs, race conditions) versus which to skip (style preferences, minor inefficiencies, patterns that match existing code).' },
      { id: 'C', text: 'Have the agent self-rate confidence on each finding (1–10) and filter to only those above 8.' },
      { id: 'D', text: "Reduce the model's temperature to make outputs more deterministic." },
    ],
    correctAnswer: 'B',
    correctExplanation: '*"Be conservative"* and *"high confidence"* are vague instructions that don\'t define what counts as a valid finding. The model\'s calibration of "confidence" doesn\'t necessarily match yours. Replacing vague guidance with **explicit categorical criteria** — what to report and what to skip — gives the model the actual decision boundary you want. This is one of the most common and high-leverage prompt engineering moves: **replace adjectives with categories**.',
    distractors: {
      A: {
        misconception: 'Emphasis improves vague instructions',
        explanation: 'Adding emphasis ("EXTREMELY") to vague instructions doesn\'t make them less vague. The model still doesn\'t know which categories you care about. This is a common mistake — escalating tone to compensate for missing structure.',
      },
      C: {
        misconception: 'Self-reported confidence is well-calibrated',
        explanation: 'Model self-rated confidence is poorly calibrated, especially for false positives — by definition the model doesn\'t know it\'s wrong, or it wouldn\'t be reporting the finding in the first place. Filtering by self-reported confidence often filters out correct findings while leaving false positives untouched.',
      },
      D: {
        misconception: 'Temperature controls correctness',
        explanation: 'Temperature affects randomness in token selection, not which findings the model considers valid. Lowering temperature might make the same wrong findings appear more consistently, which is the opposite of what you want.',
      },
    },
    tags: ['prompt-engineering', 'categorical-criteria', 'false-positives'],
  },
  {
    id: 'Q19',
    number: 19,
    domain: 'prompt-engineering',
    scenario: 'You\'re extracting research methodology details from academic papers. Some papers describe methods inline in narrative paragraphs (*"We collected 1,200 survey responses over six weeks…"*); others use a structured "Methodology" section with subheadings; others scatter relevant details across multiple sections.\n\nYour extraction quality is inconsistent across these formats.',
    question: 'Which intervention will most improve it?',
    options: [
      { id: 'A', text: 'Add a preprocessing step that converts all papers to a uniform Markdown format before extraction.' },
      { id: 'B', text: 'Add 3–4 few-shot examples that show successful extraction from each varied format — a paper with inline methodology, a paper with a structured section, a paper with scattered details.' },
      { id: 'C', text: 'Switch to a larger model with a longer context window to handle the variation in format.' },
      { id: 'D', text: 'Run the extraction three times and take the most common answer.' },
    ],
    correctAnswer: 'B',
    correctExplanation: '**Few-shot examples are particularly effective for handling format variation** because they demonstrate to the model how to extract from different structural patterns. The model learns: "given a narrative-style paper, here\'s what extraction looks like; given a structured paper, here\'s what extraction looks like." This is one of few-shot prompting\'s strongest use cases — teaching the model to generalize across surface variations to find the underlying information.',
    distractors: {
      A: {
        misconception: 'Normalization simplifies extraction',
        explanation: 'Converting papers to uniform Markdown is a major undertaking that doesn\'t necessarily preserve the structural cues the model uses. And the same kinds of variation (scattered vs. structured information) will exist in the converted output. You\'re shifting the problem, not solving it.',
      },
      C: {
        misconception: 'More capable models eliminate format sensitivity',
        explanation: 'Larger models help with many things, but format variation is largely a prompting problem, not a capability problem. Few-shot examples cost less and address the issue more directly.',
      },
      D: {
        misconception: 'Ensembling fixes inconsistency',
        explanation: 'Running three extractions and taking the consensus is expensive and addresses output variance, not the underlying format-handling problem. If the model handles narrative-style papers poorly, three runs will probably all be wrong in the same way.',
      },
    },
    tags: ['few-shot', 'prompt-engineering', 'format-variation'],
  },
  {
    id: 'Q20',
    number: 20,
    domain: 'prompt-engineering',
    scenario: 'Your team is generating nightly summaries of customer support tickets across thousands of tickets. The job runs overnight, and results are reviewed the next morning. Your manager suggests switching from real-time API calls to the **Message Batches API** to save 50% on costs.\n\nThe same team also runs a real-time pre-deploy check that must complete in under 60 seconds before code can be merged. The manager wants to switch this to Message Batches too.',
    question: "What's the right call?",
    options: [
      { id: 'A', text: 'Switch both to Message Batches — the cost savings are too significant to ignore, and most batches complete much faster than the 24-hour SLA anyway.' },
      { id: 'B', text: 'Keep both as real-time API calls — Message Batches add operational complexity not worth the savings.' },
      { id: 'C', text: 'Switch the nightly summaries to Message Batches; keep the pre-deploy check as a real-time API call.' },
      { id: 'D', text: 'Switch both to Message Batches but configure a 60-second timeout fallback to real-time for the pre-deploy check.' },
    ],
    correctAnswer: 'C',
    correctExplanation: 'Message Batches offer 50% cost savings but with up to a **24-hour processing window** and no guaranteed latency SLA. That makes them ideal for non-blocking, latency-tolerant workloads — overnight summaries are a textbook fit. They\'re inappropriate for blocking workflows where someone is waiting on the result, like a 60-second pre-deploy check. **Match the API to the workload\'s latency tolerance**: synchronous for blocking, batch for asynchronous.',
    distractors: {
      A: {
        misconception: 'Typical performance is acceptable for blocking workflows',
        explanation: '"Most batches complete faster" isn\'t an acceptable guarantee for a workflow that must complete in 60 seconds. Tail latency on a batch could be hours. Optimistic averages are not a foundation for blocking workflows.',
      },
      B: {
        misconception: 'Operational simplicity beats cost optimization',
        explanation: 'The cost difference is significant on workloads of any scale, and Message Batches aren\'t operationally complex for non-blocking jobs. Refusing to use them at all forfeits real savings on workloads where they\'re a perfect fit.',
      },
      D: {
        misconception: 'Timeouts make any API suitable for blocking workflows',
        explanation: 'A timeout fallback adds complexity and doesn\'t actually save time on the affected runs — you\'ve still waited 60 seconds before falling back, then need to make the real-time call. Net latency is worse than just using real-time from the start.',
      },
    },
    tags: ['message-batches', 'cost-optimization', 'workload-routing'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOMAIN 5: Context Management & Reliability
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'Q21',
    number: 21,
    domain: 'context-management',
    scenario: 'Your customer support agent tracks complex cases over many turns. On turn 1, a customer states: *"My order #44872 for $312 was supposed to arrive on March 14 but it\'s now March 22 and tracking hasn\'t updated since the 16th."*\n\nBy turn 12, after the agent has gathered details, looked up policies, drafted resolution options, and processed two tool calls, the agent\'s summary reads: *"Customer is reporting a delayed shipment from earlier this month."*\n\nThe financial detail, dates, and order number have been compressed away.',
    question: "What's the best architectural fix?",
    options: [
      { id: 'A', text: 'Increase the `max_tokens` limit so the agent doesn\'t compress as aggressively.' },
      { id: 'B', text: 'Extract transactional facts (order number, amount, dates, status) into a persistent **case facts** block that\'s included in every prompt, separate from the summarized conversation history.' },
      { id: 'C', text: 'Instruct the agent in the system prompt to "never compress numerical details, dates, or order numbers."' },
      { id: 'D', text: 'Switch to a model with a larger context window so the original turn 1 message is always preserved verbatim.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'Progressive summarization is one of the major reliability hazards in long-running agentic conversations. Models compress legitimately long histories but tend to lose precise facts (numbers, dates, identifiers) in the process. The architectural fix is to extract critical facts into a **structured, persistent block** that\'s included in every prompt — separate from the summarized conversation flow. The summary handles narrative; the case facts block handles precision. This separation gives you both compression and fidelity on what matters.',
    distractors: {
      A: {
        misconception: 'More tokens prevents compression',
        explanation: '`max_tokens` controls *output* length, not how the agent summarizes context. And even if you somehow disabled all compression, eventually conversations exceed any context window — compression has to happen somewhere.',
      },
      C: {
        misconception: 'Instructions prevent compression behaviors',
        explanation: 'Asking the model to "never compress numerical details" relies on probabilistic compliance for a property that compression dynamics will violate. The model is summarizing because it\'s optimizing the use of context — it can\'t both summarize and preserve every detail.',
      },
      D: {
        misconception: 'Longer context windows solve precision loss',
        explanation: 'Larger context windows help, but they don\'t prevent the lost-in-the-middle effect, and they don\'t fix the underlying issue: facts that need to be referenced repeatedly across many turns should not be buried in conversation history at all. Architecture beats raw capacity.',
      },
    },
    tags: ['context-management', 'summarization', 'persistent-facts'],
  },
  {
    id: 'Q22',
    number: 22,
    domain: 'context-management',
    scenario: 'A subagent in your research system encounters a timeout while searching academic databases. You\'re designing what it returns to the coordinator agent.',
    question: 'Which response is most useful?',
    options: [
      { id: 'A', text: '`{ "status": "error", "message": "Search failed" }`' },
      { id: 'B', text: 'A structured error: `{ "status": "error", "errorType": "timeout", "attemptedQuery": "fast fashion supply chain emissions 2023", "partialResults": [3 partial results that were retrieved before timeout], "suggestedNextStep": "retry with narrower query or alternative source" }`' },
      { id: 'C', text: 'Empty results returned as success: `{ "status": "success", "results": [] }`' },
      { id: 'D', text: 'Throwing an exception that propagates up and terminates the entire workflow.' },
    ],
    correctAnswer: 'B',
    correctExplanation: '**Structured error context is what enables intelligent recovery in multi-agent systems.** The coordinator can see what failed, what was tried, what partial results came back, and what alternative paths exist. With this information, the coordinator can decide: retry the original query, retry with a narrower query, route to a different source, proceed with partial results and annotate the gap, or escalate. Generic error messages strip away the information needed to make any of those choices.',
    distractors: {
      A: {
        misconception: 'Error messages just need to indicate failure',
        explanation: '"Search failed" is true but useless. The coordinator can\'t distinguish between a transient timeout and a permanent failure, doesn\'t know what was attempted, and has nothing to retry against. Generic error messages force generic recovery (or no recovery at all).',
      },
      C: {
        misconception: 'Failures should be hidden as empty success',
        explanation: 'Returning empty results as success is the worst option — it actively misleads the coordinator into thinking the search succeeded with no matches, which is semantically very different from "the search failed." The coordinator might confidently report "no information available on this topic" when in reality information might exist but the search timed out.',
      },
      D: {
        misconception: 'Errors should propagate upward to terminate workflows',
        explanation: 'A single subagent timeout shouldn\'t kill the entire research workflow when other subagents are succeeding and recovery strategies exist. Terminating on first failure is what you do when you\'ve given up on recovery, not what you do as a default.',
      },
    },
    tags: ['structured-errors', 'multi-agent', 'recovery'],
  },
  {
    id: 'Q23',
    number: 23,
    domain: 'context-management',
    scenario: 'Your customer support agent is mid-conversation with a frustrated customer about a delayed shipment. The agent has just finished looking up the order and identified that a refund-and-replace is straightforward and approved by policy. The customer\'s next message arrives: *"I\'m done with this. Get me a human."*\n\nThe agent has the resolution ready. It would take one tool call to execute.',
    question: 'Should the agent surface the resolution first, or escalate immediately?',
    options: [
      { id: 'A', text: 'Surface the resolution first — the agent has a one-step fix the customer will likely accept, and escalating now wastes both the customer\'s time waiting in queue and a human agent\'s time on a solved case.' },
      { id: 'B', text: 'Escalate immediately — the customer has explicitly requested a human, and overriding that to surface a fix (even a good one) treats their stated preference as something to be managed rather than respected.' },
      { id: 'C', text: 'Reply with: "I understand. I have a resolution ready that takes one click — would you like me to apply it, or transfer you to a human?" — give the customer the choice.' },
      { id: 'D', text: 'Apply the resolution silently and then transfer to a human, so the customer gets both a solved problem and the human contact they asked for.' },
    ],
    correctAnswer: 'B',
    correctExplanation: 'When a customer explicitly requests a human, that request takes precedence over the agent\'s resolution capability. Overriding it — even to deliver a good outcome — communicates that the customer\'s stated preference is conditional on the agent\'s judgment about what\'s best for them. That damages trust in a way no quick fix recovers. **The principle: explicit customer requests are not heuristics to be optimized against; they\'re constraints to be honored.** The cost of an "unnecessary" escalation is much smaller than the cost of teaching customers their requests will be overridden when the agent thinks it knows better.',
    distractors: {
      A: {
        misconception: 'Efficiency outweighs respecting explicit requests',
        explanation: 'This is the genuinely tempting answer because it sounds reasonable — the resolution exists, the customer wants the underlying problem solved, why add latency? The misconception is that the customer\'s stated preference (a human) and their underlying preference (a solved problem) can be cleanly separated. They can\'t. By the time a customer says "get me a human," they\'ve often lost trust in the automated path entirely; even a correct resolution at this point may register as the agent dismissing their request.',
      },
      C: {
        misconception: 'Offering a choice is always the safe middle ground',
        explanation: 'Offering a choice sounds neutral but functionally still asks the frustrated customer to do more work — read, decide, respond — when they\'ve just told you they\'re done with that. "Give them the choice" is reasonable in many contexts but not after an explicit demand for escalation.',
      },
      D: {
        misconception: 'Doing both satisfies both interpretations',
        explanation: 'Applying the resolution silently while transferring sounds like the best of both worlds, but it ignores the customer\'s stated preference (they asked for a human, not a resolution + a human) and creates confusion when the human agent picks up a case that\'s already been acted on. Hidden actions during escalation are a reliability hazard.',
      },
    },
    tags: ['escalation', 'human-in-the-loop', 'customer-trust'],
  },
  {
    id: 'Q24',
    number: 24,
    domain: 'context-management',
    scenario: 'You\'re synthesizing a research report combining findings from multiple subagents. One source (a 2022 industry report) states the market grew **12%** last year. Another source (a 2024 academic paper) states the market grew **8%** last year.',
    question: 'What should the synthesis subagent do?',
    options: [
      { id: 'A', text: 'Pick the more recent source (the 2024 paper) and use 8%, since recency is a reliable proxy for accuracy.' },
      { id: 'B', text: 'Average the two values and report 10%, since this is the most likely true value.' },
      { id: 'C', text: 'Preserve both values with source attribution and methodological context: "Estimates of last year\'s market growth vary: a 2022 industry report cites 12%, while a 2024 academic study cites 8%. The discrepancy may reflect differences in market definition or measurement methodology."' },
      { id: 'D', text: 'Drop both values from the report since they conflict and conflicting data can\'t be reliably reported.' },
    ],
    correctAnswer: 'C',
    correctExplanation: 'When credible sources disagree, the synthesis output should **preserve the disagreement, attribute each value to its source, and surface methodological context** where possible. This respects the user\'s intelligence, makes the report defensible, and lets readers evaluate the sources themselves. Annotating conflicts is dramatically more honest than collapsing them, and it\'s the standard for any synthesis that aspires to credibility.',
    distractors: {
      A: {
        misconception: 'Recency is the most important quality signal',
        explanation: 'Recency is one signal but not a sufficient one. The 2022 report might use a broader market definition; the 2024 paper might use a narrower one. Picking based on a single dimension hides the underlying methodological question.',
      },
      B: {
        misconception: 'Averaging conflicting estimates produces a "best" estimate',
        explanation: 'Averaging two estimates from different methodologies produces a number that doesn\'t correspond to either methodology\'s definition of the market. It looks like a compromise but is actually meaningless.',
      },
      D: {
        misconception: 'Conflicting data should be suppressed',
        explanation: 'Dropping conflicting findings is intellectual cowardice and produces a report that\'s less informative than the underlying sources. Synthesis should compress; it shouldn\'t censor.',
      },
    },
    tags: ['synthesis', 'source-attribution', 'conflicting-evidence'],
  },
  {
    id: 'Q25',
    number: 25,
    domain: 'context-management',
    scenario: 'Your customer support agent has been running for six months at 87% first-contact resolution. The board has been impressed by the metrics. Your VP of Operations is under pressure to free up reviewer capacity for a new initiative and proposes reducing human review on all "high-confidence" cases — those where the agent self-reports confidence above 0.9.\n\nAggregate accuracy on high-confidence cases is **97%**. The proposal would cut review costs significantly. Your VP wants to roll this out next month.',
    question: "What's your most defensible position?",
    options: [
      { id: 'A', text: 'Approve the rollout — 97% aggregate accuracy is well above any reasonable autonomous threshold, and delaying further when the metrics are this strong is over-cautious.' },
      { id: 'B', text: 'Approve a phased rollout — cut review by 50% next month, monitor for two months, and cut the remaining 50% if metrics hold.' },
      { id: 'C', text: 'Hold the rollout until you\'ve **stratified accuracy** by case type, dollar amount, and customer segment. Aggregate metrics can mask poor performance on subsets where errors are most expensive — high-confidence cases averaging $30 may be 99% accurate while high-confidence cases averaging $3,000 may be 78% accurate.' },
      { id: 'D', text: 'Reject the proposal — automated review is never appropriate for customer-facing financial decisions regardless of the metrics.' },
    ],
    correctAnswer: 'C',
    correctExplanation: '**Aggregate accuracy is one of the most dangerous metrics to act on without stratification.** A system that\'s 97% overall might be 99% on simple cases that dominate the volume and 73% on complex cases where errors are most costly. Before reducing review, you need to understand the *distribution* of errors — by case type, dollar amount, customer segment. Often you\'ll find that aggregate metrics are masking concentrated risk in exactly the segments where you most need human review. The defensible position is: "the 97% looks great, and before we act on it we need to verify the errors aren\'t concentrated where they hurt most."',
    distractors: {
      A: {
        misconception: 'Strong aggregate metrics justify autonomous action',
        explanation: 'This is the genuinely tempting answer under organizational pressure — the metrics look great, the VP needs the capacity, delay looks like timidity. The misconception is treating aggregate accuracy as if it tells you about the *distribution* of errors. It doesn\'t. A system can have excellent aggregate accuracy while concentrating its failures on the highest-stakes cases. "97% is good enough" is a reasoning style that produces predictable, expensive incidents.',
      },
      B: {
        misconception: 'Phased rollouts handle measurement gaps',
        explanation: 'Phasing the rollout is operationally responsible but doesn\'t address the actual question: do you know whether the 97% is uniform or concentrated? If errors are concentrated in high-stakes cases, phasing just spreads the problem across two months instead of one. Phasing is a deployment strategy; stratification is an analysis prerequisite. The phased rollout would be appropriate *after* stratification confirms the metrics are uniformly good.',
      },
      D: {
        misconception: 'Categorical positions substitute for analysis',
        explanation: 'Refusing on principle without doing the analysis is no more defensible than approving on principle. "Never automate this" forfeits real capacity gains where they\'re warranted, and it doesn\'t model the kind of analytical thinking the situation requires. The right answer is conditional on what stratification reveals.',
      },
    },
    tags: ['evaluation', 'stratification', 'human-review'],
  },
];

export function getQuestion(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function getDomainQuestions(domainId: DomainId): Question[] {
  return questions.filter((q) => q.domain === domainId);
}

export function getDomain(id: DomainId): Domain | undefined {
  return domains.find((d) => d.id === id);
}
