// Stop hook, runs when Claude wants to finish its reply:
// Reference implementation of /afs-hooks: use as is, or adapt the copy in .claude/hooks/ to the project.
// full test run with coverage. Exit 2 = Claude must not stop yet.
import { readFileSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { projectDir, loadConfig, readInput, run, describe, loadState, saveState, tellClaude, fileMtimeMs, RULES } from './lib.mjs';

const input = readInput();
const config = loadConfig();
const state = loadState(input.session_id);

// Nothing changed since the last green run (or no code was edited at all): stay out of the way.
if (!state.dirty) process.exit(0);

const t = config.timeouts;
const summaryPath = join(projectDir, config.coverageSummary);
rmSync(summaryPath, { force: true });
const startedAt = Date.now();

if (config.ensureDeps) run(config.ensureDeps, { timeoutSec: t.ensureDeps });
const r = run(config.allTests, { timeoutSec: t.allTests, maxLines: 80 });

if (!r.ok) {
  state.failures = (state.failures ?? 0) + 1;
  if (state.failures > config.maxStopRetries) {
    // Don't trap Claude in a loop: let go; the next turn starts counting again.
    state.failures = 0;
    saveState(input.session_id, state);
    process.exit(0);
  }
  saveState(input.session_id, state);
  const last = state.failures === config.maxStopRetries;
  tellClaude(
    `Final check before you finish: the full test run did not pass (attempt ${state.failures} of ${config.maxStopRetries}).\n\n` +
      `${describe('All tests', config.allTests, r, t.allTests)}\n\n` +
      (last
        ? `This is the last automatic attempt. Fix it if you can. If you cannot, finish your reply by telling the user in plain language what still fails and what you tried. Do not touch the tests to get around it.\n\n`
        : '') +
      RULES,
  );
}

// Green: reset the counters. The change is checked.
state.failures = 0;
state.dirty = false;

const fresh = fileMtimeMs(summaryPath) >= startedAt - 1000;
if (fresh && !state.coverageHintGiven) {
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = summary.total?.lines?.pct;
  if (typeof total === 'number' && total < config.coverageThreshold) {
    state.coverageHintGiven = true; // once per session - a hint, not a gate
    const weakest = Object.entries(summary)
      .filter(([name]) => name !== 'total')
      .map(([name, v]) => ({ file: relative(projectDir, name), pct: v.lines?.pct ?? 0 }))
      .filter((f) => f.pct < config.coverageThreshold)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 8)
      .map((f) => `  - ${f.file}: ${f.pct}%`)
      .join('\n');
    saveState(input.session_id, state);
    tellClaude(
      `All tests pass. Hint (not a failure): test coverage is ${total}%, below the ${config.coverageThreshold}% guide value.\n` +
        `Least covered files:\n${weakest || '  (none listed)'}\n\n` +
        `Look at these files and judge whether a sensible test is missing - for rules, calculations, validation or edge cases of what you just built. ` +
        `Add such tests if so. Do not write empty or trivial tests just to raise the number; ${config.coverageThreshold}% does not have to be reached. ` +
        `If you think nothing sensible is missing, say so in one sentence in your final reply and finish.`,
    );
  }
}

saveState(input.session_id, state);
process.exit(0);
