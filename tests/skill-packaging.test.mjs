import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const skillRoot = join(root, '.github', 'skills');
const legacyNames = {
  '00-spec-ingestion.md': 'spec-ingestion',
  '01-domain-modeling.md': 'domain-modeling',
  '02-behavioral-specifications.md': 'behavioral-specifications',
  '03-implementation-checklist.md': 'implementation-checklist',
  '03a-frontend-task-list.md': 'frontend-task-planning',
  '03b-backend-task-list.md': 'backend-task-planning',
  '04-feature-implementation.md': 'feature-implementation',
  '05-playwright-authoring.md': 'playwright-authoring',
  '06-verification-loop.md': 'verification-loop',
  '07-dynamic-api-response.md': 'dynamic-api-response',
  '08-api-level-tests.md': 'api-level-tests',
};
const expectedSkills = [...Object.values(legacyNames), 'spec-to-test-workflow', 'implementation-design'].sort();

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

test('native skills have matching names and quoted discovery descriptions', () => {
  const actual = readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name).sort();
  assert.deepEqual(actual, expectedSkills);
  for (const name of actual) {
    const text = readFileSync(join(skillRoot, name, 'SKILL.md'), 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    assert.ok(frontmatter, `${name}: missing YAML frontmatter`);
    assert.match(frontmatter[1], new RegExp(`^name: ${name}$`, 'm'));
    assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const description = frontmatter[1].match(/^description: '([^'\r\n]+)'$/m);
    assert.ok(description, `${name}: use a single-line quoted discovery description`);
    assert.match(description[1], /^Use when /);
    assert.ok(description[1].length <= 1024, `${name}: description too long`);
    assert.ok(text.split('\n').length < 500, `${name}: move detail into resources`);
  }
});

test('local Markdown resource links resolve in skills, templates, redirects, and README', () => {
  const files = [
    ...markdownFiles(skillRoot),
    ...markdownFiles(join(root, '.ai')),
    join(root, 'README.md'),
  ];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (/^(?:https?:|#)/.test(target)) continue;
      assert.ok(target.startsWith('./') || target.startsWith('../'), `${file}: non-relative resource ${target}`);
      const path = resolve(dirname(file), decodeURIComponent(target.split('#')[0]));
      assert.ok(existsSync(path), `${file}: missing resource ${target}`);
    }
  }
});

test('legacy skill and workflow entry points explicitly redirect without duplicate rules', () => {
  for (const [legacy, name] of Object.entries(legacyNames)) {
    const text = readFileSync(join(root, '.ai', 'skills', legacy), 'utf8');
    assert.ok(text.includes(`../../.github/skills/${name}/SKILL.md`), legacy);
    assert.match(text, /Read and follow/);
    assert.ok(text.split('\n').length <= 6, `${legacy}: redirect must not duplicate policy`);
  }
  const workflow = readFileSync(join(root, '.ai', 'workflows', 'full-dev-flow.md'), 'utf8');
  assert.ok(workflow.includes('../../.github/skills/spec-to-test-workflow/SKILL.md'));
  assert.match(workflow, /read and follow/);
});

test('orchestration links every phase/supporting skill and retained template', () => {
  const text = readFileSync(join(skillRoot, 'spec-to-test-workflow', 'SKILL.md'), 'utf8');
  for (const name of expectedSkills.filter((name) => name !== 'spec-to-test-workflow')) {
    assert.ok(text.includes(`../${name}/SKILL.md`), `orchestration missing ${name}`);
  }
  for (const template of readdirSync(join(root, '.ai', 'templates'))) {
    assert.ok(text.includes(`../../../.ai/templates/${template}`), `orchestration missing ${template}`);
  }
  assert.match(text, /Explicitly read the linked skill before each phase/);
  assert.match(text, /Context loading: progressive, not all-at-once/);
  assert.match(text, /Do not preload all Phase 0-12/);
  assert.match(text, /On resume,[\s\S]*reload the minimal Phase 9 set/);
});

test('implementation skill gives a bounded just-in-time reading set', () => {
  const text = readFileSync(join(skillRoot, 'feature-implementation', 'SKILL.md'), 'utf8');
  assert.match(text, /Load only the active implementation context/);
  for (const requiredInput of [
    'Applicable project instructions',
    'reviewed implementation design',
    'assigned frontend\\/backend task list',
    'frozen plan, shared contracts, and intent diagram',
    'locked acceptance test',
    'direct dependencies',
  ]) {
    assert.match(text, new RegExp(requiredInput, 'i'), `missing context input: ${requiredInput}`);
  }
  assert.match(text, /Do not load the complete upstream register/);
});

test('verification verdicts and API mock policies agree with immutable test locking', () => {
  const verification = readFileSync(join(skillRoot, 'verification-loop', 'SKILL.md'), 'utf8');
  assert.match(verification, /baseline mismatch is evidence, not a separate verdict/);
  assert.doesNotMatch(verification, /\*\*Drift\*\*/);

  const dynamicApi = readFileSync(join(skillRoot, 'dynamic-api-response', 'SKILL.md'), 'utf8');
  assert.match(dynamicApi, /not-yet-built endpoint's Phase 8 contract fixture/);
  assert.match(dynamicApi, /contract fixture remains unchanged after acceptance lock/);
  assert.match(dynamicApi, /passthrough tests are not expected to pass without their upstream server/);
});

test('canonical skills do not reference obsolete bare phase filenames', () => {
  for (const file of markdownFiles(skillRoot)) {
    const text = readFileSync(file, 'utf8');
    for (const legacy of Object.keys(legacyNames)) {
      assert.ok(!text.includes(legacy), `${basename(dirname(file))}: obsolete reference ${legacy}`);
    }
  }
});
