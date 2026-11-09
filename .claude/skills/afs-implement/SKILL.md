---
name: afs-implement
description: Execute an approved plan from docs/agents/plans/ step by step with automated checks, then one click-through test of the finished slice by the user. Only use when the user runs /afs-implement or names this skill explicitly. Do not use for ad-hoc coding tasks without a plan.
---

# Implement Plan

You are tasked with implementing an approved technical plan. These plans contain steps with specific changes and automated checks, plus one manual click-through for the finished slice. Older plans may say "Phase" instead of "Step" and have manual checks per phase — treat them the same: steps in order, all manual checks together at the end.

The user is usually **not a developer**. They decided *what* to build (spec) and approved *how*
(plan); now they test. Talk to them in plain language: what you built, what they can try, what went
wrong — not which files you touched. Explain any technical term in one short sentence.

## Getting Started

If the user provided a plan path, proceed directly. If no plan path was provided, check `docs/agents/plans/` for the most recent plans with `status: ready` and propose one. If none found, ask the user for a path — or, if there is no plan yet, tell them to run `/afs-plan` in a fresh session first.

When you have a plan:
- Read the plan completely and check for any existing checkmarks (`- [x]`)
- Read the spec linked in the plan's frontmatter, plus `docs/architecture.md` and `docs/design.md`
- Follow the conventions in `docs/architecture.md` (code language, layers) — no new questions
- Read all files mentioned in the plan
- **Read files fully** - never use limit/offset parameters, you need complete context
- Think deeply about how the pieces fit together
- Start implementing if you understand what needs to be done
- Mark tasks you are working on with `[-]` and completed tasks with `[x]` (Prefer that over the task list tool)

## Task Tracking

The plan file is also a state tracker. After every task, you MUST immediately update the checkbox. Also mark tasks you are working on:

- `[ ]` - Not started yet
- `[-]` - In Progress (update BEFORE you start)
- `[x]` - Done (directly AFTER the task is tested successfully). For manual verification steps, only mark `[x]` after user confirmation.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each step fully before moving to the next
- Verify your work makes sense in the broader codebase context

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:
- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Step [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation in plain language — what it means for what you'll see]

  Options:
  1. [option] (recommended — [why])
  2. [option]

  How should I proceed?
  ```

## Verification Approach

**After each step:**
- Write the tests the plan asks for together with the code, not afterwards.
- Run the automated checks listed in the plan (type check, linter, tests). If a check fails, fix the
  code — don't weaken or delete a test to make it pass unless the plan or the user says the behavior
  changed. A lint violation of a layer rule is fixed, not suppressed or deleted.
- **Before every test run**, make sure the installed dependencies match this machine. If a module is
  missing or built for another system (the sandbox is Linux, the user's computer runs `npm install`
  for macOS and replaces the Linux files), run `npm install` and run the tests again. Do this every
  time, not only after a failure — don't diagnose or "fix" code before this is ruled out.
- Fix any issues, then continue straight to the next step. Don't stop for the user between steps —
  only when you hit a mismatch (see above).

**After the last step**, before handing over:
- **Check what you can yourself.** For each manual verification item, try it first with what is
  already there: start the app, fetch the page (e.g. with `curl`) and check it contains what you
  expect, call the endpoint, run a small ad-hoc script. Don't install browser automation or other
  new tools just for this check. Clicking through the screen is the user's part. Fix what you find.
  Stop any server you started when you are done. Add a short note to each item on what you already
  checked (e.g. `**Note:** page loads, list shows 3 test entries`) — but leave the checkbox
  unticked: only the user ticks manual items.
- **The user runs the app, not you.** You usually work inside the mw-Sandbox, an isolated
  container that forwards no ports by default. A server you start there is reachable for you, but
  **not** from the user's browser. Never ask the user to open a server you started. Give them the
  command to run it themselves instead (see "How to run it" below).
- **Consistency check** (before the hand-over message):
  1. Compare the finished work against `docs/architecture.md`, `docs/design.md`, `docs/product.md`,
     `docs/slices.md`, the spec and the plan.
  2. Classify each finding:
     - *Your mistake* (code deviates from the docs without reason) → fix it, mention it briefly.
     - *Docs, plan and spec contradict each other* → stop and ask the user which one is right.
     - *An improvement you added* (extra edge case, better structure) → ask the user in plain
       language whether that is okay. If yes, update the affected documents in the same go; if not,
       remove it.
  3. Batch the questions (one list, recommended answer each; use the question tool if you have
     one). Record the result in the plan's "Implementation Notes" and add the line
     `Documents checked: ✓` to the hand-over message.
- The user's computer and your container are different systems. Some packages install
  system-specific files, so the user always runs `npm install` before starting the app. If a
  package fails in your container after the user's test ("cannot find module …-darwin-…"), run
  `npm install` again.
- Then stop **once** for the user to test the whole slice. The click-through list is the plan's
  Manual Verification plus any acceptance criteria from the spec it doesn't already cover:
  ```
  Done — your turn to test

  What I built: [one or two plain-language sentences]
  Automatic checks passed: [short list]
  I already tried: [what you checked yourself, in plain language]
  Documents checked: ✓

  How to run it:
  1. Open a second terminal on your computer (not the one I'm running in)
  2. Go to the project folder — the one you started me in
  3. Run: npm install   (every time — it's quick when nothing changed)
  4. Run: [start command, e.g. npm run dev]
  5. Open [URL, e.g. http://localhost:3000] in your browser
  Leave that terminal open while you test. Ctrl+C stops the app.

  Please click through:
  - [ ] [Manual verification items from the plan, as click-through steps]

  Does it work as expected? Tell me "works" — or what looks wrong — and I'll fix it.
  Quick reminder of what to check: [3–6 words per item, e.g. "add an entry · empty list · delete"]
  ```
- If something looks wrong, fix it and stop again with the same message (only the items that
  changed or failed need re-testing).

If you have a tool for asking the user a question with selectable answers (in Claude Code:
`AskUserQuestion`), use it for both prompts above: the mismatch options (recommended first), and at
the test stop "Works" / "Something looks wrong". Keep the explanation and the full click-through
list in the message before the question. Write the question itself as "Does it work as expected?"
followed by the short reminder of what to check (a few words per item, not the full steps), so the
user still sees what to test when the answer options appear.

Do not check off manual verification items until confirmed by the user.

Once the user confirms it works:
- Tick the confirmed manual items in the plan and the acceptance criteria (`- [x]`) in the spec.
- Set the plan's `status` to `done`.
- Mark the slice as finished in `docs/slices.md`: tick its checkbox and cross out the slice line,
  e.g. `- [x] ~~**2. Add an entry** — ...~~` (leave the "Done when" line as it is). This lets the
  user see at a glance what's done, and the next `/afs-specify` sees what is left. If the slice
  line has no checkbox yet (older project), add the checkbox format to all slices first; if the
  slices still live in `product.md`, move them to `docs/slices.md` first. The consistency check
  above already reconciled the docs; update them again only for what turned up during the user's
  test, with the user's agreement.
- Present a short plain-language summary: what was built, what to try, anything left open.
- Offer to commit (only if the project uses git).

Give the user a hint about the next step:
```text
Next step: the next slice.

Start a fresh session:
/new

Then run:
/afs-specify <next slice from docs/slices.md>
```

## Test runs and resources

- Tests run as single, terminating runs (`npm test`) — never start watch or dev servers in the
  foreground.
- Parallelism is fine, including sub-agents, as long as the total load stays within the VM's
  resources. If the VM becomes unresponsive or a run is killed (out of memory), reduce the workers
  and re-run — don't retry blindly at the same load.
- After each test run, check that no node/vitest process is left over and stop leftovers.
- **Unexpectedly slow tests** (clearly longer than the plan or earlier runs suggest): tell the user
  in plain language ("the tests take 45 s instead of ~5 s") and investigate the cause — too many or
  too few workers, one slow test, a missing mock, leftover processes, resource shortage — then fix
  the cause.
- **Never delete, skip (`.skip`/`.only`), weaken or shrink tests** (fewer cases, looser assertions)
  to speed up a run.

## External access

If a step needs something from outside (a package, a font, an API, a download) and the sandbox
blocks it, do not work around it (no mirrors, no vendoring). Tell the user in plain language what
you need, from where and why, and ask them to approve it in the sandbox. Continue after approval.

## Git safety

The user can't judge git commands, so protect their work. Never run, and never let a sub-agent run:

- `git clean` (any variant)
- `git reset --hard`
- `git checkout -- .` or `git restore .` (blanket discards)
- `git push --force`
- `rm -rf` on the project folder or its subfolders

Never commit files matching `.env*` (except `.env.example`). If a secret appears in tracked files,
stop and tell the user.

To undo your own change, revert the specific file. If the working tree looks messy and you are
unsure, stop and ask the user.

## If You Get Stuck

When something isn't working as expected:
- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-agents sparingly - mainly for targeted debugging or exploring unfamiliar territory.

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.
