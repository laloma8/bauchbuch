# Architecture Template

Use this template for `docs/architecture.md`. Describe how the product should be built **for real**,
not how the prototype happens to be wired together. Plain language, at most about two pages, no code.

```md
---
date: [ISO date]
topic: "[Product name] architecture"
tags: [architecture]
status: draft
---

# Architecture: [Product name]

[One or two sentences: the overall approach, in plain words.]

## Building blocks

[ASCII diagram of the main parts and how they talk to each other.]

- **[Part]** — [what it's responsible for]

## Technology

| What | Choice | Why (one line, plain language) | Needed because (confirmed requirement) |
| ---- | ------ | ------------------------------ | -------------------------------------- |
| [e.g. Web app] | [e.g. Next.js] | [...] | [...] |

Every row must trace back to a requirement the user confirmed. No requirement, no component.

## Layers and rules

[Only as many layers as the app needs — a small app may have two. No empty layers.]

- **[Layer, innermost first]** — [one-line responsibility, e.g. *core*: business rules, knows nothing about screens or storage]
- **[Next layer]** — [...]

**Direction:** dependencies only point inward.

**Rules** (typically 2–5, each checked by a tool; a rule that cannot be checked is not written down):

- [e.g. core imports nothing from outer layers] — so [plain-language reason, e.g. changing the look never breaks the business rules]
- [e.g. UI does not access storage directly]
- [e.g. no import cycles between modules]

## Quality checks

Set up with the first slice, run after every step:

| Check | Tool | Catches |
| ----- | ---- | ------- |
| Typing | [e.g. TypeScript, strict] | data in the wrong shape |
| Linting | [e.g. ESLint] | mistakes and warning signs that don't crash anything |
| Tests | [e.g. Vitest, one terminating run] | features that quietly stop doing what they should |
| Structure | [ESLint import rules, e.g. `no-restricted-imports` or `eslint-plugin-boundaries`, run with the normal lint command] | code in the wrong place |

## Data

- **What is stored:** [...]
- **Where:** [...]
- **Who can see it:** [...]
- **Secrets:** [e.g. API keys live in `.env`, which is never committed; `.env.example` lists the names]

## From the prototype

**Keep:** [what's worth carrying over]

**Throw away / redo:** [shortcuts, fakes, things that won't hold up]

## Conventions

- **Code language:** [English (recommended) or other — names, comments, tests]
- **App language:** [language of the texts shown in the app]
- **Commit messages:** same as code language

## Constraints

- Runs on the participant's own computer with `npm install` and one start command, from the project folder
- No Docker/containers, no separately installed services — file-based or embedded storage
- Everything the app needs is in the repo (except secrets)
- [e.g. must work offline, Public Zone data only]

## Open questions

- [...]
```
