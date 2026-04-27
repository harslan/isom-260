// Hand-written presentational content for the practice bank.
//
//   teasers: one-line previews shown on the domain list pages — written by hand
//            so they read cleanly, instead of regex-truncating the scenario.
//
//   misconceptionSummaries: one short sentence per named misconception that
//            distills the *general principle* (scenario-independent). Surfaced
//            on the Understanding page glossary and on the "fallen for" cards.
//            The long, scenario-bound version lives in the question view.

export const teasers: Record<string, string> = {
  Q01: "92% of the time the agent verifies identity before issuing refunds — but the 8% just cost the company three wrong refunds.",
  Q02: "The agent has the tools it needs and is asking for a customer name instead of using them. Why?",
  Q03: "A multi-agent finance research system whose synthesis agent is inventing statistics that don't appear in the sources.",
  Q04: "A marketing agent for tasks ranging from \"subject line\" to \"quarterly strategy\" — should they share one pipeline?",
  Q05: "By turn 8 of a long support session, the agent has forgotten what the customer stated on turn 1.",
  Q06: "Two book-search tools, both with one-line descriptions; the agent picks between them at 60% accuracy.",
  Q07: "A payment MCP returns \"Operation failed\" on every error — and the agent's recovery behavior is erratic.",
  Q08: "One powerful general-purpose web tool, or three narrow purpose-built ones?",
  Q09: "Configuring MCP for a shared Jira, a personal Notion workspace, and an experimental scratch server.",
  Q10: "A new MCP code-analysis tool exists, but the agent keeps reaching for built-in Grep instead.",
  Q11: "You put your team's coding standards in ~/.claude/CLAUDE.md — and your teammates report Claude is ignoring them.",
  Q12: "Marketing ops drafts emails, Slack messages, and board reports — different conventions, scattered across client folders.",
  Q13: "A 40-document cross-team escalation redesign with two valid architectural approaches in front of you.",
  Q14: "You want every developer on your team to have access to a custom slash command.",
  Q15: "A 6 AM cron job calling Claude Code is hanging indefinitely, waiting for interactive input.",
  Q16: "Your invoice extractor returns malformed JSON 5% of the time, crashing the downstream parser.",
  Q17: "A discontinued_date field that doesn't exist in most source documents — and the model is fabricating values to fill it.",
  Q18: "A code review agent flagging false positives — the prompt politely asks it to \"be conservative.\"",
  Q19: "Extracting research methodologies from papers with wildly different document structures.",
  Q20: "50% cost savings via the Message Batches API — for which workloads is that the right call?",
  Q21: "A 12-turn customer case where critical numbers from turn 1 have been compressed away by turn 12.",
  Q22: "A subagent times out — what should it return to the coordinator?",
  Q23: "A frustrated customer asks for a human, mid-conversation — and the agent has the resolution one click away.",
  Q24: "Two credible sources cite different market growth numbers — what does the synthesis agent do?",
  Q25: "97% accuracy on high-confidence cases. The VP wants to cut human review next month.",
};

export const misconceptionSummaries: Record<string, string> = {
  // Domain 1
  'Clarity equals compliance':
    'A perfectly clear instruction can still be ignored by a probabilistic system; clarity and reliable compliance are different axes.',
  'Tool availability is the right lever for workflow ordering':
    'Modifying the toolset mid-session to enforce ordering reinvents prerequisite checking — badly.',
  'The model can reliably catch its own errors':
    'Self-checks tend to rationalize the very decisions they were meant to catch.',
  'Tool use is triggered by keyword phrasing':
    "If the agent lacks information it needs to act, no amount of prompt rephrasing will make it act.",
  'tool_choice: "any" solves under-tool-use':
    'Forcing a tool call when the model lacks the inputs it needs just produces guessed parameters.',
  'Every unexpected behavior must be a control-flow bug':
    "Reaching for infrastructure explanations when the actual problem is that the agent doesn't know what it needs to know.",
  'More agents fix more problems':
    'Adding agents adds latency, cost, and failure modes; often the fix is better information flow, not more nodes.',
  'A stronger model fixes architectural problems':
    "Model upgrades can't recover information that the architecture has already discarded.",
  'Hallucination is inherent and unfixable':
    'Multi-source hallucination is largely architectural — preserve provenance and the model has nothing to invent around.',
  'Dynamic decomposition is always better':
    'Dynamic planning costs unpredictability and debuggability; for predictable work, fixed pipelines are more reliable.',
  'Missing steps explain failures':
    "Adding steps to a misshapen pipeline doesn't fix the mismatch between task complexity and decomposition strategy.",
  'Parallelization solves complexity mismatches':
    'Parallelizing dependent steps is incoherent; parallelization optimizes the right pipeline, not the wrong one.',
  'Model failures must be training-data problems':
    "Information the user just provided this session has nothing to do with the model's training cutoff.",
  'Incorrect outputs must come from corrupted inputs':
    "Sometimes the inputs are intact and the model still misses them — attention isn't memory.",
  'Cross-session contamination is a likely failure mode':
    "Sessions are isolated; cross-conversation leakage isn't how LLM context windows work.",

  // Domain 2
  'Consolidation simplifies decisions':
    "Merging tools moves the routing decision inside the tool, hiding it from the agent and from your observability.",
  'Few-shot examples beat clear descriptions':
    'Examples add per-call token cost without addressing the actual root cause: undifferentiated tool descriptions.',
  'External routing is more reliable than tool descriptions':
    'Building infrastructure around a writing problem — invest in the descriptions before reaching for routing layers.',
  'Hiding errors from the agent is safer than exposing them':
    'Blind retries waste cycles on errors that will never succeed and still produce uninformative final failures.',
  'Missing data is preferable to error data':
    "Returning null on failure conflates \"the system broke\" with \"no results found\" — two completely different states.",
  'Prompt instructions can substitute for structured data':
    'Workarounds in the prompt that interpret opaque error strings break the moment the error string changes.',
  'Maximum flexibility maximizes capability':
    'General-purpose tools trade reliability for surface area; each new use case is a new place to fail.',
  'More tools always means worse selection':
    'Three well-differentiated tools are easier to choose among than one ambiguous one — the issue is overlap, not count.',
  'Tool design is cosmetic':
    "Tool design determines reliability, observability, error handling, and effective capability — it's one of the highest-leverage decisions.",
  'Consistency means putting everything in one place':
    'Project-scoped config exposes personal workspaces to the whole team and pollutes the repo with experimental setups.',
  'User-scoped configuration is always more flexible':
    'Forcing every teammate to set up shared infrastructure independently is how organizational knowledge fails to transfer.',
  'Branches are an organizational tool for configuration':
    "Git branches isolate code changes; they don't switch runtime configurations between users.",
  'Model preferences are fixed and require override':
    "There's no built-in bias against MCP tools — the model picks based on description quality, which is yours to fix.",
  'Latency drives tool selection':
    "The model isn't aware of tool latency and doesn't optimize for speed; this is anthropomorphizing a parameter.",
  'Prompt-level overrides fix tool selection':
    'Blanket "always prefer X" rules replace nuanced selection with crude preference, breaking on cases where X is wrong.',

  // Domain 3
  'Caching explains missing behavior':
    "There's no memory cache to clear — the file simply was never delivered to the teammates' machines.",
  'The filename determines recognition':
    "CLAUDE.md is correctly named here; the issue is location, not name.",
  "There's a manual import command for personal configs":
    'User-scoped configs are intentionally per-user — sharing them means moving them into the project repo.',
  'One big file with sections is cleaner':
    'Asking the model to figure out which section applies adds inference where explicit matching would be more reliable.',
  'Reorganize the work to fit the tooling':
    'Tools should adapt to how the team actually works, not the other way around.',
  'File-level reminders are better than centralized configuration':
    'Comments in source files drift out of sync with conventions over time and pollute the documents themselves.',
  'Detailed upfront instructions substitute for exploration':
    'Detailed instructions presume you already know the right answer — but the work involves choosing between options.',
  'Emergent design beats designed architecture at scale':
    '"Letting it emerge" produces inconsistent results and forces later work to accommodate unfounded early decisions.',
  'Planning is overhead you can skip':
    'For large, cross-cutting changes, skipping the design phase is how you end up redoing the work.',
  'Per-user setup ensures availability':
    "User-scoped commands require independent installation by every teammate and don't propagate to new hires.",
  "There's a unified config file pattern":
    'Plausible-sounding but fabricated — Claude Code uses dedicated locations for commands, rules, and instructions.',
  'CLAUDE.md is the configuration catch-all':
    "CLAUDE.md is for instructions and context, not command definitions — commands have their own location.",
  'Every tool has an env-var bypass':
    'Reaching for environment variables when the actual fix is a documented CLI flag.',
  'Shell tricks substitute for proper CLI flags':
    'Stdin redirection might prevent some hangs by accident, but the documented flag is the supported approach.',
  'Scheduled jobs need their own dedicated flag':
    "Cron is the OS's concern; the program just needs a way to run non-interactively.",

  // Domain 4
  'Prompt instructions enforce structural correctness':
    'Asking the model to "be valid" relies on probabilistic compliance for a problem with a deterministic solution.',
  'Post-hoc repair is preferable to prevention':
    'Repair libraries hide bad outputs and can introduce subtle data corruption — prevent the issue, don\'t paper over it.',
  'Examples eliminate format errors':
    'Few-shot examples reduce error rates probabilistically; structural constraint (tool use) eliminates them deterministically.',
  'Prompt instructions can override schema constraints':
    'Schema and prompt have to agree — instructing the model to leave a required field empty just produces invented values.',
  'Removing fields is the fix for messy data':
    'Replacing structured fields with free-form notes destroys downstream parseability.',
  'Sentinel values are a clean solution':
    'Magic dates like 1900-01-01 require every consumer to know the convention and produce silent bugs when they don\'t.',
  'Emphasis improves vague instructions':
    'Adding capital letters to "be conservative" doesn\'t make "conservative" any less ambiguous to the model.',
  'Self-reported confidence is well-calibrated':
    "If the model knew it was wrong, it wouldn't be reporting the finding — confidence filters often miss the actual false positives.",
  'Temperature controls correctness':
    'Temperature affects output randomness, not which findings the model considers valid.',
  'Normalization simplifies extraction':
    "Converting to uniform format doesn't preserve the structural cues the model uses; the variation reappears in the converted output.",
  'More capable models eliminate format sensitivity':
    'Format variation is largely a prompting problem; few-shot examples cost less and address it more directly.',
  'Ensembling fixes inconsistency':
    'Three runs through a poorly-prompted extraction produce three similar errors — ensembling addresses variance, not bias.',
  'Typical performance is acceptable for blocking workflows':
    '"Most batches finish quickly" isn\'t a guarantee; tail latency on a batch could be hours.',
  'Operational simplicity beats cost optimization':
    "Refusing batch processing entirely forfeits significant savings on workloads where it's a perfect fit.",
  'Timeouts make any API suitable for blocking workflows':
    'Falling back to real-time after a 60-second wait is worse than just using real-time from the start.',

  // Domain 5
  'More tokens prevents compression':
    'max_tokens controls output length, not how the agent summarizes context for itself.',
  'Instructions prevent compression behaviors':
    '"Never compress numerical details" relies on probabilistic compliance for a property compression dynamics will violate.',
  'Longer context windows solve precision loss':
    "Capacity helps but doesn't prevent attention-position effects; facts referenced repeatedly shouldn't live in conversation history at all.",
  'Error messages just need to indicate failure':
    'Generic errors strip the information the coordinator needs to choose between retry, escalation, and degradation.',
  'Failures should be hidden as empty success':
    'Returning empty results misleads the coordinator into thinking the search succeeded with no matches.',
  'Errors should propagate upward to terminate workflows':
    "Killing the entire workflow on first failure is what you do when you've given up on recovery.",
  'Efficiency outweighs respecting explicit requests':
    "A customer's stated preference and their underlying need can't be cleanly separated by the agent — respect the stated one.",
  'Offering a choice is always the safe middle ground':
    "A frustrated customer who asked for a human shouldn't have to read another menu and pick again.",
  'Doing both satisfies both interpretations':
    "Hidden actions during escalation create confusion when the human picks up a case that's already been acted on.",
  'Recency is the most important quality signal':
    'Recency is one signal but not sufficient — methodological differences matter more than publication year.',
  'Averaging conflicting estimates produces a "best" estimate':
    "Averaging numbers from incompatible methodologies produces a value that doesn't correspond to either methodology.",
  'Conflicting data should be suppressed':
    "Dropping conflicts produces a report less informative than the underlying sources — synthesis compresses, doesn't censor.",
  'Strong aggregate metrics justify autonomous action':
    'Aggregate accuracy can mask catastrophic concentration of errors in the highest-stakes subset.',
  'Phased rollouts handle measurement gaps':
    "Phasing is a deployment strategy; stratification is an analysis prerequisite that can't be substituted by phasing.",
  'Categorical positions substitute for analysis':
    "\"Never automate this\" forfeits real gains and doesn't model the analytical thinking the situation requires.",
};

export function teaserFor(questionId: string): string {
  return teasers[questionId] || '';
}

export function summaryFor(misconception: string): string {
  return misconceptionSummaries[misconception] || '';
}
