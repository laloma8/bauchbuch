# Design Template

Use this template for `docs/design.md`. Use the prototype as the visual reference. Plain language,
at most about two pages.

````md
---
date: [ISO date]
topic: "[Product name] design"
tags: [design]
status: draft
---

# Design: [Product name]

[One or two sentences: the overall feel.]

## Style

- **Colours:** [...]
- **Fonts:** [...]
- **Overall feel:** [e.g. calm, dense, playful]
- **Brand rules:** [if any]

## Blueprint screens

At most 5 — the ones that set the pattern for all others (e.g. list, detail/form, main navigation). They are a template later slices follow, not a spec for every screen.

### [Screen name]

[What it's for, in one line.]

```
[ASCII sketch]
```

## Other screens

- [Screen name] — follows blueprint [X]. Details are worked out in `/afs-specify`.

## Patterns

Reusable elements later slices should reuse.

- **Buttons:** [...]
- **Forms:** [...]
- **Tables / lists:** [...]
- **Messages:** [...]

## Navigation

[How you move between screens — ASCII flow if helpful.]

## States

- **Empty:** [what you see when there's nothing yet]
- **Loading:** [...]
- **Error:** [...]

## Open questions

- [...]
````
