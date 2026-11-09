// PostToolUse hook, runs after Claude edited or wrote a file:
// Reference implementation of /afs-hooks: use as is, or adapt the copy in .claude/hooks/ to the project.
// format -> lint -> type check -> tests related to the file.
// Silent when everything is fine. Exit 2 = report to Claude.
import { existsSync } from 'node:fs';
import { relative, resolve, extname, sep } from 'node:path';
import { projectDir, loadConfig, readInput, run, describe, loadState, saveState, tellClaude, RULES } from './lib.mjs';

const input = readInput();
const config = loadConfig();

const given = input.tool_input?.file_path;
if (!given) process.exit(0);
const absolute = resolve(projectDir, given);
const rel = relative(projectDir, absolute);

const outside = rel.startsWith('..');
const ignored = config.ignoredFolders.some((folder) => rel === folder || rel.startsWith(folder + sep));
const notCode = !config.sourceExtensions.includes(extname(rel));
if (outside || ignored || notCode || !existsSync(absolute)) process.exit(0);

// Remember that code changed, so the Stop hook knows a full test run is due.
const state = loadState(input.session_id);
state.dirty = true;
saveState(input.session_id, state);

const t = config.timeouts;
const problems = [];

if (config.format) {
  const r = run(config.format, { file: rel, timeoutSec: t.format });
  if (!r.ok) problems.push(describe('Formatting', config.format, r, t.format));
}
if (config.lint) {
  const r = run(config.lint, { file: rel, timeoutSec: t.lint });
  if (!r.ok) problems.push(describe('Lint / architecture rules', config.lint, r, t.lint));
}
let typingOk = true;
if (config.typecheck) {
  const r = run(config.typecheck, { timeoutSec: t.typecheck });
  if (!r.ok) {
    typingOk = false;
    problems.push(describe('Type check', config.typecheck, r, t.typecheck));
  }
}
if (config.relatedTests && typingOk) {
  if (config.ensureDeps) run(config.ensureDeps, { timeoutSec: t.ensureDeps });
  const r = run(config.relatedTests, { file: rel, timeoutSec: t.relatedTests });
  if (!r.ok) problems.push(describe('Tests related to this file', config.relatedTests, r, t.relatedTests));
} else if (config.relatedTests) {
  problems.push('Tests related to this file: not run, because the type check fails. Fix the typing first.');
}

if (problems.length === 0) process.exit(0);

tellClaude(
  `Automatic check after editing ${rel}:\n\n${problems.join('\n\n')}\n\n` +
    `If you are in the middle of a change that spans several files, carry on and re-check when the step is done - ` +
    `the full test run at the end happens anyway. Otherwise fix this now.\n\n${RULES}`,
);
