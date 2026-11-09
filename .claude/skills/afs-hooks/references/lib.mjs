// Shared helpers for the AFS hooks. Copied to .claude/hooks/ by /afs-hooks. No dependencies.
// Reference implementation of /afs-hooks: use as is, or adapt the copy in .claude/hooks/ to the project.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export const RULES = `How to handle this:
- Fix the code, not the check. Never delete, skip, loosen or shrink a test to make it pass or to make it faster. Never lower a threshold, and never silence the type checker or linter (no @ts-ignore, eslint-disable, or "any" just to get past an error).
- If a test fails because the intended behavior changed on purpose (the spec or plan says so), update that test and tell the user in one plain sentence which test changed and why.
- If you cannot tell whether the code or the test is wrong, stop and ask the user in plain language.
- Errors like "cannot find module ...-darwin-..." or "...-linux-..." mean the installed packages belong to another operating system: run npm install and retry. That is not a code problem.
- If a run is unexpectedly slow or timed out, tell the user and find the cause. Do not remove tests to speed it up.`;

export function loadConfig() {
  const path = join(projectDir, '.claude', 'hooks', 'config.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

export function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function tail(text, maxLines) {
  const lines = text.trimEnd().split('\n');
  if (lines.length <= maxLines) return lines.join('\n');
  return `... (${lines.length - maxLines} earlier lines left out)\n` + lines.slice(-maxLines).join('\n');
}

// Runs one configured command. `{file}` in the command is replaced by the quoted file path.
export function run(command, { file, timeoutSec, maxLines = 60 } = {}) {
  const cmd = file ? command.replaceAll('{file}', shellQuote(file)) : command;
  const started = Date.now();
  const result = spawnSync(cmd, {
    shell: true,
    cwd: projectDir,
    encoding: 'utf8',
    timeout: (timeoutSec ?? 120) * 1000,
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
  });
  const timedOut = result.error?.code === 'ETIMEDOUT';
  return {
    ok: result.status === 0 && !timedOut,
    timedOut,
    seconds: Math.round((Date.now() - started) / 1000),
    output: tail(`${result.stdout ?? ''}${result.stderr ?? ''}`, maxLines),
  };
}

export function describe(title, command, r, timeoutSec) {
  const head = r.timedOut
    ? `${title}: no result after ${timeoutSec} s (timed out) - ${command}`
    : `${title}: FAILED - ${command}`;
  return `${head}\n${r.output}`;
}

// Per-session state (which files changed, how often the stop check failed, coverage hint given).
function stateFile(sessionId) {
  const safe = String(sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return join(projectDir, '.claude', 'hooks-state', `${safe}.json`);
}

export function loadState(sessionId) {
  try {
    return JSON.parse(readFileSync(stateFile(sessionId), 'utf8'));
  } catch {
    return { dirty: false, failures: 0, coverageHintGiven: false };
  }
}

export function saveState(sessionId, state) {
  const path = stateFile(sessionId);
  mkdirSync(join(projectDir, '.claude', 'hooks-state'), { recursive: true });
  writeFileSync(path, JSON.stringify(state));
}

export function fileMtimeMs(path) {
  return existsSync(path) ? statSync(path).mtimeMs : 0;
}

// Exit code 2 = the message goes back to Claude (after an edit) or keeps Claude from stopping (Stop hook).
export function tellClaude(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}
