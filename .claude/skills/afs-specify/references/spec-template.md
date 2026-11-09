# Spec Template

Use this template for `docs/agents/specs/NN-YYYY-MM-DD-<slice>.md`. Plain language, no code.

````md
---
date: [ISO date]
topic: "[Slice name]"
slice: "[Number of the slice in docs/slices.md, as a string, e.g. 5 or 5a]"
tags: [spec]
status: draft
---

# SPEC: [Slice name]

## Goal

[One or two sentences.]

## User story

As a [user], I want [what] so that [why].

## Flow

1. [The user sees ...]
2. [They click ...]
3. [The app shows ...]

## Screen

```
[ASCII sketch, in line with docs/design.md]
```

- **[Element]** — [what it shows / does]

## Rules & edge cases

- **[Case]** — [what happens]
- **Nothing there yet** — [...]
- **Wrong input** — [...]
- **Something fails** — [...]

## Out of scope

- [Deliberately not part of this slice — and where it belongs instead, if known]

## Decisions already made

Settled during the interview — the plan must not ask these again.

- **[Decision]** — [what was chosen and why]
- **[Option the user rejected]** — [why not]

## Acceptance criteria

- [ ] When I [do X], I see [Y]
- [ ] When I [do X] with [edge case], I see [Y]

## References

- docs/slices.md — slice [number]
- docs/design.md — [relevant section]
````
