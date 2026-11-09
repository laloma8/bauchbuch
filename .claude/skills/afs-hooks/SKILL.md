---
name: afs-hooks
description: Make Claude check its own work automatically by setting up two Claude Code hooks - after every edit (formatting, lint and architecture rules, typing, related tests) and before finishing (all tests plus a coverage hint at 85%), and helps with further hook ideas later. Only use when the user runs /afs-hooks or names this skill explicitly. Requires a project where the first slice was built with typecheck, lint and test commands. Do not use to write features or tests.
---

# Hooks

Until now the quality checks (typing, linting, tests) run because the plan says so. You make them run
**automatically**, so they cannot be forgotten: Claude Code hooks are small scripts that the tool
itself starts at fixed moments. You set up two of them, explain what they do in plain words, and
make sure Claude reacts to their messages the right way.

```
after every edit    format → lint + architecture rules → typing → tests related to that file
before finishing    all tests, with coverage → hint if coverage is below 85%
```

## Who you are talking to

The user is usually **not a developer**. They do not need to know what a hook is; they need to know
what will now happen on its own and how to switch it off.

- Use plain language. If you need a technical term, explain it in one short sentence.
- This skill needs almost no decisions from the user. Choose the commands yourself from the project.
  Show your proposal in one block and ask once: "Accept all" (recommended) / "Change some".
- **Let the user click instead of type.** If you have a tool for asking the user a question with
  selectable answers (in Claude Code: `AskUserQuestion`), use it: recommended option first, marked
  "(recommended)", the "why" in the option's description. Without such a tool, number the options.
- Never guess an answer the user hasn't given you.

## What the two hooks do

| Moment | Runs | If something is wrong |
| ------ | ---- | --------------------- |
| **After each edit** of a code file | formatter (fixes silently) → linter, including the architecture rules from `docs/architecture.md` → type check → only the tests related to that file | Claude gets the error message right away and fixes it |
| **Before Claude finishes** | all tests, with coverage measurement | Claude cannot finish until they pass; at most 3 attempts, then it must explain to the user what is still failing |

Details that matter:

- **Silent when all is well.** Claude only hears from a hook when something needs attention.
- **Formatting is fixed, not discussed.** The formatter rewrites the file; only a formatter that
  cannot read the file (a syntax error) is reported.
- **Related tests** run only if typing passes — a type error makes test results meaningless.
- **The full run at the end only happens when code was edited** since the last green run, so a
  pure question-and-answer turn is not slowed down.
- **Coverage is a hint, not a gate.** If less than 85 % of the code lines are exercised by tests,
  Claude gets *one* hint per session with the least covered files and is asked to judge whether a
  sensible test is missing. 85 % does not have to be reached; trivial tests written only for the
  number are explicitly unwanted. If Claude thinks nothing sensible is missing, it says so in one
  sentence and finishes.

### How Claude handles failures

This is the heart of the skill. The same rules are built into every message the hooks send
(`RULES` in `references/lib.mjs`), so Claude sees them exactly when it needs them.

| Situation | What Claude does |
| --------- | ---------------- |
| Formatting | Nothing — already fixed by the formatter |
| Lint or architecture rule violated | Fix the code. No `eslint-disable`, no loosened rule |
| Type error | Fix the types properly. No `@ts-ignore`, no `any` as an escape hatch |
| A test fails and the new code is wrong | Fix the code |
| A test fails because the behavior was **intentionally** changed (spec/plan says so) | Update that test, and tell the user in one sentence which test changed and why |
| Unclear whether code or test is wrong | Stop and ask the user, in plain language |
| "cannot find module …-darwin-…" / "…-linux-…" | Packages belong to the other operating system: `npm install`, then retry. Not a code problem |
| Error halfway through a change that spans several files | Carry on and re-check at the end of the step; the full run at the end catches it anyway |
| Tests take unexpectedly long or time out | Tell the user, find the cause. Never remove or simplify tests to save time |
| Still failing after 3 attempts at the end | Stop trying, tell the user in plain language what fails and what was tried |
| Coverage below 85 % | Look at the listed files, add sensible tests if some are missing; otherwise say so and finish |

**The one rule above all:** a check is never made to pass by weakening it. Tests are not deleted,
skipped (`.skip`), shortened or loosened; thresholds are not lowered; the type checker and linter
are not silenced. The code has to satisfy the check — not the other way around.

## Initial Setup

1. **Is there something to check?** Read `docs/architecture.md` ("Quality checks", "Layers and
   rules") and `package.json`. You need commands for type check, lint and tests. If they don't
   exist, stop and tell the user that the quality checks come with the first slice: run
   `/afs-plan` and `/afs-implement` for slice 1 first, then come back.
2. **Hooks already there?** Look for `.claude/hooks/` and a `hooks` entry in `.claude/settings.json`.
   If present, ask whether to **update** them or **leave** them, and don't touch anything else in the
   settings file.
3. Find out what the project uses (formatter such as Prettier or Biome, ESLint, `tsc`, Vitest or
   another test runner, the coverage provider) from `package.json`, config files and architecture.md.

## Process Steps

### Step 1: Propose

Present what will happen, in plain language, with the concrete commands in a small table:

```
I'll make Claude check its own work automatically:

After every edit   formatting (<tool>) · lint + architecture rules (<tool>) · typing (<tool>) · related tests (<tool>)
Before finishing   all tests (<tool>) with a coverage hint below 85 %

If a check fails, Claude must fix the code — never delete or weaken tests to get past it.
It costs a few seconds per edit; in return mistakes show up right where they're made.

You can switch it off at any time by deleting the "hooks" part in .claude/settings.json.
```

Ask once: "Accept all" (recommended) / "Change some". Typical changes: a tool is missing (e.g. no
formatter yet — propose one and add it), or the user wants only one of the two hooks.

### Step 2: Install

1. **Take the reference scripts as the starting point.** `<skill_dir>/references/` holds `lib.mjs`,
   `post-edit.mjs` and `stop.mjs`: a tested proposal, not a fixed part of the skill. Read them first,
   then choose:
   - **Use as they are** (the usual case): copy the three files to `.claude/hooks/`; everything
     project-specific lives in `config.json`.
   - **Adapt to the project** when the config isn't enough, e.g. another language or test runner
     with different output, a monorepo with several packages, related tests selected differently,
     a coverage report in another format, or checks that need extra steps. Copy, then change the
     copies in `.claude/hooks/` — never the files in the skill folder.
   Whatever you adapt must keep the behavior described above ("What the two hooks do" and "How Claude
   handles failures"): silent when green, exit code 2 to report to Claude, the rules text in every
   message, one coverage hint per session, retry limit at the end. Tell the user in one plain sentence
   if you adapted something and why.
2. **Write `.claude/hooks/config.json`** from `<skill_dir>/references/config.json`, filled with the
   project's real commands:
   - `format`, `lint`: run on one file, `{file}` marks where the path goes (e.g.
     `npx prettier --write {file}`, `npx eslint {file}`)
   - `typecheck`: whole project (type checks cannot look at one file alone), usually
     `npm run typecheck`
   - `relatedTests`: only tests affected by `{file}` (Vitest: `npx vitest related {file} --run`)
   - `allTests`: one terminating run with coverage (Vitest: `npx vitest run --coverage`) — never a
     watch mode
   - `ensureDeps`: the dependency check from the plan if the project has one (installed packages must
     match this machine; see the sandbox note in `afs-implement`); empty string if none
   - leave `coverageThreshold` at **85**, `maxStopRetries` at **3**, adjust `timeouts` only if the
     project is clearly slower
   - remove a field's command (set it to `""`) to skip that check
3. **Coverage setup.** Coverage must list *every* source file, including files no test touches —
   that is exactly what the hint is for. In the test configuration set the coverage provider (e.g.
   `v8`), the reporters `text-summary` and `json-summary`, `include` for the source folder (so
   untested files show up as 0 %), and **no `thresholds`** — coverage must never fail a test run.
   Add the coverage package if needed (e.g. `@vitest/coverage-v8`). Check the file `coverage/
   coverage-summary.json` appears after a run.
4. **Merge the hooks into `.claude/settings.json`** using
   `<skill_dir>/references/settings-snippet.json`. Create the file if needed; if it exists keep all
   other settings and existing hooks.
5. **Housekeeping:** add `.claude/hooks-state/` and `coverage/` to `.gitignore`. `.claude/hooks/` and
   `.claude/settings.json` are committed — they belong to the project.

### Step 3: Verify

Do not trust the setup before it has been run once.

1. Run each configured command once by hand and fix what doesn't work (wrong path, missing tool).
2. Simulate the after-edit hook (use the same procedure for adapted scripts) for one existing source file:
   `echo '{"session_id":"setup","tool_input":{"file_path":"<a source file>"}}' | node .claude/hooks/post-edit.mjs`
   — expected: exit code 0 and no output.
3. Simulate the finish hook: `echo '{"session_id":"setup"}' | node .claude/hooks/stop.mjs` — expected:
   exit code 0 (and since step 2 marked code as changed, the full test run actually happens). If
   coverage is under 85 %, you get the coverage hint instead (exit code 2) — that's correct, report it.
4. Delete `.claude/hooks-state/setup.json` afterwards.
5. If a check fails because of the project itself (red tests, type errors), tell the user in plain
   language and fix it first — hooks on a red project would only annoy.

### Step 4: Hand over

```
Done — Claude now checks its own work automatically:

- after every edit: formatting, lint + architecture rules, typing, related tests
- before finishing: all tests; a hint if coverage is under 85 %

What you'll notice: Claude fixes errors on its own, and sometimes needs a few seconds longer.
If it can't fix something after 3 tries it will tell you plainly what fails.
It is not allowed to delete or weaken tests to get past a check.

Hooks only become active in a new session. Start a fresh one:
/new
```

Offer to commit the new files (only if the project uses git).

## Adding more hooks

When the user comes with a wish like "Claude should never touch X", "always do Y after Z" or "tell me
when it's done", help them turn it into a hook — or tell them honestly when a hook is the wrong tool.
They describe the *wish*; you work out the technical side and explain the consequence.

### What hooks are for

A hook is a script that Claude Code itself starts at a fixed moment. Claude does not decide whether
it runs — that is the difference to instructions in `CLAUDE.md`, which Claude can forget or
misjudge. So:

- **Hook** — something that must happen **every time**, or must be **prevented** every time, and can
  be decided by a script (run the tests, block `rm -rf`, keep `.env` out of commits).
- **CLAUDE.md rule** — guidance that needs judgment ("prefer small functions", "write texts in a
  friendly tone").
- **Skill** — a guided multi-step process with questions to the user.

If a wish needs judgment, a rule in `CLAUDE.md` is usually enough; say so.

### The moments a hook can hook into

Pick the earliest moment at which the script has what it needs. Typical ones (check the current
Claude Code documentation or ask the claude-code-guide agent if you are unsure — the list grows):

| Moment (event) | Can it stop something? | Typical use |
| -------------- | ---------------------- | ----------- |
| Before a tool runs (`PreToolUse`) | **Yes** — blocks the action and tells Claude why | protect files and commands: `.env`, `git push --force`, `rm -rf`, installs from unknown sources |
| After a tool ran (`PostToolUse`) | No — the action happened; Claude is told about problems | check what was just changed (our edit hook) |
| Claude wants to finish (`Stop`) | **Yes** — Claude must continue | final check, our test run |
| User sends a message (`UserPromptSubmit`) | Can add context or block | add a reminder, check the request |
| Session starts (`SessionStart`) | No | load context, check the environment (e.g. dependencies) |
| Claude needs attention (`Notification`) | No | desktop sound or message when it waits for the user |

A matcher narrows a hook to certain tools (e.g. only `Bash`, or `Edit|Write`). Use the narrowest
one that works; a hook that runs on everything is slow and noisy.

### How a hook talks to Claude

- Silent and exit code `0`: all fine, Claude hears nothing.
- Exit code `2` and a message on stderr: the action is blocked (before-hooks, Stop) or Claude gets
  the message right away (after-hooks). **Write that message for Claude, not for a developer**: what
  was wrong, what to do instead, and — for checks — the reminder that checks are fixed in the code,
  never by weakening them (see "How Claude handles failures").
- Any other exit code: the user sees a warning, Claude does not.
- A hook that can block must be **impossible to get stuck in**: give a retry limit or a clear
  way out, like the retry counter in `stop.mjs`.

### How to help, step by step

1. **Understand the wish.** Restate it in one plain sentence. Ask what should happen and in which
   situation — never "which hook event?". Ask one question at a time; if you can recommend an answer,
   do so. Ask for a concrete example ("Which commands count as dangerous for you?").
2. **Choose the tool.** Hook, `CLAUDE.md` rule or something else (see above). Say which and why in one
   sentence, with the consequence for the user ("Claude *cannot* do this anymore" vs. "Claude is
   *asked* not to").
3. **Propose the design in plain words** before writing anything: when it runs, what it checks, what
   happens when it triggers, what Claude will be told. Show one example message. Ask once:
   "Add it" (recommended) / "Change something".
4. **Build it small.** A script in `.claude/hooks/` plus an entry in `.claude/settings.json` (merge,
   never overwrite). Reuse `lib.mjs` where it helps. Prefer a setting in `config.json` over a new
   file when the existing scripts can cover the wish. Commands run automatically, so: only what the
   project already has, nothing that downloads or runs unknown code, nothing that changes more than
   the wish needs.
5. **Test it on purpose, both ways.** Feed the script an example input that must be allowed and one
   that must be blocked / flagged, and check the exit codes and the message. Don't skip the "must be
   blocked" case — a guard that never triggers is worse than none.
6. **Explain and hand over.** What happens now, in plain language; what the user will notice; how to
   switch it off (remove its entry in `.claude/settings.json`); that a fresh session is needed. Offer
   to commit.

### Guard rails for every hook

- **Be sparing.** Each hook adds waiting time or friction. If a wish is rare or cheap to check by
  eye, say so and let the user decide.
- **Never make a hook weaken the safety net.** A new hook must not skip, bypass or loosen the
  checks above, nor let Claude edit its own hook scripts and settings to get around a block.
- **Prefer blocking with an explanation to silent failure.** Claude (and the user) must be able to
  tell what happened and why.
- **Same language as the rest.** Plain words; one short sentence for each technical term.

## Important Guidelines

- **Never weaken a check to make the setup pass.** If a command is too slow or noisy, find out why
  and tell the user; don't remove the check silently.
- **Hooks run commands automatically.** Only put commands from the project into the config
  (`package.json` scripts, the installed tools) — nothing from outside, and no commands that change
  anything beyond formatting the edited file.
- **Scripts are a reference, not a black box.** Prefer `config.json` for project differences and
  adapt the scripts only when needed. Adapted scripts live in the project's `.claude/hooks/`; the
  reference copies in this skill stay untouched. Adaptations keep the failure rules intact — never
  make a script skip, weaken or ignore a check.
- **Keep it small.** Start with the two hooks above and one config. Every further hook has to earn
  its place. But when the user wants another hook, or has an idea or a new requirement that a hook
  could cover (blocking dangerous commands, protecting `.env`, a reminder, a notification), don't
  turn them down: help them with it, following "Adding more hooks" above.
