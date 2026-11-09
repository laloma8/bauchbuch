# Slices Template

Use this template for `docs/slices.md`. Plain language.

```md
---
date: [ISO date]
topic: "[Product name] slices"
tags: [slices]
status: draft
---

# Slices: [Product name]

Build order. Each slice is something you can see and click when it's done. Keep slices small: one screen or one action each, coverable by at most 10 end-to-end checks. Slices are numbered continuously (1, 2, 3 …); increments are lettered (A, B, C …). A slice inserted or split later takes its predecessor's number plus a letter (`5a`) — existing slices are never renumbered.

`/afs-implement` ticks the box and crosses out the slice line once a slice is finished (`- [x] ~~**1. [Slice name]** — [...]~~`), so you can see at a glance what's done and what's left.

## Increment A: [name] — usable by [who] to [do what]

- [ ] **1. [Slice name]** — [one line: what it does]
  Done when: [what the user sees / can do]
- [ ] **2. [Slice name]** — [...]
  Done when: [...]

## Increment B: [name] — usable by [who] to [do what]

- [ ] **3. [Slice name]** — [...]
  Done when: [...]
```

Increment A lets the user experience the thinnest possible version of the USP from `docs/product.md`.
If the USP can only be experienced later, note here in which increment it first appears and why.
