# Spec-to-Verified-Feature Workflow

Run the phases in order. Do not skip, merge or reorder them. Read a phase's skill before starting it. Phases 2 and 12 are defined in this file.

## Hard Rules (every phase)

1. The frozen plan `specs/<feature>.md` is never edited after Phase 7. Gaps go to a follow-up plan.
2. Expected values come only from the spec and the approved intent diagram. Never from code, DOM, a live response, a capture, or an existing test.
3. Tests are written red (Phase 8) before implementation starts, then locked.
4. Implementation never edits the plan or the locked tests.
5. `@unspecified` and blocking `AMB` scenarios are never green.
6. The intent diagram and the as-built diagram are separate files. The intent diagram is never overwritten.
7. Agents never stage or commit.

If a hard rule would be broken, stop and report it. Do not work around it.

## Phases

| Phase                  | Skill                    | Output                                                                 | Gate                                                                               |
| :--------------------- | :----------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| 0 Spec ingestion       | `00`                     | `REQ` register, `AMB` register, coverage plan                          | No untraceable `REQ`; blocking `AMB` raised                                        |
| 1 Domain model         | `01`                     | Domain model                                                           | Presented; no blocking domain `AMB`                                                |
| 2 Intent diagrams      | inline                   | Versioned intent diagram file                                          | User approves; version recorded                                                    |
| 3 Scenarios            | `02`                     | `SCN` list with concrete `Then`                                        | No open `@unspecified`                                                             |
| 4 Shared checklist     | `03`                     | API and UI contracts, scope map                                        | Presented for review                                                               |
| 5 Task lists           | `03a`, `03b`             | Frontend and backend task lists, produced independently                | Sent to review                                                                     |
| 6 Review               | user                     | New `SCN`/`AMB` from edge cases, decided                               | No blocking `AMB`; scope final                                                     |
| 7 Freeze               | `templates/test-plan.md` | `specs/<feature>.md` marked FROZEN                                     | `npm run ai:freeze -- <feature>` succeeds                                          |
| 8 Red tests            | `05`, `08`, `07`         | Tests failing for the feature-missing reason; red evidence in the plan | Every test red for the right reason; `npm run ai:lock-tests -- <feature>` succeeds |
| 9 Implementation       | `04`                     | Code for the task lists                                                | Complete, no placeholders; gaps stop work                                          |
| 10 Verification        | `06`                     | Test results and triage                                                | Passing, or halt after 3 strikes                                                   |
| 11 Accessibility check | `06`                     | Contract locators checked against the running build                    | "Pencil down": report `REQ` -> `SCN` -> test -> result                             |
| 12 As-built diagrams   | inline                   | As-built diagram in a separate file                                    | Compared with the intent diagram; differences reported, nothing overwritten        |

### Phase 2 (inline)

Draft the Mermaid diagrams that apply (state, sequence, flowchart, class, ER) from the spec and domain model. Label every guard, failure branch and transition. An unlabeled decision becomes an `AMB`.

### Phase 12 (inline)

After verification, regenerate the diagrams from the code into a separate as-built file. List each difference from the intent diagram as spec drift (follow-up plan) or product defect.

## Post-Freeze Gaps

When implementation reveals a missing or wrong expectation after Phase 7:

1. Stop the affected item.
2. Record the scenario ID, the observed behavior, and the open question.
3. Create a follow-up plan for a later iteration with its own review and freeze.
4. Report the scenario as blocked in this iteration. Do not edit the plan, the tests, or any baseline.

## Enforcement

`scripts/ai/freeze-guard.mjs` (run through npm) checks the mechanical rules:

| Command                              | When                   | Checks                                                                                                                                      |
| :----------------------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run ai:freeze -- <feature>`     | Phase 7                | Plan has `SCN`s, no `@unspecified`, no blocking `AMB`. Writes `specs/<feature>.freeze.json` with the plan's checksum. Refuses to overwrite. |
| `npm run ai:lock-tests -- <feature>` | Phase 8, after red     | Every `SCN` has a tagged test, and no test tags an unknown `SCN`. Records checksums of the test files.                                      |
| `npm run ai:verify`                  | Pre-commit hook and CI | Plan unchanged, locked tests unchanged, no test files added after lock, tag coverage.                                                       |

A failed check means stop and report. Do not edit the guard, the manifest, or the checksums to make it pass.

The guard does not judge whether an expectation comes from the spec or whether a red failure is for the right reason. Those remain review steps (Phase 6 and Phase 8).

## Trigger

When the user provides a prompt alongside this workflow, read Phase 0 and begin.
