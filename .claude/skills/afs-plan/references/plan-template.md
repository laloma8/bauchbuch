# Implementation Plan Template

Use this template for `docs/agents/plans/NN-YYYY-MM-DD-<slice>.md` (same file name as the spec).

```md
---
date: [today, YYYY-MM-DD]
topic: "[Feature/Task Name]"
spec: "[docs/agents/specs/NN-YYYY-MM-DD-<slice>.md]"
tags: [plan, relevant-component-names]
status: draft
---

# PLAN: [Title]

[Describe the goal of the plan and link the spec]

## What you'll be able to do

[Two to four plain-language sentences for a non-developer: what they can see and click once this plan is implemented. Add an ASCII mockup if the feature has a UI.]

## Acceptance Criteria

[Copy the acceptance criteria from the spec unchanged; add any that came up while planning]

## Technical Key Decisions and Tradeoffs

1. **[Specific decision]:** [Chosen direction].
   - Why: [Short reason, plain language]
   - Instead of: [Rejected option, and why not]

## Current State

[How the current system works. Use ASCII diagrams if feasible.]

## Desired End State

[High-level target state. Visualize architecture changes if feasible.]

## Abstractions and Code Reuse

[How existing abstractions are reused and which new abstractions are needed.]

Use file trees when helpful:

- `folder`
  - `file1.ext` - [concise change summary. Mention affected symbols]
    - `AffectedClass` - [few word summary]
    - `affectedFunction` - [few word summary]
  - `file2.ext` - [concise change summary]

## Pitfalls

[Hidden dependencies and easily overlooked spots found while reading the code, e.g. the same data shape defined in two places, something that must happen before something else. List the external hosts the plan needs (package registry, fonts, APIs, downloads) so they can be approved in the sandbox up front. Omit the section when there are none.]

## Implementation

### Step [N]: [Descriptive Name]

Skip step headers when there is only one step.

Dependencies: [Mention earlier steps or tasks that must be completed first. Write `None` if independent.]

[Short summary of the step goals]

**Tasks**:
- [ ] [Single actionable change in one file or symbol. Point to code by symbol name or a short search snippet, never by line number — line numbers go stale]
  [High-level code snippet if helpful]
- [ ] [Next task]

**Automated Verification**:
- [ ] `npm run typecheck`, `npm run lint` (incl. layer rules) and `npm test` (one terminating run) pass
- [ ] [New tests for the behavior this step adds pass, e.g. "an empty title is rejected"]

## Manual Verification

[Click-throughs for the finished slice, covering the acceptance criteria. The user tests once, after the last step. The first item says how to start the app: `npm install`, the start command and the URL to open. Omit the section when there is nothing to click.]

- [ ] [Open the app, click *Add*, see the new entry at the top]

## Implementation Notes

During implementation, document user feedback, problems, and decisions here.

## References

[List relevant references]
```
