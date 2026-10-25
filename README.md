# Spec-to-Test Workflow

A spec-driven workflow for turning an implementation spec into a frozen test plan, red Playwright
tests, and a verified feature. It ships the phase pipeline, one skill per phase, plan and prompt
templates, and a dependency-free freeze guard that detects any change to a frozen plan or a locked
test.

The workflow is written for an AI coding agent (Claude, Codex, OpenCode, …), but the rules and the
guard work the same for a human team.

## Why

Most test suites drift toward whatever the code happens to do. This workflow inverts that:

- Expected values come only from the spec and an approved intent diagram — never from code, the
  DOM, a live response, or an existing test.
- Tests are written and seen failing **before** implementation starts.
- The plan is frozen and the tests are locked. Any later change is caught mechanically.
- Gaps discovered after the freeze become a follow-up plan, not an edit to history.

## Requirements

- Node.js 18 or later (the guard uses only `node:fs`, `node:crypto` and `node:path`)
- A target project with Playwright and TypeScript for the tests
- No dependencies to install in this repository

## Quick start

Copy or reference `.ai/` and `scripts/` in the project you want to run the workflow against, then add
the three scripts to that project's `package.json`:

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

```bash
npm run ai:freeze -- <feature>       # Phase 7: freeze specs/<feature>.md (one-way)
npm run ai:lock-tests -- <feature>   # Phase 8: lock the red tests
npm run ai:verify                    # pre-commit / CI: check every frozen feature
npm run ai:verify -- <feature>       # check one feature only
```

To run the guard from this repository against another folder, pass `--root`:

```bash
node scripts/ai/freeze-guard.mjs verify --root ../find-potential-stock/local-env
```

## Repository layout

```
.ai/
  workflows/
    full-dev-flow.md        Phase 0-12 pipeline, hard rules, post-freeze gap protocol
  skills/
    00-spec-ingestion.md    REQ / AMB registers, precedence ladder, coverage quotas
    01-domain-modeling.md   domain model and invariants
    02-behavioral-specifications.md  SCN list with concrete Then steps
    03-implementation-checklist.md   shared API and UI contracts, scope map
    03a-frontend-task-list.md        frontend tasks derived from the checklist
    03b-backend-task-list.md         backend tasks derived from the checklist
    04-feature-implementation.md     implement against the locked tests
    05-playwright-authoring.md       red-first, contract-driven UI tests
    06-verification-loop.md          safe verification and triage
    07-dynamic-api-response.md       baselines and live mocking (supporting skill)
    08-api-level-tests.md            API contract tests (supporting skill)
  templates/
    test-plan.md            the frozen plan format
    playwright-prompt.md    Phase 8 authoring prompt
    verification-prompt.md  Phase 10 verification prompt
scripts/
  ai/
    freeze-guard.mjs        freeze, lock-tests and verify commands
package.json                ai:* script aliases
README.md
```

Skills `07` and `08` are supporting skills, not extra phases: `07` is used in Phases 4, 8 and 10,
and `08` runs alongside `05` in Phase 8.

## The phases

Read `.ai/workflows/full-dev-flow.md` before starting. Run the phases in order; do not skip, merge or
reorder them.

| Phase | Name | Skill | Output | Gate |
| :-- | :-- | :-- | :-- | :-- |
| 0 | Spec ingestion | `00` | `REQ` register, `AMB` register, coverage plan | No untraceable `REQ`; blocking `AMB` raised |
| 1 | Domain model | `01` | Domain model and invariants | Presented; no blocking domain `AMB` |
| 2 | Intent diagrams | inline | Versioned intent diagram file | User approves; version recorded |
| 3 | Scenarios | `02` | `SCN` list with concrete `Then` | No open `@unspecified` |
| 4 | Shared checklist | `03` | API and UI contracts, scope map | Presented for review |
| 5 | Task lists | `03a`, `03b` | Frontend and backend task lists, produced independently | Sent to review |
| 6 | Review | user | New `SCN`/`AMB` from edge cases, decided | No blocking `AMB`; scope final |
| 7 | Freeze | `templates/test-plan.md` | `specs/<feature>.md` marked FROZEN | `npm run ai:freeze -- <feature>` succeeds |
| 8 | Red tests | `05`, `08`, `07` | Tests failing for the feature-missing reason; red evidence in the plan | Every test red for the right reason; `npm run ai:lock-tests -- <feature>` succeeds |
| 9 | Implementation | `04` | Code for the task lists | Complete, no placeholders; gaps stop work |
| 10 | Verification | `06` | Test results and triage | Passing, or halt after 3 strikes |
| 11 | Accessibility check | `06` | Contract locators checked against the running build | Report `REQ` → `SCN` → test → result |
| 12 | As-built diagrams | inline | As-built diagram in a separate file | Compared with the intent diagram; differences reported, nothing overwritten |

## Hard rules

These apply in every phase:

1. The frozen plan `specs/<feature>.md` is never edited after Phase 7. Gaps go to a follow-up plan.
2. Expected values come only from the spec and the approved intent diagram. Never from code, DOM, a
   live response, a capture, or an existing test.
3. Tests are written red (Phase 8) before implementation starts, then locked.
4. Implementation never edits the plan or the locked tests.
5. `@unspecified` and blocking `AMB` scenarios are never green.
6. The intent diagram and the as-built diagram are separate files. The intent diagram is never
   overwritten.
7. Agents never stage or commit.

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

Each test must tag every scenario it covers, for example `[SCN-<feature>-001]`. Tags are how the
guard proves traceability in both directions.

## What the guard checks

| Command | When | Checks |
| :-- | :-- | :-- |
| `freeze <feature>` | Phase 7 | The plan has `SCN-*` entries, no `@unspecified`, and no blocking open `AMB`. Writes `specs/<feature>.freeze.json` with the plan checksum. Refuses to overwrite an existing freeze. |
| `lock-tests <feature>` | Phase 8, after the red run | Every scenario in the plan has a tagged test, and no test tags an unknown scenario. Records the checksum of each protected test file and baseline. |
| `verify [feature]` | Pre-commit hook and CI | The plan is unchanged, locked tests are unchanged, no test file was added after the lock, and tag coverage still matches. With no feature argument it verifies every `*.freeze.json` under `specs/`. |

Line endings are normalised to `\n` before hashing, so a CRLF checkout does not trip the guard.

A failed check means stop and report. Do not edit the guard, the manifest or the checksums to make it
pass.

The guard checks mechanical rules only. Whether an expectation really comes from the spec, and
whether a red failure is failing for the right reason, remain human/agent review steps in Phase 6
and Phase 8.

## Traceability IDs

| Prefix | Meaning | Lives in |
| :-- | :-- | :-- |
| `REQ-<feature>-###` | A testable requirement | Requirement register, frozen plan |
| `AMB-<feature>-###` | An ambiguity, with a default assumption and a blocking flag | Ambiguity register, frozen plan |
| `SCN-<feature>-###` | A concrete scenario with a concrete expected result | Frozen plan and its test tag |

The plan is the oracle. If a value is not written as a concrete expectation, it is not testable yet.

## Using it with an AI agent

Point the agent at `.ai/workflows/full-dev-flow.md` and give it the implementation spec plus any
Mermaid diagrams. The workflow file tells it to read Phase 0 and begin. Keep phase artifacts (the
registers, diagrams, checklists, task lists, plans and verification reports) in a per-project folder
outside this repository, so the workflow stays reusable.

For an end-to-end example, see the `find-potential-stock` project in this workspace: its phase
artifacts live in `find-potential-stock/spec-to-test-workflow/find-potential-stock/`, and the frozen
plans and locked tests live in `find-potential-stock/local-env/`.

## Adopting it in an existing project

1. Copy `.ai/` and `scripts/ai/` into the project.
2. Add the `ai:*` scripts above.
3. Create `specs/` and `tests/` with the layout shown earlier.
4. Start at Phase 0 with the spec. Do not seed the plan from the current test suite; that would make
   the code the oracle.
5. Wire `npm run ai:verify` into a pre-commit hook and CI once the first plan is frozen.

## Limitations

- The skills assume a Playwright TypeScript project using `vasu-playwright-utils` and a
  `playwright-cli` skill. Those references point at paths in the template project below; adjust them
  to your setup.
- The guard does not run tests, judge assertions, or detect a weak expectation.
- The freeze is one-way by design. Changing a frozen expectation requires a new follow-up plan with
  its own review and freeze.
- No package is published; consume the files directly.

## Credit

The Playwright conventions and utility references come from
[vasu31dev/playwright-ts-template](https://github.com/vasu31dev/playwright-ts-template) (MIT). Thanks
to Vasudeva Annam for the template.

## License

MIT
