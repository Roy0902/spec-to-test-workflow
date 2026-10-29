# Spec-to-Test Workflow

A spec-driven workflow for turning requirements into reviewed implementation design,
a frozen acceptance plan, red Playwright tests, maintainable code, and verified results.
It ships native discoverable skills, reusable templates, compatibility entry points,
and a dependency-free acceptance freeze guard.

The workflow is written for an AI coding agent (Claude, Codex, OpenCode, …), but the rules and the
guard work the same for a human team.

## Why

Most test suites drift toward whatever the code happens to do. This workflow inverts that:

- Expected values come only from the spec and an approved intent diagram — never from code, the
  DOM, a live response, or an existing test.
- Tests are written and seen failing **before** implementation starts.
- The plan is frozen and the tests are locked. Any later change is caught mechanically.
- Gaps discovered after the freeze become a follow-up plan, not an edit to history.
- Folder/module ownership, dependency direction, naming, and supporting-test strategy
  are reviewed before implementation.
- Native quality checks and maintainability review are completion gates. Lint-clean
  code can still be poorly designed; behavioral green alone is not enough.

## Requirements

- Node.js 18 or later (the guard uses only `node:fs`, `node:crypto` and `node:path`)
- A target project with Playwright and TypeScript for the tests
- The documented acceptance examples also require the target project's
  `vasu-playwright-utils` helpers and installed `playwright-cli` skill. Resolve their
  actual paths and Playwright project names before running examples.
- No dependencies to install in this repository

Implementation-quality commands use the target project's existing toolchain, not
a universal npm/TypeScript linter. Missing tooling is an explicit setup decision;
inapplicable checks require reasons.

## Quick start

Copy [native skills](./.github/skills/), [templates](./.ai/templates/), and
[guard scripts](./scripts/ai/) into the target project, preserving their relative
locations. Also copy the [legacy skill redirects](./.ai/skills/) and
[workflow redirect](./.ai/workflows/) if old entry points are needed.
Merge with existing files rather than overwriting project customizations.

Open the [orchestration skill](./.github/skills/spec-to-test-workflow/SKILL.md)
with the feature spec, or invoke `spec-to-test-workflow` in a host supporting native
skill discovery. For other hosts, explicitly read that file; it links every required
phase skill. File migration alone is not evidence that every host auto-loads skills.

Add these scripts to the target project's `package.json`:

```json
{
  "scripts": {
    "ai:freeze": "node scripts/ai/freeze-guard.mjs freeze",
    "ai:lock-tests": "node scripts/ai/freeze-guard.mjs lock-tests",
    "ai:verify": "node scripts/ai/freeze-guard.mjs verify"
  }
}
```

Run them from the project root:

```text
npm run ai:freeze -- <feature>       # Phase 7: freeze specs/<feature>.md (one-way)
npm run ai:lock-tests -- <feature>   # Phase 8: lock the red tests
npm run ai:verify                    # pre-commit / CI: check every frozen feature
npm run ai:verify -- <feature>       # check one feature only
```

Use platform-appropriate path separators when invoking scripts directly.
To run the guard against another folder on Windows, pass `--root`:

```powershell
node .\scripts\ai\freeze-guard.mjs verify --root 'D:\path\to\target'
```

## Repository layout

```
.github/skills/
  spec-to-test-workflow/SKILL.md       Phase 0-12 orchestration
  spec-ingestion/SKILL.md             requirement and ambiguity registers
  domain-modeling/SKILL.md            domain model and invariants
  behavioral-specifications/SKILL.md  concrete acceptance scenarios
  implementation-checklist/SKILL.md   shared contracts and quality baselines
  implementation-design/SKILL.md      structure, dependencies, naming, tests
  frontend-task-planning/SKILL.md     frontend file-level tasks
  backend-task-planning/SKILL.md      backend file-level tasks
  feature-implementation/SKILL.md     implementation and focused checks
  playwright-authoring/SKILL.md       red-first UI acceptance tests
  verification-loop/SKILL.md          complete quality gates and triage
  dynamic-api-response/SKILL.md       network mocking support
  api-level-tests/SKILL.md            API acceptance support
.ai/skills/                           legacy redirects, not duplicate rules
.ai/workflows/full-dev-flow.md        legacy orchestration redirect
.ai/templates/
  implementation-design.md
  project-conventions.md
  execution-evidence.md
  test-plan.md
  playwright-prompt.md
  verification-prompt.md
scripts/ai/freeze-guard.mjs            unchanged production guard
tests/                               dependency-free regression tests
package.json                         ai:* and test scripts
README.md
```

Dynamic API response and API-level tests remain supporting skills, not extra phases.
Native folder names match each skill's frontmatter `name`. Descriptions provide
discovery triggers; the orchestration skill explicitly requires reading phase skills.

## The phases

Read the [canonical workflow](./.github/skills/spec-to-test-workflow/SKILL.md)
before starting. Run phases in order. The old
[workflow entry](./.ai/workflows/full-dev-flow.md) redirects there.

| Phase | Name | Skill | Output | Gate |
| :-- | :-- | :-- | :-- | :-- |
| 0 | Spec ingestion | `spec-ingestion` | `REQ` register, `AMB` register, coverage plan | No untraceable `REQ`; blocking `AMB` raised |
| 1 | Domain model | `domain-modeling` | Domain model and invariants | Presented; no blocking domain `AMB` |
| 2 | Intent diagrams | inline | Versioned intent diagram file | User approves; version recorded |
| 3 | Scenarios | `behavioral-specifications` | `SCN` list with concrete `Then` | No open `@unspecified` |
| 4 | Shared checklist | `implementation-checklist` | Contracts, conventions, native quality baselines | Setup gaps and baseline failures explicit |
| 5 | Design and task lists | `implementation-design`, frontend/backend planning | One shared design, independently prepared task lists | Ownership, dependency direction, naming, tests, commands ready |
| 6 | Review | user | Reviewed design, tasks, behavior and scope | No blocking `AMB`; tooling/baseline dispositions explicit |
| 7 | Freeze | [Test-plan template](./.ai/templates/test-plan.md) | `specs/<feature>.md` marked FROZEN | `npm run ai:freeze -- <feature>` succeeds |
| 8 | Red acceptance tests | Playwright, API, network support | Feature-missing red results outside the frozen plan | Every acceptance test red for the right reason; acceptance lock succeeds |
| 9 | Implementation | `feature-implementation` | Cohesive code, supporting tests, focused checks | Complete; product gaps stop affected work |
| 10 | Verification | `verification-loop` | Acceptance integrity, supporting tests, native checks, maintainability review | Required gates satisfied or explicit halt |
| 11 | Accessibility check | `verification-loop` | Contract locators checked against the running build | Per-requirement results recorded |
| 12 | As-built diagrams | inline | As-built diagram in a separate file | Compared with the intent diagram; differences reported, nothing overwritten |

## Hard rules

These apply in every phase:

1. The frozen plan `specs/<feature>.md` is never edited after Phase 7. Gaps go to a follow-up plan.
2. Expected values come only from the spec and the approved intent diagram. Never from code, DOM, a
   live response, a capture, or an existing test.
3. Acceptance tests are written red (Phase 8) before implementation starts, then locked.
4. Implementation never edits the plan or the locked tests.
5. `@unspecified` and blocking `AMB` scenarios are never green.
6. The intent diagram and the as-built diagram are separate files. The intent diagram is never
   overwritten.
7. Agents never stage or commit.
8. Native quality checks and reviewed implementation design are required; green acceptance tests alone do not complete the feature.
9. Run evidence and changing status live outside the frozen plan.

If a rule would be broken, stop and report it. Do not work around it.

## Expected project layout

The guard resolves everything under `--root` (default: the current directory):

```
specs/<feature>.md                  frozen test plan
specs/<feature>.freeze.json         checksums, written by freeze and lock-tests
tests/specs/<feature>.spec.ts       UI journeys
tests/api/<feature>.spec.ts         API contract tests
tests/testdata/api/<feature>/       API baselines (optional)
```

Each acceptance test must tag every scenario it covers, for example `[SCN-<feature>-001]`. Tags are how the
guard proves traceability in both directions.

Supporting unit/integration tests use the target project's native runner/layout
outside those protected acceptance paths. They may evolve with private APIs, but
cannot replace acceptance coverage or redefine expected behavior. Shared helpers
and runner configuration are not all checksum-protected: review must catch disabled
suites or weakened setup as well.

Keep reviewed designs and execution records in the target project's feature-artifact
folder. Select the external evidence path before freeze. Phase 8 and subsequent
runs append evidence there, never inside the plan. Legacy frozen artifacts remain
unchanged; reference their historical embedded evidence from new external records.

### Context loading during implementation

Do not feed every skill, artifact, or source file to the agent in one session.
The orchestration skill directs it to load the relevant phase guidance just in
time. For Phase 9, start with the implementation skill, applicable project
instructions, reviewed design, assigned task list, and only the plan/contracts/
diagram/test excerpts identified by the task's `REQ`/`SCN` IDs. Inspect the
referenced source files and direct dependencies next. Load another skill or
artifact section only when the current task needs it. On session resume, use a
concise handoff and reload this focused set; do not replay all prior context.
This keeps context bounded without skipping any required workflow gate.

## What the guard checks

| Command | When | Checks |
| :-- | :-- | :-- |
| `freeze <feature>` | Phase 7 | The plan has `SCN-*` entries, no `@unspecified`, and no blocking open `AMB`. Writes `specs/<feature>.freeze.json` with the plan checksum. Refuses to overwrite an existing freeze. |
| `lock-tests <feature>` | Phase 8, after the red run | Every scenario in the plan has a tagged test, and no test tags an unknown scenario. Records the checksum of each protected test file and baseline. |
| `verify [feature]` | Pre-commit hook and CI | The plan and selected locked acceptance files/baselines are unchanged, no newly selected protected file was added, and acceptance tag coverage matches. Supporting tests outside those paths are not locked. With no feature argument it verifies every `*.freeze.json` under `specs/`. |

Line endings are normalised to `\n` before hashing, so a CRLF checkout does not trip the guard.

A failed check means stop and report. Do not edit the guard, the manifest or the checksums to make it
pass.

The guard checks mechanical rules only. Whether an expectation really comes from the spec, and
whether a red failure is failing for the right reason, remain human/agent review steps in Phase 6
and Phase 8.

Production commands, manifest format, protected paths, and hashing are unchanged.
Execution records are not hashed or validated by the guard.

## Traceability IDs

| Prefix | Meaning | Lives in |
| :-- | :-- | :-- |
| `REQ-<feature>-###` | A testable requirement | Requirement register, frozen plan |
| `AMB-<feature>-###` | An ambiguity, with a default assumption and a blocking flag | Ambiguity register, frozen plan |
| `SCN-<feature>-###` | A concrete scenario with a concrete expected result | Frozen plan and its test tag |

The plan is the oracle. If a value is not written as a concrete expectation, it is not testable yet.

## Using it with an AI agent

Point the agent at the [orchestration skill](./.github/skills/spec-to-test-workflow/SKILL.md) and give it the implementation spec plus any
Mermaid diagrams. The workflow file tells it to read Phase 0 and begin. Keep phase artifacts (the
registers, diagrams, checklists, task lists, plans and verification reports) in a per-project folder
outside this repository, so the workflow stays reusable.

For an end-to-end example, see the `find-potential-stock` project in this workspace: its phase
artifacts live in `find-potential-stock/spec-to-test-workflow/find-potential-stock/`, and the frozen
plans and locked tests live in `find-potential-stock/local-env/`.

## Adopting it in an existing project

1. Copy the native skills, templates, and guard scripts described in Quick start; add redirects if required.
2. Add the `ai:*` scripts above.
3. Create `specs/` and `tests/` with the layout shown earlier.
4. Start at Phase 0 with the spec. Do not seed the plan from the current test suite; that would make
   the code the oracle.
5. Adapt the [project-conventions template](./.ai/templates/project-conventions.md)
   into the project's existing supported persistent instructions. Review naming,
   folders, dependency rules, error conventions, and exact native commands.
6. Discover and run baseline checks before edits. Missing setup needs an approved
   decision. Existing failures need evidence, no introduced violations, and explicit
   dispositions; never report unresolved baseline failures as clean passes.
7. Wire `npm run ai:verify` and required native checks into the project's reviewed
   pre-commit/CI setup. Do not weaken rules, add blanket suppressions/exclusions, or
   disable tests to pass.

### Design and verification examples

- **Greenfield:** propose a small structure such as a transport adapter, a domain
  module named after its rule, and a persistence adapter only when needed. For each,
  state responsibility, dependencies, a concrete function/type name, supporting
  test location, and the project's actual check commands. No fixed layer count.
- **Existing lint failures:** record command/scope and actual baseline diagnostics;
  run after changes, establish no introduced violations, and obtain an explicit
  disposition for remaining failures. Report "baseline issue", not "pass".
- **Locked locator/setup defect:** reproduce using the relevant browser/request
  runner, stop affected work, and propose a reviewed follow-up. Do not fix it by
  editing the locked test or regenerating manifest hashes.

## Validating this repository

```text
npm test
```

Tests use Node's built-in runner and temporary fixture projects; no package install
is needed. They exercise the real guard CLI, including acceptance protection,
legacy manifest compatibility, supporting-test independence, and external evidence.
They also check skill metadata, local links, and compatibility redirects.
Running `ai:verify` here with no frozen features is not a substitute for these tests.

## Limitations

- Acceptance authoring still assumes Playwright/TypeScript, `vasu-playwright-utils`,
  and `playwright-cli`; alternative acceptance runners are outside this refactor.
- Metadata/link checks validate structure, not actual host invocation. Test discovery
  in your host; explicitly open the orchestration skill when discovery is unavailable.
- The guard does not run tests, judge assertions, or detect a weak expectation.
- The guard does not enforce module quality, run lint/build checks, protect every
  shared dependency/configuration file, or attest execution records.
- The freeze is one-way by design. Changing a frozen expectation requires a new follow-up plan with
  its own review and freeze.
- No package is published; consume the files directly.

## Credit

The Playwright conventions and utility references come from
[vasu31dev/playwright-ts-template](https://github.com/vasu31dev/playwright-ts-template) (MIT). Thanks
to Vasudeva Annam for the template.

## License

MIT
