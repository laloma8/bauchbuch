---
name: afs-plan
description: Turn a feature spec from docs/agents/specs/ into an implementation plan in steps in docs/agents/plans/, working with a non-developer user. Only use when the user runs /afs-plan or names this skill explicitly. Do not use for generic planning requests.
---

# Plan

You turn **one spec** into a technical plan in steps that `/afs-implement` can follow without
guessing. You write it to `docs/agents/plans/NN-YYYY-MM-DD-<slice>.md`.

## Who you are talking to

The user is usually **not a developer**. They wrote the spec with `/afs-specify` and know *what* the
feature must do. You own the technical *how*.

- **Decide technical details yourself**, following `docs/architecture.md`. Record each decision
  with a one-line "why" in plain language. Do not ask the user to choose between libraries, patterns
  or file structures.
- **Ask only about behavior and trade-offs they can judge**: what they would see, what happens in an
  edge case, speed vs. simplicity, "now or in a later slice". Explain any technical term in one short
  sentence and offer 2–3 options with your recommendation. For each option, say what the user will
  notice or what it costs them (speed, effort now vs. later, what they can or can't do afterwards)
  — not how it works inside. Example: "Option A: entries survive closing the browser, but only on
  this computer. Option B: also on other devices, but needs a login. (A recommended for now.)" If
  the options have no visible consequence, decide yourself and record it under Key Decisions.
- Ask **one question at a time** while the direction is still open. Once it is clear, stop asking
  single questions: list all remaining ones together, each with your recommended answer in one line,
  and ask the user to correct only the ones they disagree with.
- If the user pushes back or asks about a question, stay on it until it is resolved before asking
  anything new. If they skip a question, ask it again.
- **Let the user click instead of type.** If you have a tool for asking the user a question with
  selectable answers (in Claude Code: `AskUserQuestion`), use it for every question that has
  options: recommended option first, marked "(recommended)", short labels, the "why" in the
  option's description. Put sketches and your one-line restatement in the message before the
  question, not inside it. For a batch of recommendations, list them in the message and ask
  "Accept all" (recommended) / "Change some". Without such a tool, number the options so the user
  can reply "1".
- **Show, don't describe**: ASCII mockups and simple diagrams in the conversation. File paths belong
  in the plan document, not in the conversation.

## Project documents

```
docs/product.md · docs/slices.md · docs/architecture.md · docs/design.md   big picture — always read all
docs/agents/specs/NN-YYYY-MM-DD-<slice>.md                  the spec you plan (input)
docs/agents/plans/NN-YYYY-MM-DD-<slice>.md                  the plan you write (output, same file name as the spec)
```

The spec is the source of truth for **what** to build. Its acceptance criteria go into the plan
unchanged, and everything under "Decisions already made" is settled — do not ask it again. If planning shows the spec is incomplete or wrong, stop, explain it to the user, and
update the spec with their agreement before continuing.

## Initial Setup

If the user gave you a spec, start with step 1. Otherwise look in `docs/agents/specs/` for specs with
`status: ready` that have no plan in `docs/agents/plans/` yet, and propose the most recent one. If
there are none, say:

```
I plan one feature at a time, based on a spec.

Please give me the spec file, e.g.:
/afs-plan @docs/agents/specs/02-2026-09-30-add-entries.md

No spec yet? Start a fresh session and run /afs-specify first.
```

## Process Steps

### Step 1: Understand and interview

1. Read the spec and `docs/product.md`, `docs/slices.md`, `docs/architecture.md`, `docs/design.md` **fully**, plus any
   file the user referenced.
2. Find the code this slice touches (use an explorer subagent if available; it should return paths,
   not long answers). Read the files you will change yourself — do not plan from summaries.
3. If you use a library or service you don't know well, check its real interface (source code in
   `node_modules`, or a web search). Verify facts instead of assuming them.
4. Summarise in plain language what exists today and what the spec adds, with an ASCII sketch of
   the current screen or flow. Do not propose a solution yet.
5. Interview the user about everything still open (see "Who you are talking to"). The spec already
   answered the *what* — do not ask it again. If the code can answer a question, look instead of
   asking. Follow the conventions in `docs/architecture.md` (code language, layers) — no new
   questions about them. After each answer, restate the updated understanding in one line. Separate each Q&A turn
   with `---`.

### Step 2: Agree on the structure

Summarise before writing:

```text
Acceptance criteria:
- [from the spec, plus any that came up while planning]

Key decisions:
1. **<Decision>:** <chosen direction>.
   - Why: <short reason, plain language>
   - Instead of: <rejected option, and why not>

Planned steps (I build them in order; you test the whole slice once at the end):
1. ...
2. ...

Reply "create plan" and I will write the plan.
```

With a question tool, ask "Create plan" (recommended) / "Change something".

- Steps follow a sensible build order, and each leaves the project working (it builds, the
  automated checks pass). A step doesn't need something the user can click. Documentation and tests
  go into the step that needs them. If steps don't split cleanly, use
  fewer, larger ones.
- **Too big to test in one go?** If the manual check at the end would need more than ~5–7
  click-through items (the limit for the user's own test — do not raise it), or the spec has more
  than 10 acceptance criteria, the slice is too big. Stop, suggest splitting it, and update the
  spec and `docs/slices.md` with the user's agreement. A split-off or inserted slice takes its
  predecessor's number plus a letter (`5a`, `5b`); never renumber existing slices. Don't add a
  test stop in the middle.
- **First slice to be built in this project?** If the project has no type check, linter or test
  scripts yet (check `package.json`, whichever slice number this is), set up only what this slice
  needs — including the quality checks — as the first step. See "First-step setup" below.
- **External access:** list the external hosts the plan will need (package registry, fonts, APIs,
  downloads) under Pitfalls, so the user can approve them in the sandbox up front.

### Step 3: Write the plan

After **explicit** approval:

1. Write `docs/agents/plans/NN-YYYY-MM-DD-<slice>.md` (same file name as the spec) using
   `<skill_dir>/references/plan-template.md`. Create the folder if needed.
2. **Every actionable item gets a checkbox** (`- [ ]`) — each task and each verification step.
3. Verification:
   - The project has a type check, a linter and tests (see "Quality checks" in
     `docs/architecture.md`). If they don't exist yet, setting them up is part of the first step:
     the tools plus the commands `npm run typecheck`, `npm run lint` and `npm test`.
   - Plan tests like any other task, in the step that adds the behavior: a few focused tests for
     logic and rules (validation, sorting, calculations), not one per line of code. No browser
     tests.
   - `npm test` means **one terminating run** (`vitest run`, never watch mode).
   - Automated Verification lists the type check, linter and tests for every step.
   - Don't write CLAUDE.md rules that enforce the checks — that is added later, on purpose.
   - Manual Verification is **one section after the last step**: the click-throughs for the
     finished slice, covering the acceptance criteria, written as click-through items ("Open the
     app, click *Add*, see the new entry at the top").
   - The user starts the app themselves, in their own terminal — the mw-Sandbox forwards no ports
     by default, so a server the agent starts there isn't reachable from their browser. The first
     manual check says how: `npm install`, the start command (e.g. `npm run dev`) and the
     URL to open.
   - Never "review the code" as a check. Omit the Manual Verification section when there are no
     manual checks.
4. If the feature has a UI, include ASCII mockups — current and proposed state when it changes an
   existing screen.
5. **No open questions in the plan.** If one comes up while writing, stop and resolve it first.

### First-step setup

When the plan includes setting up the quality checks, the first step also contains:

- **Tests:** single, terminating runs with parallelism sized to the VM — the number of workers is
  derived from the available CPUs and memory, leaving headroom for the OS and the agent. No real
  network calls or fixed sleeps in tests; timeouts set.
- **Dependency check:** a `pretest` npm script that makes sure the installed dependencies match this
  machine (the sandbox is Linux, the user's computer is macOS, and each `npm install` replaces the
  other's native files), e.g. `npm install --no-audit --no-fund`, which is fast when nothing changed.
  `npm test` then always runs the check.
- **Layer rules:** ESLint import rules (e.g. `no-restricted-imports` or `eslint-plugin-boundaries`)
  for exactly the layers and rules in `docs/architecture.md`, run with `npm run lint`. Later steps
  must pass them.
- **Secrets:** if the project uses git, create or extend `.gitignore` with `.env`, `.env.*` (except
  `.env.example`), `node_modules/` and build output. Provide `.env.example` with placeholder names.
  Config is read from the environment, never from source.

### Step 4: Review and hand over

1. Review the plan (with a subagent if available) for consistency with the spec and the docs. Also
   look back through this conversation: every decision the user made must appear in the plan
   (Key Decisions, a step, or Pitfalls). Fix findings directly.
2. Present it:

   ```
   I've written the plan: docs/agents/plans/NN-YYYY-MM-DD-<slice>.md

   Please read at least "What you'll be able to do" and the manual checks:
   - Does the result match what you expect from the spec?
   - Does the order of the steps make sense to you?
   - Are the manual checks things you can actually click through?
   ```

3. Iterate until the user is happy, then set `status: ready`. Offer to commit (only if the project
   uses git and the plan isn't gitignored).
4. Give the next step:

   ```text
   Next step: implement the plan.

   Start a fresh session:
   /new

   Then run:
   /afs-implement @docs/agents/plans/NN-YYYY-MM-DD-<slice>.md
   ```
